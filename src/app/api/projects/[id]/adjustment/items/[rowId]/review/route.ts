import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import { addAdjustmentItemReview } from "@/lib/review/service";
import type { ReviewParty, ReviewDecision } from "@/lib/review/layers";

// POST — افزودن لایه‌ی رسیدگی یک ردیف تعدیل
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { id, rowId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const access = await getProjectAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });
  const party = access.member.partyType as ReviewParty;
  if (party !== "CONSULTANT" && party !== "EMPLOYER") return NextResponse.json({ error: "رسیدگی فقط برای مشاور/کارفرما" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { decision?: ReviewDecision; adjustmentAmount?: number; comment?: string };
  const decision = body.decision ?? "APPROVED_AS_IS";
  if ((decision === "REVISED" || decision === "REJECTED" || decision === "NEEDS_EXPLANATION") && !(body.comment && body.comment.trim())) {
    return NextResponse.json({ error: "برای اصلاح/رد، ثبت توضیح الزامی است" }, { status: 400 });
  }
  await addAdjustmentItemReview({
    rowId, partyType: party, reviewStage: party === "CONSULTANT" ? "CONSULTANT_REVIEW" : "EMPLOYER_REVIEW",
    decision, adjustmentAmount: body.adjustmentAmount ?? null, comment: body.comment ?? null, userId: user.id, userName: user.name,
  });
  return NextResponse.json({ ok: true });
}
