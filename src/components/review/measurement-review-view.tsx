"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { RedlineReviewPanel, type RedlineItem } from "@/components/review/redline-review-panel";
import type { SequenceStage } from "@/components/review/calculation-sequence-rail";
import type { ReviewParty } from "@/lib/review/layers";

interface MData {
  myParty: ReviewParty | null;
  items: RedlineItem[];
  summary: { total: number; reviewed: number; revised: number };
  sequence: SequenceStage[];
}

export function MeasurementReviewView({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const key = ["measurement-review", projectId];
  const { data, isLoading } = useQuery<MData>({
    queryKey: key,
    queryFn: async () => (await fetch(`/api/projects/${projectId}/measurement/review`)).json(),
  });

  const reviewMut = useMutation({
    mutationFn: async (p: { itemId: string; decision: string; quantity?: number; comment?: string }) => {
      const r = await fetch(`/api/projects/${projectId}/measurement/items/${p.itemId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: p.decision, quantity: p.quantity, comment: p.comment }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  if (isLoading) return <div className="space-y-4 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  const canReview = data?.myParty === "CONSULTANT" || data?.myParty === "EMPLOYER";

  return (
    <RedlineReviewPanel
      title="رسیدگی ریزمتره"
      subtitle="مقدار واردشده‌ی پیمانکار، رسیدگی مشاور (قرمز) و مقدار نهایی کارفرما (سبز)"
      summary={null}
      sequence={data?.sequence ?? []}
      items={data?.items ?? []}
      showQuantity
      canReview={canReview}
      busy={reviewMut.isPending}
      onReview={(itemId, decision, value, comment) => reviewMut.mutate({ itemId, decision, quantity: value, comment })}
      onBulkApprove={() => { /* اقدام گروهی متره در نسخه‌ی بعد */ }}
    />
  );
}
