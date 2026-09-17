import type { Observation, ObservationCategory, RiskScore } from "@/types/domain";

const CATEGORY_WEIGHTS: Record<ObservationCategory, number> = {
  emotional_dysregulation: 10,
  executive_functioning: 7,
  sensory_processing: 7,
  communication_difference: 8,
  sleep: 6,
  school_avoidance: 12,
  anxiety: 10,
  self_harm_risk: 25,
};

const ACTIONS = {
  green: "Continue universal support, monitor trends weekly, and celebrate strengths.",
  amber: "Convene a multi-agency review, update support strategies, and gather evidence for targeted intervention.",
  red: "Escalate immediately to safeguarding or crisis pathways and notify the agreed responsible professional.",
} as const;

function daysBetween(left: Date, right: Date): number {
  return Math.abs(left.getTime() - right.getTime()) / (1000 * 60 * 60 * 24);
}

export function calculateRiskScore(observations: Observation[], now = new Date()): RiskScore {
  if (observations.length === 0) {
    return {
      level: "green",
      score: 0,
      rationale: ["No recent observations have been recorded."],
      recommendedAction: ACTIONS.green,
    };
  }

  const recentObservations = observations.filter((observation) => daysBetween(new Date(observation.occurredAt), now) <= 30);
  const categoryCounts = new Map<ObservationCategory, number>();
  let rawScore = 0;
  const rationale: string[] = [];

  for (const observation of recentObservations) {
    categoryCounts.set(observation.category, (categoryCounts.get(observation.category) ?? 0) + 1);
    const recencyMultiplier = daysBetween(new Date(observation.occurredAt), now) <= 7 ? 1.25 : 1;
    const safeguardingMultiplier = observation.safeguardingConcern ? 1.5 : 1;
    rawScore += CATEGORY_WEIGHTS[observation.category] * observation.intensity * recencyMultiplier * safeguardingMultiplier;
  }

  for (const [category, count] of categoryCounts) {
    if (count >= 3) {
      rawScore += 12;
      rationale.push(`Recurring ${category.replaceAll("_", " ")} pattern recorded ${count} times in 30 days.`);
    }
  }

  if (recentObservations.some((observation) => observation.safeguardingConcern || observation.category === "self_harm_risk")) {
    rationale.push("Safeguarding or self-harm indicators require professional review.");
  }

  const score = Math.min(100, Math.round(rawScore));
  const level = score >= 70 ? "red" : score >= 35 ? "amber" : "green";

  return {
    level,
    score,
    rationale: rationale.length > 0 ? rationale : ["Risk score reflects recent frequency, intensity, category weighting, and recency."],
    recommendedAction: ACTIONS[level],
  };
}
