"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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
  HardHat,
  Truck,
  Package,
  Ship,
  TrendingUp,
  Wallet,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { faMoney, faRial, toFa, faPct } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CostAnalysisData {
  project: { id: string; name: string; code: string; contractAmount: number };
  factors: Array<{
    key: string;
    label: string;
    amount: number;
    percent: number;
    color: string;
    icon: string;
  }>;
  grandTotal: number;
  chapterAnalysis: Array<{
    chapterNo: number;
    title: string;
    labor: number;
    equipment: number;
    material: number;
    transport: number;
    total: number;
    percentOfTotal: number;
  }>;
  topItems: Array<{
    code: string;
    description: string;
    totalAmount: number;
    labor: number;
    equipment: number;
    material: number;
    transport: number;
    chapterNo: number;
  }>;
  executed: {
    total: number;
    net: number;
    deductions: {
      guarantee: number;
      insurance: number;
      tax: number;
      total: number;
    };
  };
  summary: {
    totalItems: number;
    starredItems: number;
    avgItemCost: number;
    maxItemCost: number;
    minItemCost: number;
  };
}

const ICONS: Record<string, typeof HardHat> = {
  HardHat,
  Truck,
  Package,
  Ship,
};

export function CostAnalysisView() {
  const { selectedProjectId } = useAppStore();

  const { data, isLoading } = useQuery<CostAnalysisData>({
    queryKey: ["cost-analysis", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/cost-analysis`);
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
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const pieData = data.factors.map((f) => ({
    name: f.label,
    value: f.amount,
    color: f.color,
  }));

  const chapterBarData = data.chapterAnalysis.map((ch) => ({
    name: `فصل ${toFa(ch.chapterNo)}`,
    دستمزد: ch.labor,
    ماشین‌آلات: ch.equipment,
    مصالح: ch.material,
    حمل: ch.transport,
  }));

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Wallet className="size-5 text-amber-600" />
          تحلیل هزینه‌ی پروژه
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          تجزیه‌ی هزینه‌ها به عوامل چهارگانه (دستمزد، ماشین‌آلات، مصالح، حمل)
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={Wallet}
          label="مبلغ کل محاسبه‌شده"
          value={faMoney(data.grandTotal)}
          sub={faRial(data.grandTotal)}
          color="amber"
        />
        <KPICard
          icon={Receipt}
          label="اجرا شده"
          value={faMoney(data.executed.total)}
          sub={`خالص: ${faMoney(data.executed.net)}`}
          color="emerald"
        />
        <KPICard
          icon={AlertCircle}
          label="کسورات قانونی"
          value={faMoney(data.executed.deductions.total)}
          sub={`تضمین ${faPct(5)} + بیمه ${faPct(2)} + مالیات ${faPct(5)}`}
          color="rose"
        />
        <KPICard
          icon={TrendingUp}
          label="میانگین هزینه‌ی آیتم"
          value={faMoney(data.summary.avgItemCost)}
          sub={`${toFa(data.summary.totalItems)} آیتم • ${toFa(data.summary.starredItems)} ستاره‌دار`}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart - Cost Factors */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="size-4 text-amber-600" />
              توزیع عوامل چهارگانه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  label={({ name, percent }) =>
                    `${name} ${toFa((percent * 100).toFixed(0))}٪`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CostTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Factor cards */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {data.factors.map((f) => {
                const Icon = ICONS[f.icon] || HardHat;
                return (
                  <div
                    key={f.key}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card"
                  >
                    <div
                      className="size-8 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: f.color }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {faMoney(f.amount)} • {toFa(f.percent.toFixed(1))}٪
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stacked Bar Chart - Chapter Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-orange-600" />
              توزیع هزینه بر اساس فصول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chapterBarData} layout="vertical" margin={{ right: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => faMoney(v)} tick={{ fontSize: 10 }} reversed orientation="top" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} orientation="right" />
                <Tooltip content={<CostTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="مصالح" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="دستمزد" stackId="a" fill="#d97706" />
                <Bar dataKey="ماشین‌آلات" stackId="a" fill="#0891b2" />
                <Bar dataKey="حمل" stackId="a" fill="#9333ea" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Items by Cost */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="size-4 text-amber-600" />
            ۱۰ آیتم برتر از نظر هزینه
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10 border-b">
                <tr>
                  <th className="text-right p-2 font-medium">کد</th>
                  <th className="text-right p-2 font-medium">شرح</th>
                  <th className="text-center p-2 font-medium">فصل</th>
                  <th className="text-left p-2 font-medium">دستمزد</th>
                  <th className="text-left p-2 font-medium">ماشین</th>
                  <th className="text-left p-2 font-medium">مصالح</th>
                  <th className="text-left p-2 font-medium">حمل</th>
                  <th className="text-left p-2 font-medium">جمع کل</th>
                  <th className="text-center p-2 font-medium">سهم</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, idx) => {
                  const share = data.grandTotal > 0 ? (item.totalAmount / data.grandTotal) * 100 : 0;
                  return (
                    <tr key={idx} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-mono text-[11px]">{item.code}</td>
                      <td className="p-2 max-w-[200px] truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="p-2 text-center">{toFa(item.chapterNo)}</td>
                      <td className="p-2 text-left tabular-nums text-[11px] text-amber-600">
                        {faMoney(item.labor)}
                      </td>
                      <td className="p-2 text-left tabular-nums text-[11px] text-cyan-600">
                        {faMoney(item.equipment)}
                      </td>
                      <td className="p-2 text-left tabular-nums text-[11px] text-emerald-600">
                        {faMoney(item.material)}
                      </td>
                      <td className="p-2 text-left tabular-nums text-[11px] text-purple-600">
                        {faMoney(item.transport)}
                      </td>
                      <td className="p-2 text-left tabular-nums font-bold">
                        {faMoney(item.totalAmount)}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(share, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums">
                            {toFa(share.toFixed(0))}٪
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deductions Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-600" />
            تفکیک کسورات قانونی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DeductionCard
              label="تضمین حسن انجام کار"
              amount={data.executed.deductions.guarantee}
              percent={5}
              color="amber"
            />
            <DeductionCard
              label="بیمه"
              amount={data.executed.deductions.insurance}
              percent={2}
              color="orange"
            />
            <DeductionCard
              label="مالیات"
              amount={data.executed.deductions.tax}
              percent={5}
              color="rose"
            />
            <DeductionCard
              label="جمع کسورات"
              amount={data.executed.deductions.total}
              percent={12}
              color="slate"
              highlight
            />
          </div>
        </CardContent>
      </Card>
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

function DeductionCard({
  label,
  amount,
  percent,
  color,
  highlight,
}: {
  label: string;
  amount: number;
  percent: number;
  color: "amber" | "orange" | "rose" | "slate";
  highlight?: boolean;
}) {
  const colors = {
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    rose: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
    slate: "bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700",
  };
  return (
    <div className={cn("rounded-lg border p-3", colors[color], highlight && "ring-2 ring-slate-400/30")}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold tabular-nums mt-1">{faMoney(amount)}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {toFa(percent)}٪ از مبلغ اجرا
      </div>
    </div>
  );
}

function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-xs" dir="rtl">
      {label && <div className="font-bold mb-2">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.color }} />
            {p.name}
          </span>
          <span className="font-bold tabular-nums">{faMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
