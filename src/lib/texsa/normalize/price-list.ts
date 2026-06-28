/**
 * price-list.ts — normalize brv_fhbh → PriceList + PriceListItem.
 */
import { db } from "@/lib/db";
import { PRICE_ITEM_FIELD_MAP } from "../table-map";
import { type NormalizeContext, num, type NormalizeStat } from "./context";

export async function normalizePriceList(
  ctx: NormalizeContext,
  projectId: string,
  year: number
): Promise<NormalizeStat> {
  const rows = await ctx.readTable("brv_fhbh");
  if (!rows.length) return { entity: "PriceListItem", created: 0, skipped: 0 };
  const M = PRICE_ITEM_FIELD_MAP;

  const discipline = "ابنیه";
  let priceList = await db.priceList.findFirst({ where: { year, discipline } });
  if (!priceList) {
    priceList = await db.priceList.create({
      data: { year, discipline, title: `فهرست‌بهای ${discipline} ${year}` },
    });
  }
  await db.project.update({ where: { id: projectId }, data: { priceListId: priceList.id } });

  // dedup بر اساس کد فهرست‌بها
  const seen = new Set<string>();
  let created = 0;
  let skipped = 0;
  const data: { priceListId: string; code: string; title: string; unit: string; unitPrice: number }[] = [];
  for (const r of rows) {
    const code = r.fields[M.code];
    if (!code || seen.has(code)) {
      skipped += 1;
      continue;
    }
    seen.add(code);
    data.push({
      priceListId: priceList.id,
      code,
      title: r.fields[M.description] || code,
      unit: r.fields[M.unit] || "",
      unitPrice: num(r.fields[M.unitPrice]),
    });
    created += 1;
  }
  // درج دسته‌ای
  for (let i = 0; i < data.length; i += 500) {
    await db.priceListItem.createMany({ data: data.slice(i, i + 500) });
  }
  return { entity: "PriceListItem", created, skipped };
}
