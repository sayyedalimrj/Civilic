"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Send,
  RotateCcw,
  FileText,
  Lock,
  Unlock,
  Clock,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Payment {
  id: string;
  periodNo: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  stateHistory: string;
  dueDate: string | null;
}

const STEPS = [
  {
    key: "DRAFT",
    label: "پیش‌نویس",
    icon: FileText,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    key: "SUBMITTED",
    label: "در انتظار تأیید",
    icon: Clock,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  },
  {
    key: "APPROVED",
    label: "تأیید شده",
    icon: Check,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  },
];

interface WorkflowStepperProps {
  projectId: string;
  payment: Payment;
}

export function WorkflowStepper({ projectId, payment }: WorkflowStepperProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const transition = useMutation({
    mutationFn: async (payload: {
      action: "submit" | "approve" | "reject" | "reopen";
      note?: string;
    }) => {
      const r = await fetch(
        `/api/projects/${projectId}/payments/${payment.periodNo}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            userId: "user-admin",
            userName: "سید علی میرجعفری",
          }),
        }
      );
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "خطا در تغییر وضعیت");
      }
      return r.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      const actionLabel = {
        submit: "ارسال شد",
        approve: "تأیید شد",
        reject: "رد شد",
        reopen: "بازگشایی شد",
      }[vars.action];
      toast({
        title: `صورت‌وضعیت ${actionLabel}`,
        description: `دوره ${toFa(payment.periodNo)}`,
      });
      setRejectDialog(false);
      setRejectNote("");
    },
    onError: (err: Error) =>
      toast({ title: err.message, variant: "destructive" }),
  });

  const isRejected = payment.status === "REJECTED";
  const activeStep = isRejected ? 0 : STEPS.findIndex((s) => s.key === payment.status);

  const history = (() => {
    try {
      return JSON.parse(payment.stateHistory || "[]") as Array<{
        from: string;
        to: string;
        action: string;
        userId: string;
        userName: string;
        note: string | null;
        at: string;
      }>;
    } catch {
      return [];
    }
  })();

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">گردش کار صورت‌وضعیت</h3>
          {payment.lockedBy && (
            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 gap-1 text-[10px]">
              <Lock className="size-3" />
              قفل شده
            </Badge>
          )}
          {!payment.lockedBy && payment.status !== "APPROVED" && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1 text-[10px]">
              <Unlock className="size-3" />
              قابل ویرایش
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {payment.dueDate && (
            <span className="text-[10px] text-muted-foreground">
              موعد: {toJalali(payment.dueDate)}
            </span>
          )}
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              <History className="size-3" />
              تاریخچه ({toFa(history.length)})
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 mb-4 px-2">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive = i === activeStep;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? `${step.color} border-current`
                      : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {isRejected && i === 0 && (
                  <span className="text-[9px] text-rose-500">(رد شده)</span>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 -mt-5 transition-colors",
                    i < activeStep ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {payment.status === "DRAFT" && (
          <Button
            size="sm"
            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 gap-1"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ action: "submit" })}
          >
            <Send className="size-3.5" />
            ارسال برای تأیید
          </Button>
        )}
        {payment.status === "REJECTED" && (
          <Button
            size="sm"
            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 gap-1"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ action: "submit" })}
          >
            <Send className="size-3.5" />
            ارسال مجدد
          </Button>
        )}
        {payment.status === "SUBMITTED" && (
          <>
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
              disabled={transition.isPending}
              onClick={() => transition.mutate({ action: "approve" })}
            >
              <Check className="size-3.5" />
              تأیید
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 gap-1"
              disabled={transition.isPending}
              onClick={() => setRejectDialog(true)}
            >
              <X className="size-3.5" />
              رد
            </Button>
          </>
        )}
        {payment.status === "APPROVED" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            disabled={transition.isPending}
            onClick={() => {
              if (confirm("بازگشایی صورت‌وضعیت؟ این عمل قابل بازگشت نیست.")) {
                transition.mutate({ action: "reopen" });
              }
            }}
          >
            <RotateCcw className="size-3.5" />
            بازگشایی
          </Button>
        )}
        {payment.reviewNote && (payment.status === "REJECTED" || payment.status === "APPROVED") && (
          <div className="text-[11px] text-muted-foreground italic flex items-center gap-1 mr-auto self-center">
            یادداشت بازبین: {payment.reviewNote}
          </div>
        )}
      </div>

      {historyOpen && history.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2">
            تاریخچه‌ی گردش کار
          </div>
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px]"
            >
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{h.userName}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — {actionLabel(h.action)} (از {stateLabel(h.from)} به{" "}
                  {stateLabel(h.to)})
                </span>
                {h.note && (
                  <div className="text-muted-foreground italic mt-0.5">
                    «{h.note}»
                  </div>
                )}
                <div className="text-[9px] text-muted-foreground">
                  {toJalali(h.at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد صورت‌وضعیت دوره {toFa(payment.periodNo)}</DialogTitle>
            <DialogDescription>
              لطفاً دلیل رد صورت‌وضعیت را ذکر کنید. این یادداشت برای فرستنده قابل‌مشاهده خواهد بود.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">یادداشت بازبینی</Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="مثلاً: مبالغ فصل ۳ با برگه مالی تطابق ندارد..."
              className="min-h-[80px] text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialog(false)}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={!rejectNote.trim() || transition.isPending}
              onClick={() =>
                transition.mutate({
                  action: "reject",
                  note: rejectNote.trim(),
                })
              }
            >
              <X className="size-3.5" />
              رد صورت‌وضعیت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    submit: "ارسال",
    approve: "تأیید",
    reject: "رد",
    reopen: "بازگشایی",
  };
  return map[action] || action;
}

function stateLabel(state: string): string {
  const map: Record<string, string> = {
    DRAFT: "پیش‌نویس",
    SUBMITTED: "در انتظار تأیید",
    APPROVED: "تأیید شده",
    REJECTED: "رد شده",
  };
  return map[state] || state;
}
