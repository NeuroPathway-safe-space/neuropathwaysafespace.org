const API_BASE = "http://localhost:4000";
const DEMO_ADMISSION = "adm-001";

const stateEl = document.querySelector("#summary-state");
const patientNameEl = document.querySelector("#patient-name");
const snapshotEl = document.querySelector("#snapshot");
const disclaimerEl = document.querySelector("#disclaimer");
const diagnosesEl = document.querySelector("#diagnoses");
const medicationsEl = document.querySelector("#medications");
const risksEl = document.querySelector("#risks");
const communicationEl = document.querySelector("#communication");
const whatHelpsEl = document.querySelector("#what-helps");
const whatDoesNotHelpEl = document.querySelector("#what-does-not-help");
const provenanceEl = document.querySelector("#provenance");

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", "x-user-id": "clinician-demo" },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }
  return body.data;
}

function provenanceTag(provenance) {
  return `
    <button class="source-chip" title="Open original source" data-source="${provenance.sourceRecordUrl ?? ""}">
      ${provenance.sourceSystem} · ${provenance.sourceRecordId} · ${provenance.sourceDate} · ${(provenance.confidenceScore * 100).toFixed(0)}%
    </button>
  `;
}

function statementCard(statement) {
  return `
    <article class="statement">
      <p>${statement.text}</p>
      ${provenanceTag(statement.provenance)}
    </article>
  `;
}

function renderSnapshot(summary) {
  const { fields, statements } = summary.patientSnapshot;
  patientNameEl.textContent = fields.name;
  snapshotEl.innerHTML = `
    <div><span>Name</span><strong>${fields.name}</strong></div>
    <div><span>DOB</span><strong>${fields.dob}</strong></div>
    <div><span>Age</span><strong>${fields.age}</strong></div>
    <div><span>NHS Number</span><strong>${fields.nhsNumber}</strong></div>
    <div class="snapshot-source">${provenanceTag(statements[0].provenance)}</div>
  `;
  disclaimerEl.textContent = summary.safety.clinicalDisclaimer;
}

function renderDiagnoses(summary) {
  diagnosesEl.innerHTML = `
    <h3>Active diagnoses</h3>
    ${summary.diagnoses.active.map(statementCard).join("") || statementCard(unavailable("diagnoses.active"))}
    <h3>Significant historical diagnoses</h3>
    ${summary.diagnoses.historical.map(statementCard).join("") || statementCard(unavailable("diagnoses.historical"))}
  `;
}

function renderMedications(summary) {
  medicationsEl.innerHTML = summary.medicationSummary
    .map((medication) => {
      if (medication.text) return statementCard(medication);
      return `
        <article class="statement medication">
          <div>
            <h3>${medication.name}</h3>
            <p><strong>Dose:</strong> ${medication.dose} · <strong>Frequency:</strong> ${medication.frequency}</p>
            <p><strong>Indication:</strong> ${medication.indication}</p>
            <p><strong>Monitoring:</strong> ${medication.monitoringRequirements}</p>
          </div>
          ${provenanceTag(medication.provenance)}
        </article>
      `;
    })
    .join("");
}

function renderRisks(summary) {
  risksEl.innerHTML = Object.entries(summary.risks)
    .map(
      ([category, statements]) => `
        <article class="risk-card">
          <h3>${category.replace(/([A-Z])/g, " $1")}</h3>
          ${statements.map(statementCard).join("")}
        </article>
      `,
    )
    .join("");
}

function renderCommunication(summary) {
  communicationEl.innerHTML = Object.entries(summary.communicationNeeds)
    .map(
      ([category, statements]) => `
        <h3>${category.replace(/([A-Z])/g, " $1")}</h3>
        ${statements.map(statementCard).join("")}
      `,
    )
    .join("");
}

function renderHelp(summary) {
  whatHelpsEl.innerHTML = summary.whatHelps.map(statementCard).join("");
  whatDoesNotHelpEl.innerHTML = summary.whatDoesNotHelp.map(statementCard).join("");
}

function unavailable(section) {
  return {
    text: "Information not available from connected records.",
    provenance: {
      sourceSystem: "MediSense safety guardrail",
      sourceRecordId: `unavailable:${section}`,
      sourceDate: new Date().toISOString().slice(0, 10),
      confidenceScore: 1,
      sourceRecordUrl: null,
    },
  };
}

async function renderProvenance(summaryId) {
  const provenance = await request(`/provenance/${summaryId}`);
  provenanceEl.innerHTML = provenance.sourceRecords
    .map(
      (record) => `
        <article class="source-record">
          <strong>${record.sourceSystem}</strong>
          <span>${record.sourceIdentifier}</span>
          <time>${record.recordDate}</time>
          <code>${record.type}</code>
        </article>
      `,
    )
    .join("");
}

async function loadSummary(admissionId = DEMO_ADMISSION) {
  try {
    stateEl.textContent = "Generating / active";
    let summaryRecord;
    try {
      summaryRecord = await request(`/summary/${admissionId}`);
    } catch {
      summaryRecord = await request("/generate-summary", {
        method: "POST",
        body: JSON.stringify({ admissionId, userId: "clinician-demo" }),
      });
    }

    const summary = summaryRecord.summaryJson;
    renderSnapshot(summary);
    renderDiagnoses(summary);
    renderMedications(summary);
    renderRisks(summary);
    renderCommunication(summary);
    renderHelp(summary);
    await renderProvenance(summaryRecord.id);
    stateEl.textContent = `Active until ${new Date(summaryRecord.expiresAt).toLocaleTimeString()}`;
  } catch (error) {
    stateEl.textContent = error.message;
    patientNameEl.textContent = "Information not available from connected records.";
  }
}

async function simulateAdmission() {
  const admission = await request("/admissions", {
    method: "POST",
    body: JSON.stringify({
      nhsNumber: "9434765919",
      patientId: "GM-TRUST-0001",
      admissionEvent: "demo-admission-trigger",
      userId: "clinician-demo",
    }),
  });
  await loadSummary(admission.admission.id);
}

async function discharge() {
  await request("/discharge", {
    method: "POST",
    body: JSON.stringify({ admissionId: DEMO_ADMISSION, userId: "clinician-demo" }),
  });
  stateEl.textContent = "Expired and removed by discharge kill switch";
  provenanceEl.innerHTML = "<p>Audit retained. Source records remain untouched.</p>";
}

document.querySelector("#refresh").addEventListener("click", () => loadSummary());
document.querySelector("#admit").addEventListener("click", simulateAdmission);
document.querySelector("#discharge").addEventListener("click", discharge);

loadSummary();
