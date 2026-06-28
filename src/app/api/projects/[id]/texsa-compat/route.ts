import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProjectContext } from "@/lib/auth/session";
import { getCalculationStatus } from "@/lib/calculation/dependency-engine";

// GET — گزارش سازگاری تکسا (توالی + رسیدگی + نرمال‌سازی) در سطح پروژه
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getProjectContext(id);
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const sequence = await getCalculationStatus(id);
  const freshCount = sequence.filter((s) => s.status === "FRESH" || s.status === "LOCKED").length;
  const sequenceCompletePct = sequence.length ? Math.round((freshCount / sequence.length) * 100) : 0;
  const staleStages = sequence.filter((s) => s.status === "STALE" || s.status === "NEEDS_REVIEW").map((s) => s.label);

  const [payments, details, summaries, adjustments, texsaPayments, civilicPayments, reviews, imp] = await Promise.all([
    db.payment.count({ where: { projectId: id } }),
    db.detailBoq.count({ where: { projectId: id } }),
    db.summaryBoq.count({ where: { projectId: id } }),
    db.adjustmentReportRow.count({ where: { projectId: id } }),
    db.payment.count({ where: { projectId: id, recordSource: "TEXSA" } }),
    db.payment.count({ where: { projectId: id, recordSource: "CIVILIC" } }),
    db.paymentCertificateItemReview.findMany({ where: { item: { payment: { projectId: id } }, isEffective: true }, select: { paymentCertificateItemId: true, partyType: true, decision: true } }),
    db.texsaImport.findFirst({ where: { projectId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  const reviewedItems = new Set(reviews.map((r) => r.paymentCertificateItemId)).size;
  const revisedItems = new Set(reviews.filter((r) => r.decision === "REVISED" || r.decision === "REJECTED").map((r) => r.paymentCertificateItemId)).size;
  const employerFinal = reviews.filter((r) => r.partyType === "EMPLOYER").length;

  return NextResponse.json({
    sequence,
    sequenceCompletePct,
    staleStages,
    normalized: { payments, details, summaries, adjustments },
    exportability: { exportableFromTexsa: texsaPayments, civilicOnly: civilicPayments },
    review: { reviewedItems, revisedItems, employerFinal },
    imported: imp ? { tables: imp.totalTables, rows: imp.totalRows, fileName: imp.originalFileName, texsaVersion: imp.texsaVersion } : null,
  });
}
