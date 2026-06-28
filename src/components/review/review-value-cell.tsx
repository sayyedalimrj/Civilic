"use client";

import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { faMoney } from "@/lib/fa";
import { buildDisplayStack, PARTY_COLOR, type ReviewLayer } from "@/lib/review/layers";

interface ReviewValueCellProps {
  contractor: { quantity?: number | null; amount?: number | null };
  layers: ReviewLayer[];
  /** نمایش مقدار به‌جای مبلغ */
  showQuantity?: boolean;
}

/**
 * سلول رسیدگی: لایه‌های طرف را روی‌هم نمایش می‌دهد.
 * مقدار اصلاح‌شده‌ی قبلی خط‌خورده و مقدار جدید با رنگ طرف نمایش داده می‌شود.
 */
export function ReviewValueCell({ contractor, layers, showQuantity }: ReviewValueCellProps) {
  const stack = buildDisplayStack(contractor, layers);
  const fmt = (v: number | null) => (showQuantity ? (v ?? 0).toLocaleString("fa-IR") : faMoney(v ?? 0));

  return (
    <div className="flex flex-col items-end gap-0.5">
      {stack.map((s, i) => {
        const c = PARTY_COLOR[s.partyType];
        const isContractor = s.partyType === "CONTRACTOR";
        return (
          <div key={i} className="flex items-center gap-1.5">
            {s.comment && <MessageSquareText className="size-3 text-muted-foreground" />}
            {!isContractor && (
              <span className={cn("rounded px-1 text-[9px] font-medium", c.bg, c.text)}>
                {s.decision === "REVISED" ? `اصلاح ${c.label}` : s.decision === "REJECTED" ? `رد ${c.label}` : c.label}
              </span>
            )}
            <span
              className={cn(
                "text-xs tabular-nums",
                s.superseded ? "text-muted-foreground line-through decoration-rose-400/70" : isContractor ? "text-foreground" : cn(c.text, "font-semibold")
              )}
            >
              {fmt(showQuantity ? s.quantity : s.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
