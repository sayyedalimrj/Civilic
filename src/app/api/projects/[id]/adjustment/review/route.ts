import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProjectContext, getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import { adjustmentReviewSummary, addAdjustmentItemReview } from "@/lib/review/service";
import { getCalculationStatus } from "@/lib/calculation/dependency-engine";
import type { ReviewParty } from "@/lib/review/layers";

// GET — ردیف‌های تعدیل با لایه‌های رسیدگی + خلاصه + توالی
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const type = req.nextUrl.searchParams.get("type") || "TEMPORARY";
  const { user, access } = await getProjectContext(id);
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const rows = await db.adjustmentReportRow.findMany({
    where: { projectId: id, adjustmentType: type },
    orderBy: { chapterNo: "asc" },
    include: { reviews: { where: { isEffective: true } } },
  });

  const items = rows.map((r) => ({
    id: r.id,
    code: String(r.chapterNo),
    description: `${r.periodLabel} — فصل ${r.chapterNo}`,
    unit: "ریال",
    baseIndex: r.baseIndex,
    currentIndex: r.currentIndex,
    factor: r.adjustmentFactor,
    contractor: { amount: r.adjustmentAmount },
    layers: r.reviews.filter((x) => x.partyType !== "CONTRACTOR").map((x) => ({ partyType: x.partyType, decision: x.decision, amount: x.adjustmentAmount, comment: x.comment, reviewerName: x.reviewerName, reviewedAt: x.reviewedAt })),
  }));

  const [summary, sequence] = await Promise.all([adjustmentReviewSummary(id, type), getCalculationStatus(id)]);
  return NextResponse.json({ myParty: (access?.member.partyType as ReviewParty) ?? null, type, items, summary, sequence });
}

// POST — اقدام گروهی (approve_all)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const access = await getProjectAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });
  const party = access.member.partyType as ReviewParty;
  if (party !== "CONSULTANT" && party !== "EMPLOYER") return NextResponse.json({ error: "اقدام فقط برای مشاور/کارفرما" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; type?: string };
  if (body.action !== "approve_all") return NextResponse.json({ error: "اقدام نامعتبر" }, { status: 400 });
  const rows = await db.adjustmentReportRow.findMany({ where: { projectId: id, adjustmentType: body.type || "TEMPORARY" } });
  for (const r of rows) {
    await addAdjustmentItemReview({ rowId: r.id, partyType: party, reviewStage: party === "CONSULTANT" ? "CONSULTANT_REVIEW" : "EMPLOYER_REVIEW", decision: "APPROVED_AS_IS", userId: user.id, userName: user.name });
  }
  return NextResponse.json({ ok: true, approved: rows.length });
}
