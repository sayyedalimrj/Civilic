import { cn } from "@/lib/utils";
import { faMoney } from "@/lib/fa";

export interface PaymentReviewSummaryData {
  contractorClaimed: number;
  consultantReviewed: number;
  employerFinal: number;
  consultantDiff: number;
  employerDiff: number;
}

/** خلاصه‌ی سه‌لایه‌ای مبالغ صورت‌وضعیت (پیمانکار آبی، مشاور قرمز، کارفرما سبز). */
export function PaymentReviewSummary({ data, netPayable }: { data: PaymentReviewSummaryData; netPayable?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Cell label="مبلغ ادعایی پیمانکار" value={data.contractorClaimed} tone="blue" />
      <Cell label="رسیدگی‌شده مشاور" value={data.consultantReviewed} tone="rose" diff={data.consultantDiff} />
      <Cell label="تایید نهایی کارفرما" value={data.employerFinal} tone="emerald" diff={data.employerDiff} />
      {typeof netPayable === "number" && <Cell label="خالص قابل پرداخت" value={netPayable} tone="slate" />}
    </div>
  );
}

function Cell({ label, value, tone, diff }: { label: string; value: number; tone: "blue" | "rose" | "emerald" | "slate"; diff?: number }) {
  const toneCls = {
    blue: "text-blue-700 dark:text-blue-300",
    rose: "text-rose-700 dark:text-rose-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    slate: "text-slate-700 dark:text-slate-300",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 truncate text-base font-bold tabular-nums", toneCls)}>{faMoney(value)}</div>
      {typeof diff === "number" && diff !== 0 && (
        <div className={cn("mt-0.5 text-[10px] tabular-nums", diff < 0 ? "text-rose-600" : "text-emerald-600")}>
          اختلاف: {faMoney(diff)}
        </div>
      )}
    </div>
  );
}
