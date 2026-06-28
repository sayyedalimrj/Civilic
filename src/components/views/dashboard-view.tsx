"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UploadCloud, Plus, FolderTree, FileText, Clock, ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toFa, faMoney, toJalali } from "@/lib/fa";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const { setView, selectProject } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard");
      return r.json();
    },
  });

  const { stats, projectStats } = data || {};

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl">
      {/* Welcome + Primary Actions */}
      <div>
        <h1 className="text-2xl font-bold mb-1">سلام، سید علی 👋</h1>
        <p className="text-sm text-muted-foreground mb-6">
          برای شروع، یک فایل تکسا وارد کنید یا پروژه‌ای را باز کنید.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="h-12 gap-2 bg-amber-600 hover:bg-amber-700 text-base"
            onClick={() => setView("settings")}
          >
            <UploadCloud className="size-5" />
            وارد کردن فایل تکسا
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 gap-2 text-base"
            onClick={() => setView("projects")}
          >
            <FolderTree className="size-5" />
            مشاهده پروژه‌ها
          </Button>
        </div>
      </div>

      {/* KPI Cards — max 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <KPICard
              label="پروژه‌های فعال"
              value={toFa(stats?.activeProjects || 0)}
              sub={`از ${toFa(stats?.totalProjects || 0)} پروژه`}
            />
            <KPICard
              label="آخرین صورت‌وضعیت"
              value={toFa(stats?.totalPayments || 0)}
              sub="دوره ثبت‌شده"
            />
            <KPICard
              label="مبلغ کل پیمان"
              value={faMoney(stats?.totalContract || 0)}
              sub="ریال"
            />
            <KPICard
              label="نیازمند بررسی"
              value={toFa(0)}
              sub="صورت‌وضعیت در انتظار"
            />
          </>
        )}
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">آخرین پروژه‌ها</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setView("projects")}>
            همه پروژه‌ها
            <ArrowLeft className="size-3" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(projectStats || []).slice(0, 5).map((p: any) => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-right transition-colors hover:bg-muted/30"
              >
                <div className={cn(
                  "size-2 rounded-full shrink-0",
                  p.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.code} • {faMoney(p.contractAmount)}
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {p.status === "ACTIVE" ? "فعال" : "پیش‌نویس"}
                </Badge>
                <ArrowLeft className="size-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            {(!projectStats || projectStats.length === 0) && (
              <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                <FolderTree className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                هنوز پروژه‌ای ایجاد نشده
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next steps */}
      <div>
        <h2 className="text-sm font-bold mb-3">کارهای بعدی</h2>
        <div className="space-y-2">
          <NextStep
            icon={UploadCloud}
            title="وارد کردن فایل تکسا"
            desc="یک فایل .svzt تکسا را وارد کنید تا تمام داده‌ها بارگذاری شود"
            action="شروع"
            onClick={() => setView("settings")}
          />
          <NextStep
            icon={Plus}
            title="ایجاد پروژه دستی"
            desc="یک پروژه جدید از صفر بسازید (بدون فایل تکسا)"
            action="ایجاد"
            onClick={() => setView("projects")}
          />
          <NextStep
            icon={FileText}
            title="گزارش‌ها و خروجی"
            desc="گزارش‌های مالی، صورت‌وضعیت و خروجی Excel/PDF"
            action="مشاهده"
            onClick={() => setView("reports")}
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-lg font-bold tabular-nums mt-1">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

function NextStep({
  icon: Icon, title, desc, action, onClick,
}: {
  icon: typeof Clock; title: string; desc: string; action: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-right transition-colors hover:bg-muted/30"
    >
      <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 text-xs">{action}</Button>
    </button>
  );
}
