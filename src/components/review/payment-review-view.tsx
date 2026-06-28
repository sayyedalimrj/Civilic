"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { RedlineReviewPanel, type RedlineItem } from "@/components/review/redline-review-panel";
import type { PaymentReviewSummaryData } from "@/components/review/payment-review-summary";
import type { SequenceStage } from "@/components/review/calculation-sequence-rail";
import type { ReviewParty } from "@/lib/review/layers";
import { toFa } from "@/lib/fa";

interface ReviewData {
  payment: { id: string; periodNo: number; status: string };
  myParty: ReviewParty | null;
  items: RedlineItem[];
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

  const reviewMut = useMutation({
    mutationFn: async (p: { itemId: string; decision: string; amount?: number; comment?: string }) => {
      const r = await fetch(`/api/projects/${projectId}/payments/${periodNo}/items/${p.itemId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: p.decision, amount: p.amount, comment: p.comment }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const bulkMut = useMutation({
    mutationFn: async () => {
      await fetch(`/api/projects/${projectId}/payments/${periodNo}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_all" }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  if (isLoading) return <div className="space-y-4 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!data?.payment) return <div className="p-4"><EmptyState icon={Receipt} title="صورت‌وضعیتی یافت نشد" /></div>;

  const canReview = data.myParty === "CONSULTANT" || data.myParty === "EMPLOYER";

  return (
    <RedlineReviewPanel
      title={`رسیدگی صورت‌وضعیت شماره ${toFa(data.payment.periodNo)}`}
      subtitle="مقادیر پیمانکار، رسیدگی مشاور (قرمز) و تایید نهایی کارفرما (سبز)"
      headerAction={<StatusBadge status={data.payment.status} kind="payment" />}
      summary={data.summary}
      sequence={data.sequence}
      items={data.items}
      canReview={canReview}
      busy={reviewMut.isPending || bulkMut.isPending}
      onReview={(itemId, decision, value, comment) => reviewMut.mutate({ itemId, decision, amount: value, comment })}
      onBulkApprove={() => bulkMut.mutate()}
    />
  );
}
