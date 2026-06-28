"use client";

import { Check, RefreshCw, AlertTriangle, Lock, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SequenceStage {
  stage: string;
  label: string;
  status: "FRESH" | "STALE" | "NEEDS_REVIEW" | "LOCKED";
  statusLabel: string;
  parity: string;
  dependsOn: string[];
  staleReason: string | null;
  lastCalculatedAt: string | null;
}

const STATUS_STYLE: Record<SequenceStage["status"], { cls: string; icon: typeof Check }> = {
  FRESH: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300", icon: Check },
  STALE: { cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300", icon: RefreshCw },
  NEEDS_REVIEW: { cls: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300", icon: AlertTriangle },
  LOCKED: { cls: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300", icon: Lock },
};

/** ریل توالی محاسبات تکسا: ریزمتره → خلاصه متره → برگه مالی → صورت‌وضعیت → کسورات/تعدیل → خروجی */
export function CalculationSequenceRail({ stages }: { stages: SequenceStage[] }) {
  if (!stages?.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-3">
      <div className="flex min-w-max items-stretch gap-1">
        {stages.map((s, i) => {
          const st = STATUS_STYLE[s.status];
          const Icon = st.icon;
          return (
            <div key={s.stage} className="flex items-center gap-1">
              <div
                title={s.staleReason ?? `${s.label}: ${s.statusLabel}`}
                className={cn("flex min-w-[7rem] flex-col gap-0.5 rounded-lg px-2.5 py-1.5 ring-1 ring-inset", st.cls)}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("size-3.5", s.status === "STALE" && "")} />
                  <span className="text-xs font-semibold">{s.label}</span>
                </div>
                <span className="text-[10px] opacity-80">{s.statusLabel}</span>
              </div>
              {i < stages.length - 1 && <ChevronLeft className="size-3.5 shrink-0 text-muted-foreground" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
