"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  HardHat,
  Wallet,
} from "lucide-react";
import { toFa, faMoney, faRial } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface ComparisonData {
  projects: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    location: string | null;
    year: number;
    contractAmount: number;
    executedAmount: number;
    netPaid: number;
    remaining: number;
    progressPercent: number;
    detailBoqCount: number;
    financialSheetCount: number;
    paymentCount: number;
    pendingPayments: number;
    finalizedPayments: number;
    unreadAlerts: number;
    healthScore: number;
    healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
    createdAt: string;
  }>;
  totals: {
    projects: number;
    activeProjects: number;
    draftProjects: number;
    totalContract: number;
    totalExecuted: number;
    totalRemaining: number;
    avgProgress: number;
    healthyProjects: number;
    warningProjects: number;
    criticalProjects: number;
    totalPendingPayments: number;
    totalUnreadAlerts: number;
  };
}

const HEALTH_META = {
  HEALTHY: {
    label: "سالم",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  WARNING: {
    label: "هشدار",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "بحرانی",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: AlertTriangle,
  },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "فعال", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  DRAFT: { label: "پیش‌نویس", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  CLOSED: { label: "بسته‌شده", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
};

export function ProjectComparison() {
  const { selectProject } = useAppStore();
  const { data, isLoading } = useQuery<ComparisonData>({
    queryKey: ["dashboard-comparison"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/comparison");
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { projects, totals } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Activity className="size-6 text-amber-600" />
          داشبورد مقایسه‌ای پروژه‌ها
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          مقایسه‌ی سلامت، پیشرفت و عملکرد پروژه‌های سازمان
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TotalCard
          icon={HardHat}
          label="کل پروژه‌ها"
          value={toFa(totals.projects)}
          sub={`${toFa(totals.activeProjects)} فعال • ${toFa(totals.draftProjects)} پیش‌نویس`}
          color="amber"
        />
        <TotalCard
          icon={Wallet}
          label="مبلغ کل پیمان"
          value={faMoney(totals.totalContract)}
          sub={`${faMoney(totals.totalExecuted)} اجرا شده`}
          color="orange"
        />
        <TotalCard
          icon={TrendingUp}
          label="میانگین پیشرفت"
          value={`${toFa(totals.avgProgress.toFixed(1))}٪`}
          sub={`${faMoney(totals.totalRemaining)} مانده`}
          color="emerald"
        />
        <TotalCard
          icon={AlertTriangle}
          label="هشدارها"
          value={toFa(totals.totalUnreadAlerts)}
          sub={`${toFa(totals.totalPendingPayments)} صورت‌وضعیت در انتظار`}
          color={totals.totalUnreadAlerts > 0 ? "rose" : "slate"}
        />
      </div>

      {/* Health Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="size-4 text-amber-600" />
            نمای کلی سلامت پروژه‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <HealthCard
              label="سالم"
              count={totals.healthyProjects}
              total={totals.projects}
              type="HEALTHY"
            />
            <HealthCard
              label="هشدار"
              count={totals.warningProjects}
              total={totals.projects}
              type="WARNING"
            />
            <HealthCard
              label="بحرانی"
              count={totals.criticalProjects}
              total={totals.projects}
              type="CRITICAL"
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Comparison Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HardHat className="size-4 text-amber-600" />
            جدول مقایسه‌ی پروژه‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10 border-b">
                <tr>
                  <th className="text-right p-3 font-medium">پروژه</th>
                  <th className="text-right p-3 font-medium">وضعیت</th>
                  <th className="text-left p-3 font-medium">مبلغ پیمان</th>
                  <th className="text-left p-3 font-medium">اجرا شده</th>
                  <th className="text-center p-3 font-medium">پیشرفت</th>
                  <th className="text-center p-3 font-medium">صورت‌وضعیت</th>
                  <th className="text-center p-3 font-medium">هشدار</th>
                  <th className="text-center p-3 font-medium">سلامت</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const health = HEALTH_META[p.healthStatus];
                  const status = STATUS_META[p.status] || STATUS_META.DRAFT;
                  const HealthIcon = health.icon;
                  return (
                    <tr
                      key={p.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => selectProject(p.id, "overview")}
                    >
                      <td className="p-3">
                        <div className="font-medium text-xs">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {p.code} • {p.location}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={cn("text-[10px] h-5", status.color)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-left tabular-nums">
                        {faMoney(p.contractAmount)}
                      </td>
                      <td className="p-3 text-left tabular-nums">
                        <div className="font-medium">{faMoney(p.executedAmount)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          مانده: {faMoney(p.remaining)}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                p.progressPercent >= 75
                                  ? "bg-emerald-500"
                                  : p.progressPercent >= 40
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              )}
                              style={{ width: `${Math.min(p.progressPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums font-medium">
                            {toFa(p.progressPercent.toFixed(0))}٪
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="text-xs font-medium">{toFa(p.paymentCount)}</div>
                        <div className="text-[9px] text-muted-foreground">
                          {toFa(p.finalizedPayments)} قطعی
                        </div>
                        {p.pendingPayments > 0 && (
                          <Badge className="mt-0.5 text-[8px] h-3.5 bg-orange-100 text-orange-800">
                            {toFa(p.pendingPayments)} در انتظار
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {p.unreadAlerts > 0 ? (
                          <Badge className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            {toFa(p.unreadAlerts)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <HealthIcon className={cn("size-4", health.dot.replace("bg-", "text-"))} />
                          <div>
                            <Badge className={cn("text-[9px] h-4", health.color)}>
                              {health.label}
                            </Badge>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              {toFa(p.healthScore)}٪
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2">
                <tr className="font-bold">
                  <td className="p-3">جمع کل</td>
                  <td></td>
                  <td className="p-3 text-left tabular-nums">{faMoney(totals.totalContract)}</td>
                  <td className="p-3 text-left tabular-nums">{faMoney(totals.totalExecuted)}</td>
                  <td className="p-3 text-center tabular-nums">
                    {toFa(totals.avgProgress.toFixed(0))}٪
                  </td>
                  <td className="p-3 text-center">{toFa(totals.totalPendingPayments)} در انتظار</td>
                  <td className="p-3 text-center">{toFa(totals.totalUnreadAlerts)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing & At Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performing */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              بهترین پروژه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects
                .slice()
                .sort((a, b) => b.progressPercent - a.progressPercent)
                .slice(0, 3)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 cursor-pointer"
                    onClick={() => selectProject(p.id, "overview")}
                  >
                    <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                      {toFa(i + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {toFa(p.progressPercent.toFixed(0))}٪ پیشرفت
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                      {faMoney(p.executedAmount)}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-600" />
              پروژه‌های نیازمند توجه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects
                .slice()
                .sort((a, b) => a.healthScore - b.healthScore)
                .slice(0, 3)
                .map((p) => {
                  const health = HEALTH_META[p.healthStatus];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 cursor-pointer"
                      onClick={() => selectProject(p.id, "overview")}
                    >
                      <div className={cn("size-2 rounded-full", health.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          امتیاز سلامت: {toFa(p.healthScore)}٪
                          {p.unreadAlerts > 0 && ` • ${toFa(p.unreadAlerts)} هشدار`}
                        </div>
                      </div>
                      <Badge className={cn("text-[10px]", health.color)}>
                        {health.label}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TotalCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof HardHat;
  label: string;
  value: string;
  sub: string;
  color: "amber" | "emerald" | "rose" | "slate" | "orange";
}) {
  const colors = {
    amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300",
    slate: "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-700 dark:text-slate-300",
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 text-orange-700 dark:text-orange-300",
  };
  return (
    <Card className={cn("border-0 shadow-sm bg-gradient-to-br", colors[color])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <Icon className="size-4 opacity-60" />
        </div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

function HealthCard({
  label,
  count,
  total,
  type,
}: {
  label: string;
  count: number;
  total: number;
  type: "HEALTHY" | "WARNING" | "CRITICAL";
}) {
  const meta = HEALTH_META[type];
  const Icon = meta.icon;
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className={cn("rounded-lg border p-4 text-center", meta.color)}>
      <Icon className="size-6 mx-auto mb-2" />
      <div className="text-2xl font-bold tabular-nums">{toFa(count)}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
      <div className="text-[10px] opacity-70 mt-1">
        {toFa(percent.toFixed(0))}٪ از کل
      </div>
    </div>
  );
}
