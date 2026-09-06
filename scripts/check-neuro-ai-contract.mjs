import { readFileSync } from "node:fs";

const requiredPromptPhrases = [
  "You are NeuroPathway AI",
  "You do not diagnose",
  "Always output:",
  "Observation Summary",
  "Patterns Identified",
  "Possible Areas of Need",
  "Evidence Strength",
  "Recommended Supports",
  "Missing Information",
  "Professional Summary",
  "Risk Flags",
  "urgent safeguarding concern",
  "Risk Agent",
  "Observation Agent",
  "EHCP Agent",
  "Parent Support Agent",
  "Clinical Summary Agent",
  "Safeguarding Agent",
];

const promptSource = readFileSync(new URL("../lib/ai-prompts.ts", import.meta.url), "utf8");
const missingPromptPhrases = requiredPromptPhrases.filter((phrase) => !promptSource.includes(phrase));

if (missingPromptPhrases.length > 0) {
  console.error(`Missing NeuroPathway prompt contract phrases: ${missingPromptPhrases.join(", ")}`);
  process.exit(1);
}

const requiredAnalysisExports = [
  "analyseObservations",
  "convertToEhcpReadyEvidence",
  "translateForAudiences",
  "analyseTimeline",
  "analyseJournalEntry",
  "runSpecialistAgents",
];

const analysisSource = readFileSync(new URL("../lib/neuro-ai-analysis.ts", import.meta.url), "utf8");
const missingExports = requiredAnalysisExports.filter((exportName) => !analysisSource.includes(`function ${exportName}`));

if (missingExports.length > 0) {
  console.error(`Missing NeuroPathway analysis exports: ${missingExports.join(", ")}`);
  process.exit(1);
}

console.log("NeuroPathway AI prompt and structured analysis contract verified.");
