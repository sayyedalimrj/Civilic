"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  GitPullRequest, Plus, Check, X, Clock, TrendingUp, Calendar, DollarSign,
} from "lucide-react";
import { faMoney, toFa, toJalali } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChangeOrder {
  id: string;
  changeNo: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  costImpact: number;
  scheduleImpact: number;
  status: string;
  requestedBy: string;
  requestedByName: string;
  reviewedByName: string | null;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  implementedAt: string | null;
}

const TYPES = [
  { value: "SCOPE", label: "دامنه", color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40" },
  { value: "DESIGN", label: "طراحی", color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40" },
  { value: "SCHEDULE", label: "زمان‌بندی", color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/40" },
  { value: "COST", label: "هزینه", color: "text-rose-600 bg-rose-100 dark:bg-rose-950/40" },
  { value: "MATERIAL", label: "مصالح", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40" },
  { value: "OTHER", label: "سایر", color: "text-slate-600 bg-slate-100 dark:bg-slate-900/40" },
];

const PRIORITIES = [
  { value: "LOW", label: "کم", color: "bg-emerald-100 text-emerald-800" },
  { value: "MEDIUM", label: "متوسط", color: "bg-amber-100 text-amber-800" },
  { value: "HIGH", label: "بالا", color: "bg-orange-100 text-orange-800" },
  { value: "URGENT", label: "فوری", color: "bg-rose-100 text-rose-800" },
];

const STATUSES = [
  { value: "SUBMITTED", label: "ارسال‌شده", color: "bg-amber-100 text-amber-800" },
  { value: "UNDER_REVIEW", label: "در حال بررسی", color: "bg-cyan-100 text-cyan-800" },
  { value: "APPROVED", label: "تأییدشده", color: "bg-emerald-100 text-emerald-800" },
  { value: "REJECTED", label: "ردشده", color: "bg-rose-100 text-rose-800" },
  { value: "IMPLEMENTED", label: "اجرا شده", color: "bg-emerald-200 text-emerald-900" },
];

const EMPTY_FORM = {
  title: "", description: "", type: "SCOPE", priority: "MEDIUM",
  costImpact: 0, scheduleImpact: 0,
};

export function ChangeOrderView() {
  const { selectedProjectId } = useAppStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [reviewDialog, setReviewDialog] = useState<ChangeOrder | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data, isLoading } = useQuery<{ changes: ChangeOrder[]; summary: any }>({
    queryKey: ["change-orders", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/change-orders`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const r = await fetch(`/api/projects/${selectedProjectId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          costImpact: Number(payload.costImpact) || 0,
          scheduleImpact: Number(payload.scheduleImpact) || 0,
        }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "درخواست تغییر ثبت شد" });
      qc.invalidateQueries({ queryKey: ["change-orders", selectedProjectId] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note: string }) => {
      const r = await fetch(`/api/projects/${selectedProjectId}/change-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewNote: note,
          reviewedBy: "user-admin",
          reviewedByName: "سید علی میرجعفری",
        }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "وضعیت به‌روزرسانی شد" });
      qc.invalidateQueries({ queryKey: ["change-orders", selectedProjectId] });
      setReviewDialog(null);
      setReviewNote("");
    },
  });

  const changes = data?.changes || [];
  const summary = data?.summary;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <GitPullRequest className="size-5 text-amber-600" />
            مدیریت تغییرات (Change Orders)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            ثبت و پیگیری درخواست‌های تغییر در دامنه، طراحی، زمان‌بندی و هزینه
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          درخواست تغییر
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard icon={GitPullRequest} label="کل تغییرات" value={summary ? toFa(summary.total) : "—"} color="amber" />
        <SummaryCard icon={Clock} label="در انتظار" value={summary ? toFa(summary.pending) : "—"} color="orange" />
        <SummaryCard icon={Check} label="تأیید/اجرا" value={summary ? toFa(summary.approved) : "—"} color="emerald" />
        <SummaryCard icon={DollarSign} label="تأثیر مالی" value={summary ? faMoney(summary.totalCostImpact) : "—"} color={summary && summary.totalCostImpact > 0 ? "rose" : "slate"} />
        <SummaryCard icon={Calendar} label="تأثیر زمانی" value={summary ? `${toFa(summary.totalScheduleImpact)} روز` : "—"} color={summary && summary.totalScheduleImpact > 0 ? "rose" : "slate"} />
      </div>

      {/* Changes List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">لیست درخواست‌های تغییر</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : !changes.length ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <GitPullRequest className="size-10 mx-auto mb-2 text-amber-300" />
              درخواست تغییری ثبت نشده
            </div>
          ) : (
            <div className="divide-y">
              {changes.map((c) => {
                const type = TYPES.find((t) => t.value === c.type) || TYPES[5];
                const priority = PRIORITIES.find((p) => p.value === c.priority) || PRIORITIES[1];
                const status = STATUSES.find((s) => s.value === c.status) || STATUSES[0];
                return (
                  <div key={c.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("size-9 rounded-full flex items-center justify-center shrink-0", type.color)}>
                        <GitPullRequest className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{c.changeNo}</span>
                          <span className="text-sm font-bold">{c.title}</span>
                          <Badge className={cn("text-[9px] h-4", type.color)}>{type.label}</Badge>
                          <Badge className={cn("text-[9px] h-4", priority.color)}>{priority.label}</Badge>
                          <Badge className={cn("text-[9px] h-4", status.color)}>{status.label}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-1.5">{c.description}</p>
                        <div className="flex items-center gap-4 text-[10px]">
                          <span className="flex items-center gap-1">
                            <DollarSign className="size-2.5" />
                            <span className={cn("font-bold tabular-nums", c.costImpact > 0 ? "text-rose-600" : c.costImpact < 0 ? "text-emerald-600" : "")}>
                              {c.costImpact > 0 ? "+" : ""}{faMoney(c.costImpact)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-2.5" />
                            <span className={cn("font-bold tabular-nums", c.scheduleImpact > 0 ? "text-rose-600" : c.scheduleImpact < 0 ? "text-emerald-600" : "")}>
                              {c.scheduleImpact > 0 ? "+" : ""}{toFa(c.scheduleImpact)} روز
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            {c.requestedByName} • {toJalali(c.submittedAt)}
                          </span>
                        </div>
                        {c.reviewNote && (
                          <div className="mt-1.5 rounded-md bg-muted/40 p-2 text-[10px] italic">
                            <span className="font-medium">{c.reviewedByName}:</span> {c.reviewNote}
                          </div>
                        )}
                      </div>
                      {(c.status === "SUBMITTED" || c.status === "UNDER_REVIEW") && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setReviewDialog(c); setReviewNote(""); }}>
                          بررسی
                        </Button>
                      )}
                      {c.status === "APPROVED" && (
                        <Button size="sm" className="h-7 text-[11px] bg-emerald-600" onClick={() => reviewMutation.mutate({ id: c.id, status: "IMPLEMENTED", note: "" })}>
                          <Check className="size-3" /> اجرا شد
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>درخواست تغییر جدید</DialogTitle>
            <DialogDescription>ثبت درخواست تغییر در دامنه، طراحی، زمان‌بندی یا هزینه</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان <span className="text-rose-500">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" placeholder="مثلاً تغییر ابعاد دهانه پل" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شرح کامل</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[70px] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">نوع تغییر</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">اولویت</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">تأثیر مالی (ریال)</Label>
                <Input type="number" value={form.costImpact} onChange={(e) => setForm({ ...form, costImpact: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
                <p className="text-[9px] text-muted-foreground">مثبت=افزایش، منفی=کاهش</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">تأثیر زمانی (روز)</Label>
                <Input type="number" value={form.scheduleImpact} onChange={(e) => setForm({ ...form, scheduleImpact: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
                <p className="text-[9px] text-muted-foreground">مثبت=تأخیر، منفی=تعجیل</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? "در حال ثبت..." : "ثبت درخواست"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>بررسی درخواست تغییر</DialogTitle>
            <DialogDescription>{reviewDialog?.changeNo} — {reviewDialog?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">یادداشت بازبینی</Label>
            <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} className="min-h-[60px] text-xs" placeholder="توضیحات تصمیم..." />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReviewDialog(null)}>انصراف</Button>
            <Button size="sm" variant="outline" className="text-rose-600 border-rose-300" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: reviewDialog!.id, status: "REJECTED", note: reviewNote })}>
              <X className="size-3.5" /> رد
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: reviewDialog!.id, status: "APPROVED", note: reviewNote })}>
              <Check className="size-3.5" /> تأیید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color: "amber" | "emerald" | "rose" | "slate" | "orange" }) {
  const colors = {
    amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300",
    slate: "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-700 dark:text-slate-300",
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 text-orange-700 dark:text-orange-300",
  };
  return (
    <Card className={cn("border-0 shadow-sm bg-gradient-to-br", colors[color])}>
      <CardContent className="p-3 flex items-center gap-2.5">
        <Icon className="size-4 opacity-60" />
        <div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="text-sm font-bold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
