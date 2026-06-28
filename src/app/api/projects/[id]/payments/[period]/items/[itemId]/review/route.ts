import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess, PermissionError } from "@/lib/auth/permissions";
import { addPaymentItemReview } from "@/lib/review/service";
import type { ReviewParty, ReviewDecision } from "@/lib/review/layers";

// POST — افزودن لایه‌ی رسیدگی یک ردیف توسط مشاور/کارفرما
// body: { decision, quantity?, unitPrice?, amount?, comment? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; period: string; itemId: string }> }) {
  const { id, itemId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });

  const party = access.member.partyType as ReviewParty;
  if (party !== "CONSULTANT" && party !== "EMPLOYER") {
    return NextResponse.json({ error: "رسیدگی ردیفی فقط برای مشاور یا کارفرماست" }, { status: 403 });
  }
  // مجوز: مشاور نیاز به review، کارفرما نیاز به approve_employer/return
  const perm = party === "CONSULTANT" ? "payment.return_to_contractor" : "payment.return_by_employer";
  if (!access.permissions.includes(perm as never)) {
    return NextResponse.json({ error: "مجوز رسیدگی ندارید" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { decision?: ReviewDecision; quantity?: number; unitPrice?: number; amount?: number; comment?: string };
  const decision = body.decision ?? "APPROVED_AS_IS";
  // اعتبارسنجی نرم: اصلاح/رد نیازمند توضیح
  if ((decision === "REVISED" || decision === "REJECTED" || decision === "NEEDS_EXPLANATION") && !(body.comment && body.comment.trim())) {
    return NextResponse.json({ error: "برای اصلاح/رد، ثبت توضیح الزامی است" }, { status: 400 });
  }

  try {
    const result = await addPaymentItemReview({
      itemId,
      partyType: party,
      reviewStage: party === "CONSULTANT" ? "CONSULTANT_REVIEW" : "EMPLOYER_REVIEW",
      decision,
      quantity: body.quantity ?? null,
      unitPrice: body.unitPrice ?? null,
      amount: body.amount ?? null,
      comment: body.comment ?? null,
      userId: user.id,
      userName: user.name,
    });
    return NextResponse.json({ ok: true, effective: result.effective });
  } catch (e) {
    if (e instanceof PermissionError) return NextResponse.json({ error: e.message }, { status: 403 });
    return NextResponse.json({ error: "ثبت رسیدگی ناموفق بود", detail: String(e) }, { status: 500 });
  }
}
