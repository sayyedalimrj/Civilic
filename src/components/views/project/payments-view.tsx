"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  CheckCircle2,
  Send,
  PenLine,
  ShieldCheck,
  Banknote,
  Receipt,
  TrendingUp,
  Info,
  XCircle,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { faNum, faMoney, faRial, faPct, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StrictWorkflowStepper } from "@/components/workflow/strict-workflow-stepper";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommentThread } from "@/components/comments/comment-thread";
import { PaymentReviewView } from "@/components/review/payment-review-view";

// ─── Types ───────────────────────────────────────────────────────────
interface PaymentItem {
  id: string;
  paymentId: string;
  financialSheetId: string | null;
  code: string;
  description: string;
  unit: string;
  totalQuantity: number;
  executedQuantity: number;
  executedPercent: number;
  unitPrice: number;
  executedAmount: number;
  adjustedAmount: number;
  isAdjusted: boolean;
}

interface Payment {
  id: string;
  projectId: string;
  periodNo: number;
  status: "DRAFT" | "SUBMITTED" | "CONSULTANT_APPROVED" | "FINALIZED" | "REJECTED" | string;
  // گردش کار سخت‌گیرانه نقش‌ها
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
  guaranteePct: number;
  insurancePct: number;
  taxPct: number;
  executedAmount: number;
  guarantee: number;
  insurance: number;
  tax: number;
  netPayable: number;
  createdAt: string;
  updatedAt: string;
  items?: PaymentItem[];
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    code: string;
    contractAmount: number;
    cachedTotal: number;
    cachedExecuted: number;
    payments: Payment[];
  };
}

// ─── Constants ───────────────────────────────────────────────────────
const STATUS_META: Record<
  string,
  { label: string; color: string; icon: typeof FileText }
