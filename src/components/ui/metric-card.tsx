import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
  className?: string;
}

const TONE: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  danger: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
  info: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
};

export function MetricCard({ label, value, icon: Icon, hint, tone = "default", loading, className }: MetricCardProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-card p-4", className)}>
      {Icon && (
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon className="size-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <div className="truncate text-xl font-bold tabular-nums">{value}</div>
        )}
        {hint && !loading && <div className="text-[10px] text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
