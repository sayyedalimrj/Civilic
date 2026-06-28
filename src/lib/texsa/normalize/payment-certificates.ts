/**
 * payment-certificates.ts — normalize brv_type_situ → Payment.
 * صورت‌وضعیت‌های وارد شده از تکسا با recordSource=TEXSA و وضعیت اولیه‌ی LOCKED (تاریخی) ساخته می‌شوند.
 */
import { db } from "@/lib/db";
import { PAYMENT_FIELD_MAP } from "../table-map";
import { type NormalizeContext, num, bool, type NormalizeStat } from "./context";

export async function normalizePaymentCertificates(
  ctx: NormalizeContext,
  projectId: string
): Promise<NormalizeStat> {
  const rows = await ctx.readTable("brv_type_situ");
  if (!rows.length) return { entity: "Payment", created: 0, skipped: 0 };
  const M = PAYMENT_FIELD_MAP;

  // فقط نسخه‌ی نوع ۰ (موقت/جاری) و dedup بر شماره دوره
  const seen = new Set<number>();
  let created = 0;
  let skipped = 0;
  for (const r of rows) {
    const periodNo = num(r.fields[M.periodNo]);
    if (seen.has(periodNo)) {
      skipped += 1;
      continue;
    }
    seen.add(periodNo);
    const amount = num(r.fields[M.amount]);
    const locked = bool(r.fields[M.isLocked]);
    const guarantee = amount * 0.05;
    const insurance = amount * 0.02;
    const tax = amount * 0.05;
    try {
      await db.payment.create({
        data: {
          projectId,
          periodNo,
          // صورت‌وضعیت‌های تاریخیِ واردشده پرداخت‌شده تلقی می‌شوند مگر قفل‌نشده
          status: locked ? "LOCKED" : "PAYMENT_REGISTERED",
          executedAmount: amount,
          guarantee,
          insurance,
          tax,
          netPayable: amount - guarantee - insurance - tax,
          recordSource: "TEXSA",
          texsaImportId: ctx.importId,
          texsaSourceRowId: `brv_type_situ#${r.rowOrder}`,
        },
      });
      created += 1;
    } catch {
      skipped += 1;
    }
  }
  return { entity: "Payment", created, skipped };
}