> = {
  DRAFT: {
    label: "پیش‌نویس",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    icon: PenLine,
  },
  SUBMITTED: {
    label: "در انتظار مشاور",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
    icon: Send,
  },
  CONSULTANT_APPROVED: {
    label: "تأیید مشاور",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  FINALIZED: {
    label: "قطعی",
    color: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "رد شده",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    icon: XCircle,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────
function parseFaNumber(input: string): number {
  const en = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،\s]/g, "");
  const n = parseFloat(en);
  return isFinite(n) ? n : 0;
}

// ─── Main View ───────────────────────────────────────────────────────
export function PaymentsView() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ProjectResponse>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`);
      if (!r.ok) throw new Error("بارگذاری پروژه ناموفق بود");
      return r.json();
    },
    enabled: !!projectId,
  });

  const [selectedPeriod, setSelectedPeriod] = React.useState<number | null>(null);
  const [reviewMode, setReviewMode] = React.useState(false);

  const payments = data?.project?.payments ?? [];
  const selectedPayment = payments.find((p) => p.periodNo === selectedPeriod) || null;

  // ─── Create new payment ───
  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ payment: Payment }>;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast({
        title: "صورت‌وضعیت ایجاد شد",
        description: (
          <span className="text-xs leading-5">
            دوره‌ی {toFa(res.payment.periodNo)} با {toFa(res.payment.items?.length || 0)}{" "}
            ردیف از روی برگه مالی کپی شد.
          </span>
        ),
      });
      setSelectedPeriod(res.payment.periodNo);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "خطا در ایجاد صورت‌وضعیت",
        description: err.message,
      });
    },
  });

  // ─── Empty / loading / error states ───
  if (!projectId) {
    return (
      <EmptyState
        icon={<Wallet className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا صورت‌وضعیت‌های آن نمایش داده شود."
      />
    );
  }

  if (isLoading) {
    return <PaymentsSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={<RefreshCw className="size-8" />}
        title="خطا در بارگذاری"
        description="بارگذاری پروژه ناموفق بود."
        action={
          <Button variant="outline" className="h-9" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        }
      />
    );
  }

  const totalExecuted = payments.reduce((s, p) => s + (p.executedAmount || 0), 0);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Wallet className="size-5 text-amber-600" />
            صورت‌وضعیت‌ها
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پروژه: <span className="font-medium text-foreground">{data?.project.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            بازخوانی
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            ایجاد صورت‌وضعیت جدید
          </Button>
        </div>
      </div>

      {/* Summary mini-cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryMiniCard
          label="تعداد دوره‌ها"
          value={toFa(payments.length)}
          icon={<FileText className="size-4 text-amber-600" />}
        />
        <SummaryMiniCard
          label="مجموع اجرا‌شده"
          value={faMoney(totalExecuted)}
          sub={faRial(totalExecuted)}
          icon={<TrendingUp className="size-4 text-emerald-600" />}
        />
        <SummaryMiniCard
          label="مبلغ پیمان"
          value={faMoney(data?.project.contractAmount || 0)}
          sub={faRial(data?.project.contractAmount || 0)}
          icon={<Banknote className="size-4 text-amber-600" />}
        />
      </div>

      {/* Payment periods list */}
      {payments.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-8" />}
          title="صورت‌وضعیت‌ای موجود نیست"
          description="برای ایجاد صورت‌وضعیت، روی دکمه‌ی «ایجاد صورت‌وضعیت جدید» بزنید. تمام ردیف‌های برگه مالی به‌صورت خودکار با مقدار اجرا برابر صفر کپی می‌شوند."
          action={
            <Button
              className="h-9 gap-1.5"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              ایجاد صورت‌وضعیت جدید
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {payments.map((p) => (
            <PaymentCard
              key={p.id}
              payment={p}
              contractAmount={data?.project.contractAmount || 0}
              onOpen={() => setSelectedPeriod(p.periodNo)}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet
        open={selectedPayment !== null}
        onOpenChange={(o) => !o && setSelectedPeriod(null)}
      >
        <SheetContent
          side="left"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-4xl"
        >
          <SheetHeader className="border-b bg-muted/30 p-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <FileText className="size-5 text-amber-600" />
              صورت‌وضعیت دوره‌ی {toFa(selectedPayment?.periodNo ?? 0)}
              {selectedPayment && (
                <Badge
                  className={cn(
                    "mr-1",
                    STATUS_META[selectedPayment.status]?.color ||
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {STATUS_META[selectedPayment.status]?.label || selectedPayment.status}
                </Badge>
              )}
              {selectedPayment && (
                <CommentThread
                  projectId={(projectId as string) || ""}
                  entityType="PAYMENT"
                  entityId={selectedPayment.id}
                  entityLabel={`صورت‌وضعیت دوره‌ی ${toFa(selectedPayment.periodNo)}`}
                  variant="outline"
                  className="size-7"
                />
              )}
            </SheetTitle>
            <SheetDescription className="text-xs">
              برای ثبت اجرا، درصد اجرای هر ردیف را با اسلایدر یا ورودی عددی تنظیم کنید. کسورات قانونی به‌صورت خودکار محاسبه می‌شود.
            </SheetDescription>
          </SheetHeader>

          {selectedPayment ? (
            <>
              <div className="flex items-center gap-1 border-b bg-card px-4 py-2">
                <Button size="sm" variant={!reviewMode ? "default" : "ghost"} className="h-8 text-xs" onClick={() => setReviewMode(false)}>
                  ثبت اجرا
                </Button>
                <Button size="sm" variant={reviewMode ? "default" : "ghost"} className="h-8 text-xs" onClick={() => setReviewMode(true)}>
                  رسیدگی ردیفی (Redline)
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {reviewMode ? (
                  <PaymentReviewView projectId={(projectId as string) || ""} periodNo={selectedPayment.periodNo} />
                ) : (
                  <PaymentDetail payment={selectedPayment} />
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Payment Card (list item) ────────────────────────────────────────
function PaymentCard({
  payment,
  contractAmount,
  onOpen,
}: {
  payment: Payment;
  contractAmount: number;
  onOpen: () => void;
}) {
  const meta = STATUS_META[payment.status] || STATUS_META.DRAFT;
  const Icon = meta.icon;
  const pct = contractAmount > 0 ? (payment.executedAmount / contractAmount) * 100 : 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                دوره‌ی {toFa(payment.periodNo)}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                {new Date(payment.createdAt).toLocaleDateString("fa-IR")}
              </div>
            </div>
          </div>
          <Badge className={meta.color}>{meta.label}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="مبلغ اجرا" value={faMoney(payment.executedAmount)} />
          <MiniStat label="خالص پرداخت" value={faMoney(payment.netPayable)} />
          <MiniStat
            label="تضمین"
            value={`${faPct(payment.guaranteePct)} — ${faMoney(payment.guarantee)}`}
          />
          <MiniStat
            label="بیمه + مالیات"
            value={`${faPct(payment.insurancePct + payment.taxPct)} — ${faMoney(
              payment.insurance + payment.tax,
            )}`}
          />
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>سهم از مبلغ پیمان</span>
            <span className="tabular-nums">{faPct(pct)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 h-9 w-full gap-1.5"
          onClick={onOpen}
        >
          <FileText className="size-4" />
          مشاهده‌ی جزئیات و ثبت اجرا
        </Button>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-2.5 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SummaryMiniCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted/40">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-muted-foreground">{label}</div>
          <div className="truncate text-base font-bold tabular-nums">{value}</div>
          {sub ? (
            <div className="truncate text-[10px] text-muted-foreground tabular-nums">{sub}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Payment Detail (sheet content) ──────────────────────────────────
function PaymentDetail({ payment }: { payment: Payment }) {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const qc = useQueryClient();
  const { toast } = useToast();

  // ─── Mutation: update executedPercent ───
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      itemId: string;
      executedPercent?: number;
      executedQuantity?: number;
      isAdjusted?: boolean;
      indexFrom?: number;
      indexTo?: number;
    }) => {
      const r = await fetch(
        `/api/projects/${projectId}/payments/${payment.periodNo}/items`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ item: PaymentItem; payment: Payment }>;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["project", projectId] });
      const prev = qc.getQueryData<ProjectResponse>(["project", projectId]);
      if (prev && payload.executedPercent !== undefined) {
        const newPayments = prev.project.payments.map((p) => {
          if (p.id !== payment.id) return p;
          const newItems = (p.items || []).map((it) => {
            if (it.id !== payload.itemId) return it;
            const execQty = (payload.executedPercent! / 100) * it.totalQuantity;
            const execAmt = execQty * it.unitPrice;
            return {
              ...it,
              executedPercent: payload.executedPercent!,
              executedQuantity: execQty,
              executedAmount: execAmt,
              adjustedAmount: it.isAdjusted ? execAmt : execAmt,
            };
          });
          const executedAmount = newItems.reduce((s, i) => s + i.executedAmount, 0);
          const guarantee = (executedAmount * p.guaranteePct) / 100;
          const insurance = (executedAmount * p.insurancePct) / 100;
          const tax = (executedAmount * p.taxPct) / 100;
          return {
            ...p,
            items: newItems,
            executedAmount,
            guarantee,
            insurance,
            tax,
            netPayable: executedAmount - guarantee - insurance - tax,
          };
        });
        qc.setQueryData<ProjectResponse>(["project", projectId], {
          ...prev,
          project: { ...prev.project, payments: newPayments },
        });
      }
      return { prev };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["project", projectId], ctx.prev);
      toast({
        variant: "destructive",
        title: "خطا در ثبت اجرا",
        description: err.message,
      });
    },
    onSettled: (data) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      if (data?.payment) {
        toast({
          title: "ثبت شد",
          description: (
            <span className="text-xs leading-5">
              خالص پرداخت دوره: <b>{faMoney(data.payment.netPayable)}</b> — تضمین:{" "}
              <b>{faMoney(data.payment.guarantee)}</b> — مالیات:{" "}
              <b>{faMoney(data.payment.tax)}</b>
            </span>
          ),
        });
      }
    },
  });

  const items = payment.items || [];
  const executedSum = items.reduce((s, i) => s + i.executedAmount, 0);
  // adjustedSum حذف شد — مبلغ تعدیل‌شده در گزارش مستقل تعدیل نمایش داده می‌شود

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Workflow stepper — گردش کار سخت‌گیرانه نقش‌ها */}
      <div className="px-4 pt-3">
        <StrictWorkflowStepper projectId={projectId!} payment={payment} currentRole="EMPLOYER" />
      </div>

      {/* Summary panel */}
      <div className="border-b bg-gradient-to-l from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/20">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCell
            label="مبلغ اجرا"
            value={faMoney(payment.executedAmount)}
            sub={faRial(payment.executedAmount)}
            icon={<TrendingUp className="size-3.5" />}
            tone="default"
          />
          <SummaryCell
            label="تضمین"
            value={faMoney(payment.guarantee)}
            sub={`کسر ${faPct(payment.guaranteePct)}`}
            icon={<ShieldCheck className="size-3.5" />}
            tone="neg"
          />
          <SummaryCell
            label="بیمه"
            value={faMoney(payment.insurance)}
            sub={`کسر ${faPct(payment.insurancePct)}`}
            icon={<Receipt className="size-3.5" />}
            tone="neg"
          />
          <SummaryCell
            label="مالیات"
            value={faMoney(payment.tax)}
            sub={`کسر ${faPct(payment.taxPct)}`}
            icon={<Receipt className="size-3.5" />}
            tone="neg"
          />
        </div>
        <Separator className="my-3 bg-amber-200/50 dark:bg-amber-800/30" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground">خالص پرداختنی</div>
            <div className="text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-200">
              {faMoney(payment.netPayable)}
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {faRial(payment.netPayable)}
            </div>
          </div>
          {/* مبلغ تعدیل‌شده حذف شد — در گزارش مستقل تعدیل نمایش داده می‌شود */}
          <div className="text-left">
            <div className="text-[11px] text-muted-foreground">تعداد ردیف‌ها</div>
            <div className="text-base font-semibold tabular-nums">
              {toFa(items.length)} ردیف
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              مبلغ خام: {faMoney(payment.executedAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="border-b bg-muted/20 px-4 py-2">
        <Alert className="border-amber-200 bg-amber-50 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
          <Info className="size-3.5" />
          <AlertDescription className="text-[11px]">
            نرخ کسورات قانونی: تضمین <b>{faPct(payment.guaranteePct)}</b>، بیمه{" "}
            <b>{faPct(payment.insurancePct)}</b>، مالیات <b>{faPct(payment.taxPct)}</b>. این
            نرخ‌ها هنگام ایجاد دوره تعیین می‌شوند و در این نما فقط نمایش داده می‌شوند.
          </AlertDescription>
        </Alert>
      </div>

      {/* Items table */}
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          این صورت‌وضعیت هنوز ردیفی ندارد.
        </div>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto">
          <Table className="boq-table text-sm">
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <TableRow className="border-b hover:bg-transparent">
                <TableHead className="h-10 w-10 bg-muted/60 px-2 text-center font-medium">#</TableHead>
                <TableHead className="h-10 bg-muted/60 px-2 font-medium">کد</TableHead>
                <TableHead className="h-10 bg-muted/60 px-2 font-medium">شرح</TableHead>
                <TableHead className="h-10 w-16 bg-muted/60 px-2 font-medium">واحد</TableHead>
                <TableHead className="h-10 w-24 bg-muted/60 px-2 text-left font-medium">مقدار کل</TableHead>
                <TableHead className="h-10 w-40 bg-muted/60 px-2 text-center font-medium">درصد اجرا</TableHead>
                <TableHead className="h-10 w-24 bg-muted/60 px-2 text-left font-medium">مقدار اجرا</TableHead>
                <TableHead className="h-10 w-32 bg-muted/60 px-2 text-left font-medium">مبلغ اجرا</TableHead>
                {/* مبلغ تعدیل‌شده حذف شد — در گزارش مستقل تعدیل نمایش داده می‌شود */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <PaymentItemRow
                  key={item.id}
                  item={item}
                  idx={idx}
                  pending={updateMutation.isPending && updateMutation.variables?.itemId === item.id}
                  onCommit={(payload) => updateMutation.mutate(payload)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer totals */}
      <div className="mt-auto border-t bg-muted/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            مجموع مبالغ اجرا در این دوره
          </div>
          <div className="text-left">
            <span className="text-base font-bold tabular-nums text-amber-900 dark:text-amber-200">
              {faMoney(executedSum)}
            </span>
            <span className="mr-2 text-[10px] text-muted-foreground tabular-nums">
              {faRial(executedSum)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Item Row (with inline slider + number input) ────────────
function PaymentItemRow({
  item,
  idx,
  pending,
  onCommit,
}: {
  item: PaymentItem;
  idx: number;
  pending: boolean;
  onCommit: (payload: {
    itemId: string;
    executedPercent?: number;
    executedQuantity?: number;
  }) => void;
}) {
  const [pct, setPct] = React.useState(item.executedPercent || 0);
  const [inputVal, setInputVal] = React.useState(toFa((item.executedPercent || 0).toFixed(1)));
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setPct(item.executedPercent || 0);
    setInputVal(toFa((item.executedPercent || 0).toFixed(1)));
  }, [item.executedPercent]);

  const commit = (newPct: number) => {
    const clamped = Math.max(0, Math.min(100, newPct));
    if (Math.abs(clamped - (item.executedPercent || 0)) < 0.01) return;
    onCommit({ itemId: item.id, executedPercent: clamped });
  };

  const handleSlider = (v: number[]) => {
    const next = v[0] ?? 0;
    setPct(next);
    setInputVal(toFa(next.toFixed(1)));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(next), 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputVal(raw);
    const n = parseFaNumber(raw);
    const clamped = Math.max(0, Math.min(100, n));
    setPct(clamped);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(clamped), 800);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const executedQty = (pct / 100) * item.totalQuantity;

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="px-2 text-center text-xs text-muted-foreground">
        {toFa(idx + 1)}
      </TableCell>
      <TableCell className="px-2">
        <Badge variant="outline" className="font-mono text-[11px]">
          {item.code}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[20vw] px-2">
        <div className="truncate text-xs" title={item.description}>
          {item.description}
        </div>
      </TableCell>
      <TableCell className="px-2 text-[11px] text-muted-foreground">{item.unit}</TableCell>
      <TableCell className="px-2 text-left text-xs tabular-nums">
        {faNum(item.totalQuantity, 2)}
      </TableCell>
      <TableCell className="px-2">
        <div className="flex items-center gap-2">
          <Slider
            value={[pct]}
            onValueChange={handleSlider}
            min={0}
            max={100}
            step={0.5}
            className="flex-1"
            aria-label="درصد اجرا"
          />
          <Input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={inputVal}
            onChange={handleInputChange}
            className="h-9 w-14 text-left tabular-nums text-xs"
            aria-label="درصد اجرا"
          />
          {pending ? (
            <Loader2 className="size-3.5 animate-spin text-amber-500" />
          ) : (
            <span className="w-7 text-left text-[10px] text-muted-foreground tabular-nums">
              {toFa(pct.toFixed(0))}٪
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-2 text-left text-xs tabular-nums">
        {faNum(executedQty, 2)}
      </TableCell>
      <TableCell className="px-2 text-left text-xs font-semibold tabular-nums">
        {faRial(item.executedAmount)}
      </TableCell>
      {/* مبلغ تعدیل‌شده حذف شد — در گزارش مستقل تعدیل نمایش داده می‌شود */}
    </TableRow>
  );
}

// ─── Summary Cell ────────────────────────────────────────────────────
function SummaryCell({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: "default" | "neg";
}) {
  return (
    <div className="rounded-lg border border-amber-200/60 bg-white/60 p-2.5 dark:border-amber-800/30 dark:bg-amber-950/20">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-base font-bold tabular-nums",
          tone === "neg" ? "text-rose-600 dark:text-rose-400" : "text-amber-900 dark:text-amber-200",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="text-[9px] text-muted-foreground tabular-nums">{sub}</div>
      ) : null}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function PaymentsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export default PaymentsView;
