import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProjectContext } from "@/lib/auth/session";
import { measurementReviewSummary } from "@/lib/review/service";
import { getCalculationStatus } from "@/lib/calculation/dependency-engine";
import type { ReviewParty } from "@/lib/review/layers";

// GET — ردیف‌های ریزمتره با لایه‌های رسیدگی + خلاصه + توالی
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, access } = await getProjectContext(id);
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const rows = await db.detailBoq.findMany({
    where: { projectId: id },
    orderBy: { code: "asc" },
    take: 300,
    include: { reviews: { where: { isEffective: true } } },
  });

  const items = rows.map((d) => ({
    id: d.id,
    code: d.code,
    description: d.description || d.code,
    unit: d.unit || "—",
    recordSource: d.recordSource,
    contractor: { quantity: d.quantity },
    layers: d.reviews.filter((x) => x.partyType !== "CONTRACTOR").map((x) => ({ partyType: x.partyType, decision: x.decision, quantity: x.quantity, comment: x.comment, reviewerName: x.reviewerName, reviewedAt: x.reviewedAt })),
  }));

  const [summary, sequence] = await Promise.all([measurementReviewSummary(id), getCalculationStatus(id)]);
  return NextResponse.json({ myParty: (access?.member.partyType as ReviewParty) ?? null, items, summary, sequence });
}
