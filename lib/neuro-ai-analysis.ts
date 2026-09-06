import { calculateRiskScore } from "@/lib/risk-scoring";
import type { Observation, ObservationCategory } from "@/types/domain";
import type {
  EhcpEvidenceDomain,
  EhcpReadyEvidence,
  EvidenceStrengthLevel,
  JournalWellbeingAnalysis,
  MultiAudienceSummary,
  NeuroPathwayAnalysis,
  PatternFinding,
  RiskFlag,
  SafeguardingRiskCategory,
  SpecialistAgentResult,
  SupportRecommendation,
  TimelineTrendAnalysis,
} from "@/types/neuro-ai";

// Shared taxonomy labels used to keep analysis language consistent across agents.
const CATEGORY_LABELS: Record<ObservationCategory, string> = {
  emotional_dysregulation: "emotional regulation",
  executive_functioning: "executive functioning",
  sensory_processing: "sensory processing",
  communication_difference: "communication and interaction",
  sleep: "sleep and recovery",
  school_avoidance: "attendance and school-related anxiety",
  anxiety: "anxiety and wellbeing",
  self_harm_risk: "self-harm or safety concern",
};

// Support recommendations are intentionally practical and non-diagnostic.
const SUPPORT_LIBRARY: Record<ObservationCategory, Omit<SupportRecommendation, "rationale">> = {
  emotional_dysregulation: {
    area: "Emotional Regulation",
    support: "Agree a co-regulation plan, predictable calm space access, emotional literacy tools, and post-incident repair routines.",
    responsibleRole: "Parent/carer, SENCO, class team, and mental health lead",
  },
  executive_functioning: {
    area: "Executive Functioning",
    support: "Use visual planning, chunked instructions, reduced working-memory load, timers, checklists, and supported transitions.",
    responsibleRole: "SENCO, class teacher, parent/carer, and occupational therapist where involved",
  },
  sensory_processing: {
    area: "Sensory and Physical",
    support: "Complete a sensory profile and offer reasonable adjustments such as quieter spaces, movement breaks, predictable routines, and sensory tools.",
    responsibleRole: "SENCO, occupational therapist, and class team",
  },
  communication_difference: {
    area: "Communication and Interaction",
    support: "Use clear language, processing time, visual supports, communication preferences, and explicit social-context explanations.",
    responsibleRole: "SENCO, speech and language therapist, parent/carer, and class team",
  },
  sleep: {
    area: "Health and Wellbeing",
    support: "Record sleep patterns, reduce morning demand where possible, and consider referral to appropriate health advice if sleep disruption persists.",
    responsibleRole: "Parent/carer, GP/paediatrician, and school pastoral team",
  },
  school_avoidance: {
    area: "Attendance",
    support: "Create a relational attendance plan with graded return, trusted adult check-ins, safe arrival routine, and adjustments to known triggers.",
    responsibleRole: "SENCO, attendance lead, parent/carer, and pastoral team",
  },
  anxiety: {
    area: "SEMH",
    support: "Provide predictable routines, worry scaling, trusted adult access, low-arousal communication, and planned coping strategies.",
    responsibleRole: "Parent/carer, school mental health lead, SENCO, and CAMHS where involved",
  },
  self_harm_risk: {
    area: "Safeguarding and Wellbeing",
    support: "Follow local safeguarding procedures immediately, agree a safety plan with the appropriate professionals, and do not leave concerns unreviewed.",
    responsibleRole: "Designated safeguarding lead and relevant crisis/safeguarding professionals",
  },
};

// Safeguarding keyword checks are conservative triggers for human review, not automated clinical decisions.
const RISK_KEYWORDS = [
  { match: ["suicide", "end my life", "kill myself", "want to die"], category: "urgent_safeguarding_concern" as const, flag: "Suicidal language" },
  { match: ["self harm", "self-harm", "cut", "overdose"], category: "high" as const, flag: "Self-harm concern" },
  { match: ["ran away", "abscond", "left site", "missing"], category: "high" as const, flag: "Absconding risk" },
  { match: ["exploitation", "unsafe adult", "coerced", "groom"], category: "high" as const, flag: "Exploitation vulnerability" },
  { match: ["crisis", "panic", "meltdown", "overloaded", "dysregulated"], category: "moderate" as const, flag: "Emotional crisis indicator" },
  { match: ["hit", "kick", "throw", "aggression", "violent"], category: "moderate" as const, flag: "Aggression escalation" },
  { match: ["neglect", "hungry", "unwashed", "no coat"], category: "high" as const, flag: "Neglect indicator" },
  { match: ["medication", "missed dose", "side effect", "sedated"], category: "moderate" as const, flag: "Medication concern" },
];

