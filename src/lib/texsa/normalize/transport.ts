/**
 * transport.ts — جدول‌های حمل/مسافت (brv_hmpy, brv_hmbs, brv_dstn_*) فقط در mirror حفظ می‌شوند
 * و در UI تحت «برگه مالی → حمل (پیشرفته)» نمایش داده می‌شوند. اینجا فقط شمارش گزارش می‌شود.
 */
import { type NormalizeContext, type NormalizeStat } from "./context";

const TRANSPORT_TABLES = [
  "brv_hmpy",
  "brv_hmpy_rzmt",
  "brv_hmbs",
  "brv_dstb",
  "brv_dstn_main",
  "brv_dstn_fromto",
  "brv_dstn_main_rzmt",
  "brv_dstn_fromto_rzmt",
];

export async function normalizeTransport(ctx: NormalizeContext): Promise<NormalizeStat> {
  let preserved = 0;
  for (const t of TRANSPORT_TABLES) {
    const rows = await ctx.readTable(t);
    preserved += rows.length;
  }
  // داده‌ی حمل فقط حفظ (preserve-only) می‌شود؛ موجودیت محصول جداگانه ساخته نمی‌شود.
  return { entity: "Transport(raw-preserved)", created: 0, skipped: preserved };
}
