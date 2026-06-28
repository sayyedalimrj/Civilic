"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  PiggyBank,
  Target,
} from "lucide-react";
import { faMoney, faRial, toFa, faPct } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CashFlowData {
  project: { id: string; name: string; code: string; contractAmount: number };
  historical: Array<{
    period: string;
    periodNo: number;
    date: string;
    inflow: number;
    outflow: number;
    net: number;
    cumulativeInflow: number;
    cumulativeOutflow: number;
    cumulativeNet: number;
  }>;
  forecast: Array<{
    period: string;
    periodNo: number;
    inflow: number;
    outflow: number;
    net: number;
    cumulativeInflow: number;
    cumulativeOutflow: number;
    cumulativeNet: number;
    isForecast: boolean;
  }>;
  kpis: {
    totalInflow: number;
    totalOutflow: number;
    currentBalance: number;
    profitMargin: number;
    breakEvenPoint: number;
    materialCosts: number;
    avgInflowPerPeriod: number;
    avgOutflowPerPeriod: number;
  };
  chapterCosts: Array<{ name: string; value: number; percent: number }>;
}

export function CashFlowView() {
  const { selectedProjectId } = useAppStore();

  const { data, isLoading } = useQuery<CashFlowData>({
    queryKey: ["cash-flow", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/cash-flow`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
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

  // ترکیب داده‌های تاریخی و پیش‌بینی
  const allData = [
    ...data.historical.map((h) => ({ ...h, type: "historical" })),
    ...data.forecast.map((f) => ({ ...f, type: "forecast" })),
  ];

  const kpis = data.kpis;
  const isProfitable = kpis.currentBalance >= 0;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <DollarSign className="size-5 text-emerald-600" />
          پیش‌بینی جریان نقدی
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          تحلیل درآمد و هزینه‌ی پروژه در طول زمان + پیش‌بینی ۴ دوره آینده
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={TrendingUp}
          label="درآمد کل (دریافتی)"
          value={faMoney(kpis.totalInflow)}
          sub={`میانگین دوره‌ای: ${faMoney(kpis.avgInflowPerPeriod)}`}
          color="emerald"
        />
        <KPICard
          icon={TrendingDown}
          label="هزینه‌ی کل (پرداختی)"
          value={faMoney(kpis.totalOutflow)}
          sub={`میانگین دوره‌ای: ${faMoney(kpis.avgOutflowPerPeriod)}`}
          color="rose"
        />
        <KPICard
          icon={PiggyBank}
          label="تراز نقدی فعلی"
          value={faMoney(Math.abs(kpis.currentBalance))}
          sub={isProfitable ? "سود (مثبت)" : "زیان (منفی)"}
          color={isProfitable ? "emerald" : "rose"}
        />
        <KPICard
          icon={Target}
          label="حاشیه‌ی سود"
          value={`${toFa(kpis.profitMargin.toFixed(1))}٪`}
          sub={`نقطه‌ی سربه‌سر: دوره ${toFa(kpis.breakEvenPoint)}`}
          color={kpis.profitMargin >= 15 ? "emerald" : kpis.profitMargin >= 0 ? "amber" : "rose"}
        />
      </div>

      {/* Cash Flow Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="size-4 text-amber-600" />
              نمودار جریان نقدی تجمعی
            </span>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-[9px] gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                درآمد
              </Badge>
              <Badge variant="outline" className="text-[9px] gap-1">
                <span className="size-2 rounded-full bg-rose-500" />
                هزینه
              </Badge>
              <Badge variant="outline" className="text-[9px] gap-1">
                <span className="size-2 rounded-full bg-amber-500" />
                تراز
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={allData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} reversed />
              <YAxis
                tickFormatter={(v) => faMoney(v)}
                tick={{ fontSize: 10 }}
                orientation="right"
                width={80}
              />
              <Tooltip content={<CashFlowTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey="cumulativeInflow"
                name="درآمد تجمعی"
                stroke="#16a34a"
                fill="url(#inflowGrad)"
                strokeWidth={2}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="cumulativeOutflow"
                name="هزینه‌ی تجمعی"
                stroke="#dc2626"
                fill="url(#outflowGrad)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="cumulativeNet"
                name="تراز نقدی"
                stroke="#d97706"
                strokeWidth={3}
                dot={{ fill: "#d97706", r: 3 }}
                connectNulls
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Period-by-Period Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="size-4 text-emerald-600" />
            درآمد و هزینه‌ی هر دوره
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={allData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} reversed />
              <YAxis tickFormatter={(v) => faMoney(v)} tick={{ fontSize: 10 }} orientation="right" width={80} />
              <Tooltip content={<CashFlowTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inflow" name="درآمد" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={18} />
              <Bar dataKey="outflow" name="هزینه" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="size-4 text-amber-600" />
            جدول تفصیلی جریان نقدی
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[40vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10 border-b">
                <tr>
                  <th className="text-right p-2 font-medium">دوره</th>
                  <th className="text-left p-2 font-medium">درآمد</th>
                  <th className="text-left p-2 font-medium">هزینه</th>
                  <th className="text-left p-2 font-medium">تراز خالص</th>
                  <th className="text-left p-2 font-medium">درآمد تجمعی</th>
                  <th className="text-left p-2 font-medium">هزینه‌ی تجمعی</th>
                  <th className="text-left p-2 font-medium">تراز تجمعی</th>
                </tr>
              </thead>
              <tbody>
                {allData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b hover:bg-muted/30",
                      row.type === "forecast" && "bg-emerald-50/30 dark:bg-emerald-950/10 italic"
                    )}
                  >
                    <td className="p-2 font-medium">
                      {row.period}
                      {row.type === "forecast" && (
                        <Badge variant="outline" className="text-[9px] h-4 mr-1 text-emerald-600">
                          پیش‌بینی
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 text-left tabular-nums text-emerald-600">
                      {faMoney(row.inflow)}
                    </td>
                    <td className="p-2 text-left tabular-nums text-rose-600">
                      {faMoney(row.outflow)}
                    </td>
                    <td className={cn(
                      "p-2 text-left tabular-nums font-bold",
                      row.net >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {row.net >= 0 ? "+" : ""}{faMoney(row.net)}
                    </td>
                    <td className="p-2 text-left tabular-nums text-muted-foreground">
                      {faMoney(row.cumulativeInflow)}
                    </td>
                    <td className="p-2 text-left tabular-nums text-muted-foreground">
                      {faMoney(row.cumulativeOutflow)}
                    </td>
                    <td className={cn(
                      "p-2 text-left tabular-nums font-bold",
                      row.cumulativeNet >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {faMoney(row.cumulativeNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className={cn(
          "border-0 shadow-sm bg-gradient-to-br",
          isProfitable
            ? "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
            : "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {isProfitable ? (
                <TrendingUp className="size-5 text-emerald-600" />
              ) : (
                <TrendingDown className="size-5 text-rose-600" />
              )}
              <span className="text-sm font-bold">
                {isProfitable ? "پروژه در حال سوددهی" : "پروژه در حال زیان"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isProfitable
                ? `تراز نقدی فعلی مثبت است. با ادامه‌ی این روند، سود نهایی تقریباً ${faMoney(kpis.currentBalance * 4)} خواهد بود.`
                : `تراز نقدی منفی است. نیاز به بازنگری در هزینه‌ها یا تسریع در دریافت صورت‌وضعیت‌ها.`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-5 text-amber-600" />
              <span className="text-sm font-bold">پیش‌بینی نقطه‌ی سربه‌سر</span>
            </div>
            <p className="text-xs text-muted-foreground">
              بر اساس میانگین فعلی، پروژه در دوره‌ی <strong>{toFa(kpis.breakEvenPoint)}</strong> به نقطه‌ی سربه‌سر می‌رسد.
              هزینه‌ی مصالح پای کار: <strong>{faMoney(kpis.materialCosts)}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof TrendingUp;
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
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <Icon className="size-3.5 opacity-60" />
        </div>
        <div className="text-base font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}

function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-xs" dir="rtl">
      <div className="font-bold mb-2">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-bold tabular-nums">{faMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
