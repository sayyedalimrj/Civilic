"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Wallet, AlertTriangle, GitPullRequest, Users, FileText,
  Shield, Building2, Activity, Star, DollarSign, Calendar,
} from "lucide-react";
import { faMoney, toFa, faPct } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface OrgKPI {
  kpis: {
    totalProjects: number;
    activeProjects: number;
    totalContract: number;
    totalExecuted: number;
    totalNetPaid: number;
    totalDeductions: number;
    overallProgress: number;
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    totalRiskCost: number;
    totalChanges: number;
    pendingChanges: number;
    approvedChanges: number;
    totalCostImpact: number;
    totalScheduleImpact: number;
    unreadAlerts: number;
    criticalAlerts: number;
    totalSuppliers: number;
    activeSuppliers: number;
    avgSupplierRating: number;
    totalSupplierValue: number;
    totalDocuments: number;
    totalComments: number;
    totalBoqItems: number;
  };
  monthlyTrend: Array<{ month: string; executed: number; contract: number }>;
  projectBreakdown: Array<{
    name: string; code: string; contract: number; executed: number;
    progress: number; riskCount: number; changeCount: number;
  }>;
}

export function OrgKPIDashboard() {
  const { selectProject } = useAppStore();
  const { data, isLoading } = useQuery<OrgKPI>({
    queryKey: ["org-kpi"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/org-kpi");
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
  const k = data.kpis;

  // داده‌های radial chart برای پیشرفت کلی
  const radialData = [
    { name: "پیشرفت", value: k.overallProgress, fill: "#d97706" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-600 via-orange-500 to-amber-700 p-6 text-white shadow-lg">
        <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -right-8 size-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="size-7" />
            داشبورد KPI سازمانی
          </h1>
          <p className="mt-2 text-sm text-amber-100">
            سیوان تدبیر تجارت — نمای جامع عملکرد تمام پروژه‌ها
          </p>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard icon={Building2} label="پروژه‌ها" value={toFa(k.totalProjects)} sub={`${toFa(k.activeProjects)} فعال`} color="amber" />
        <KPICard icon={Wallet} label="مبلغ پیمان" value={faMoney(k.totalContract)} sub="کل قراردادها" color="orange" />
        <KPICard icon={TrendingUp} label="اجرا شده" value={faMoney(k.totalExecuted)} sub={`${toFa(k.overallProgress.toFixed(1))}٪ پیشرفت`} color="emerald" />
        <KPICard icon={DollarSign} label="خالص پرداخت" value={faMoney(k.totalNetPaid)} sub={`کسورات: ${faMoney(k.totalDeductions)}`} color="slate" />
        <KPICard icon={AlertTriangle} label="هشدارها" value={toFa(k.unreadAlerts)} sub={`${toFa(k.criticalAlerts)} بحرانی`} color={k.criticalAlerts > 0 ? "rose" : "slate"} />
        <KPICard icon={Shield} label="ریسک‌ها" value={toFa(k.totalRisks)} sub={`${toFa(k.criticalRisks + k.highRisks)} بحرانی/بالا`} color={k.criticalRisks > 0 ? "rose" : "slate"} />
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard icon={GitPullRequest} label="تغییرات" value={toFa(k.totalChanges)} sub={`${toFa(k.pendingChanges)} در انتظار`} color="amber" />
        <KPICard icon={DollarSign} label="تأثیر مالی تغییرات" value={faMoney(k.totalCostImpact)} sub={`زمانی: ${toFa(k.totalScheduleImpact)} روز`} color="orange" />
        <KPICard icon={Users} label="تأمین‌کنندگان" value={toFa(k.totalSuppliers)} sub={`${toFa(k.activeSuppliers)} فعال`} color="emerald" />
        <KPICard icon={Star} label="میانگین امتیاز" value={toFa(k.avgSupplierRating.toFixed(1))} sub="از ۵" color="slate" />
        <KPICard icon={FileText} label="مستندات" value={toFa(k.totalDocuments)} sub="فایل آپلودشده" color="amber" />
        <KPICard icon={Activity} label="آیتم‌های ریزمتره" value={toFa(k.totalBoqItems)} sub={`${toFa(k.totalComments)} کامنت`} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall Progress Radial */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="size-4 text-amber-600" />
              پیشرفت کلی سازمان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} fill="#d97706" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-32 mb-12">
              <div className="text-3xl font-bold text-amber-600 tabular-nums">
                {toFa(k.overallProgress.toFixed(0))}٪
              </div>
              <div className="text-[10px] text-muted-foreground">پیشرفت کلی</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">اجرا شده</div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{faMoney(k.totalExecuted)}</div>
              </div>
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">مانده</div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300">{faMoney(k.totalContract - k.totalExecuted)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              روند ۶ ماهه‌ی اجرا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} reversed />
                <YAxis tickFormatter={(v) => faMoney(v)} tick={{ fontSize: 10 }} orientation="right" width={70} />
                <Tooltip
                  contentStyle={{ fontSize: 11, direction: "rtl" }}
                  formatter={(v: number) => faMoney(v)}
                />
                <Area type="monotone" dataKey="executed" name="اجرا شده" stroke="#16a34a" fill="url(#execGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="size-4 text-amber-600" />
            تجزیه‌ی پروژه‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10 border-b">
                <tr>
                  <th className="text-right p-3 font-medium">پروژه</th>
                  <th className="text-left p-3 font-medium">مبلغ پیمان</th>
                  <th className="text-left p-3 font-medium">اجرا شده</th>
                  <th className="text-center p-3 font-medium">پیشرفت</th>
                  <th className="text-center p-3 font-medium">ریسک</th>
                  <th className="text-center p-3 font-medium">تغییرات</th>
                </tr>
              </thead>
              <tbody>
                {data.projectBreakdown.map((p) => (
                  <tr
                    key={p.code}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => selectProject(p.code, "overview")}
                  >
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{p.code}</div>
                    </td>
                    <td className="p-3 text-left tabular-nums">{faMoney(p.contract)}</td>
                    <td className="p-3 text-left tabular-nums">{faMoney(p.executed)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
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
                    <td className="p-3 text-center">
                      {p.riskCount > 0 ? (
                        <Badge className={cn("text-[10px]", p.riskCount > 2 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")}>
                          {toFa(p.riskCount)}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      {p.changeCount > 0 ? (
                        <Badge variant="outline" className="text-[10px]">{toFa(p.changeCount)}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk & Change Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-5 text-rose-600" />
              <span className="text-sm font-bold">وضعیت ریسک</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-md bg-rose-100 dark:bg-rose-950/40">
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300">{toFa(k.criticalRisks)}</div>
                <div className="text-[9px] text-muted-foreground">بحرانی</div>
              </div>
              <div className="text-center p-2 rounded-md bg-orange-100 dark:bg-orange-950/40">
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{toFa(k.highRisks)}</div>
                <div className="text-[9px] text-muted-foreground">بالا</div>
              </div>
              <div className="text-center p-2 rounded-md bg-slate-100 dark:bg-slate-900/40">
                <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{toFa(k.totalRisks)}</div>
                <div className="text-[9px] text-muted-foreground">کل</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              هزینه‌ی تخمینی کل ریسک‌ها: <span className="font-bold text-rose-600">{faMoney(k.totalRiskCost)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitPullRequest className="size-5 text-amber-600" />
              <span className="text-sm font-bold">وضعیت تغییرات</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-md bg-amber-100 dark:bg-amber-950/40">
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{toFa(k.pendingChanges)}</div>
                <div className="text-[9px] text-muted-foreground">در انتظار</div>
              </div>
              <div className="text-center p-2 rounded-md bg-emerald-100 dark:bg-emerald-950/40">
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{toFa(k.approvedChanges)}</div>
                <div className="text-[9px] text-muted-foreground">تأیید/اجرا</div>
              </div>
              <div className="text-center p-2 rounded-md bg-slate-100 dark:bg-slate-900/40">
                <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{toFa(k.totalChanges)}</div>
                <div className="text-[9px] text-muted-foreground">کل</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              تأثیر مالی: <span className="font-bold text-rose-600">{faMoney(k.totalCostImpact)}</span>
              {" • "}
              تأثیر زمانی: <span className="font-bold text-rose-600">{toFa(k.totalScheduleImpact)} روز</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof TrendingUp; label: string; value: string; sub: string;
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
