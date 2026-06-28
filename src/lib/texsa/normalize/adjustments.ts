/**
 * adjustments.ts — normalize brv_ahta → AdjustmentReportRow (تعدیل به تفکیک فصل).
 * فقط نسخه‌ی پیمانکار (ata_type=0) برداشته می‌شود تا تکرار نشود.
 */
import { db } from "@/lib/db";
import { ADJUSTMENT_FIELD_MAP } from "../table-map";
import { type NormalizeContext, num, type NormalizeStat } from "./context";

export async function normalizeAdjustments(
  ctx: NormalizeContext,
  projectId: string
): Promise<NormalizeStat> {
  const rows = await ctx.readTable("brv_ahta");
  if (!rows.length) return { entity: "AdjustmentReportRow", created: 0, skipped: 0 };
  const M = ADJUSTMENT_FIELD_MAP;

  let created = 0;
  let skipped = 0;
  const data: {
    tenantId: string;
    projectId: string;
    periodLabel: string;
    chapterNo: number;
    workPeriodAmount: number;
    baseIndex: number;
    currentIndex: number;
    adjustmentFactor: number;
    adjustmentAmount: number;
    adjustmentType: string;
    recordSource: string;
    texsaImportId: string;
    texsaSourceRowId: string;
  }[] = [];

  for (const r of rows) {
    if ((r.fields[M.partyVersion] ?? "0") !== "0") {
      skipped += 1;
      continue;
    }
    const base = num(r.fields[M.baseIndex]);
    const cur = num(r.fields[M.periodIndex]);
    const newAmount = num(r.fields[M.newAmount]);
    const factor = base > 0 ? cur / base : 1;
    data.push({
      tenantId: ctx.tenantId,
      projectId,
      periodLabel: `${r.fields[M.indexQuarter] ?? ""} ${r.fields[M.year] ?? ""}`.trim() || "دوره",
      chapterNo: 0,
      workPeriodAmount: newAmount,
      baseIndex: base,
      currentIndex: cur,
      adjustmentFactor: factor,
      adjustmentAmount: newAmount * (factor - 1),
      adjustmentType: "TEMPORARY",
      recordSource: "TEXSA",
      texsaImportId: ctx.importId,
      texsaSourceRowId: `brv_ahta#${r.rowOrder}`,
    });
    created += 1;
  }
  for (let i = 0; i < data.length; i += 500) {
    await db.adjustmentReportRow.createMany({ data: data.slice(i, i + 500) });
  }
  return { entity: "AdjustmentReportRow", created, skipped };
}
