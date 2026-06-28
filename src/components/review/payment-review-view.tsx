"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Pencil, Loader2, History, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewValueCell } from "@/components/review/review-value-cell";
import { PaymentReviewSummary, type PaymentReviewSummaryData } from "@/components/review/payment-review-summary";
import { CalculationSequenceRail, type SequenceStage } from "@/components/review/calculation-sequence-rail";
import type { ReviewLayer, ReviewParty } from "@/lib/review/layers";
import { toFa } from "@/lib/fa";

interface ReviewItem {
  id: string; code: string; description: string; unit: string;
  contractor: { quantity: number; unitPrice: number; amount: number };
  layers: ReviewLayer[];
  effectiveAmount: number;
}
interface ReviewData {
  payment: { id: string; periodNo: number; status: string };
  myParty: ReviewParty | null;
  items: ReviewItem[];
  summary: PaymentReviewSummaryData;
  sequence: SequenceStage[];
}

export function PaymentReviewView({ projectId, periodNo }: { projectId: string; periodNo: number }) {
  const qc = useQueryClient();
  const key = ["payment-review", projectId, periodNo];
  const { data, isLoading } = useQuery<ReviewData>({
    queryKey: key,
    queryFn: async () => (await fetch(`/api/projects/${projectId}/payments/${periodNo}/review`)).json(),
  });

  const [reviseItem, setReviseItem] = useState<ReviewItem | null>(null);
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const canReview = data?.myParty === "CONSULTANT" || data?.myParty === "EMPLOYER";

  const reviewMut = useMutation({
    mutationFn: async (payload: { itemId: string; decision: string; amount?: number; comment?: string }) => {
      const r = await fetch(`/api/projects/${projectId}/payments/${periodNo}/items/${payload.itemId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: payload.decision, amount: payload.amount, comment: payload.comment }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => { setReviseItem(null); setAmount(""); setComment(""); setErr(null); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => setErr(e.message),
  });

  const bulkMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/payments/${periodNo}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_all" }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  if (isLoading) {
    return <div className="space-y-4 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!data?.payment) {
    return <div className="p-4"><EmptyState icon={Receipt} title="صورت‌وضعیتی یافت نشد" /></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title={`رسیدگی صورت‌وضعیت شماره ${toFa(data.payment.periodNo)}`}
        subtitle="مقادیر پیمانکار، رسیدگی مشاور (قرمز) و تایید نهایی کارفرما (سبز)"
        action={<StatusBadge status={data.payment.status} kind="payment" />}
      />

      <PaymentReviewSummary data={data.summary} />

      <CalculationSequenceRail stages={data.sequence} />

      {canReview && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          <span className="text-xs text-muted-foreground">اقدام گروهی:</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}>
            {bulkMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            تایید همه بدون تغییر
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[auto_2fr_1fr_1.4fr_auto] gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground md:grid">
          <span>کد</span><span>شرح</span><span>واحد</span><span className="text-end">مقادیر رسیدگی</span><span className="text-center">اقدام</span>
        </div>
        <div className="divide-y">
          {data.items.length === 0 ? (
            <div className="p-4"><EmptyState title="ردیفی برای رسیدگی نیست" /></div>
          ) : data.items.map((it) => (
            <div key={it.id} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[auto_2fr_1fr_1.4fr_auto] md:items-center">
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">{it.code}</span>
              <span className="text-sm">{it.description}</span>
              <span className="text-xs text-muted-foreground">{it.unit}</span>
              <div className="md:flex md:justify-end">
                <ReviewValueCell contractor={it.contractor} layers={it.layers} />
              </div>
              <div className="flex items-center justify-end gap-1 md:justify-center">
                {canReview && (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-emerald-600" onClick={() => reviewMut.mutate({ itemId: it.id, decision: "APPROVED_AS_IS" })}>
                      <CheckCheck className="size-3.5" /> تایید
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-amber-600" onClick={() => { setReviseItem(it); setAmount(String(Math.round(it.effectiveAmount))); setComment(""); setErr(null); }}>
                      <Pencil className="size-3.5" /> اصلاح
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* دیالوگ اصلاح مبلغ */}
      <Dialog open={!!reviseItem} onOpenChange={(o) => !o && setReviseItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>اصلاح مبلغ ردیف</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{reviseItem?.description}</div>
            <div className="space-y-1.5">
              <Label>مبلغ اصلاح‌شده (ریال)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>دلیل اصلاح (الزامی)</Label>
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="مثلاً اصلاح احجام مطابق صورت‌جلسه" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviseItem(null)}>انصراف</Button>
            <Button
              onClick={() => reviseItem && reviewMut.mutate({ itemId: reviseItem.id, decision: "REVISED", amount: Number(amount.replace(/[^\d.]/g, "")) || 0, comment })}
              disabled={reviewMut.isPending}
            >
              {reviewMut.isPending && <Loader2 className="size-4 animate-spin" />} ثبت اصلاح
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
