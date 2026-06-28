"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Line,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle,
  Activity, Target, Sparkles, Clock,
} from "lucide-react";
import { faMoney, toFa, toJalali } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ForecastData {
  project: { id: string; name: string; code: string; contractAmount: number };
  current: {
    executedAmount: number;
    remainingAmount: number;
    progress: number;
    avgRatePerPeriod: number;
    periods: number;
  };
  forecast: {
    estimatedRemainingPeriods: number;
    estimatedCompletionDate: string;
    totalRiskCost: number;
    avgRiskScore: number;
    pendingChangeCost: number;
    pendingChangeDelay: number;
  };
  scenarios: {
    optimistic: { label: string; finalCost: number; completionDate: string; probability: number; description: string };
    realistic: { label: string; finalCost: number; completionDate: string; probability: number; description: string };
    pessimistic: { label: string; finalCost: number; completionDate: string; probability: number; description: string };
  };
  forecastSeries: Array<{ period: string; planned: number; forecast: number }>;
  recommendations: Array<{ type: string; priority: string; message: string }>;
}

const PRIORITY_META = {
  HIGH: { label: "فوری", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300", dot: "bg-rose-500" },
  MEDIUM: { label: "متوسط", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", dot: "bg-amber-500" },
  LOW: { label: "کم", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export function ForecastView() {
  const { selectedProjectId } = useAppStore();

  const { data, isLoading } = useQuery<ForecastData>({
    queryKey: ["forecast", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/forecast`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { current, forecast, scenarios, forecastSeries, recommendations } = data;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="size-5 text-amber-600" />
          پیش‌بینی هوشمند پروژه
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          تحلیل پیش‌بینی تکمیل پروژه بر اساس داده‌های تاریخی، ریسک‌ها و تغییرات
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={Activity}
          label="پیشرفت فعلی"
          value={`${toFa(current.progress.toFixed(1))}٪`}
          sub={`${faMoney(current.executedAmount)} از ${faMoney(data.project.contractAmount)}`}
          color="amber"
        />
        <KPICard
          icon={Clock}
          label="تخمین تکمیل"
          value={forecast.estimatedRemainingPeriods > 0 ? `${toFa(forecast.estimatedRemainingPeriods)} دوره` : "—"}
          sub={`موعد تخمینی: ${toJalali(forecast.estimatedCompletionDate)}`}
          color="orange"
        />
        <KPICard
          icon={AlertCircle}
          label="هزینه‌ی ریسک"
          value={faMoney(forecast.totalRiskCost)}
          sub={`میانگین امتیاز ریسک: ${toFa((forecast.avgRiskScore * 100).toFixed(0))}٪`}
          color="rose"
        />
        <KPICard
          icon={DollarSign}
          label="تغییرات در انتظار"
          value={faMoney(forecast.pendingChangeCost)}
          sub={`تأخیر: ${toFa(forecast.pendingChangeDelay)} روز`}
          color="slate"
        />
      </div>

      {/* Forecast Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="size-4 text-amber-600" />
            نمودار پیش‌بینی تکمیل پروژه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastSeries} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} reversed />
              <YAxis tickFormatter={(v) => faMoney(v)} tick={{ fontSize: 10 }} orientation="right" width={80} />
              <Tooltip
                contentStyle={{ fontSize: 11, direction: "rtl", borderRadius: 8 }}
                formatter={(v: number) => faMoney(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="planned" name="برنامه‌ریزی‌شده" stroke="#94a3b8" fill="url(#plannedGrad)" strokeWidth={2} strokeDasharray="5 3" />
              <Area type="monotone" dataKey="forecast" name="پیش‌بینی" stroke="#d97706" fill="url(#forecastGrad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(scenarios).map(([key, s]) => {
          const isOptimistic = key === "optimistic";
          const isPessimistic = key === "pessimistic";
          return (
            <Card key={key} className={cn(
              "border-0 shadow-sm bg-gradient-to-br",
              isOptimistic
                ? "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
                : isPessimistic
                ? "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30"
                : "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    {isOptimistic ? <TrendingUp className="size-4 text-emerald-600" /> :
                     isPessimistic ? <TrendingDown className="size-4 text-rose-600" /> :
                     <Target className="size-4 text-amber-600" />}
                    {s.label}
                  </span>
                  <Badge variant="outline" className="text-[9px]">
                    احتمال {toFa(s.probability)}٪
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">هزینه‌ی نهایی:</span>
                    <span className="font-bold tabular-nums">{faMoney(s.finalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاریخ تکمیل:</span>
                    <span className="font-medium">{toJalali(s.completionDate)}</span>
                  </div>
                </div>
                <Separator className="my-2" />
                <p className="text-[10px] text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-amber-600" />
              توصیه‌های هوشمند ({toFa(recommendations.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => {
                const meta = PRIORITY_META[rec.priority as keyof typeof PRIORITY_META] || PRIORITY_META.MEDIUM;
                return (
                  <div key={idx} className={cn(
                    "flex items-start gap-2 p-2.5 rounded-md border",
                    rec.priority === "HIGH"
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                      : rec.priority === "MEDIUM"
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                      : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  )}>
                    <div className={cn("size-2 rounded-full mt-1.5 shrink-0", meta.dot)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={cn("text-[8px] h-3.5", meta.color)}>
                          {meta.label}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] h-3.5">
                          {rec.type === "RISK" ? "ریسک" :
                           rec.type === "SCHEDULE" ? "زمان‌بندی" :
                           rec.type === "COST" ? "هزینه" :
                           rec.type === "COMPLETION" ? "تکمیل" : rec.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{rec.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Activity; label: string; value: string; sub: string;
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
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <Icon className="size-3.5 opacity-60" />
        </div>
        <div className="text-sm font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}
