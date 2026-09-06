import type { Observation, RiskLevel } from "@/types/domain";

export type EvidenceStrengthLevel = "limited" | "emerging" | "moderate" | "strong";
export type SafeguardingRiskCategory = "low" | "moderate" | "high" | "urgent_safeguarding_concern";

export interface PatternFinding {
  theme: string;
  evidenceIds: string[];
  settings: string[];
  frequency: string;
  severityTrend: "insufficient_evidence" | "stable" | "improving" | "worsening" | "fluctuating";
  uncertainty: string;
}

export interface SupportRecommendation {
  area: string;
  support: string;
  rationale: string;
  responsibleRole: string;
}

export interface RiskFlag {
  category: SafeguardingRiskCategory;
  flag: string;
  evidenceIds: string[];
  reason: string;
  recommendedAction: string;
}

export interface NeuroPathwayAnalysis {
  observationSummary: string;
  patternsIdentified: PatternFinding[];
  possibleAreasOfNeed: string[];
  evidenceStrength: {
    level: EvidenceStrengthLevel;
    rationale: string;
  };
  recommendedSupports: SupportRecommendation[];
  missingInformation: string[];
  professionalSummary: string;
  riskFlags: RiskFlag[];
  deterministicRisk: {
    level: RiskLevel;
    score: number;
    rationale: string[];
  };
}

export interface EhcpEvidenceDomain {
  observedImpact: string;
  frequency: string;
  supportAttempted: string;
  outcomes: string;
  unmetNeed: string;
  evidenceIds: string[];
}

export interface EhcpReadyEvidence {
  cognitionAndLearning: EhcpEvidenceDomain;
  communicationAndInteraction: EhcpEvidenceDomain;
  semh: EhcpEvidenceDomain;
  sensoryAndPhysical: EhcpEvidenceDomain;
  attendance: EhcpEvidenceDomain;
  emotionalRegulation: EhcpEvidenceDomain;
  executiveFunctioning: EhcpEvidenceDomain;
}

export interface MultiAudienceSummary {
  nhsClinicalLanguage: string;
  educationalSendLanguage: string;
  socialCareLanguage: string;
  parentFriendlyLanguage: string;
}

export interface TimelineTrendAnalysis {
  timelineSummary: string[];
  trendAnalysis: string;
  riskTrajectory: "insufficient_evidence" | "stable" | "improving" | "worsening" | "fluctuating";
  triggerRelationships: string[];
}

export interface JournalWellbeingAnalysis {
  emotionalSummary: string;
  wellbeingTrends: string[];
  supportSuggestions: string[];
  encouragement: string;
  escalationWarning?: string;
}

export interface SpecialistAgentResult {
  agent: "Risk Agent" | "Observation Agent" | "EHCP Agent" | "Parent Support Agent" | "Clinical Summary Agent" | "Safeguarding Agent";
  scope: string;
  output: Record<string, unknown>;
  uncertainty: string;
  escalation?: string;
}

export interface AnalysisRequestPayload {
  observations: Observation[];
  includeEhcpEvidence?: boolean;
  includeTranslations?: boolean;
  includeTimeline?: boolean;
}
