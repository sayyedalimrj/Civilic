"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Send,
  RotateCcw,
  Lock,
  Unlock,
  History,
  Shield,
  Crown,
  HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
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
  status: "DRAFT" | "SUBMITTED" | "CONSULTANT_APPROVED" | "FINALIZED" | "REJECTED" | string;
  submittedBy: string | null;
  submittedAt: string | null;
  consultantApprovedBy: string | null;
  consultantApprovedAt: string | null;
  finalizedBy: string | null;
  finalizedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  stateHistory: string;
  dueDate: string | null;
}

// نقش‌ها — در نسخه‌ی دمو، میرجعفری هم کارفرما و هم مشاور است
type Role = "CONTRACTOR" | "CONSULTANT" | "EMPLOYER" | "ADMIN";

const STEPS = [
  {
    key: "DRAFT",
    label: "پیش‌نویس پیمانکار",
    shortLabel: "پیش‌نویس",
    icon: HardHat,
    role: "CONTRACTOR" as Role,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    key: "SUBMITTED",
    label: "در انتظار مشاور",
    shortLabel: "مشاور",
    icon: Shield,
    role: "CONSULTANT" as Role,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  },
  {
    key: "CONSULTANT_APPROVED",
    label: "در انتظار کارفرما",
    shortLabel: "کارفرما",
    icon: Crown,
    role: "EMPLOYER" as Role,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    key: "FINALIZED",
    label: "قطعی شد",
    shortLabel: "قطعی",
    icon: Check,
    role: "EMPLOYER" as Role,
    color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40",
  },
];

interface StrictWorkflowStepperProps {
  projectId: string;
  payment: Payment;
  // نقش کاربر فعلی — پیش‌فرض EMPLOYER (میرجعفری در نقش کارفرما)
  currentRole?: Role;
}

