import { NextResponse } from "next/server";
import { analyseJournalEntry } from "@/lib/neuro-ai-analysis";
import { requireSecureApiAccess, redactForAi, sanitizeFreeText } from "@/lib/security";

export async function POST(request: Request) {
  const access = await requireSecureApiAccess(request, {
    allowedRoles: ["child_young_person", "adult_user", "parent_carer", "camhs_clinician", "administrator"],
    auditAction: "safe_space_journal_ai_review_requested",
  });
  if (access instanceof NextResponse) return access;

  const body = (await request.json()) as { entry?: string; previousEntries?: string[] };
  const entry = redactForAi(sanitizeFreeText(body.entry, 4000));
  const previousEntries = Array.isArray(body.previousEntries)
    ? body.previousEntries.slice(0, 20).map((item) => redactForAi(sanitizeFreeText(item, 4000)))
    : [];

  return NextResponse.json({
    data: analyseJournalEntry(entry, previousEntries),
    humanReviewRequired: true,
  });
}
