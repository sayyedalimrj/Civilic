"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, Filter, TrendingUp, DollarSign, Shield, GitPullRequest,
  Download, RefreshCw, Building2, Activity,
} from "lucide-react";
import { faMoney, toFa, faPct } from "@/lib/fa";
import { exportToExcel } from "@/lib/export/export-utils";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface BIProject {
  id: string; name: string; code: string; status: string; year: number;
  location: string | null; contractAmount: number; executedAmount: number;
  netPaid: number; deductions: number; progress: number; remaining: number;
  detailBoqCount: number; financialSheetCount: number; paymentCount: number;
  documentCount: number; openRisks: number; criticalRisks: number;
  totalRiskCost: number; pendingChanges: number; totalCostImpact: number;
  healthScore: number; healthStatus: string; createdAt: string;
}

interface BIData {
  projects: BIProject[];
  totals: any;
  filters: { statuses: string[]; years: number[]; minContractAmount: number; maxContractAmount: number };
}

const HEALTH_COLORS = {
  HEALTHY: "#16a34a",
  WARNING: "#d97706",
  CRITICAL: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "فعال",
  DRAFT: "پیش‌نویس",
  CLOSED: "بسته‌شده",
};

export function BIDashboard() {
  const { selectProject } = useAppStore();
  const [status, setStatus] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("contractAmount");

  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (year !== "ALL") params.set("year", year);
  if (minAmount) params.set("minAmount", minAmount);
  if (maxAmount) params.set("maxAmount", maxAmount);
  params.set("sortBy", sortBy);

  const { data, isLoading } = useQuery<BIData>({
    queryKey: ["bi-dashboard", status, year, minAmount, maxAmount, sortBy],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/bi?${params.toString()}`);
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { projects, totals, filters } = data;

  // داده‌های نمودار میله‌ای — مبلغ پیمان vs اجرا
  const barData = projects.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
    پیمان: p.contractAmount,
    اجرا: p.executedAmount,
  }));

  // داده‌های Pie Chart — توزیع سلامت
  const healthPieData = [
    { name: "سالم", value: totals.healthy, color: HEALTH_COLORS.HEALTHY },
    { name: "هشدار", value: totals.warning, color: HEALTH_COLORS.WARNING },
    { name: "بحرانی", value: totals.critical, color: HEALTH_COLORS.CRITICAL },
  ];

  // داده‌های Scatter — ریسک vs پیشرفت
  const scatterData = projects.map((p) => ({
    name: p.name,
    risk: p.openRisks,
    progress: p.progress,
    size: p.contractAmount / 100000000,
    health: p.healthStatus,
  }));

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="size-6 text-amber-600" />
            داشبورد BI پیشرفته
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            تحلیل تجاری پیشرفته با فیلترهای چندگانه و نمودارهای تعاملی
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => {
              if (!data) return;
              exportToExcel(`bi-dashboard-${new Date().toISOString().split("T")[0]}`, [
                {
                  name: "پروژه‌ها",
                  title: "سیوان تدبیر تجارت — داشبورد BI",
                  subtitle: `تاریخ تولید: ${new Date().toLocaleDateString("fa-IR")}`,
                  headers: ["نام", "کد", "وضعیت", "مبلغ پیمان", "اجرا شده", "پیشرفت(٪)", "ریسک‌های باز", "تغییرات در انتظار", "امتیاز سلامت"],
                  rows: data.projects.map((p) => [
                    p.name, p.code, p.status, p.contractAmount, p.executedAmount,
                    Math.round(p.progress), p.openRisks, p.pendingChanges, p.healthScore,
                  ]),
                  totals: [
                    { label: "جمع", col: 3, formula: `SUM(E5:E${4 + data.projects.length})` },
                    { label: "جمع", col: 4, formula: `SUM(F5:F${4 + data.projects.length})` },
                  ],
                },
              ]);
            }}
          >
            <Download className="size-4" />
            خروجی Excel
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" />
            بازخوانی
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="size-4 text-amber-600" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px]">وضعیت</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  {filters.statuses.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">سال</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  {filters.years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{toFa(y)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">حداقل مبلغ (میلیون ریال)</Label>
              <Input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="۰"
                className="h-8 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">حداکثر مبلغ (میلیون ریال)</Label>
              <Input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="∞"
                className="h-8 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">مرتب‌سازی</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contractAmount">مبلغ پیمان</SelectItem>
                  <SelectItem value="name">نام پروژه</SelectItem>
                  <SelectItem value="createdAt">تاریخ ایجاد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard icon={Building2} label="پروژه‌ها" value={toFa(totals.count)} sub={`${toFa(totals.healthy)} سالم`} color="amber" />
        <KPICard icon={DollarSign} label="مبلغ پیمان" value={faMoney(totals.totalContract)} sub={`${faMoney(totals.totalExecuted)} اجرا`} color="orange" />
        <KPICard icon={TrendingUp} label="میانگین پیشرفت" value={`${toFa(totals.avgProgress.toFixed(0))}٪`} sub={`${faMoney(totals.totalNet)} خالص`} color="emerald" />
        <KPICard icon={Shield} label="ریسک‌های باز" value={toFa(totals.totalOpenRisks)} sub={`${faMoney(totals.totalRiskCost)} هزینه`} color="rose" />
        <KPICard icon={GitPullRequest} label="تغییرات در انتظار" value={toFa(totals.totalPendingChanges)} sub={`${faMoney(totals.totalCostImpact)} تأثیر`} color="slate" />
        <KPICard icon={Activity} label="میانگین سلامت" value={`${toFa(totals.avgHealth.toFixed(0))}٪`} sub={`${toFa(totals.critical)} بحرانی`} color={totals.critical > 0 ? "rose" : "emerald"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart — Contract vs Executed */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="size-4 text-amber-600" />
              مبلغ پیمان در مقابل اجرا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} reversed />
                <YAxis tickFormatter={(v) => faMoney(v)} tick={{ fontSize: 10 }} orientation="right" width={70} />
                <Tooltip
                  contentStyle={{ fontSize: 11, direction: "rtl", borderRadius: 8 }}
                  formatter={(v: number) => faMoney(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="پیمان" fill="#d97706" radius={[0, 4, 4, 0]} barSize={18} />
                <Bar dataKey="اجرا" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart — Health Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="size-4 text-emerald-600" />
              توزیع سلامت پروژه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={healthPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  label={({ name, percent }) => `${name} ${toFa((percent * 100).toFixed(0))}٪`}
                  labelLine={false}
                >
                  {healthPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, direction: "rtl" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Chart — Risk vs Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="size-4 text-purple-600" />
            تحلیل ریسک در مقابل پیشرفت (حباب = مبلغ پیمان)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="progress"
                name="پیشرفت"
                domain={[0, 100]}
                tickFormatter={(v) => `${toFa(v)}٪`}
                tick={{ fontSize: 10 }}
                reversed
              />
              <YAxis
                type="number"
                dataKey="risk"
                name="ریسک"
                tick={{ fontSize: 10 }}
                orientation="right"
                label={{ value: "تعداد ریسک", angle: 90, position: "insideRight", style: { fontSize: 10 } }}
              />
              <ZAxis type="number" dataKey="size" range={[50, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ fontSize: 11, direction: "rtl", borderRadius: 8 }}
                content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-card p-3 shadow-lg text-xs" dir="rtl">
                      <div className="font-bold mb-1">{p.name}</div>
                      <div>پیشرفت: {toFa(p.progress.toFixed(0))}٪</div>
                      <div>ریسک‌های باز: {toFa(p.risk)}</div>
                      <div>سلامت: {p.health === "HEALTHY" ? "سالم" : p.health === "WARNING" ? "هشدار" : "بحرانی"}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#d97706" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="size-4 text-amber-600" />
              جدول پروژه‌های فیلترشده ({toFa(projects.length)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10 border-b">
                <tr>
                  <th className="text-right p-2 font-medium">پروژه</th>
                  <th className="text-center p-2 font-medium">وضعیت</th>
                  <th className="text-left p-2 font-medium">پیمان</th>
                  <th className="text-left p-2 font-medium">اجرا</th>
                  <th className="text-center p-2 font-medium">پیشرفت</th>
                  <th className="text-center p-2 font-medium">ریسک</th>
                  <th className="text-center p-2 font-medium">تغییرات</th>
                  <th className="text-center p-2 font-medium">سلامت</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => selectProject(p.id, "overview")}
                  >
                    <td className="p-2">
                      <div className="font-medium truncate max-w-[150px]">{p.name}</div>
                      <div className="text-[9px] text-muted-foreground font-mono">{p.code}</div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-[9px]">
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-left tabular-nums">{faMoney(p.contractAmount)}</td>
                    <td className="p-2 text-left tabular-nums">{faMoney(p.executedAmount)}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[50px]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              p.progress >= 75 ? "bg-emerald-500" : p.progress >= 40 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${Math.min(p.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums">{toFa(p.progress.toFixed(0))}٪</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {p.openRisks > 0 ? (
                        <Badge className={cn(
                          "text-[9px]",
                          p.criticalRisks > 0 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                        )}>
                          {toFa(p.openRisks)}
                          {p.criticalRisks > 0 && ` (${toFa(p.criticalRisks)})`}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 text-center">
                      {p.pendingChanges > 0 ? (
                        <Badge variant="outline" className="text-[9px]">{toFa(p.pendingChanges)}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: HEALTH_COLORS[p.healthStatus as keyof typeof HEALTH_COLORS] }}
                        />
                        <span className="text-[10px] tabular-nums">{toFa(p.healthScore)}٪</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Building2; label: string; value: string; sub: string;
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
