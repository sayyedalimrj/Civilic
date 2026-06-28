/**
 * roundtrip-report.ts — تولید گزارش سازگاری round-trip برای یک import.
 * نشان می‌دهد چه چیزی حفظ، نگاشت، ویرایش، export و نامفهوم باقی مانده است.
 */
import { db } from "@/lib/db";
import { TEXSA_TABLES } from "../table-map";
import { getCalculationStatus } from "@/lib/calculation/dependency-engine";

export interface RoundTripReport {
  importedTableCount: number;
  importedRowCount: number;
  normalizedEntities: number;
  editedRecords: number;
  exportableRecords: number;
  civilicOnlyRecords: number;
  preservedRawFields: number;
  warningCount: number;
  errorCount: number;
  compatibilityPct: number;
  // توالی محاسبات (مطابق docs/texsa-calculation-sequence.md)
  sequence: { stage: string; label: string; status: string; parity: string }[];
  sequenceCompletePct: number;
  staleStages: string[];
  // رسیدگی ردیفی (redline)
  review: {
    reviewedItems: number;       // ردیف‌هایی که حداقل یک لایه‌ی رسیدگی دارند
    revisedItems: number;        // ردیف‌های اصلاح‌شده
    consultantReviewed: number;  // لایه‌های مشاور
    employerFinal: number;       // لایه‌های کارفرما
  };
  details: {
    normalizedTables: string[];
    rawOnlyTables: string[];
  };
}

export async function generateRoundTripReport(importId: string): Promise<RoundTripReport> {
  const imp = await db.texsaImport.findUnique({ where: { id: importId } });
  const schemas = await db.texsaTableSchema.findMany({ where: { importId } });
  const rawCount = await db.texsaRawRow.count({ where: { importId } });
  const editedRecords = await db.texsaRawRow.count({ where: { importId, isEdited: true } });
  const issues = await db.texsaMappingIssue.findMany({ where: { importId } });

  const normalizedTables = schemas.filter((s) => s.normalized).map((s) => s.tableName);
  const rawOnlyTables = schemas.filter((s) => !s.normalized).map((s) => s.tableName);

  // موجودیت‌های نرمال‌شده‌ی محصول مرتبط با پروژه‌ی این import
  let normalizedEntities = 0;
  let civilicOnlyRecords = 0;
  if (imp?.projectId) {
    const pid = imp.projectId;
    const [payments, details, summaries, adjustments, civilicPayments] = await Promise.all([
      db.payment.count({ where: { projectId: pid } }),
      db.detailBoq.count({ where: { projectId: pid } }),
      db.summaryBoq.count({ where: { projectId: pid } }),
      db.adjustmentReportRow.count({ where: { projectId: pid } }),
      db.payment.count({ where: { projectId: pid, recordSource: "CIVILIC" } }),
    ]);
    normalizedEntities = payments + details + summaries + adjustments;
    civilicOnlyRecords = civilicPayments;
  }

  // برآورد ستون‌های خام حفظ‌شده‌ی نامفهوم (جدول‌هایی که normalize نمی‌شوند)
  let preservedRawFields = 0;
  for (const s of schemas) {
    if (!TEXSA_TABLES[s.tableName]?.normalized) preservedRawFields += s.rowCount;
  }

  const warnings = issues.filter((i) => i.severity === "WARNING").length;
  const errors = issues.filter((i) => i.severity === "ERROR").length;

  // توالی محاسبات + لایه‌های رسیدگی
  let sequence: { stage: string; label: string; status: string; parity: string }[] = [];
  let staleStages: string[] = [];
  const review = { reviewedItems: 0, revisedItems: 0, consultantReviewed: 0, employerFinal: 0 };
  if (imp?.projectId) {
    const pid = imp.projectId;
    const seq = await getCalculationStatus(pid);
    sequence = seq.map((s) => ({ stage: s.stage, label: s.label, status: s.status, parity: s.parity }));
    staleStages = seq.filter((s) => s.status === "STALE" || s.status === "NEEDS_REVIEW").map((s) => s.label);

    const reviews = await db.paymentCertificateItemReview.findMany({
      where: { item: { payment: { projectId: pid } }, isEffective: true },
      select: { paymentCertificateItemId: true, partyType: true, decision: true },
    });
    review.reviewedItems = new Set(reviews.map((r) => r.paymentCertificateItemId)).size;
    review.revisedItems = new Set(reviews.filter((r) => r.decision === "REVISED" || r.decision === "REJECTED").map((r) => r.paymentCertificateItemId)).size;
    review.consultantReviewed = reviews.filter((r) => r.partyType === "CONSULTANT").length;
    review.employerFinal = reviews.filter((r) => r.partyType === "EMPLOYER").length;
  }
  const freshCount = sequence.filter((s) => s.status === "FRESH" || s.status === "LOCKED").length;
  const sequenceCompletePct = sequence.length > 0 ? Math.round((freshCount / sequence.length) * 100) : 0;

  // درصد سازگاری: نسبت ردیف‌های قابل بازتولید (همه‌ی raw حفظ‌شده) منهای خطاها
  const compatibilityPct = rawCount > 0 ? Math.max(0, Math.round((1 - errors / Math.max(rawCount, 1)) * 100)) : 0;

  const report: RoundTripReport = {
    importedTableCount: schemas.length,
    importedRowCount: rawCount,
    normalizedEntities,
    editedRecords,
    exportableRecords: rawCount, // در ROUND_TRIP_RAW همه قابل export هستند
    civilicOnlyRecords,
    preservedRawFields,
    warningCount: warnings,
    errorCount: errors,
    compatibilityPct,
    sequence,
    sequenceCompletePct,
    staleStages,
    review,
    details: { normalizedTables, rawOnlyTables },
  };

  await db.texsaRoundTripReport.create({
    data: {
      importId,
      importedTableCount: report.importedTableCount,
      importedRowCount: report.importedRowCount,
      normalizedEntities: report.normalizedEntities,
      editedRecords: report.editedRecords,
      exportableRecords: report.exportableRecords,
      civilicOnlyRecords: report.civilicOnlyRecords,
      preservedRawFields: report.preservedRawFields,
      warningCount: report.warningCount,
      errorCount: report.errorCount,
      compatibilityPct: report.compatibilityPct,
      detailsJson: JSON.stringify({ ...report.details, sequence: report.sequence, sequenceCompletePct, staleStages, review }),
    },
  });

  return report;
}