export function StrictWorkflowStepper({
  projectId,
  payment,
  currentRole = "EMPLOYER",
}: StrictWorkflowStepperProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const transition = useMutation({
    mutationFn: async (payload: {
      action: "submit" | "consultantApprove" | "reject" | "finalize" | "reopen";
      note?: string;
    }) => {
      const r = await fetch(
        `/api/projects/${projectId}/payments/${payment.periodNo}/transition-v2`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            userId: "user-admin",
            userName: "سید علی میرجعفری",
            role: currentRole,
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
      const labels: Record<string, string> = {
        submit: "ارسال به مشاور",
        consultantApprove: "تأیید مشاور",
        reject: "رد و برگشت به پیمانکار",
        finalize: "قطعی شدن",
        reopen: "بازگشایی",
      };
      toast({
        title: `صورت‌وضعیت ${labels[vars.action] || "به‌روزرسانی شد"}`,
        description: `دوره ${toFa(payment.periodNo)}`,
      });
      setRejectDialog(false);
      setRejectReason("");
    },
    onError: (err: Error) =>
      toast({ title: err.message, variant: "destructive" }),
  });

  const state = payment.status;
  const isRejected = state === "REJECTED";
  const activeStep = isRejected
    ? 0
    : STEPS.findIndex((s) => s.key === state);

  const history = (() => {
    try {
      return JSON.parse(payment.stateHistory || "[]") as Array<{
        from: string;
        to: string;
        action: string;
        userId: string;
        userName: string;
        role: string;
        note: string | null;
        at: string;
      }>;
    } catch {
      return [];
    }
  })();

  // تعیین اقدامات مجاز بر اساس نقش و وضعیت
  const canSubmit =
    (currentRole === "CONTRACTOR" || currentRole === "ADMIN") &&
    (state === "DRAFT" || state === "REJECTED");
  const canConsultantApprove =
    (currentRole === "CONSULTANT" || currentRole === "ADMIN") &&
    state === "SUBMITTED";
  const canReject =
    (currentRole === "CONSULTANT" || currentRole === "ADMIN") &&
    state === "SUBMITTED";
  const canFinalize =
    (currentRole === "EMPLOYER" || currentRole === "ADMIN") &&
    state === "CONSULTANT_APPROVED";
  const canReopen =
    (currentRole === "EMPLOYER" || currentRole === "ADMIN") &&
    state === "FINALIZED";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">گردش کار سخت‌گیرانه نقش‌ها</h3>
          {payment.lockedBy && (
            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 gap-1 text-[10px]">
              <Lock className="size-3" />
              قفل (Read-Only)
            </Badge>
          )}
          {!payment.lockedBy && state !== "FINALIZED" && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1 text-[10px]">
              <Unlock className="size-3" />
              قابل ویرایش
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            نقش شما:{" "}
            {currentRole === "CONTRACTOR"
              ? "پیمانکار"
              : currentRole === "CONSULTANT"
              ? "مشاور"
              : "کارفرما"}
          </Badge>
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

      {/* Stepper — 4 مرحله‌ای */}
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
                    "size-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? `${step.color} border-current`
                      : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center",
                    isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.shortLabel}
                </span>
                {isRejected && i === 0 && (
                  <span className="text-[9px] text-rose-500">(رد شده)</span>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 -mt-6 transition-colors",
                    i < activeStep ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* دکمه‌های اکشن بر اساس نقش */}
      <div className="flex flex-wrap gap-2">
        {/* پیمانکار */}
        {canSubmit && (
          <Button
            size="sm"
            className="h-9 text-xs bg-amber-600 hover:bg-amber-700 gap-1.5"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ action: "submit" })}
          >
            <Send className="size-3.5" />
            ارسال برای تأیید مشاور
          </Button>
        )}
        {/* مشاور */}
        {canConsultantApprove && (
          <Button
            size="sm"
            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ action: "consultantApprove" })}
          >
            <Check className="size-3.5" />
            تأیید مشاور
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 gap-1.5"
            disabled={transition.isPending}
            onClick={() => setRejectDialog(true)}
          >
            <X className="size-3.5" />
            رد و برگشت به پیمانکار
          </Button>
        )}
        {/* کارفرما */}
        {canFinalize && (
          <Button
            size="sm"
            className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 gap-1.5"
            disabled={transition.isPending}
            onClick={() => transition.mutate({ action: "finalize" })}
          >
            <Crown className="size-3.5" />
            قطعی کردن (Finalize)
          </Button>
        )}
        {canReopen && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs gap-1.5"
            disabled={transition.isPending}
            onClick={() => {
              if (confirm("بازگشایی صورت‌وضعیت قطعی‌شده؟")) {
                transition.mutate({ action: "reopen" });
              }
            }}
          >
            <RotateCcw className="size-3.5" />
            بازگشایی
          </Button>
        )}
        {/* یادداشت رد */}
        {payment.rejectReason && state === "REJECTED" && (
          <div className="text-[11px] text-rose-600 italic flex items-center gap-1 mr-auto self-center">
            دلیل رد: {payment.rejectReason}
          </div>
        )}
      </div>

      {/* تاریخچه */}
      {historyOpen && history.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2">
            تاریخچه‌ی گردش کار
          </div>
          {history.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{h.userName}</span>
                <Badge variant="outline" className="text-[9px] h-4 mr-1">
                  {h.role === "CONTRACTOR"
                    ? "پیمانکار"
                    : h.role === "CONSULTANT"
                    ? "مشاور"
                    : h.role === "EMPLOYER"
                    ? "کارفرما"
                    : h.role}
                </Badge>
                <span className="text-muted-foreground">
                  {" "}
                  — {actionLabel(h.action)} (از {stateLabel(h.from)} به{" "}
                  {stateLabel(h.to)})
                </span>
                {h.note && (
                  <div className="text-muted-foreground italic mt-0.5">«{h.note}»</div>
                )}
                <div className="text-[9px] text-muted-foreground">
                  {toJalali(h.at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* دیالوگ رد */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد صورت‌وضعیت دوره {toFa(payment.periodNo)}</DialogTitle>
            <DialogDescription>
              صورت‌وضعیت به پیمانکار بازگردانده می‌شود. لطفاً دلیل رد را ذکر کنید تا
              پیمانکار اصلاحات لازم را انجام دهد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">دلیل رد (الزامی)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
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
              disabled={!rejectReason.trim() || transition.isPending}
              onClick={() =>
                transition.mutate({
                  action: "reject",
                  note: rejectReason.trim(),
                })
              }
            >
              <X className="size-3.5" />
              رد و برگشت به پیمانکار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    submit: "ارسال به مشاور",
    consultantApprove: "تأیید مشاور",
    reject: "رد و برگشت",
    finalize: "قطعی شدن",
    reopen: "بازگشایی",
  };
  return map[action] || action;
}

function stateLabel(state: string): string {
  const map: Record<string, string> = {
    DRAFT: "پیش‌نویس",
    SUBMITTED: "در انتظار مشاور",
    CONSULTANT_APPROVED: "تأیید مشاور",
    FINALIZED: "قطعی",
    REJECTED: "رد شده",
  };
  return map[state] || state;
}
