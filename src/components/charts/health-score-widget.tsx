"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Shield, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Activity, Clock, DollarSign, FileText, Users,
} from "lucide-react";
import { toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";

interface HealthData {
  radarData: Array<{ axis: string; value: number; fullMark: number }>;
  overallScore: number;
  healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  recommendations: Array<{ axis: string; score: number; message: string; priority: "HIGH" | "MEDIUM" | "LOW" }>;
}

const HEALTH_META = {
  HEALTHY: {
    label: "سالم",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    ring: "stroke-emerald-500",
    bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    text: "text-emerald-600",
    icon: CheckCircle2,
  },
  WARNING: {
    label: "هشدار",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    ring: "stroke-amber-500",
    bg: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    text: "text-amber-600",
    icon: AlertCircle,
  },
  CRITICAL: {
    label: "بحرانی",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    ring: "stroke-rose-500",
    bg: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30",
    text: "text-rose-600",
    icon: AlertCircle,
  },
};

const AXIS_ICONS: Record<string, typeof Activity> = {
  "پیشرفت": TrendingUp,
  "کیفیت": CheckCircle2,
  "زمان‌بندی": Clock,
  "مالی": DollarSign,
  "ایمنی": Shield,
  "مستندات": FileText,
  "مدیریت ریسک": Shield,
  "رضایت": Users,
};

export function HealthScoreWidget({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery<HealthData>({
    queryKey: ["radar", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/radar`);
      return r.json();
    },
    enabled: !!projectId,
  });

  if (isLoading || !data) {
    return null;
  }

  const health = HEALTH_META[data.healthStatus];
  const HealthIcon = health.icon;
  const score = data.overallScore;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card className={cn("border-0 shadow-sm bg-gradient-to-br", health.bg)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="size-4 text-amber-600" />
            امتیاز سلامت پروژه
          </span>
          <Badge className={cn("text-[10px]", health.color)}>
            <HealthIcon className="size-3 ml-1" />
            {health.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Circular Score */}
          <div className="relative shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 50 50)"
                className={cn("transition-all duration-1000", health.ring)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold tabular-nums", health.text)}>
                {toFa(score)}
              </span>
              <span className="text-[9px] text-muted-foreground">از ۱۰۰</span>
            </div>
          </div>

          {/* Axis breakdown */}
          <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {data.radarData.slice(0, 6).map((d) => {
              const Icon = AXIS_ICONS[d.axis] || Activity;
              const colorClass =
                d.value >= 75 ? "text-emerald-600" :
                d.value >= 50 ? "text-amber-600" : "text-rose-600";
              return (
                <div key={d.axis} className="flex items-center gap-1.5">
                  <Icon className={cn("size-3 shrink-0", colorClass)} />
                  <span className="text-[10px] text-muted-foreground truncate flex-1">{d.axis}</span>
                  <span className={cn("text-[10px] font-bold tabular-nums", colorClass)}>
                    {toFa(d.value)}٪
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top recommendation */}
        {data.recommendations.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex items-start gap-2">
              <AlertCircle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground">نیازمند توجه فوری:</div>
                <div className="text-[11px] font-medium">
                  {data.recommendations[0].axis} — {toFa(data.recommendations[0].score)}٪
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
