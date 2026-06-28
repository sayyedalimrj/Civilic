import { cn } from "@/lib/utils";
import { PARTY_COLOR, DECISION_LABEL, type ReviewParty, type ReviewDecision } from "@/lib/review/layers";

interface PartyReviewBadgeProps {
  party: ReviewParty;
  decision?: ReviewDecision;
  className?: string;
}

/** نشان هویت طرف + تصمیم رسیدگی (با رنگ طرف). */
export function PartyReviewBadge({ party, decision, className }: PartyReviewBadgeProps) {
  const c = PARTY_COLOR[party];
  const revised = decision === "REVISED" || decision === "REJECTED";
  const label =
    decision === "REVISED" ? `اصلاح ${c.label}`
    : decision === "REJECTED" ? `رد ${c.label}`
    : decision === "NEEDS_EXPLANATION" ? `توضیح ${c.label}`
    : `تایید ${c.label}`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset", c.bg, c.text, c.ring, className)}>
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {decision ? label : c.label}
      {revised && decision && <span className="sr-only">{DECISION_LABEL[decision]}</span>}
    </span>
  );
}
