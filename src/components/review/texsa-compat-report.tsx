"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { MetricCard } from "@/components/ui/metric-card";
import { CalculationStatusBadge, TexsaCompatibilityBadge } from "@/components/review/provenance-badges";
import { Database, ListChecks, FileWarning, GitCompare, RefreshCw, Loader2 } from "lucide-react";
import { toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";

interface CompatData {
  sequence: { stage: string; label: string; status: string; parity: string }[];
  sequenceCompletePct: number;
  staleStages: string[];
  normalized: { payments: number; details: number; summaries: number; adjustments: number };
  exportability: { exportableFromTexsa: number; civilicOnly: number };
  review: { reviewedItems: number; revisedItems: number; employerFinal: number };
  imported: { tables: number; rows: number; fileName: string; texsaVersion: string | null } | null;
}

export function TexsaCompatReport({ projectId }: { projectId: string }) {
  const [filter, setFilter] = useState<string>("all");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<CompatData>({
    queryKey: ["texsa-compat", projectId],
    queryFn: async () => (await fetch(`/api/projects/${projectId}/texsa-compat`)).json(),
  });

  // مراحل قابل بازمحاسبه در سطح پروژه (بدون نیاز به شناسه‌ی سند)
  const RECALCULABLE = new Set(["MEASUREMENT_SUMMARY", "FINANCIAL_SHEET"]);
  const recalc = useMutation({
    mutationFn: async (stage: string) => {
      const r = await fetch(`/api/projects/${projectId}/recalc`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["texsa-compat", projectId] }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return null;

  const stages = filter === "all" ? data.sequence : data.sequence.filter((s) => s.stage === filter);

  return (
    <div className="space-y-4">
      <SectionCard title="گزارش سازگاری تکسا" icon={<Database className="size-4" />}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="کامل‌بودن توالی" value={`${toFa(data.sequenceCompletePct)}٪`} icon={ListChecks} tone={data.sequenceCompletePct >= 100 ? "success" : "warning"} />
          <MetricCard label="مراحل نیازمند بروزرسانی" value={toFa(data.staleStages.length)} icon={FileWarning} tone={data.staleStages.length ? "warning" : "success"} />
          <MetricCard label="ردیف‌های رسیدگی‌شده" value={toFa(data.review.reviewedItems)} icon={GitCompare} tone="info" />
          <MetricCard label="تاییدشده توسط کارفرما" value={toFa(data.review.employerFinal)} icon={ListChecks} tone="success" />
        </div>
        {data.imported && (
          <p className="mt-3 text-xs text-muted-foreground">
            وارد شده از تکسا: {toFa(data.imported.tables)} جدول، {toFa(data.imported.rows)} ردیف
            {data.imported.texsaVersion && <> — نسخه {data.imported.texsaVersion}</>}
          </p>
        )}
      </SectionCard>

      <SectionCard title="وضعیت مراحل (قابل فیلتر)" bodyClassName="p-0">
        <div className="flex flex-wrap gap-1 border-b p-3">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>همه</Chip>
          {data.sequence.map((s) => <Chip key={s.stage} active={filter === s.stage} onClick={() => setFilter(s.stage)}>{s.label}</Chip>)}
        </div>
        <ul className="divide-y">
          {stages.map((s) => (
            <li key={s.stage} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-sm font-medium">{s.label}</span>
              <div className="flex items-center gap-2">
                <TexsaCompatibilityBadge parity={s.parity} />
                <CalculationStatusBadge status={s.status} />
                {RECALCULABLE.has(s.stage) && (s.status === "STALE" || s.status === "NEEDS_REVIEW") && (
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => recalc.mutate(s.stage)} disabled={recalc.isPending}>
                    {recalc.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} بروزرسانی
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="صورت‌وضعیت‌ها" value={toFa(data.normalized.payments)} tone="info" />
        <MetricCard label="ریزمتره" value={toFa(data.normalized.details)} tone="info" />
        <MetricCard label="قابل خروجی به تکسا" value={toFa(data.exportability.exportableFromTexsa)} tone="success" />
        <MetricCard label="فقط در Civilic" value={toFa(data.exportability.civilicOnly)} tone="default" />
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn("rounded-full px-2.5 py-1 text-xs", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>{children}</button>;
}
