import { NextResponse } from "next/server";
import { requireSecureApiAccess, recordAuditEvent } from "@/lib/security";
import { validateObservation } from "@/lib/validation";

const OBSERVATION_ROLES = [
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

export async function GET(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: [...OBSERVATION_ROLES],
    auditAction: "observations_list_requested",
  });
  if (access instanceof NextResponse) return access;

  return NextResponse.json({
    data: [],
    notice: "Observation reads must be backed by Supabase RLS policies and explicit relationships; demo in-memory storage has been disabled for sensitive data.",
  });
}

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: [...OBSERVATION_ROLES],
    auditAction: "observation_create_requested",
  });
  if (access instanceof NextResponse) return access;

  const validation = validateObservation(await request.json());
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  await recordAuditEvent(request, {
    actorUserId: access.user.id,
    action: validation.data.safeguardingConcern ? "safeguarding_observation_recorded" : "observation_validated_for_persistence",
    entityTable: "observations",
    entityId: validation.data.id,
    metadata: { category: validation.data.category, intensity: validation.data.intensity },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      data: validation.data,
      persistenceRequired: true,
      notice: "Validated observation must be persisted through Supabase using RLS and audit logging; in-memory storage is disabled.",
    },
    { status: 202 },
  );
}
