/**
 * service.ts — منطق سرور برای افزودن لایه‌ی رسیدگی (بدون overwrite مخرب).
 */
import { db } from "@/lib/db";
import { resolveEffective, type ReviewParty, type ReviewDecision, partyColorKey, type ReviewLayer } from "./layers";

export interface AddReviewInput {
  itemId: string;
  partyType: ReviewParty;
  reviewStage: string;
  decision: ReviewDecision;
  quantity?: number | null;
  unitPrice?: number | null;
  amount?: number | null;
  comment?: string | null;
  userId?: string;
  userName?: string;
}

function logChange(entityType: string, entityId: string, field: string, oldV: unknown, newV: unknown, userId?: string, party?: string, reason?: string) {
  return db.lineItemChangeLog.create({
    data: { entityType, entityId, fieldName: field, oldValue: oldV == null ? null : String(oldV), newValue: newV == null ? null : String(newV), actorUserId: userId ?? null, actorPartyType: party ?? null, reason: reason ?? null },
  });
}

/** افزودن/به‌روزرسانی لایه‌ی رسیدگی یک ردیف صورت‌وضعیت و بازمحاسبه‌ی مقدار مؤثر. */
export async function addPaymentItemReview(input: AddReviewInput) {
  const item = await db.paymentItem.findUnique({ where: { id: input.itemId }, include: { reviews: true } });
  if (!item) throw new Error("ردیف یافت نشد");

  // مبلغ از مقدار×بهای واحد در صورت نبود amount
  let amount = input.amount ?? null;
  if (amount == null && input.quantity != null) {
    const up = input.unitPrice ?? item.unitPrice;
    amount = input.quantity * up;
  }

  // لایه‌ی قبلی همان طرف را غیرمؤثر کن (حفظ تاریخچه)
  const prevSameParty = item.reviews.find((r) => r.partyType === input.partyType && r.isEffective);
  if (prevSameParty) {
    await db.paymentCertificateItemReview.update({ where: { id: prevSameParty.id }, data: { isEffective: false } });
  }

  const review = await db.paymentCertificateItemReview.create({
    data: {
      paymentCertificateItemId: item.id,
      partyType: input.partyType,
      reviewerUserId: input.userId ?? null,
      reviewerName: input.userName ?? null,
      reviewStage: input.reviewStage,
      decision: input.decision,
      quantity: input.quantity ?? null,
      unitPrice: input.unitPrice ?? null,
      amount,
      comment: input.comment ?? null,
      colorKey: partyColorKey(input.partyType),
      source: "REVIEW",
      previousReviewId: prevSameParty?.id ?? null,
      isEffective: true,
    },
  });

  await logChange("PAYMENT_ITEM", item.id, "amount", item.adjustedAmount || item.executedAmount, amount, input.userId, input.partyType, input.comment ?? undefined);

  // بازمحاسبه‌ی مقدار مؤثر از روی همه‌ی لایه‌های مؤثر
  const layers = await db.paymentCertificateItemReview.findMany({ where: { paymentCertificateItemId: item.id, isEffective: true } });
  const eff = resolveEffective(
    { quantity: item.executedQuantity, unitPrice: item.unitPrice, amount: item.executedAmount },
    layers.map((l) => ({ partyType: l.partyType as ReviewParty, decision: l.decision as ReviewDecision, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, isEffective: true } as ReviewLayer))
  );
  await db.paymentItem.update({
    where: { id: item.id },
    data: { adjustedAmount: eff.amount ?? item.executedAmount, isAdjusted: eff.byParty !== "CONTRACTOR" },
  });

  return { review, effective: eff };
}

/** تایید گروهی بدون تغییر برای همه‌ی ردیف‌های یک صورت‌وضعیت. */
export async function bulkApproveAsIs(paymentId: string, partyType: ReviewParty, reviewStage: string, userId?: string, userName?: string) {
  const items = await db.paymentItem.findMany({ where: { paymentId } });
  let count = 0;
  for (const it of items) {
    await addPaymentItemReview({ itemId: it.id, partyType, reviewStage, decision: "APPROVED_AS_IS", userId, userName });
    count++;
  }
  return { approved: count };
}

/** جمع‌بندی مبالغ سه‌لایه‌ای یک صورت‌وضعیت. */
export async function paymentReviewSummary(paymentId: string) {
  const items = await db.paymentItem.findMany({ where: { paymentId }, include: { reviews: { where: { isEffective: true } } } });
  let contractor = 0, consultant = 0, employer = 0;
  for (const it of items) {
    const base = it.executedAmount || 0;
    contractor += base;
    const c = it.reviews.find((r) => r.partyType === "CONSULTANT");
    const e = it.reviews.find((r) => r.partyType === "EMPLOYER");
    consultant += c?.amount ?? base;
    employer += e?.amount ?? c?.amount ?? base;
  }
  return {
    contractorClaimed: contractor,
    consultantReviewed: consultant,
    employerFinal: employer,
    consultantDiff: consultant - contractor,
    employerDiff: employer - consultant,
  };
}
