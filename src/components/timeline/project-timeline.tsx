"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Flag,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardHat,
  FileText,
  GanttChart,
} from "lucide-react";
import { toFa, toJalali, faMoney } from "@/lib/fa";
import { cn } from "@/lib/utils";

interface TimelineData {
  project: {
    id: string;
    name: string;
    code: string;
    createdAt: string;
    contractAmount: number;
  };
  phases: Array<{
    id: string;
    title: string;
    type: string;
    start: string;
    end: string;
    progress: number;
    amount: number;
    chapterNo: number;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    type: string;
    date: string | null;
    status: string;
    amount: number;
    periodNo: number;
    dueDate: string | null;
  }>;
  upcomingMilestones: Array<{
    id: string;
    title: string;
    type: string;
    date: string | null;
    severity: string;
    isResolved: boolean;
    message: string;
  }>;
  timelineStart: string;
  timelineEnd: string;
  summary: {
    totalPhases: number;
    completedPhases: number;
    totalMilestones: number;
    finalizedMilestones: number;
    upcomingAlerts: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  SUBMITTED: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  CONSULTANT_APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  FINALIZED: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  SUBMITTED: "ارسال‌شده",
  CONSULTANT_APPROVED: "تأیید مشاور",
  FINALIZED: "قطعی",
  REJECTED: "رد شده",
};

const PHASE_COLORS = [
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-orange-500",
  "from-purple-400 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-yellow-400 to-amber-500",
  "from-pink-400 to-rose-500",
];

export function ProjectTimeline({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery<TimelineData>({
    queryKey: ["timeline", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/timeline`);
      return r.json();
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const start = new Date(data.timelineStart);
  const end = new Date(data.timelineEnd);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000);

  const dayToPercent = (date: Date) => {
    const days = (date.getTime() - start.getTime()) / 86400000;
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <GanttChart className="size-5 text-amber-600" />
            تایم‌لاین و گانت پروژه
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            نمای کلی فازها، صورت‌وضعیت‌ها و milestone‌های پروژه
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard
          icon={HardHat}
          label="کل فازها"
          value={toFa(data.summary.totalPhases)}
          color="amber"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="فازهای تکمیل‌شده"
          value={toFa(data.summary.completedPhases)}
          color="emerald"
        />
        <SummaryCard
          icon={FileText}
          label="کل صورت‌وضعیت‌ها"
          value={toFa(data.summary.totalMilestones)}
          color="slate"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="قطعی‌شده"
          value={toFa(data.summary.finalizedMilestones)}
          color="emerald"
        />
        <SummaryCard
          icon={AlertCircle}
          label="هشدارهای آینده"
          value={toFa(data.summary.upcomingAlerts)}
          color={data.summary.upcomingAlerts > 0 ? "rose" : "slate"}
        />
      </div>

      {/* Gantt Chart — Phases */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HardHat className="size-4 text-amber-600" />
            فازهای پروژه (گانت)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Time axis */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2 pb-1 border-b">
              <span>{toJalali(start)}</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>{toJalali(end)}</span>
            </div>

            {data.phases.map((phase, idx) => {
              const phaseStart = new Date(phase.start);
              const phaseEnd = new Date(phase.end);
              const leftPercent = dayToPercent(phaseStart);
              const widthPercent = Math.max(
                5,
                dayToPercent(phaseEnd) - leftPercent
              );
              const color = PHASE_COLORS[idx % PHASE_COLORS.length];

              return (
                <div key={phase.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full bg-gradient-to-br",
                          color
                        )}
                      />
                      {phase.title}
                      {phase.type === "WORKSHOP" && (
                        <Badge variant="outline" className="text-[9px] h-4">
                          تجهیز کارگاه
                        </Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {toFa(phase.progress.toFixed(0))}٪ • {faMoney(phase.amount)}
                    </span>
                  </div>
                  <div className="relative h-7 rounded-md bg-muted/30 border">
                    {/* Phase bar */}
                    <div
                      className={cn(
                        "absolute h-full rounded-md bg-gradient-to-l flex items-center justify-center text-[9px] text-white font-bold shadow-sm",
                        color
                      )}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      {widthPercent > 15 && `${toFa(phase.progress.toFixed(0))}٪`}
                    </div>
                    {/* Progress overlay */}
                    {phase.progress > 0 && phase.progress < 100 && (
                      <div
                        className="absolute top-0 bottom-0 bg-black/20 rounded-md"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${(widthPercent * phase.progress) / 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
                    <span>شروع: {toJalali(phaseStart)}</span>
                    <span>پایان: {toJalali(phaseEnd)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Milestones — Payment events */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="size-4 text-orange-600" />
            Milestone‌های صورت‌وضعیت
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.milestones.length ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <Flag className="size-8 mx-auto mb-2 text-orange-300" />
              صورت‌وضعیت‌ای ثبت نشده
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-1">
                {data.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 p-2 rounded-md border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="mt-0.5">
                      <div
                        className={cn(
                          "size-8 rounded-full flex items-center justify-center text-white",
                          m.status === "FINALIZED"
                            ? "bg-emerald-500"
                            : m.status === "CONSULTANT_APPROVED"
                            ? "bg-emerald-400"
                            : m.status === "SUBMITTED"
                            ? "bg-orange-500"
                            : m.status === "REJECTED"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        )}
                      >
                        <FileText className="size-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{m.title}</span>
                        <Badge
                          className={cn("text-[9px] h-4", STATUS_COLORS[m.status])}
                        >
                          {STATUS_LABELS[m.status] || m.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="size-2.5" />
                          {m.date ? toJalali(m.date) : "—"}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">{faMoney(m.amount)}</span>
                        {m.dueDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Clock className="size-2.5" />
                              موعد: {toJalali(m.dueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Alerts */}
      {data.upcomingMilestones.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-600" />
              موعد و هشدارهای آینده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upcomingMilestones.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-md border",
                    m.isResolved
                      ? "bg-muted/30 opacity-60"
                      : m.severity === "CRITICAL"
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                      : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 size-7 rounded-full flex items-center justify-center shrink-0",
                      m.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/40"
                    )}
                  >
                    <AlertCircle className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{m.title}</span>
                      {m.date && (
                        <span className="text-[10px] text-muted-foreground">
                          {toJalali(m.date)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {m.message}
                    </p>
                  </div>
                  {m.isResolved && (
                    <Badge className="text-[9px] bg-emerald-600">حل‌شده</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof HardHat;
  label: string;
  value: string;
  color: "amber" | "emerald" | "rose" | "slate" | "orange";
}) {
  const colors = {
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/40",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-900/40",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/40",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 flex items-center gap-2.5">
        <div className={cn("size-9 rounded-full flex items-center justify-center", colors[color])}>
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="text-lg font-bold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
