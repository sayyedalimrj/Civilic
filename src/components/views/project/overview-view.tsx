"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Wallet, TrendingUp, Calendar, MapPin, Hash, FileText,
  Layers, Users, HardHat, Activity, ArrowLeft, Clock,
  Heart, AlertTriangle, CheckCircle2, XCircle, Zap,
  ShieldCheck, BarChart3, CreditCard, ClipboardCheck,
  FileSpreadsheet, Calculator, FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAppStore, type ProjectTab } from "@/lib/store";
import { faMoney, faNum, faPct, faRial, toFa, toJalali, progressColor, initials } from "@/lib/fa";
import { combinedCoefficient, projectProgress, type Coefficients } from "@/lib/calc/cascade";
import { SCurveChart } from "@/components/charts/s-curve-chart";
import { HealthScoreWidget } from "@/components/charts/health-score-widget";

export function OverviewView() {
  const { selectedProjectId, setProjectTab } = useAppStore();

  const { data } = useQuery<{ project: any }>({
    queryKey: ["project", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  if (!data?.project) {
    return (
      <div className="p-6">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const p = data.project;
  const coeffs: Coefficients = JSON.parse(p.coefficients || "{}");
  const combined = combinedCoefficient(coeffs);
  const progress = projectProgress(p.cachedExecuted, p.cachedTotal || p.contractAmount);
  const remaining = (p.cachedTotal || p.contractAmount) - p.cachedExecuted;
  const assignedUserIds: string[] = JSON.parse(p.assignedUserIds || "[]");

  // Health checks
  const healthChecks = [
    {
      label: "ضرایب تنظیم شده",
      ok: !!(coeffs.general && coeffs.regional && coeffs.altitude && coeffs.floors),
      detail: coeffs.general ? "فعال" : "تنظیم نشده",
    },
    {
      label: "ریزمتره وارد شده",
      ok: (p.detailBoqs?.length || 0) > 0,
      detail: `${toFa(p.detailBoqs?.length || 0)} ردیف`,
    },
    {
      label: "برگه مالی محاسبه شده",
      ok: (p.financialSheet?.length || 0) > 0,
      detail: `${toFa(p.financialSheet?.length || 0)} ردیف`,
    },
    {
      label: "فصول توزیع شده",
      ok: (p.chapters?.length || 0) > 0,
      detail: `${toFa(p.chapters?.length || 0)} فصل`,
    },
    {
      label: "صورت‌وضعیت ثبت شده",
      ok: (p.payments?.length || 0) > 0,
      detail: `${toFa(p.payments?.length || 0)} دوره`,
    },
    {
      label: "فهرست بها متصل",
      ok: !!p.priceListId,
      detail: p.priceListId ? "متصل" : "متصل نشده",
    },
  ];

  const healthScore = healthChecks.filter((h) => h.ok).length;
  const healthPct = (healthScore / healthChecks.length) * 100;

  // Warnings
  const warnings: string[] = [];
  if (!coeffs.general) warnings.push("ضریب عمومی تنظیم نشده");
  if (!coeffs.regional) warnings.push("ضریب منطقه‌ای تنظیم نشده");
  if (!coeffs.altitude) warnings.push("ضریب ارتفاع تنظیم نشده");
  if (!coeffs.floors) warnings.push("ضریب طبقات تنظیم نشده");
  if (!p.priceListId) warnings.push("فهرست بها به پروژه متصل نشده");
  if (p.cachedTotal === 0 && (p.detailBoqs?.length || 0) > 0) warnings.push("برگه مالی بازمحاسبه نشده");

  // Recent activity (mock based on project data)
  const recentActivity = [
    ...(p.payments?.slice(-2).map((pay: any) => ({
      icon: CreditCard,
      text: `صورت‌وضعیت دوره ${toFa(pay.periodNo)} ثبت شد`,
      time: toJalali(pay.createdAt),
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40",
    })) || []),
    ...(p.detailBoqs?.length > 0 ? [{
      icon: ClipboardCheck,
      text: `${toFa(p.detailBoqs.length)} ردیف ریزمتره وارد شد`,
      time: toJalali(p.updatedAt),
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40",
    }] : []),
    ...(p.chapters?.length > 0 ? [{
      icon: BarChart3,
      text: `توزیع ${toFa(p.chapters.length)} فصل محاسبه شد`,
      time: toJalali(p.updatedAt),
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40",
    }] : []),
    {
      icon: FileText,
      text: `پروژه ${p.status === "ACTIVE" ? "فعال" : "ایجاد"} شد`,
      time: toJalali(p.createdAt),
      color: "text-slate-600 bg-slate-100 dark:bg-slate-800/40",
    },
  ].slice(0, 5);

  // Upcoming deadlines (mock)
  const upcomingDeadlines = [
    { label: "مهلت ارسال صورت‌وضعیت", days: 12, urgent: false },
    { label: "بازنگری پیمان", days: 28, urgent: false },
    { label: "سررسید تضمین", days: 5, urgent: true },
  ];

  // Module quick access with icons
  const modules = [
    { tab: "detail-boq" as ProjectTab, label: "ریزمتره", desc: "ورود احجام و مقادیر", step: 1, icon: ClipboardCheck },
    { tab: "financial-sheet" as ProjectTab, label: "برگه مالی", desc: "قیمت‌گذاری و آنالیز", step: 2, icon: FileSpreadsheet },
    { tab: "chapters" as ProjectTab, label: "فصول", desc: "توزیع مبالغ", step: 3, icon: BarChart3 },
    { tab: "payments" as ProjectTab, label: "صورت‌وضعیت", desc: "ثبت اجرا و کسورات", step: 4, icon: CreditCard },
    { tab: "adjustment" as ProjectTab, label: "تعدیل", desc: "اعمال شاخص و مصالح", step: 5, icon: Calculator },
    { tab: "export" as ProjectTab, label: "گزارشات", desc: "خروجی PDF/XML/CSV", step: 6, icon: FileDown },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* هدر پروژه */}
      <Card className="overflow-hidden border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50 dark:border-amber-900 dark:from-amber-950/40 dark:to-orange-950/40">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-primary-foreground shadow-md">
                <HardHat className="size-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{p.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>کد: {toFa(p.code)}</span>
                  <span>•</span>
                  <span>{p.location}</span>
                  <span>•</span>
                  <span>سال {toFa(p.year)}</span>
                </div>
                {p.description && (
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{p.description}</p>
                )}
              </div>
            </div>
            <Badge
              variant={p.status === "ACTIVE" ? "default" : "secondary"}
              className="shrink-0"
            >
              {p.status === "ACTIVE" ? "فعال" : p.status === "CLOSED" ? "مختومه" : "پیش‌نویس"}
            </Badge>
          </div>

          {/* Circular progress */}
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <CircularProgressRing percentage={progress} size={90} strokeWidth={8} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">پیشرفت کلی پروژه</span>
                <span className="font-bold text-amber-600">{faPct(progress)}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor(progress)}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>اجرا شده: {faMoney(p.cachedExecuted)}</span>
                <span>کل: {faMoney(p.cachedTotal || p.contractAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          icon={Wallet}
          label="مبلغ پیمان"
          value={faMoney(p.contractAmount)}
          sub={faRial(p.contractAmount)}
          gradient="from-amber-500 to-orange-600"
        />
        <FinancialCard
          icon={TrendingUp}
          label="محاسبه‌شده (برگه مالی)"
          value={faMoney(p.cachedTotal)}
          sub={faRial(p.cachedTotal)}
          gradient="from-emerald-500 to-teal-600"
        />
        <FinancialCard
          icon={Activity}
          label="اجرا شده"
          value={faMoney(p.cachedExecuted)}
          sub={faRial(p.cachedExecuted)}
          gradient="from-orange-500 to-rose-600"
        />
        <FinancialCard
          icon={CreditCard}
          label="مانده"
          value={faMoney(remaining)}
          sub={faRial(remaining)}
          gradient="from-slate-500 to-slate-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* اطلاعات پروژه */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">اطلاعات پروژه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Hash, label: "کد پروژه", value: toFa(p.code) },
                { icon: FileText, label: "کد مدرک", value: toFa(p.documentCode || "—") },
                { icon: Calendar, label: "سال", value: toFa(p.year) },
                { icon: MapPin, label: "موقعیت", value: p.location || "—" },
                { icon: Calendar, label: "تاریخ پیمان", value: toJalali(p.contractDate) },
                { icon: Layers, label: "ردیف ریزمتره", value: faNum(p.detailBoqs?.length || 0) },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">{item.label}</div>
                    <div className="text-sm font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ضرایب پروژه */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">ضرایب پروژه</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setProjectTab("overview")} className="gap-1 text-xs">
              ویرایش <ArrowLeft className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <CoeffRow label="ضریب عمومی" value={coeffs.general} />
            <CoeffRow label="ضریب منطقه‌ای" value={coeffs.regional} />
            <CoeffRow label="ضریب ارتفاع" value={coeffs.altitude} />
            <CoeffRow label="ضریب طبقات" value={coeffs.floors} />
            {coeffs.tunnelHardship > 1 && (
              <CoeffRow label="سختی تونل" value={coeffs.tunnelHardship} highlight />
            )}
            <Separator />
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
              <span className="text-sm font-medium">ضریب ترکیبی</span>
              <span className="text-lg font-bold text-amber-600">{toFa(combined.toFixed(4))}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Check + Warnings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="size-4 text-rose-500" />
              سلامت پروژه
            </CardTitle>
            <CardDescription>بررسی وضعیت تکمیل اطلاعات پروژه</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>امتیاز سلامت</span>
                  <span className="font-bold">{faPct(healthPct)}</span>
                </div>
                <Progress value={healthPct} className={`h-2 ${healthPct >= 80 ? "[&>div]:bg-emerald-500" : healthPct >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-rose-500"}`} />
              </div>
            </div>
            <div className="space-y-2">
              {healthChecks.map((check, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div className="flex items-center gap-2">
                    {check.ok ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <XCircle className="size-4 text-rose-400" />
                    )}
                    <span className="text-sm">{check.label}</span>
                  </div>
                  <Badge variant={check.ok ? "outline" : "secondary"} className={`text-[10px] ${check.ok ? "text-emerald-600" : "text-rose-500"}`}>
                    {check.detail}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                <AlertTriangle className="size-4" />
                هشدارها
              </CardTitle>
              <CardDescription>{toFa(warnings.length)} مورد نیاز توجه</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-100/50 p-3 dark:bg-amber-900/20">
                  <Zap className="size-4 shrink-0 text-amber-500" />
                  <span className="text-sm">{w}</span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setProjectTab("overview")}
              >
                رفع هشدارها
              </Button>
            </CardContent>
          </Card>
        )}

        {/* If no warnings, show Upcoming Deadlines */}
        {warnings.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-amber-600" />
                مهلت‌های پیش‌رو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.map((dl, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`size-4 ${dl.urgent ? "text-rose-500" : "text-muted-foreground"}`} />
                    <span className="text-sm">{dl.label}</span>
                  </div>
                  <Badge
                    variant={dl.urgent ? "destructive" : "outline"}
                    className="text-[10px]"
                  >
                    {toFa(dl.days)} روز مانده
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity + Team */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-amber-600" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${act.color}`}>
                    <act.icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{act.text}</p>
                    <p className="text-[11px] text-muted-foreground">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-amber-600" />
              تیم پروژه
            </CardTitle>
            <CardDescription>
              {toFa(assignedUserIds.length)} کاربر اختصاص‌یافته
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedUserIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users className="size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">هنوز کاربری اختصاص نیافته</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedUserIds.map((uid: string, i: number) => (
                  <div key={uid} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                      {toFa(i + 1)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">کاربر {toFa(i + 1)}</p>
                      <p className="text-[11px] text-muted-foreground">برآوردکار</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">فعال</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* S-Curve Progress Chart + Health Score */}
      {selectedProjectId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SCurveChart projectId={selectedProjectId} height={280} showChapterDistribution={false} />
          </div>
          <HealthScoreWidget projectId={selectedProjectId} />
        </div>
      )}

      {/* Quick Access Modules */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-amber-600" />
            دسترسی سریع به ماژول‌ها
          </CardTitle>
          <CardDescription>ورک‌فلو زنجیره‌ای پروژه — تغییر در هر مرحله در مراحل بعدی بازتاب می‌یابد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <QuickAccess key={mod.tab} {...mod} onClick={() => setProjectTab(mod.tab)} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Circular Progress Ring ── */
function CircularProgressRing({
  percentage,
  size = 90,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, percentage) / 100) * circumference;
  const color =
    percentage >= 85 ? "#10b981" : percentage >= 50 ? "#f59e0b" : percentage >= 25 ? "#f97316" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{faPct(percentage)}</span>
        <span className="text-[9px] text-muted-foreground">پیشرفت</span>
      </div>
    </div>
  );
}

/* ── Financial Mini Card ── */
function FinancialCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub: string;
  gradient: string;
}) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground tabular-nums">{sub}</p>
          </div>
          <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Coefficient Row ── */
function CoeffRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${highlight ? "text-amber-600" : ""}`}>
        {value ? toFa(value.toFixed(4)) : "—"}
      </span>
    </div>
  );
}

/* ── Quick Access Module Card ── */
function QuickAccess({
  label,
  desc,
  step,
  icon: Icon,
  onClick,
}: {
  tab: ProjectTab;
  label: string;
  desc: string;
  step: number;
  icon: typeof ClipboardCheck;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border p-4 text-right transition-all hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
        <Icon className="size-5 text-amber-700 dark:text-amber-300" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-700 dark:bg-amber-800 dark:text-amber-200">
            {toFa(step)}
          </span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
    </button>
  );
}
