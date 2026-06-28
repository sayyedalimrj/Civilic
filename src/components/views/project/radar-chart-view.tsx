"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Target, TrendingUp, AlertCircle, CheckCircle2, Activity, Download,
} from "lucide-react";
import { toFa } from "@/lib/fa";
import { exportToExcel } from "@/lib/export/export-utils";
import { cn } from "@/lib/utils";

interface RadarData {
  project: { id: string; name: string; code: string };
  radarData: Array<{ axis: string; value: number; fullMark: number }>;
  benchmark: Array<{ axis: string; value: number }>;
  overallScore: number;
  healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  recommendations: Array<{ axis: string; score: number; message: string; priority: "HIGH" | "MEDIUM" | "LOW" }>;
}

const HEALTH_META = {
  HEALTHY: { label: "سالم", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", icon: CheckCircle2, ring: "text-emerald-500" },
  WARNING: { label: "هشدار", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", icon: AlertCircle, ring: "text-amber-500" },
  CRITICAL: { label: "بحرانی", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300", icon: AlertCircle, ring: "text-rose-500" },
};

const PRIORITY_META = {
  HIGH: { label: "فوری", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300", dot: "bg-rose-500" },
  MEDIUM: { label: "متوسط", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", dot: "bg-amber-500" },
  LOW: { label: "کم", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export function RadarChartView({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery<RadarData>({
    queryKey: ["radar", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/radar`);
      return r.json();
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ترکیب داده‌های رادار و benchmark برای نمودار
  const chartData = data.radarData.map((d, i) => ({
    axis: d.axis,
    project: d.value,
    benchmark: data.benchmark[i]?.value || 0,
    fullMark: 100,
  }));

  const health = HEALTH_META[data.healthStatus];
  const HealthIcon = health.icon;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Target className="size-5 text-amber-600" />
            ارزیابی چندبعدی پروژه (Radar)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            ارزیابی پروژه در ۸ محور: پیشرفت، کیفیت، زمان‌بندی، مالی، ایمنی، مستندات، ریسک، رضایت
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => {
            exportToExcel(`radar-${data.project.code}`, [
              {
                name: "ارزیابی رادار",
                title: `سیوان تدبیر تجارت — ارزیابی رادار پروژه ${data.project.name}`,
                subtitle: `کد: ${data.project.code} — امتیاز کلی: ${data.overallScore}٪`,
                headers: ["محور", "امتیاز پروژه", "امتیاز میانگین سازمان"],
                rows: data.radarData.map((d, i) => [
                  d.axis, d.value, data.benchmark[i]?.value || 0,
                ]),
              },
              {
                name: "توصیه‌ها",
                title: "توصیه‌های هوشمند",
                headers: ["محور", "امتیاز", "اولویت", "توصیه"],
                rows: data.recommendations.map((r) => [
                  r.axis, r.score, r.priority, r.message,
                ]),
              },
            ]);
          }}
        >
          <Download className="size-4" />
          خروجی Excel
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className={cn(
        "border-0 shadow-sm bg-gradient-to-br",
        data.healthStatus === "HEALTHY"
          ? "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
          : data.healthStatus === "WARNING"
          ? "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
          : "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("size-12 rounded-full flex items-center justify-center", health.color)}>
                <HealthIcon className="size-6" />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">امتیاز کلی پروژه</div>
                <div className="text-2xl font-bold tabular-nums">{toFa(data.overallScore)}٪</div>
              </div>
            </div>
            <Badge className={cn("text-xs", health.color)}>
              {health.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="size-4 text-amber-600" />
              نمودار رادار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "currentColor" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="پروژه"
                  dataKey="project"
                  stroke="#d97706"
                  fill="#d97706"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Radar
                  name="میانگین سازمان"
                  dataKey="benchmark"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, direction: "rtl", borderRadius: 8 }}
                  formatter={(v: number) => `${toFa(v)}٪`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Axis Scores */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              امتیاز هر محور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.radarData.map((d) => {
              const benchmark = data.benchmark.find((b) => b.axis === d.axis)?.value || 0;
              const isAbove = d.value >= benchmark;
              return (
                <div key={d.axis} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{d.axis}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold tabular-nums",
                        d.value >= 75 ? "text-emerald-600" : d.value >= 50 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {toFa(d.value)}٪
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        (میانگین: {toFa(benchmark)}٪)
                      </span>
                      {isAbove ? (
                        <TrendingUp className="size-3 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-3 text-rose-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 h-1.5">
                    {/* Project bar */}
                    <div className="flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          d.value >= 75 ? "bg-emerald-500" : d.value >= 50 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${d.value}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              توصیه‌های هوشمند ({toFa(data.recommendations.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.recommendations.map((rec, idx) => {
                const meta = PRIORITY_META[rec.priority];
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-md border",
                      rec.priority === "HIGH"
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                        : rec.priority === "MEDIUM"
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    )}
                  >
                    <div className={cn("size-2 rounded-full mt-1.5 shrink-0", meta.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold">{rec.axis}</span>
                        <Badge className={cn("text-[8px] h-3.5", meta.color)}>
                          {meta.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums mr-auto">
                          {toFa(rec.score)}٪
                        </span>
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