function normalise(value: string | undefined): string {
  return (value ?? "").trim();
}

function observationText(observation: Observation): string {
  return [
    observation.narrative,
    observation.environment,
    observation.emotionalState,
    observation.trigger,
    observation.supportAttempted,
    observation.outcome,
    observation.frequency,
    observation.professionalInvolvement,
  ]
    .map(normalise)
    .filter(Boolean)
    .join(" ");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function groupByCategory(observations: Observation[]): Map<ObservationCategory, Observation[]> {
  const grouped = new Map<ObservationCategory, Observation[]>();

  for (const observation of observations) {
    grouped.set(observation.category, [...(grouped.get(observation.category) ?? []), observation]);
  }

  return grouped;
}

function describeFrequency(count: number): string {
  if (count >= 5) return `${count} records indicate a repeated pattern requiring coordinated review.`;
  if (count >= 3) return `${count} records suggest an emerging repeated pattern.`;
  if (count === 2) return "Two records suggest a possible pattern, but more evidence is needed.";
  return "One record only; treat as an initial indicator rather than a confirmed pattern.";
}

function inferTrend(observations: Observation[]): PatternFinding["severityTrend"] {
  if (observations.length < 2) return "insufficient_evidence";

  const sorted = [...observations].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  const first = sorted[0].intensity;
  const last = sorted[sorted.length - 1].intensity;

  if (last >= first + 2) return "worsening";
  if (first >= last + 2) return "improving";
  if (new Set(sorted.map((observation) => observation.intensity)).size > 2) return "fluctuating";
  return "stable";
}

function evidenceStrength(observations: Observation[], patterns: PatternFinding[]): { level: EvidenceStrengthLevel; rationale: string } {
  const settings = unique(observations.map((observation) => normalise(observation.environment)));
  const sources = unique(observations.map((observation) => observation.sourceRole));
  const repeatedPatterns = patterns.filter((pattern) => pattern.evidenceIds.length >= 3).length;

  if (observations.length >= 8 && settings.length >= 2 && sources.length >= 2 && repeatedPatterns >= 2) {
    return { level: "strong", rationale: "Multiple observations across settings and contributors show repeated themes." };
  }

  if (observations.length >= 5 && (settings.length >= 2 || sources.length >= 2)) {
    return { level: "moderate", rationale: "Several observations are available, with some cross-setting or multi-source evidence." };
  }

  if (observations.length >= 2) {
    return { level: "emerging", rationale: "There is more than one observation, but consistency and context need further evidence." };
  }

  return { level: "limited", rationale: "Only one or no observations are available, so uncertainty remains high." };
}

function buildPatterns(observations: Observation[]): PatternFinding[] {
  return [...groupByCategory(observations)].map(([category, categoryObservations]) => ({
    theme: CATEGORY_LABELS[category],
    evidenceIds: categoryObservations.map((observation) => observation.id),
    settings: unique(categoryObservations.map((observation) => normalise(observation.environment) || "setting not recorded")),
    frequency: describeFrequency(categoryObservations.length),
    severityTrend: inferTrend(categoryObservations),
    uncertainty:
      categoryObservations.length >= 3
        ? "Pattern is supported by repeated observations, but should still be reviewed with family and professionals."
        : "Evidence is limited; avoid firm conclusions until more observations are recorded.",
  }));
}

function buildRiskFlags(observations: Observation[]): RiskFlag[] {
  const flags: RiskFlag[] = [];

  for (const keyword of RISK_KEYWORDS) {
    const matched = observations.filter((observation) => {
      const text = observationText(observation).toLowerCase();
      return keyword.match.some((term) => text.includes(term));
    });

    if (matched.length > 0) {
      flags.push({
        category: keyword.category,
        flag: keyword.flag,
        evidenceIds: matched.map((observation) => observation.id),
        reason: `${keyword.flag} was triggered by language or context recorded in ${matched.length} observation(s).`,
        recommendedAction:
          keyword.category === "urgent_safeguarding_concern"
            ? "Follow local urgent safeguarding or crisis procedures immediately; this tool does not make clinical decisions."
            : "Review with the responsible safeguarding or pastoral lead and agree proportionate next steps.",
      });
    }
  }

  const explicitlySafeguarding = observations.filter((observation) => observation.safeguardingConcern);
  if (explicitlySafeguarding.length > 0) {
    flags.push({
      category: "high",
      flag: "Recorded safeguarding concern",
      evidenceIds: explicitlySafeguarding.map((observation) => observation.id),
      reason: "One or more contributors explicitly marked the observation as a safeguarding concern.",
      recommendedAction: "Ensure the concern is reviewed through local safeguarding governance and documented by the responsible professional.",
    });
  }

  return flags.length > 0
    ? flags
    : [
        {
          category: "low",
          flag: "No specific safeguarding keyword detected",
          evidenceIds: [],
          reason: "No self-harm, suicidal language, absconding, exploitation, neglect, medication, or crisis keywords were detected in the supplied text.",
          recommendedAction: "Continue monitoring and record any escalation, context, protective factors, and support response.",
        },
      ];
}

function buildRecommendedSupports(patterns: PatternFinding[]): SupportRecommendation[] {
  const categories = [...new Set(patterns.map((pattern) => {
    const entry = Object.entries(CATEGORY_LABELS).find(([, label]) => label === pattern.theme);
    return entry?.[0] as ObservationCategory | undefined;
  }).filter(Boolean))] as ObservationCategory[];

  return categories.map((category) => ({
    ...SUPPORT_LIBRARY[category],
    rationale: `Recommended because observations include ${CATEGORY_LABELS[category]} evidence.`,
  }));
}

function buildPossibleNeeds(patterns: PatternFinding[]): string[] {
  return patterns.map((pattern) => `Possible need for support with ${pattern.theme}; ${pattern.uncertainty.toLowerCase()}`);
}

function buildMissingInformation(observations: Observation[]): string[] {
  const missing = new Set<string>();

  if (observations.length < 3) missing.add("More dated observations are needed to understand frequency and consistency over time.");
  if (observations.every((observation) => !observation.environment)) missing.add("Record settings/environments to compare home, school, community, and clinical contexts.");
  if (observations.every((observation) => !observation.trigger)) missing.add("Record possible triggers and what happened immediately before each observation.");
  if (observations.every((observation) => !observation.supportAttempted)) missing.add("Record support attempted, including adjustments, co-regulation, sensory strategies, or communication aids.");
  if (observations.every((observation) => !observation.outcome)) missing.add("Record outcomes after support, including recovery time and what helped.");
  if (observations.every((observation) => !observation.professionalInvolvement)) missing.add("Record whether SENCO, health, social care, or safeguarding professionals are involved.");

  return [...missing];
}

// Main structured JSON analysis required by the NeuroPathway AI contract.
export function analyseObservations(observations: Observation[]): NeuroPathwayAnalysis {
  const patterns = buildPatterns(observations);
  const risk = calculateRiskScore(observations);
  const strength = evidenceStrength(observations, patterns);
  const highestIntensity = Math.max(0, ...observations.map((observation) => observation.intensity));

  return {
    observationSummary:
      observations.length === 0
        ? "No observations were supplied. NeuroPathway AI cannot infer needs without evidence."
        : `${observations.length} observation(s) were reviewed across ${unique(observations.map((observation) => normalise(observation.environment) || "unspecified setting")).join(", ")}. The highest recorded intensity was ${highestIntensity}/5. This is an evidence organisation summary, not a diagnosis.`,
    patternsIdentified: patterns,
    possibleAreasOfNeed: buildPossibleNeeds(patterns),
    evidenceStrength: strength,
    recommendedSupports: buildRecommendedSupports(patterns),
    missingInformation: buildMissingInformation(observations),
    professionalSummary:
      observations.length === 0
        ? "No professional summary can be generated without observations."
        : `Structured evidence indicates ${patterns.map((pattern) => pattern.theme).join(", ")}. Functional impact, consistency across settings, and response to support should be reviewed by the family and relevant professionals before decisions are made.`,
    riskFlags: buildRiskFlags(observations),
    deterministicRisk: {
      level: risk.level,
      score: risk.score,
      rationale: risk.rationale,
    },
  };
}

function domainEvidence(observations: Observation[], categories: ObservationCategory[], fallback: string): EhcpEvidenceDomain {
  const matches = observations.filter((observation) => categories.includes(observation.category));
  const evidenceIds = matches.map((observation) => observation.id);

  return {
    observedImpact:
      matches.length > 0
        ? matches.map((observation) => observation.narrative).join(" ")
        : `${fallback} evidence has not yet been recorded in sufficient detail.`,
    frequency: matches.map((observation) => observation.frequency).filter(Boolean).join("; ") || describeFrequency(matches.length),
    supportAttempted: matches.map((observation) => observation.supportAttempted).filter(Boolean).join("; ") || "Support attempted is not yet recorded consistently.",
    outcomes: matches.map((observation) => observation.outcome).filter(Boolean).join("; ") || "Outcomes after support are not yet recorded consistently.",
    unmetNeed:
      matches.length > 0
        ? `The evidence suggests unmet need in ${categories.map((category) => CATEGORY_LABELS[category]).join(" and ")}; further professional review is required.`
        : "Unmet need cannot be determined without more evidence.",
    evidenceIds,
  };
}

// EHCP conversion maps everyday observations into education-focused functional-impact domains.
export function convertToEhcpReadyEvidence(observations: Observation[]): EhcpReadyEvidence {
  return {
    cognitionAndLearning: domainEvidence(observations, ["executive_functioning"], "Cognition and learning"),
    communicationAndInteraction: domainEvidence(observations, ["communication_difference"], "Communication and interaction"),
    semh: domainEvidence(observations, ["anxiety", "emotional_dysregulation", "self_harm_risk"], "SEMH"),
    sensoryAndPhysical: domainEvidence(observations, ["sensory_processing", "sleep"], "Sensory and physical"),
    attendance: domainEvidence(observations, ["school_avoidance"], "Attendance"),
    emotionalRegulation: domainEvidence(observations, ["emotional_dysregulation", "anxiety"], "Emotional regulation"),
    executiveFunctioning: domainEvidence(observations, ["executive_functioning"], "Executive functioning"),
  };
}

// Audience translations keep the same evidence consistent for NHS, education, social care, and parents.
export function translateForAudiences(analysis: NeuroPathwayAnalysis): MultiAudienceSummary {
  const themes = analysis.patternsIdentified.map((pattern) => pattern.theme).join(", ") || "no repeated themes yet";

  return {
    nhsClinicalLanguage: `Evidence describes functional concerns relating to ${themes}. This summary is non-diagnostic and should be interpreted alongside clinical history, safeguarding context, and professional assessment.`,
    educationalSendLanguage: `Recorded observations indicate possible barriers to access, participation, regulation, and learning linked to ${themes}. SEN support should be evidence-led, reviewed, and adjusted according to response.`,
    socialCareLanguage: `The record suggests possible support needs affecting daily functioning, family stress, safety, and participation. Consent, safeguarding, and whole-family context should guide next steps.`,
    parentFriendlyLanguage: `The notes show some patterns that may explain why things feel hard at times. This does not label or diagnose anyone; it helps show what support might make daily life and school feel safer and more manageable.`,
  };
}

// Longitudinal review highlights trends, trigger relationships, and risk trajectory over time.
export function analyseTimeline(observations: Observation[]): TimelineTrendAnalysis {
  const sorted = [...observations].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  const allTrend = inferTrend(sorted);
  const triggerRelationships = unique(sorted.map((observation) => normalise(observation.trigger))).map(
    (trigger) => `Trigger recorded: ${trigger}`,
  );

  return {
    timelineSummary: sorted.map(
      (observation) => `${observation.occurredAt}: ${CATEGORY_LABELS[observation.category]} at intensity ${observation.intensity}/5 in ${observation.environment ?? "an unspecified setting"}.`,
    ),
    trendAnalysis:
      sorted.length < 2
        ? "More dated observations are needed before a reliable time trend can be described."
        : `Across the supplied period, the overall severity trajectory appears ${allTrend}. Seasonal, medication-related, and school timetable effects require more contextual data unless explicitly recorded.`,
    riskTrajectory: allTrend,
    triggerRelationships,
  };
}

// Safe Space journal review focuses on emotional tone, protective factors, and escalation warnings.
export function analyseJournalEntry(entry: string, previousEntries: string[] = []): JournalWellbeingAnalysis {
  const lower = entry.toLowerCase();
  const stressTerms = ["overwhelmed", "stressed", "worried", "panic", "alone", "can't cope", "unsafe"];
  const protectiveTerms = ["friend", "trusted", "helped", "calm", "proud", "safe", "talked"];
  const stressMatches = stressTerms.filter((term) => lower.includes(term));
  const protectiveMatches = protectiveTerms.filter((term) => lower.includes(term));

  return {
    emotionalSummary:
      stressMatches.length > 0
        ? `The entry suggests stress or overwhelm themes: ${stressMatches.join(", ")}. This is not a diagnosis.`
        : "The entry does not contain clear crisis language, but emotional meaning should be checked with the person in a supportive way.",
    wellbeingTrends:
      previousEntries.length > 0
        ? [`Compare with ${previousEntries.length} previous journal entry/entries to monitor whether stress language is increasing or reducing.`]
        : ["No previous journal entries were supplied, so trend evidence is limited."],
    supportSuggestions: [
      "Offer a calm check-in with a trusted adult or supporter.",
      "Ask what helped, what made things harder, and what support they would like next.",
      "Record any triggers, protective factors, and recovery strategies that are mentioned.",
    ],
    encouragement: "Thank you for sharing this. Your feelings matter, and support can be planned one small step at a time.",
    escalationWarning: lower.includes("unsafe") || lower.includes("want to die") || lower.includes("kill myself") ? "Escalation language is present. Follow local safeguarding or crisis procedures immediately." : undefined,
  };
}

// Multi-agent facade returns specialist bounded outputs for orchestration or UI display.
export function runSpecialistAgents(observations: Observation[]): SpecialistAgentResult[] {
  const analysis = analyseObservations(observations);
  const ehcp = convertToEhcpReadyEvidence(observations);
  const translations = translateForAudiences(analysis);

  return [
    { agent: "Observation Agent", scope: "Patterns, settings, frequency, strengths, and missing evidence", output: { patterns: analysis.patternsIdentified }, uncertainty: analysis.evidenceStrength.rationale },
    { agent: "Risk Agent", scope: "Deterministic Green/Amber/Red risk score", output: analysis.deterministicRisk, uncertainty: "Risk score is a support triage aid and not a clinical decision." },
    { agent: "Safeguarding Agent", scope: "Safeguarding and wellbeing flags", output: { riskFlags: analysis.riskFlags }, uncertainty: "Keyword and contributor flags require human safeguarding review.", escalation: analysis.riskFlags.some((flag) => flag.category === "urgent_safeguarding_concern") ? "Urgent safeguarding concern detected." : undefined },
    { agent: "EHCP Agent", scope: "Education-focused functional evidence", output: ehcp as unknown as Record<string, unknown>, uncertainty: "EHCP wording must be reviewed by family and professionals before use." },
    { agent: "Parent Support Agent", scope: "Simple compassionate explanation", output: { parentFriendlyLanguage: translations.parentFriendlyLanguage }, uncertainty: "Parent summary simplifies professional evidence and should not remove important safeguarding context." },
    { agent: "Clinical Summary Agent", scope: "NHS and multi-agency summary wording", output: { nhsClinicalLanguage: translations.nhsClinicalLanguage, socialCareLanguage: translations.socialCareLanguage }, uncertainty: "Clinical wording is non-diagnostic and should be checked against health records." },
  ];
}
