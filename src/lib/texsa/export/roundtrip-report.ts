/**
 * roundtrip-report.ts — تولید گزارش سازگاری round-trip برای یک import.
 * نشان می‌دهد چه چیزی حفظ، نگاشت، ویرایش، export و نامفهوم باقی مانده است.
 */
import { db } from "@/lib/db";
import { TEXSA_TABLES } from "../table-map";

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
      detailsJson: JSON.stringify(report.details),
    },
  });

  return report;
}
