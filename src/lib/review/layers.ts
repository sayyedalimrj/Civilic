/**
 * layers.ts — منطق خالص لایه‌های رسیدگی (redline). بدون وابستگی به db؛ قابل استفاده در سرور و UI.
 *
 * نگاشت به تکسا: CONTRACTOR=_type 0 | CONSULTANT=_type 1/2 | EMPLOYER=_type 4
 * مقدار «مؤثر» = آخرین لایه‌ی معتبر با بالاترین اولویت طرف در مرحله‌ی جاری.
 */

export type ReviewParty = "CONTRACTOR" | "CONSULTANT" | "EMPLOYER";
export type ReviewDecision = "APPROVED_AS_IS" | "REVISED" | "REJECTED" | "NEEDS_EXPLANATION";

export const PARTY_PRIORITY: Record<ReviewParty, number> = { CONTRACTOR: 0, CONSULTANT: 1, EMPLOYER: 2 };

/** رنگ هویتی هر طرف (مطابق الزام: پیمانکار آبی/خنثی، مشاور قرمز، کارفرما سبز) */
export const PARTY_COLOR: Record<ReviewParty, { key: string; text: string; ring: string; bg: string; dot: string; label: string }> = {
  CONTRACTOR: { key: "contractor", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-900", bg: "bg-blue-50 dark:bg-blue-950/40", dot: "bg-blue-500", label: "پیمانکار" },
  CONSULTANT: { key: "consultant", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-900", bg: "bg-rose-50 dark:bg-rose-950/40", dot: "bg-rose-500", label: "مشاور" },
  EMPLOYER: { key: "employer", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-900", bg: "bg-emerald-50 dark:bg-emerald-950/40", dot: "bg-emerald-500", label: "کارفرما" },
};

export const DECISION_LABEL: Record<ReviewDecision, string> = {
  APPROVED_AS_IS: "تایید بدون تغییر",
  REVISED: "اصلاح‌شده",
  REJECTED: "رد/خط‌خورده",
  NEEDS_EXPLANATION: "نیاز به توضیح",
};

export interface ReviewLayer {
  partyType: ReviewParty;
  decision: ReviewDecision;
  quantity?: number | null;
  unitPrice?: number | null;
  amount?: number | null;
  comment?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | Date | null;
  isEffective?: boolean;
}

export interface EffectiveValue {
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  byParty: ReviewParty;
  decision: ReviewDecision;
}

/**
 * مقدار مؤثر را از روی لایه‌ها محاسبه می‌کند.
 * اولویت: بالاترین طرفِ دارای لایه‌ی معتبر (کارفرما > مشاور > پیمانکار).
 * REJECTED → مبلغ صفر. APPROVED_AS_IS → مقدار از لایه‌ی پایین‌تر به‌ارث می‌رسد اگر این لایه عددی نداشته باشد.
 */
export function resolveEffective(contractorBase: { quantity?: number | null; unitPrice?: number | null; amount?: number | null }, layers: ReviewLayer[]): EffectiveValue {
  // لایه‌ی پایه‌ی پیمانکار
  let eff: EffectiveValue = {
    quantity: contractorBase.quantity ?? null,
    unitPrice: contractorBase.unitPrice ?? null,
    amount: contractorBase.amount ?? null,
    byParty: "CONTRACTOR",
    decision: "APPROVED_AS_IS",
  };
  const sorted = [...layers]
    .filter((l) => l.isEffective !== false)
    .sort((a, b) => PARTY_PRIORITY[a.partyType] - PARTY_PRIORITY[b.partyType]);
  for (const l of sorted) {
    if (l.decision === "REJECTED") {
      eff = { quantity: 0, unitPrice: eff.unitPrice, amount: 0, byParty: l.partyType, decision: "REJECTED" };
      continue;
    }
    eff = {
      quantity: l.quantity ?? eff.quantity,
      unitPrice: l.unitPrice ?? eff.unitPrice,
      amount: l.amount ?? eff.amount,
      byParty: l.partyType,
      decision: l.decision,
    };
  }
  return eff;
}

export interface DisplayLayer {
  partyType: ReviewParty;
  decision: ReviewDecision;
  amount: number | null;
  quantity: number | null;
  /** آیا این مقدار توسط لایه‌ی بالاتر اصلاح/باطل شده (نمایش خط‌خورده) */
  superseded: boolean;
  comment?: string | null;
  reviewerName?: string | null;
}

/** پشته‌ی نمایش لایه‌ها برای UI (با علامت‌گذاری خط‌خورده). */
export function buildDisplayStack(
  contractorBase: { quantity?: number | null; amount?: number | null },
  layers: ReviewLayer[]
): DisplayLayer[] {
  const stack: DisplayLayer[] = [
    { partyType: "CONTRACTOR", decision: "APPROVED_AS_IS", amount: contractorBase.amount ?? null, quantity: contractorBase.quantity ?? null, superseded: false },
  ];
  const sorted = [...layers].filter((l) => l.isEffective !== false).sort((a, b) => PARTY_PRIORITY[a.partyType] - PARTY_PRIORITY[b.partyType]);
  for (const l of sorted) {
    stack.push({
      partyType: l.partyType,
      decision: l.decision,
      amount: l.amount ?? null,
      quantity: l.quantity ?? null,
      superseded: false,
      comment: l.comment,
      reviewerName: l.reviewerName,
    });
  }
  // هر لایه‌ای که لایه‌ی «اصلاح‌کننده» بعد از خود دارد، خط‌خورده می‌شود
  for (let i = 0; i < stack.length - 1; i++) {
    const laterRevises = stack.slice(i + 1).some((s) => s.decision === "REVISED" || s.decision === "REJECTED");
    if (laterRevises) stack[i].superseded = true;
  }
  return stack;
}

export function partyColorKey(p: ReviewParty): string {
  return PARTY_COLOR[p].key;
}
