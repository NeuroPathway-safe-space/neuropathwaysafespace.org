import { NextResponse } from "next/server";
import { calculateRiskScore } from "@/lib/risk-scoring";
import { requireSecureApiAccess } from "@/lib/security";
import { validateObservations } from "@/lib/validation";

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: ["parent_carer", "teacher_senco", "camhs_clinician", "social_worker", "gp_paediatrician", "administrator"],
    auditAction: "deterministic_risk_score_requested",
  });
  if (access instanceof NextResponse) return access;

  const body = (await request.json()) as { observations?: unknown };
  const validation = validateObservations(body.observations);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  const riskScore = calculateRiskScore(validation.data);
  return NextResponse.json({ data: riskScore, humanReviewRequired: riskScore.level === "red" });
}
