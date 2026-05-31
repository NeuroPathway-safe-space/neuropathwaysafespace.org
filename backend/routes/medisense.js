import { Router } from "express";
import {
  admissions,
  aiSummaries,
  auditLogs,
  patients,
  sourceRecords,
} from "../storage/medisenseData.js";
import { generateCareSummary } from "../services/summaryGenerator.js";

const router = Router();

function nowIso() {
  return new Date().toISOString();
}

function addAudit(userId, action, resource) {
  const log = {
    id: `aud-${String(auditLogs.length + 1).padStart(3, "0")}`,
    userId,
    action,
    resource,
    timestamp: nowIso(),
  };
  auditLogs.unshift(log);
  return log;
}

function findPatient({ nhsNumber, patientId }) {
  return patients.find(
    (patient) => patient.nhsNumber === nhsNumber || patient.patientId === patientId || patient.id === patientId,
  );
}

function activeSummaryFor(admissionId) {
  return aiSummaries.find((summary) => summary.admissionId === admissionId && summary.status === "active");
}

function createSummaryForAdmission(admission, requestedBy = "system") {
  const patient = patients.find((item) => item.id === admission.patientId);
  if (!patient) {
    const error = new Error("Patient not found for admission.");
    error.statusCode = 404;
    throw error;
  }

  const records = sourceRecords.filter((record) => record.patientId === patient.id);
  const summaryJson = generateCareSummary({ patient, admission, records });
  const expiresAt = admission.dischargeTime ?? new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const existingSummary = activeSummaryFor(admission.id);

  if (existingSummary) {
    existingSummary.summaryJson = summaryJson;
    existingSummary.createdAt = nowIso();
    existingSummary.expiresAt = expiresAt;
    addAudit(requestedBy, "summary-regenerated", existingSummary.id);
    return existingSummary;
  }

  const summary = {
    id: `sum-${String(aiSummaries.length + 1).padStart(3, "0")}`,
    admissionId: admission.id,
    summaryJson,
    createdAt: nowIso(),
    expiresAt,
    status: "active",
  };

  aiSummaries.unshift(summary);
  addAudit(requestedBy, "summary-generated", summary.id);
  return summary;
}

router.post("/admissions", (req, res) => {
  const { nhsNumber, patientId, admissionEvent, admissionTime, userId = "system" } = req.body ?? {};

  if (!nhsNumber || !patientId || !admissionEvent) {
    return res.status(400).json({
      error: "nhsNumber, patientId and admissionEvent are required.",
    });
  }

  const patient = findPatient({ nhsNumber, patientId });
  if (!patient) {
    return res.status(404).json({ error: "Patient not found in authorised records." });
  }

  const admission = {
    id: `adm-${String(admissions.length + 1).padStart(3, "0")}`,
    patientId: patient.id,
    admissionTime: admissionTime ?? nowIso(),
    dischargeTime: null,
    status: "active",
    admissionEvent,
  };

  admissions.unshift(admission);
  addAudit(userId, "admission-created", admission.id);
  const summary = createSummaryForAdmission(admission, userId);

  return res.status(201).json({ data: { admission, summary } });
});

router.post("/generate-summary", (req, res) => {
  const { admissionId, userId = "system" } = req.body ?? {};
  if (!admissionId) {
    return res.status(400).json({ error: "admissionId is required." });
  }

  const admission = admissions.find((item) => item.id === admissionId);
  if (!admission) {
    return res.status(404).json({ error: "Admission not found." });
  }
  if (admission.status !== "active") {
    return res.status(409).json({ error: "Cannot generate a summary for a discharged admission." });
  }

  return res.json({ data: createSummaryForAdmission(admission, userId) });
});

router.get("/summary/:admissionId", (req, res) => {
  const summary = activeSummaryFor(req.params.admissionId);
  if (!summary) {
    return res.status(404).json({ error: "Active summary not found." });
  }
  addAudit(req.get("x-user-id") ?? "clinician-demo", "summary-viewed", summary.id);
  return res.json({ data: summary });
});

router.get("/provenance/:summaryId", (req, res) => {
  const summary = aiSummaries.find((item) => item.id === req.params.summaryId);
  if (!summary) {
    return res.status(404).json({ error: "Summary not found." });
  }

  const admission = admissions.find((item) => item.id === summary.admissionId);
  const records = sourceRecords.filter((record) => record.patientId === admission?.patientId);

  addAudit(req.get("x-user-id") ?? "clinician-demo", "provenance-viewed", summary.id);
  return res.json({ data: { summaryId: summary.id, sourceRecords: records } });
});

router.get("/provenance/source-records/:sourceRecordId", (req, res) => {
  const sourceRecord = sourceRecords.find((record) => record.id === req.params.sourceRecordId);
  if (!sourceRecord) {
    return res.status(404).json({ error: "Source record not found." });
  }
  addAudit(req.get("x-user-id") ?? "clinician-demo", "source-record-viewed", sourceRecord.id);
  return res.json({ data: sourceRecord });
});

router.post("/discharge", (req, res) => {
  const { admissionId, dischargeTime = nowIso(), userId = "system" } = req.body ?? {};
  if (!admissionId) {
    return res.status(400).json({ error: "admissionId is required." });
  }

  const admission = admissions.find((item) => item.id === admissionId);
  if (!admission) {
    return res.status(404).json({ error: "Admission not found." });
  }

  admission.status = "discharged";
  admission.dischargeTime = dischargeTime;

  const removedSummaryIds = [];
  for (let index = aiSummaries.length - 1; index >= 0; index -= 1) {
    if (aiSummaries[index].admissionId === admissionId) {
      removedSummaryIds.push(aiSummaries[index].id);
      aiSummaries.splice(index, 1);
    }
  }

  addAudit(userId, "discharge-kill-switch-executed", admissionId);
  return res.json({ data: { admission, removedSummaryIds, sourceRecordsUntouched: true } });
});

router.get("/audit", (_req, res) => {
  res.json({ data: auditLogs });
});

router.get("/medisense/demo", (_req, res) => {
  const admission = admissions.find((item) => item.status === "active") ?? admissions[0];
  const summary = admission ? activeSummaryFor(admission.id) ?? createSummaryForAdmission(admission) : null;
  res.json({ data: { patient: patients[0], admission, summary, auditLogs } });
});

export default router;
