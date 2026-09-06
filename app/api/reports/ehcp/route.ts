import { NextResponse } from "next/server";
import { generateEhcpReportSections, type EhcpReportInput } from "@/lib/ehcp-report";
import { requireSecureApiAccess, sanitizeFreeText } from "@/lib/security";
import { validateObservations } from "@/lib/validation";

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: ["parent_carer", "teacher_senco", "educational_psychologist", "administrator"],
    auditAction: "ehcp_report_generation_requested",
  });
  if (access instanceof NextResponse) return access;

  const body = (await request.json()) as EhcpReportInput;
  const validation = validateObservations(body.observations ?? []);
  if (!validation.ok || !validation.data) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  const sections = generateEhcpReportSections({
    ...body,
    childName: sanitizeFreeText(body.childName, 200),
    dateOfBirth: body.dateOfBirth ? sanitizeFreeText(body.dateOfBirth, 30) : undefined,
    strengths: Array.isArray(body.strengths) ? body.strengths.slice(0, 50).map((item) => sanitizeFreeText(item, 500)) : [],
    observations: validation.data,
  });

  return NextResponse.json({ data: { sections, status: "draft_requires_professional_review" } });
}
