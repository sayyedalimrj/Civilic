import { cn } from "@/lib/utils";
import { Database, RefreshCw, CheckCircle2, AlertTriangle, Lock, Check } from "lucide-react";

/** نشان منبع/سازگاری تکسا یک مقدار */
export function TexsaCompatibilityBadge({ parity, className }: { parity: string; className?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    IMPORTED_FROM_TEXSA: { label: "واردشده از تکسا — سازگار", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    CIVILIC_CALCULATED: { label: "محاسبه‌شده در Civilic", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
    NEEDS_TEXSA_PARITY_REVIEW: { label: "نیازمند بررسی سازگاری تکسا", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    CIVILIC_ONLY: { label: "فقط در Civilic — غیرقابل خروجی مستقیم", cls: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
  };
  const m = map[parity] ?? map.CIVILIC_CALCULATED;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset", m.cls, className)}>
      <Database className="size-3" /> {m.label}
    </span>
  );
}

/** نشان وضعیت محاسبه‌ی یک مرحله */
export function CalculationStatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Check }> = {
    FRESH: { label: "آماده", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: Check },
    STALE: { label: "نیازمند بروزرسانی", cls: "bg-amber-50 text-amber-700 ring-amber-200", icon: RefreshCw },
    NEEDS_REVIEW: { label: "نیازمند رسیدگی", cls: "bg-blue-50 text-blue-700 ring-blue-200", icon: AlertTriangle },
    LOCKED: { label: "قفل‌شده", cls: "bg-slate-100 text-slate-700 ring-slate-300", icon: Lock },
  };
  const m = map[status] ?? map.FRESH;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset", m.cls, className)}>
      <Icon className="size-3" /> {m.label}
    </span>
  );
}

/** توضیح منبع مقدار (provenance) به‌صورت title ساده */
export function ValueProvenanceTooltip({ source, children }: { source: string; children: React.ReactNode }) {
  const label = source === "TEXSA" ? "واردشده از تکسا" : source === "REVIEW" ? "رسیدگی‌شده" : "ساخته‌شده در Civilic";
  return (
    <span title={`منبع: ${label}`} className="inline-flex items-center gap-1">
      {source === "TEXSA" && <CheckCircle2 className="size-3 text-emerald-500" />}
      {children}
    </span>
  );
}
