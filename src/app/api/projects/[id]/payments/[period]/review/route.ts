import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProjectContext } from "@/lib/auth/session";
import { paymentReviewSummary, bulkApproveAsIs } from "@/lib/review/service";
import { getCalculationStatus } from "@/lib/calculation/dependency-engine";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import type { ReviewParty } from "@/lib/review/layers";

// GET — اقلام صورت‌وضعیت با لایه‌های رسیدگی + خلاصه + وضعیت توالی محاسبات
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; period: string }> }) {
  const { id, period } = await params;
  const { user, access } = await getProjectContext(id);
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: parseInt(period, 10) },
    include: { items: { include: { reviews: { where: { isEffective: true } } } } },
  });
  if (!payment) return NextResponse.json({ error: "صورت‌وضعیت یافت نشد" }, { status: 404 });

  const items = payment.items.map((it) => ({
    id: it.id,
    code: it.code,
    description: it.description,
    unit: it.unit,
    contractor: { quantity: it.executedQuantity, unitPrice: it.unitPrice, amount: it.executedAmount },
    layers: it.reviews
      .filter((r) => r.partyType !== "CONTRACTOR")
      .map((r) => ({ partyType: r.partyType, decision: r.decision, quantity: r.quantity, unitPrice: r.unitPrice, amount: r.amount, comment: r.comment, reviewerName: r.reviewerName, reviewedAt: r.reviewedAt })),
    effectiveAmount: it.adjustedAmount || it.executedAmount,
  }));

  const [summary, sequence] = await Promise.all([paymentReviewSummary(payment.id), getCalculationStatus(id)]);

  return NextResponse.json({
    payment: { id: payment.id, periodNo: payment.periodNo, status: payment.status },
    myParty: (access?.member.partyType as ReviewParty) ?? null,
    items,
    summary,
    sequence,
  });
}


// POST — اقدام گروهی رسیدگی. body: { action: "approve_all" }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; period: string }> }) {
  const { id, period } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const access = await getProjectAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });

  const party = access.member.partyType as ReviewParty;
  if (party !== "CONSULTANT" && party !== "EMPLOYER") {
    return NextResponse.json({ error: "اقدام گروهی فقط برای مشاور یا کارفرماست" }, { status: 403 });
  }

  const payment = await db.payment.findFirst({ where: { projectId: id, periodNo: parseInt(period, 10) } });
  if (!payment) return NextResponse.json({ error: "صورت‌وضعیت یافت نشد" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === "approve_all") {
    const res = await bulkApproveAsIs(payment.id, party, party === "CONSULTANT" ? "CONSULTANT_REVIEW" : "EMPLOYER_REVIEW", user.id, user.name);
    return NextResponse.json({ ok: true, ...res });
  }
  return NextResponse.json({ error: "اقدام نامعتبر" }, { status: 400 });
}
