import { NextResponse } from "next/server";
import { analyseObservations, analyseTimeline, translateForAudiences } from "@/lib/neuro-ai-analysis";
import { requireSecureApiAccess, redactForAi, recordAuditEvent } from "@/lib/security";
import { validateObservations } from "@/lib/validation";
import type { AnalysisRequestPayload } from "@/types/neuro-ai";

const ALLOWED_ANALYSIS_ROLES = [
  "parent_carer",
  "adult_user",
  "teacher_senco",
  "educational_psychologist",
  "speech_language_therapist",
  "occupational_therapist",
  "camhs_clinician",
  "social_worker",
  "gp_paediatrician",
  "administrator",
] as const;

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: [...ALLOWED_ANALYSIS_ROLES],
    auditAction: "ai_observation_analysis_requested",
  });
  if (access instanceof NextResponse) return access;

  const body = (await request.json()) as AnalysisRequestPayload;
  const validation = validateObservations(body.observations);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  const observations = validation.data.map((observation) => ({
    ...observation,
    narrative: redactForAi(observation.narrative),
  }));
  const analysis = analyseObservations(observations);

  await recordAuditEvent(request, {
    actorUserId: access.user.id,
    action: "ai_observation_analysis_completed",
    metadata: {
      observationCount: observations.length,
      riskLevel: analysis.deterministicRisk.level,
      riskScore: analysis.deterministicRisk.score,
    },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    data: {
      ...analysis,
      translations: body.includeTranslations ? translateForAudiences(analysis) : undefined,
      timeline: body.includeTimeline ? analyseTimeline(observations) : undefined,
      humanReviewRequired: true,
      aiSafetyNotice: "Non-diagnostic evidence organisation only. Safeguarding and clinical outputs require human review.",
    },
  });
}
