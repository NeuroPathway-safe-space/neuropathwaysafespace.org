export const patients = [
  {
    id: "pat-001",
    nhsNumber: "9434765919",
    patientId: "GM-TRUST-0001",
    name: "Amira Patel",
    dob: "1984-03-18",
    createdAt: "2026-05-31T08:00:00Z",
  },
];

export const admissions = [
  {
    id: "adm-001",
    patientId: "pat-001",
    admissionTime: "2026-05-31T09:15:00Z",
    dischargeTime: null,
    status: "active",
  },
];

export const sourceRecords = [
  {
    id: "src-dx-001",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "Condition/GMCR-1001",
    recordDate: "2026-05-12",
    type: "diagnosis",
    payload: {
      category: "active",
      statement: "Type 2 diabetes mellitus recorded as an active condition.",
    },
  },
  {
    id: "src-dx-002",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "Condition/GMCR-1002",
    recordDate: "2025-11-04",
    type: "diagnosis",
    payload: {
      category: "historical",
      statement: "Previous episode of severe depression recorded in 2025.",
    },
  },
  {
    id: "src-med-001",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "MedicationStatement/GMCR-2001",
    recordDate: "2026-05-20",
    type: "medication",
    payload: {
      name: "Metformin",
      dose: "500 mg",
      frequency: "Twice daily",
      indication: "Type 2 diabetes mellitus",
      monitoringRequirements: "Renal function and gastrointestinal tolerance documented for monitoring.",
    },
  },
  {
    id: "src-risk-001",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "Flag/GMCR-3001",
    recordDate: "2026-04-28",
    type: "risk",
    payload: {
      category: "falls",
      statement: "Falls risk assessment indicates increased falls risk when mobilising at night.",
    },
  },
  {
    id: "src-risk-002",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "RiskAssessment/GMCR-3002",
    recordDate: "2026-03-15",
    type: "risk",
    payload: {
      category: "medicationCompliance",
      statement: "Medication compliance concerns recorded after missed repeat prescriptions.",
    },
  },
  {
    id: "src-comm-001",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "Communication/GMCR-4001",
    recordDate: "2026-05-01",
    type: "communication",
    payload: {
      category: "preferredCommunication",
      statement: "Patient prefers clear written explanations alongside verbal discussion.",
    },
  },
  {
    id: "src-help-001",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "CarePlan/GMCR-5001",
    recordDate: "2026-05-01",
    type: "whatHelps",
    payload: {
      statement: "Allowing extra time for questions helps the patient understand care plans.",
    },
  },
  {
    id: "src-help-002",
    patientId: "pat-001",
    sourceSystem: "Greater Manchester Care Record",
    sourceIdentifier: "CarePlan/GMCR-5002",
    recordDate: "2026-05-01",
    type: "whatDoesNotHelp",
    payload: {
      statement: "Rapid changes in plan without explanation are recorded as unhelpful.",
    },
  },
];

export const aiSummaries = [];

export const auditLogs = [
  {
    id: "aud-001",
    userId: "system",
    action: "seed-data-loaded",
    resource: "medisense-mvp",
    timestamp: "2026-05-31T08:00:00Z",
  },
];

export function resetMediSenseData() {
  aiSummaries.length = 0;
  auditLogs.splice(1);
  const admission = admissions.find((item) => item.id === "adm-001");
  if (admission) {
    admission.status = "active";
    admission.dischargeTime = null;
  }
}
