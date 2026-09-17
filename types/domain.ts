export type UserRole =
  | "parent_carer"
  | "child_young_person"
  | "adult_user"
  | "teacher_senco"
  | "educational_psychologist"
  | "speech_language_therapist"
  | "occupational_therapist"
  | "camhs_clinician"
  | "social_worker"
  | "gp_paediatrician"
  | "local_authority_officer"
  | "administrator"
  | "commissioner";

export type RiskLevel = "green" | "amber" | "red";

export type ObservationCategory =
  | "emotional_dysregulation"
  | "executive_functioning"
  | "sensory_processing"
  | "communication_difference"
  | "sleep"
  | "school_avoidance"
  | "anxiety"
  | "self_harm_risk";

export interface Observation {
  id: string;
  childId: string;
  category: ObservationCategory;
  narrative: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  occurredAt: string;
  sourceRole: UserRole;
  safeguardingConcern?: boolean;
  environment?: string;
  emotionalState?: string;
  trigger?: string;
  supportAttempted?: string;
  outcome?: string;
  frequency?: string;
  professionalInvolvement?: string;
}

export interface RiskScore {
  level: RiskLevel;
  score: number;
  rationale: string[];
  recommendedAction: string;
}
