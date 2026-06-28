/**
 * resources.ts — منابع/مصالح (brv_sorc, brv_sorc_all, brv_nmmhb) فقط در mirror حفظ می‌شوند
 * و تحت «مصالح (پیشرفته)» نمایش داده می‌شوند. اینجا فقط شمارش حفظ‌شده گزارش می‌شود.
 */
import { type NormalizeContext, type NormalizeStat } from "./context";

const RESOURCE_TABLES = ["brv_sorc", "brv_sorc_all", "brv_nmmhb"];

export async function normalizeResources(ctx: NormalizeContext): Promise<NormalizeStat> {
  let preserved = 0;
  for (const t of RESOURCE_TABLES) {
    const rows = await ctx.readTable(t);
    preserved += rows.length;
  }
  return { entity: "Resources(raw-preserved)", created: 0, skipped: preserved };
}
