import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../app.js";
import { resetMediSenseData } from "../storage/medisenseData.js";

async function withServer(callback) {
  const server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test("admission trigger creates a provenance-tagged summary", async () => {
  resetMediSenseData();
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/admissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nhsNumber: "9434765919",
        patientId: "GM-TRUST-0001",
        admissionEvent: "emergency-admission",
        userId: "doctor-001",
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    const summary = body.data.summary.summaryJson;

    assert.equal(summary.patientSnapshot.fields.nhsNumber, "9434765919");
    assert.equal(summary.careConsiderations[0].text.includes("does not replace professional judgement"), true);
    assert.equal(summary.medicationSummary[0].provenance.sourceSystem, "Greater Manchester Care Record");
    assert.equal(summary.risks.selfHarm[0].text, "Information not available from connected records.");
  });
});

test("discharge kill switch removes active summaries and keeps audit", async () => {
  resetMediSenseData();
  await withServer(async (baseUrl) => {
    const generated = await fetch(`${baseUrl}/generate-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionId: "adm-001", userId: "nurse-001" }),
    });
    assert.equal(generated.status, 200);

    const discharge = await fetch(`${baseUrl}/discharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionId: "adm-001", userId: "nurse-001" }),
    });
    assert.equal(discharge.status, 200);
    const dischargeBody = await discharge.json();
    assert.deepEqual(dischargeBody.data.removedSummaryIds, ["sum-001"]);
    assert.equal(dischargeBody.data.sourceRecordsUntouched, true);

    const summaryAfterDischarge = await fetch(`${baseUrl}/summary/adm-001`);
    assert.equal(summaryAfterDischarge.status, 404);

    const audit = await fetch(`${baseUrl}/audit`);
    const auditBody = await audit.json();
    assert.equal(
      auditBody.data.some((entry) => entry.action === "discharge-kill-switch-executed"),
      true,
    );
  });
});
