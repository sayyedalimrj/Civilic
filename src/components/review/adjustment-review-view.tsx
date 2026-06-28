"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { RedlineReviewPanel, type RedlineItem } from "@/components/review/redline-review-panel";
import type { PaymentReviewSummaryData } from "@/components/review/payment-review-summary";
import type { SequenceStage } from "@/components/review/calculation-sequence-rail";
import type { ReviewParty } from "@/lib/review/layers";

interface AdjData {
  myParty: ReviewParty | null;
  type: string;
  items: RedlineItem[];
  summary: PaymentReviewSummaryData;
  sequence: SequenceStage[];
}

export function AdjustmentReviewView({ projectId, type = "TEMPORARY" }: { projectId: string; type?: string }) {
  const qc = useQueryClient();
  const key = ["adjustment-review", projectId, type];
  const { data, isLoading } = useQuery<AdjData>({
    queryKey: key,
    queryFn: async () => (await fetch(`/api/projects/${projectId}/adjustment/review?type=${type}`)).json(),
  });

  const reviewMut = useMutation({
    mutationFn: async (p: { itemId: string; decision: string; amount?: number; comment?: string }) => {
      const r = await fetch(`/api/projects/${projectId}/adjustment/items/${p.itemId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: p.decision, adjustmentAmount: p.amount, comment: p.comment }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const bulkMut = useMutation({
    mutationFn: async () => {
      await fetch(`/api/projects/${projectId}/adjustment/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_all", type }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  if (isLoading) return <div className="space-y-4 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  const canReview = data?.myParty === "CONSULTANT" || data?.myParty === "EMPLOYER";

  return (
    <RedlineReviewPanel
      title="رسیدگی تعدیل"
      subtitle="تعدیل ادعایی پیمانکار، رسیدگی مشاور (قرمز) و تایید نهایی کارفرما (سبز)"
      summary={data?.summary ?? null}
      sequence={data?.sequence ?? []}
      items={data?.items ?? []}
      canReview={canReview}
      busy={reviewMut.isPending || bulkMut.isPending}
      onReview={(itemId, decision, value, comment) => reviewMut.mutate({ itemId, decision, amount: value, comment })}
      onBulkApprove={() => bulkMut.mutate()}
    />
  );
}
