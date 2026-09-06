import { NextResponse } from "next/server";
import { convertToEhcpReadyEvidence } from "@/lib/neuro-ai-analysis";
import { requireSecureApiAccess, redactForAi } from "@/lib/security";
import { validateObservations } from "@/lib/validation";

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: ["parent_carer", "teacher_senco", "educational_psychologist", "administrator"],
    auditAction: "ehcp_ai_evidence_requested",
  });
  if (access instanceof NextResponse) return access;

  const body = await request.json() as { observations?: unknown };
  const validation = validateObservations(body.observations);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  const observations = validation.data.map((observation) => ({ ...observation, narrative: redactForAi(observation.narrative) }));
  return NextResponse.json({
    data: convertToEhcpReadyEvidence(observations),
    humanReviewRequired: true,
  });
}
