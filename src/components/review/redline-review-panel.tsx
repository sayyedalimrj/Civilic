"use client";

import { useState } from "react";
import { CheckCheck, Pencil, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewValueCell } from "@/components/review/review-value-cell";
import { PaymentReviewSummary, type PaymentReviewSummaryData } from "@/components/review/payment-review-summary";
import { CalculationSequenceRail, type SequenceStage } from "@/components/review/calculation-sequence-rail";
import type { ReviewLayer } from "@/lib/review/layers";
import { toFa } from "@/lib/fa";
import { cn } from "@/lib/utils";

export interface RedlineItem {
  id: string; code: string; description: string; unit: string;
  contractor: { quantity?: number | null; amount?: number | null };
  layers: ReviewLayer[];
}

type RowFilter = "all" | "changed" | "needs_comment";

export function RedlineReviewPanel(props: {
  title: string;
  subtitle: string;
  headerAction?: React.ReactNode;
  summary: PaymentReviewSummaryData | null;
  netPayable?: number;
  sequence: SequenceStage[];
  items: RedlineItem[];
  showQuantity?: boolean;
  canReview: boolean;
  busy?: boolean;
  onReview: (itemId: string, decision: string, value: number | undefined, comment: string | undefined) => void;
  onBulkApprove: () => void;
}) {
  const { items, showQuantity, canReview } = props;
  const [filter, setFilter] = useState<RowFilter>("all");
  const [revise, setRevise] = useState<RedlineItem | null>(null);
  const [val, setVal] = useState("");
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const changedCount = items.filter((i) => i.layers.some((l) => l.decision === "REVISED" || l.decision === "REJECTED")).length;
  const filtered = items.filter((i) => {
    if (filter === "changed") return i.layers.some((l) => l.decision === "REVISED" || l.decision === "REJECTED");
    if (filter === "needs_comment") return i.layers.some((l) => l.decision === "NEEDS_EXPLANATION");
    return true;
  });

  function submitRevise() {
    if (!comment.trim()) { setErr("ثبت دلیل اصلاح الزامی است"); return; }
    if (revise) props.onReview(revise.id, "REVISED", Number(val.replace(/[^\d.]/g, "")) || 0, comment);
    setRevise(null); setVal(""); setComment(""); setErr(null);
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader title={props.title} subtitle={props.subtitle} action={props.headerAction} />
      {props.summary && <PaymentReviewSummary data={props.summary} netPayable={props.netPayable} />}
      {props.sequence?.length > 0 && <CalculationSequenceRail stages={props.sequence} />}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <Filter className="size-3.5 text-muted-foreground" />
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>همه ({toFa(items.length)})</FilterChip>
        <FilterChip active={filter === "changed"} onClick={() => setFilter("changed")}>تغییریافته ({toFa(changedCount)})</FilterChip>
        <FilterChip active={filter === "needs_comment"} onClick={() => setFilter("needs_comment")}>نیازمند توضیح</FilterChip>
        {canReview && (
          <Button size="sm" variant="outline" className="ms-auto gap-1.5" onClick={props.onBulkApprove} disabled={props.busy}>
            {props.busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />} تایید همه بدون تغییر
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[auto_2fr_1fr_1.4fr_auto] gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground md:grid">
          <span>کد</span><span>شرح</span><span>واحد</span><span className="text-end">مقادیر رسیدگی</span><span className="text-center">اقدام</span>
        </div>
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="p-4"><EmptyState title="ردیفی برای نمایش نیست" /></div>
          ) : filtered.map((it) => (
            <div key={it.id} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[auto_2fr_1fr_1.4fr_auto] md:items-center">
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">{it.code}</span>
              <span className="text-sm">{it.description}</span>
              <span className="text-xs text-muted-foreground">{it.unit}</span>
              <div className="md:flex md:justify-end"><ReviewValueCell contractor={it.contractor} layers={it.layers} showQuantity={showQuantity} /></div>
              <div className="flex items-center justify-end gap-1 md:justify-center">
                {canReview && (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-emerald-600" onClick={() => props.onReview(it.id, "APPROVED_AS_IS", undefined, undefined)}>
                      <CheckCheck className="size-3.5" /> تایید
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-amber-600" onClick={() => {
                      setRevise(it);
                      const base = showQuantity ? it.contractor.quantity : it.contractor.amount;
                      setVal(String(Math.round(Number(base ?? 0)))); setComment(""); setErr(null);
                    }}>
                      <Pencil className="size-3.5" /> اصلاح
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!revise} onOpenChange={(o) => !o && setRevise(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>اصلاح {showQuantity ? "مقدار" : "مبلغ"} ردیف</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{revise?.description}</div>
            <div className="space-y-1.5">
              <Label>{showQuantity ? "مقدار اصلاح‌شده" : "مبلغ اصلاح‌شده (ریال)"}</Label>
              <Input value={val} onChange={(e) => setVal(e.target.value)} dir="ltr" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>دلیل اصلاح (الزامی)</Label>
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="مثلاً اصلاح مطابق صورت‌جلسه" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevise(null)}>انصراف</Button>
            <Button onClick={submitRevise} disabled={props.busy}>{props.busy && <Loader2 className="size-4 animate-spin" />} ثبت اصلاح</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full px-2.5 py-1 text-xs transition-colors", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
      {children}
    </button>
  );
}
