"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Shield,
  Calculator,
  FileText,
  X,
  Check,
  Filter,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  projectId: string | null;
  relatedId: string | null;
  relatedType: string | null;
  dueDate: string | null;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

const TYPE_META: Record<
  string,
  { icon: typeof Bell; color: string; bg: string; label: string }
> = {
  GUARANTEE: {
    icon: Shield,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    label: "تضامین",
  },
  DEDUCTION: {
    icon: Calculator,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    label: "کسورات",
  },
  SCHEDULE: {
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    label: "زمان‌بندی",
  },
  CALC: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    label: "محاسبات",
  },
  WORKFLOW: {
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    label: "گردش کار",
  },
  SYSTEM: {
    icon: Info,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    label: "سیستمی",
  },
};

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  INFO: { label: "اطلاع", color: "text-slate-500" },
  WARNING: { label: "هشدار", color: "text-amber-600" },
  CRITICAL: { label: "بحرانی", color: "text-rose-600" },
};

function relativeTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "هم‌اکنون";
  if (diff < 3600) return `${toFa(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toFa(Math.floor(diff / 3600))} ساعت پیش`;
  return `${toFa(Math.floor(diff / 86400))} روز پیش`;
}

function daysUntil(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 86400000;
  if (diff < 0) return `${toFa(Math.abs(Math.ceil(diff)))} روز گذشته`;
  if (diff < 1) return "امروز";
  return `${toFa(Math.ceil(diff))} روز مانده`;
}

interface AlertsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertsPanel({ open, onOpenChange }: AlertsPanelProps) {
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{
    alerts: Alert[];
    count: number;
    unreadCount: number;
    criticalCount: number;
  }>({
    queryKey: ["alerts", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === "unread") params.set("onlyUnread", "true");
      const r = await fetch(`/api/alerts?${params.toString()}`);
      return r.json();
    },
    enabled: open,
    refetchInterval: 15000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/alerts/${id}/read`, { method: "PATCH" });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/alerts/${id}/resolve`, { method: "PATCH" });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast({ title: "هشدار رفع شد" });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const alerts = data?.alerts || [];
      await Promise.all(
        alerts.filter((a) => !a.isRead).map((a) => markRead.mutateAsync(a.id))
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const alerts = data?.alerts || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="size-5 text-amber-600" />
              هشدارهای هوشمند
              {data && data.unreadCount > 0 && (
                <Badge className="bg-amber-600 text-[10px]">
                  {toFa(data.unreadCount)} خوانده‌نشده
                </Badge>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => markAllRead.mutate()}
              disabled={!data?.unreadCount}
            >
              <Check className="size-3" />
              خواندن همه
            </Button>
          </div>
          {/* فیلتر */}
          <div className="flex gap-1 mt-2">
            {[
              { id: "all" as const, label: "همه" },
              { id: "unread" as const, label: "خوانده‌نشده" },
              { id: "critical" as const, label: "بحرانی" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] transition-colors",
                  filter === f.id
                    ? "bg-amber-600 text-white"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-md bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : !alerts.length ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                <CheckCircle2 className="size-10 mx-auto mb-2 text-emerald-300" />
                هشداری وجود ندارد
                <br />
                <span className="text-[10px]">همه‌چیز مرتب است</span>
              </div>
            ) : (
              alerts.map((a) => {
                const meta = TYPE_META[a.type] || TYPE_META.SYSTEM;
                const sev = SEVERITY_META[a.severity] || SEVERITY_META.INFO;
                const Icon = meta.icon;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      a.isResolved
                        ? "bg-muted/30 border-transparent opacity-60"
                        : !a.isRead
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                        : "bg-card"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "size-9 rounded-full flex items-center justify-center shrink-0",
                          meta.bg
                        )}
                      >
                        <Icon className={cn("size-4", meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-bold truncate">
                            {a.title}
                          </span>
                          {!a.isRead && !a.isResolved && (
                            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 py-0"
                          >
                            {meta.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] h-4 py-0", sev.color)}
                          >
                            {sev.label}
                          </Badge>
                          {a.dueDate && !a.isResolved && (
                            <span className="text-[9px] text-muted-foreground">
                              • {daysUntil(a.dueDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground mb-2">
                          {a.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground">
                            {relativeTime(a.createdAt)}
                          </span>
                          <div className="flex gap-1">
                            {!a.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[10px]"
                                onClick={() => markRead.mutate(a.id)}
                              >
                                خواندن
                              </Button>
                            )}
                            {!a.isResolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-emerald-600 hover:text-emerald-700"
                                onClick={() => resolve.mutate(a.id)}
                              >
                                <Check className="size-3" />
                                رفع
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {data && data.criticalCount > 0 && (
          <div className="border-t p-2 bg-rose-50 dark:bg-rose-950/30">
            <div className="text-[10px] text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <AlertTriangle className="size-3" />
              {toFa(data.criticalCount)} هشدار بحرانی نیاز به توجه فوری دارد
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
