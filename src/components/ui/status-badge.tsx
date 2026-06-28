import { cn } from "@/lib/utils";
import { TONE_STYLES, PAYMENT_STATUS, GENERIC_STATUS, type StatusTone } from "@/lib/design/tokens";

interface StatusBadgeProps {
  /** کلید وضعیت (مثل DRAFT) یا برچسب آماده */
  status?: string;
  label?: string;
  tone?: StatusTone;
  /** نوع نگاشت: payment | generic */
  kind?: "payment" | "generic";
  className?: string;
}

export function StatusBadge({ status, label, tone, kind = "generic", className }: StatusBadgeProps) {
  const map = kind === "payment" ? PAYMENT_STATUS : GENERIC_STATUS;
  const resolved = status ? map[status] : undefined;
  const finalTone: StatusTone = tone ?? resolved?.tone ?? "neutral";
  const finalLabel = label ?? resolved?.label ?? status ?? "—";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_STYLES[finalTone].className,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", {
        "bg-zinc-400": finalTone === "neutral",
        "bg-blue-500": finalTone === "info",
        "bg-amber-500": finalTone === "warning",
        "bg-emerald-500": finalTone === "success",
        "bg-slate-500": finalTone === "slate",
        "bg-rose-500": finalTone === "danger",
      })} />
      {finalLabel}
    </span>
  );
}
