import { NextResponse } from "next/server";
import { analyseObservations } from "@/lib/neuro-ai-analysis";
import { requireSecureApiAccess, redactForAi, recordAuditEvent } from "@/lib/security";
import { validateObservations } from "@/lib/validation";

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: ["parent_carer", "teacher_senco", "camhs_clinician", "social_worker", "gp_paediatrician", "administrator"],
    auditAction: "safeguarding_risk_review_requested",
  });
  if (access instanceof NextResponse) return access;

  const body = await request.json() as { observations?: unknown };
  const validation = validateObservations(body.observations);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  const observations = validation.data.map((observation) => ({ ...observation, narrative: redactForAi(observation.narrative) }));
  const analysis = analyseObservations(observations);
  const urgent = analysis.riskFlags.some((flag) => flag.category === "urgent_safeguarding_concern");

  if (urgent) {
    await recordAuditEvent(request, {
      actorUserId: access.user.id,
      action: "urgent_safeguarding_alert_triggered",
      metadata: { riskFlags: analysis.riskFlags.map((flag) => flag.flag) },
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    data: {
      deterministicRisk: analysis.deterministicRisk,
      riskFlags: analysis.riskFlags,
      criticalAlert: urgent,
      reminder: "This review does not make clinical decisions. Follow local safeguarding procedures for concerns.",
    },
  });
}
