"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { faMoney, faPct, toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";

interface SCurveData {
  project: { id: string; name: string; code: string; contractAmount: number };
  actual: Array<{
    period: string;
    periodNo: number;
    date: string;
    amount: number;
    cumulative: number;
    percent: number;
    isLast: boolean;
  }>;
  planned: Array<{
    period: string;
    periodNo: number;
    plannedPercent: number;
    plannedCumulative: number;
  }>;
  forecast: Array<{
    period: string;
    periodNo: number;
    cumulative: number;
    percent: number;
    isForecast: boolean;
  }>;
  kpis: {
    actualPercent: number;
    plannedPercentNow: number;
    spi: number;
    remainingAmount: number;
    avgRatePerPeriod: number;
    estimatedRemainingPeriods: number;
    isAhead: boolean;
    isOnTrack: boolean;
    isBehind: boolean;
  };
  chapterDistribution: Array<{
    chapterNo: number;
    title: string;
    amount: number;
    percent: number;
  }>;
}

interface SCurveChartProps {
  projectId: string;
  height?: number;
  showKPIs?: boolean;
  showChapterDistribution?: boolean;
}

export function SCurveChart({
  projectId,
  height = 320,
  showKPIs = true,
  showChapterDistribution = true,
}: SCurveChartProps) {
  const { data, isLoading } = useQuery<SCurveData>({
    queryKey: ["scurve", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/scurve`);
      return r.json();
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // ترکیب داده‌های planned و actual و forecast برای نمودار
  const chartData: any[] = [];
  const maxPeriod = Math.max(
    data.planned.length - 1,
    data.actual.length > 0 ? data.actual[data.actual.length - 1].periodNo : 0,
    data.forecast.length > 0
      ? data.forecast[data.forecast.length - 1].periodNo
      : 0
  );

  for (let i = 0; i <= maxPeriod; i++) {
    const planned = data.planned[i];
    const actual = data.actual.find((a) => a.periodNo === i);
    const forecast = data.forecast.find((f) => f.periodNo === i);
    chartData.push({
      period: actual?.period || planned?.period || `دوره ${i}`,
      periodNo: i,
      plannedPercent: planned?.plannedPercent || null,
      plannedCumulative: planned?.plannedCumulative || null,
      actualPercent: actual?.percent || null,
      actualCumulative: actual?.cumulative || null,
      forecastPercent: forecast?.percent || null,
      forecastCumulative: forecast?.cumulative || null,
    });
  }

  const kpis = data.kpis;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      {showKPIs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="پیشرفت واقعی"
            value={`${toFa(kpis.actualPercent.toFixed(1))}٪`}
            sub={faMoney(data.actual.length > 0 ? data.actual[data.actual.length - 1].cumulative : 0)}
            icon={Activity}
            color="amber"
          />
          <KPICard
            label="پیشرفت برنامه‌ریزی‌شده"
            value={`${toFa(kpis.plannedPercentNow.toFixed(1))}٪`}
            sub="بر اساس منحنی S ایده‌آل"
            icon={TrendingUp}
            color="slate"
          />
          <KPICard
            label="شاخص زمان‌بندی (SPI)"
            value={kpis.spi > 0 ? toFa(kpis.spi.toFixed(2)) : "—"}
            sub={
              kpis.isAhead
                ? "جلوتر از برنامه"
                : kpis.isOnTrack
                ? "مطابق برنامه"
                : "عقب‌تر از برنامه"
            }
            icon={kpis.isAhead ? TrendingUp : kpis.isBehind ? TrendingDown : Minus}
            color={kpis.isAhead ? "emerald" : kpis.isBehind ? "rose" : "amber"}
          />
          <KPICard
            label="تخمین تکمیل"
            value={kpis.estimatedRemainingPeriods > 0 ? `${toFa(kpis.estimatedRemainingPeriods)} دوره` : "—"}
            sub={`مانده: ${faMoney(kpis.remainingAmount)}`}
            icon={Activity}
            color="orange"
          />
        </div>
      )}

      {/* S-Curve Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="size-4 text-amber-600" />
              نمودار S-Curve پیشرفت پروژه
            </span>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-[9px] gap-1">
                <span className="size-2 rounded-full bg-amber-500" />
                واقعی
              </Badge>
              <Badge variant="outline" className="text-[9px] gap-1">
                <span className="size-2 rounded-full bg-slate-400" />
                برنامه‌ریزی
              </Badge>
              <Badge variant="outline" className="text-[9px] gap-1">
                <span className="size-2 rounded-full bg-emerald-400" />
                پیش‌بینی
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10 }}
                reversed
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="percent"
                orientation="right"
                tickFormatter={(v) => `${toFa(v)}٪`}
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                width={50}
              />
              <YAxis
                yAxisId="amount"
                orientation="left"
                tickFormatter={(v) => faMoney(v)}
                tick={{ fontSize: 10 }}
                width={80}
              />
              <Tooltip content={<SCurveTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {/* خط برنامه‌ریزی‌شده */}
              <Area
                yAxisId="percent"
                type="monotone"
                dataKey="plannedPercent"
                name="برنامه‌ریزی‌شده"
                stroke="#94a3b8"
                fill="url(#plannedGrad)"
                strokeWidth={2}
                strokeDasharray="5 3"
                connectNulls
              />
              {/* خط واقعی */}
              <Area
                yAxisId="percent"
                type="monotone"
                dataKey="actualPercent"
                name="واقعی"
                stroke="#d97706"
                fill="url(#actualGrad)"
                strokeWidth={3}
                connectNulls
                dot={{ fill: "#d97706", r: 3 }}
                activeDot={{ r: 5 }}
              />
              {/* خط پیش‌بینی */}
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="forecastPercent"
                name="پیش‌بینی"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
              {/* خط ۱۰۰٪ */}
              <ReferenceLine yAxisId="percent" y={100} stroke="#16a34a" strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chapter Distribution */}
      {showChapterDistribution && data.chapterDistribution.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-orange-600" />
              توزیع پیشرفت فصول
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.chapterDistribution.map((ch) => {
              const colors = [
                "bg-amber-500",
                "bg-orange-500",
                "bg-emerald-500",
                "bg-rose-500",
                "bg-purple-500",
                "bg-cyan-500",
                "bg-pink-500",
              ];
              const color = colors[(ch.chapterNo - 1) % colors.length];
              return (
                <div key={ch.chapterNo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      فصل {toFa(ch.chapterNo)} — {ch.title}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {faMoney(ch.amount)} • {toFa(ch.percent.toFixed(1))}٪
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", color)}
                      style={{ width: `${Math.min(ch.percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Activity;
  color: "amber" | "emerald" | "rose" | "orange" | "slate";
}) {
  const colors = {
    amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300",
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 text-orange-700 dark:text-orange-300",
    slate: "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-700 dark:text-slate-300",
  };
  return (
    <Card className={cn("border-0 shadow-sm bg-gradient-to-br", colors[color])}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <Icon className="size-3.5 opacity-60" />
        </div>
        <div className="text-lg font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}

function SCurveTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-xs" dir="rtl">
      <div className="font-bold mb-2">{label}</div>
      {payload.map((p: any, i: number) => {
        if (p.value === null || p.value === undefined) return null;
        return (
          <div key={i} className="flex items-center justify-between gap-3 mb-1">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </span>
            <span className="font-bold tabular-nums">
              {toFa(Number(p.value).toFixed(1))}٪
            </span>
          </div>
        );
      })}
    </div>
  );
}
