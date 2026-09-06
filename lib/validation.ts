import { sanitizeFreeText } from "@/lib/security";
import type { Observation, ObservationCategory, UserRole } from "@/types/domain";

const OBSERVATION_CATEGORIES: ObservationCategory[] = [
  "emotional_dysregulation",
  "executive_functioning",
  "sensory_processing",
  "communication_difference",
  "sleep",
  "school_avoidance",
  "anxiety",
  "self_harm_risk",
];

const USER_ROLES: UserRole[] = [
  "parent_carer",
  "child_young_person",
  "adult_user",
  "teacher_senco",
  "educational_psychologist",
  "speech_language_therapist",
  "occupational_therapist",
  "camhs_clinician",
  "social_worker",
  "gp_paediatrician",
  "local_authority_officer",
  "administrator",
  "commissioner",
];

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors?: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isObservationCategory(value: unknown): value is ObservationCategory {
  return typeof value === "string" && OBSERVATION_CATEGORIES.includes(value as ObservationCategory);
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

function optionalText(value: unknown, maxLength = 1000): string | undefined {
  const sanitised = sanitizeFreeText(value, maxLength);
  return sanitised.length > 0 ? sanitised : undefined;
}

export function validateObservation(value: unknown): ValidationResult<Observation> {
  if (!isObject(value)) {
    return { ok: false, errors: ["Observation must be an object."] };
  }

  const errors: string[] = [];
  const id = optionalText(value.id, 100) || crypto.randomUUID();
  const childId = optionalText(value.childId, 100);
  const category = value.category;
  const intensity = Number(value.intensity);
  const occurredAt = optionalText(value.occurredAt, 80);
  const sourceRole = value.sourceRole;
  const narrative = sanitizeFreeText(value.narrative, 4000);

  if (!childId) errors.push("childId is required.");
  if (!isObservationCategory(category)) errors.push("category is invalid.");
  if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) errors.push("intensity must be an integer from 1 to 5.");
  if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) errors.push("occurredAt must be a valid ISO date/time.");
  if (!isUserRole(sourceRole)) errors.push("sourceRole is invalid.");
  if (narrative.length < 3) errors.push("narrative is required.");

  if (errors.length > 0 || !childId || !isObservationCategory(category) || !occurredAt || !isUserRole(sourceRole)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      id,
      childId,
      category,
      narrative,
      intensity: intensity as Observation["intensity"],
      occurredAt,
      sourceRole,
      safeguardingConcern: Boolean(value.safeguardingConcern),
      environment: optionalText(value.environment, 200),
      emotionalState: optionalText(value.emotionalState, 200),
      trigger: optionalText(value.trigger, 500),
      supportAttempted: optionalText(value.supportAttempted, 1000),
      outcome: optionalText(value.outcome, 1000),
      frequency: optionalText(value.frequency, 300),
      professionalInvolvement: optionalText(value.professionalInvolvement, 500),
    },
  };
}

export function validateObservations(value: unknown): ValidationResult<Observation[]> {
  if (!Array.isArray(value)) {
    return { ok: false, errors: ["observations must be an array."] };
  }

  if (value.length > 200) {
    return { ok: false, errors: ["A maximum of 200 observations can be analysed at once."] };
  }

  const observations: Observation[] = [];
  const errors: string[] = [];

  value.forEach((item, index) => {
    const result = validateObservation(item);
    if (result.ok && result.data) {
      observations.push(result.data);
    } else {
      errors.push(`Observation ${index + 1}: ${(result.errors ?? []).join(" ")}`);
    }
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: observations };
}
