"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Activity, Users, Clock, TrendingUp, Flame, Download,
} from "lucide-react";
import { toFa, toJalali } from "@/lib/fa";
import { exportToExcel } from "@/lib/export/export-utils";
import { cn } from "@/lib/utils";

interface ActivityData {
  heatmap: number[][];
  users: Array<{ id: string; name: string; count: number; lastActive: string }>;
  summary: {
    totalActivities: number;
    peakHour: number;
    peakDay: number;
    peakDayName: string;
    activeUsers: number;
    avgPerUser: number;
  };
  weekdays: string[];
  hourlyActivity: number[];
  dailyActivity: Array<{ day: string; count: number }>;
}

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

// رنگ‌بندی heat map بر اساس شدت
function getHeatColor(value: number, max: number): string {
  if (value === 0) return "bg-muted/30";
  const ratio = value / max;
  if (ratio < 0.1) return "bg-amber-100 dark:bg-amber-950/30";
  if (ratio < 0.25) return "bg-amber-200 dark:bg-amber-900/40";
  if (ratio < 0.5) return "bg-amber-300 dark:bg-amber-800/50";
  if (ratio < 0.75) return "bg-amber-400 dark:bg-amber-700/60";
  return "bg-amber-500 dark:bg-amber-600";
}

export function ActivityHeatmap() {
  const { data, isLoading } = useQuery<ActivityData>({
    queryKey: ["activity-heatmap"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/activity");
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

  const maxCell = Math.max(...data.heatmap.flat());

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Flame className="size-6 text-amber-600" />
            نقشه‌ی حرارتی فعالیت کاربران
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            تحلیل الگوی فعالیت سازمان بر اساس روز هفته و ساعت روز
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => {
            if (!data) return;
            exportToExcel(`activity-report-${new Date().toISOString().split("T")[0]}`, [
              {
                name: "کاربران",
                title: "سیوان تدبیر تجارت — گزارش فعالیت کاربران",
                subtitle: `تاریخ تولید: ${new Date().toLocaleDateString("fa-IR")}`,
                headers: ["رتبه", "نام کاربر", "تعداد فعالیت", "آخرین فعالیت"],
                rows: data.users.map((u, i) => [i + 1, u.name, u.count, toJalali(u.lastActive)]),
                totals: [{ label: "جمع", col: 2, formula: `SUM(C5:C${4 + data.users.length})` }],
              },
            ]);
          }}
        >
          <Download className="size-4" />
          خروجی Excel
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={Activity}
          label="کل فعالیت‌ها"
          value={toFa(data.summary.totalActivities)}
          sub="در تمام ماژول‌ها"
          color="amber"
        />
        <KPICard
          icon={Users}
          label="کاربران فعال"
          value={toFa(data.summary.activeUsers)}
          sub={`میانگین ${toFa(Math.round(data.summary.avgPerUser))} فعالیت/کاربر`}
          color="emerald"
        />
        <KPICard
          icon={Clock}
          label="ساعت اوج"
          value={`${toFa(data.summary.peakHour)}:۰۰`}
          sub="پر فعالیت‌ترین ساعت"
          color="orange"
        />
        <KPICard
          icon={TrendingUp}
          label="روز اوج"
          value={data.summary.peakDayName}
          sub="پر فعالیت‌ترین روز"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="size-4 text-amber-600" />
              ماتریس فعالیت (روز × ساعت)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Hour labels (top) */}
                <div className="flex">
                  <div className="w-16 shrink-0" />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground min-w-[20px]">
                      {h % 3 === 0 ? toFa(h) : ""}
                    </div>
                  ))}
                </div>
                {/* Heatmap rows */}
                {data.heatmap.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex items-center">
                    <div className="w-16 shrink-0 text-[10px] font-medium text-muted-foreground pl-1">
                      {WEEKDAYS[dayIdx]}
                    </div>
                    {row.map((value, hour) => (
                      <div
                        key={hour}
                        className={cn(
                          "flex-1 min-w-[20px] h-6 m-0.5 rounded-sm flex items-center justify-center text-[8px] font-bold transition-all hover:ring-2 hover:ring-amber-400 cursor-default",
                          getHeatColor(value, maxCell),
                          value > 0 && value >= maxCell * 0.5 && "text-white"
                        )}
                        title={`${WEEKDAYS[dayIdx]} ${toFa(hour)}:۰۰ — ${toFa(value)} فعالیت`}
                      >
                        {value > 0 && value >= maxCell * 0.25 ? toFa(value) : ""}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-3 text-[9px] text-muted-foreground">
                  <span>کمتر</span>
                  <div className="size-3 rounded-sm bg-muted/30" />
                  <div className="size-3 rounded-sm bg-amber-100 dark:bg-amber-950/30" />
                  <div className="size-3 rounded-sm bg-amber-200 dark:bg-amber-900/40" />
                  <div className="size-3 rounded-sm bg-amber-300 dark:bg-amber-800/50" />
                  <div className="size-3 rounded-sm bg-amber-400 dark:bg-amber-700/60" />
                  <div className="size-3 rounded-sm bg-amber-500 dark:bg-amber-600" />
                  <span>بیشتر</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Leaderboard */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="size-4 text-amber-600" />
              رتبه‌بندی کاربران
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {data.users.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  فعالیتی ثبت نشده
                </div>
              ) : (
                data.users.map((user, idx) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn(
                      "size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      idx === 0 ? "bg-amber-400 text-white" :
                      idx === 1 ? "bg-slate-300 text-slate-800" :
                      idx === 2 ? "bg-orange-300 text-orange-800" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {toFa(idx + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{user.name}</div>
                      <div className="text-[9px] text-muted-foreground">
                        آخرین فعالیت: {toJalali(user.lastActive)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] tabular-nums">
                      {toFa(user.count)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4 text-cyan-600" />
              فعالیت بر اساس ساعت روز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-48">
              {data.hourlyActivity.map((count, hour) => {
                const maxHour = Math.max(...data.hourlyActivity);
                const height = maxHour > 0 ? (count / maxHour) * 100 : 0;
                return (
                  <div
                    key={hour}
                    className="flex-1 group relative"
                    title={`${toFa(hour)}:۰۰ — ${toFa(count)} فعالیت`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t transition-all hover:opacity-80",
                        hour === data.summary.peakHour ? "bg-amber-500" : "bg-amber-300 dark:bg-amber-700/50"
                      )}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {hour % 3 === 0 && (
                      <div className="text-[8px] text-muted-foreground text-center mt-1">
                        {toFa(hour)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              فعالیت بر اساس روز هفته
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.dailyActivity.map((day) => {
                const maxDay = Math.max(...data.dailyActivity.map((d) => d.count));
                const width = maxDay > 0 ? (day.count / maxDay) * 100 : 0;
                return (
                  <div key={day.day} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{day.day}</span>
                      <span className="text-muted-foreground tabular-nums">{toFa(day.count)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          day.day === data.summary.peakDayName ? "bg-amber-500" : "bg-emerald-400 dark:bg-emerald-700/50"
                        )}
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
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
        <div className="text-base font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}
