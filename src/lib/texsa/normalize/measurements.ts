/**
 * measurements.ts — normalize brv_rzmt → DetailBoq و brv_khmt → SummaryBoq.
 */
import { db } from "@/lib/db";
import { DETAIL_BOQ_FIELD_MAP, SUMMARY_BOQ_FIELD_MAP } from "../table-map";
import { type NormalizeContext, num, type NormalizeStat } from "./context";

export async function normalizeMeasurements(
  ctx: NormalizeContext,
  projectId: string
): Promise<NormalizeStat[]> {
  const stats: NormalizeStat[] = [];

  // ریزمتره → DetailBoq
  const rz = await ctx.readTable("brv_rzmt");
  const dm = DETAIL_BOQ_FIELD_MAP;
  let detailCreated = 0;
  const detailData = rz.map((r) => ({
    projectId,
    code: r.fields[dm.code] || "",
    description: "",
    unit: "",
    quantity: num(r.fields[dm.quantityTotal]),
    recordSource: "TEXSA",
    texsaImportId: ctx.importId,
    texsaSourceRowId: `brv_rzmt#${r.rowOrder}`,
  }));
  for (let i = 0; i < detailData.length; i += 500) {
    await db.detailBoq.createMany({ data: detailData.slice(i, i + 500) });
    detailCreated += Math.min(500, detailData.length - i);
  }
  stats.push({ entity: "DetailBoq", created: detailCreated, skipped: 0 });

  // خلاصه‌متره → SummaryBoq (dedup بر کد چون @@unique projectId+code)
  const kh = await ctx.readTable("brv_khmt");
  const sm = SUMMARY_BOQ_FIELD_MAP;
  const byCode = new Map<string, number>();
  for (const r of kh) {
    const code = r.fields[sm.code];
    if (!code) continue;
    byCode.set(code, (byCode.get(code) ?? 0) + num(r.fields[sm.quantityTotal]));
  }
  let summaryCreated = 0;
  const summaryData = Array.from(byCode.entries()).map(([code, qty]) => ({
    projectId,
    code,
    description: "",
    unit: "",
    totalQuantity: qty,
    recordSource: "TEXSA",
    texsaImportId: ctx.importId,
  }));
  for (let i = 0; i < summaryData.length; i += 500) {
    await db.summaryBoq.createMany({ data: summaryData.slice(i, i + 500) });
    summaryCreated += Math.min(500, summaryData.length - i);
  }
  stats.push({ entity: "SummaryBoq", created: summaryCreated, skipped: 0 });

  return stats;
}
