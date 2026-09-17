import type { Observation, RiskScore } from "@/types/domain";

export interface EhcpReportInput {
  childName: string;
  dateOfBirth?: string;
  strengths: string[];
  observations: Observation[];
  riskScore: RiskScore;
}

export interface EhcpReportSection {
  heading: string;
  body: string;
}

export function generateEhcpReportSections(input: EhcpReportInput): EhcpReportSection[] {
  const categories = [...new Set(input.observations.map((observation) => observation.category.replaceAll("_", " ")))];

  return [
    {
      heading: "Child or young person profile",
      body: `${input.childName}${input.dateOfBirth ? `, born ${input.dateOfBirth}` : ""}. This draft is generated from structured observations and should be reviewed by the family and named professionals.`,
    },
    {
      heading: "Strengths and protective factors",
      body: input.strengths.length > 0 ? input.strengths.join("; ") : "Strengths evidence should be gathered from home, education, and professional contributors.",
    },
    {
      heading: "Presenting needs and patterns",
      body: categories.length > 0 ? `Observed themes include ${categories.join(", ")}.` : "No observation themes have been recorded yet.",
    },
    {
      heading: "Functional impact",
      body: "Evidence should describe what the child can do independently, what requires prompting or adaptation, and how needs affect learning, emotional wellbeing, communication, safety, and participation.",
    },
    {
      heading: "Risk and safeguarding summary",
      body: `Current risk level is ${input.riskScore.level.toUpperCase()} (${input.riskScore.score}/100). ${input.riskScore.recommendedAction}`,
    },
    {
      heading: "SMART outcomes and provision",
      body: "Draft outcomes should be specific, measurable, achievable, relevant, and time-bound, with provision described by type, frequency, duration, responsible role, and review date.",
    },
  ];
}
