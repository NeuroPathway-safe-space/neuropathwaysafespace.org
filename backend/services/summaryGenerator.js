const UNAVAILABLE = "Information not available from connected records.";
const DISCLAIMER =
  "This summary supports clinical decision making and does not replace professional judgement.";

const riskCategories = [
  "selfHarm",
  "suicide",
  "violence",
  "falls",
  "medicationCompliance",
];

const communicationCategories = [
  "preferredCommunication",
  "sensoryNeeds",
  "neurodiversityNeeds",
];

function calculateAge(dob, atDate = new Date()) {
  const birthDate = new Date(`${dob}T00:00:00Z`);
  let age = atDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDifference = atDate.getUTCMonth() - birthDate.getUTCMonth();
  const dayDifference = atDate.getUTCDate() - birthDate.getUTCDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age;
}

function provenance(record, confidenceScore = 0.97) {
  return {
    sourceSystem: record.sourceSystem,
    sourceRecordId: record.sourceIdentifier,
    sourceDate: record.recordDate,
    confidenceScore,
    sourceRecordUrl: `/provenance/source-records/${record.id}`,
  };
}

function unavailableStatement(section, confidenceScore = 1) {
  return {
    text: UNAVAILABLE,
    provenance: {
      sourceSystem: "MediSense safety guardrail",
      sourceRecordId: `unavailable:${section}`,
      sourceDate: new Date().toISOString().slice(0, 10),
      confidenceScore,
      sourceRecordUrl: null,
    },
  };
}

function statementFromRecord(record) {
  return {
    text: record.payload.statement,
    provenance: provenance(record),
  };
}

function groupRecords(records, type) {
  return records.filter((record) => record.type === type);
}

export function generateCareSummary({ patient, admission, records }) {
  const diagnoses = groupRecords(records, "diagnosis");
  const medications = groupRecords(records, "medication");
  const risks = groupRecords(records, "risk");
  const communications = groupRecords(records, "communication");
  const whatHelps = groupRecords(records, "whatHelps");
  const whatDoesNotHelp = groupRecords(records, "whatDoesNotHelp");

  return {
    summaryVersion: "medisense-mvp-1.0",
    generatedAt: new Date().toISOString(),
    model: {
      name: "GPT-5-or-equivalent deterministic structured summariser (MVP rules engine stub)",
      temperature: 0,
      autonomousActions: false,
    },
    safety: {
      clinicalDisclaimer: DISCLAIMER,
      rules: [
        "No diagnosis, prescribing, treatment recommendation, invention, or inference from missing data.",
        "Unavailable data is explicitly marked as unavailable from connected records.",
        "Every statement includes source system, source record ID, source date, and confidence score.",
      ],
    },
    patientSnapshot: {
      statements: [
        {
          text: `${patient.name}, born ${patient.dob}, age ${calculateAge(patient.dob)}, NHS Number ${patient.nhsNumber}.`,
          provenance: {
            sourceSystem: "Local PAS admission feed",
            sourceRecordId: admission.id,
            sourceDate: admission.admissionTime.slice(0, 10),
            confidenceScore: 0.99,
            sourceRecordUrl: `/provenance/admissions/${admission.id}`,
          },
        },
      ],
      fields: {
        name: patient.name,
        dob: patient.dob,
        age: calculateAge(patient.dob),
        nhsNumber: patient.nhsNumber,
      },
    },
    diagnoses: {
      active: diagnoses.filter((record) => record.payload.category === "active").map(statementFromRecord),
      historical: diagnoses
        .filter((record) => record.payload.category === "historical")
        .map(statementFromRecord),
    },
    medicationSummary:
      medications.length > 0
        ? medications.map((record) => ({
            name: record.payload.name,
            dose: record.payload.dose,
            frequency: record.payload.frequency,
            indication: record.payload.indication,
            monitoringRequirements: record.payload.monitoringRequirements,
            provenance: provenance(record),
          }))
        : [unavailableStatement("medications")],
    risks: Object.fromEntries(
      riskCategories.map((category) => {
        const categoryRecords = risks.filter((record) => record.payload.category === category);
        return [
          category,
          categoryRecords.length > 0 ? categoryRecords.map(statementFromRecord) : [unavailableStatement(`risks.${category}`)],
        ];
      }),
    ),
    communicationNeeds: Object.fromEntries(
      communicationCategories.map((category) => {
        const categoryRecords = communications.filter((record) => record.payload.category === category);
        return [
          category,
          categoryRecords.length > 0
            ? categoryRecords.map(statementFromRecord)
            : [unavailableStatement(`communicationNeeds.${category}`)],
        ];
      }),
    ),
    whatHelps: whatHelps.length > 0 ? whatHelps.map(statementFromRecord) : [unavailableStatement("whatHelps")],
    whatDoesNotHelp:
      whatDoesNotHelp.length > 0 ? whatDoesNotHelp.map(statementFromRecord) : [unavailableStatement("whatDoesNotHelp")],
    careConsiderations: [
      {
        text: DISCLAIMER,
        provenance: {
          sourceSystem: "MediSense clinical safety case",
          sourceRecordId: "DCB0129-SCR-MVP",
          sourceDate: "2026-05-31",
          confidenceScore: 1,
          sourceRecordUrl: "/docs/clinical-safety.md",
        },
      },
    ],
  };
}

export { UNAVAILABLE, DISCLAIMER };
