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

  // علامت‌گذاری مراحل پایین‌دست (کسورات/تعدیل/خروجی) به‌عنوان نیازمند بروزرسانی
  const pay = await db.payment.findUnique({ where: { id: item.paymentId }, select: { projectId: true, status: true } });
  if (pay && pay.status !== "LOCKED") {
    await markDependentsStale(pay.projectId, "PAYMENT_CERTIFICATE", "رسیدگی ردیفی صورت‌وضعیت").catch(() => {});
  }

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


import { markDependentsStale } from "@/lib/calculation/dependency-engine";

// ─────────────────────────────────────────────────────────────
//  تعدیل (Adjustment) — لایه‌های رسیدگی
// ─────────────────────────────────────────────────────────────
export interface AddAdjustmentReviewInput {
  rowId: string;
  partyType: ReviewParty;
  reviewStage: string;
  decision: ReviewDecision;
  adjustmentAmount?: number | null;
  indexValue?: number | null;
  coefficient?: number | null;
  comment?: string | null;
  userId?: string;
  userName?: string;
}

export async function addAdjustmentItemReview(input: AddAdjustmentReviewInput) {
  const row = await db.adjustmentReportRow.findUnique({ where: { id: input.rowId }, include: { reviews: true } });
  if (!row) throw new Error("ردیف تعدیل یافت نشد");

  const prev = row.reviews.find((r) => r.partyType === input.partyType && r.isEffective);
  if (prev) await db.adjustmentItemReview.update({ where: { id: prev.id }, data: { isEffective: false } });

  const review = await db.adjustmentItemReview.create({
    data: {
      adjustmentItemId: row.id,
      partyType: input.partyType,
      reviewerUserId: input.userId ?? null,
      reviewerName: input.userName ?? null,
      reviewStage: input.reviewStage,
      decision: input.decision,
      baseAmount: row.workPeriodAmount,
      indexValue: input.indexValue ?? null,
      coefficient: input.coefficient ?? null,
      adjustmentAmount: input.adjustmentAmount ?? null,
      comment: input.comment ?? null,
      colorKey: partyColorKey(input.partyType),
      source: "REVIEW",
      previousReviewId: prev?.id ?? null,
      isEffective: true,
    },
  });
  await logChange("ADJUSTMENT_ITEM", row.id, "adjustmentAmount", row.adjustmentAmount, input.adjustmentAmount, input.userId, input.partyType, input.comment ?? undefined);
  await markDependentsStale(row.projectId, "ADJUSTMENT", "رسیدگی تعدیل به‌روزرسانی شد").catch(() => {});
  return { review };
}

export async function adjustmentReviewSummary(projectId: string, adjustmentType = "TEMPORARY") {
  const rows = await db.adjustmentReportRow.findMany({ where: { projectId, adjustmentType }, include: { reviews: { where: { isEffective: true } } } });
  let contractor = 0, consultant = 0, employer = 0;
  for (const r of rows) {
    const base = r.adjustmentAmount || 0;
    contractor += base;
    const c = r.reviews.find((x) => x.partyType === "CONSULTANT");
    const e = r.reviews.find((x) => x.partyType === "EMPLOYER");
    consultant += c?.adjustmentAmount ?? base;
    employer += e?.adjustmentAmount ?? c?.adjustmentAmount ?? base;
  }
  return { contractorClaimed: contractor, consultantReviewed: consultant, employerFinal: employer, consultantDiff: consultant - contractor, employerDiff: employer - consultant };
}

// ─────────────────────────────────────────────────────────────
//  متره (Measurement / ریزمتره) — لایه‌های رسیدگی
// ─────────────────────────────────────────────────────────────
export interface AddMeasurementReviewInput {
  itemId: string;
  partyType: ReviewParty;
  decision: ReviewDecision;
  quantity?: number | null;
  formula?: string | null;
  comment?: string | null;
  userId?: string;
  userName?: string;
}

export async function addMeasurementItemReview(input: AddMeasurementReviewInput) {
  const item = await db.detailBoq.findUnique({ where: { id: input.itemId }, include: { reviews: true } });
  if (!item) throw new Error("ردیف متره یافت نشد");

  const prev = item.reviews.find((r) => r.partyType === input.partyType && r.isEffective);
  if (prev) await db.measurementItemReview.update({ where: { id: prev.id }, data: { isEffective: false } });

  const review = await db.measurementItemReview.create({
    data: {
      measurementItemId: item.id,
      partyType: input.partyType,
      reviewerUserId: input.userId ?? null,
      reviewerName: input.userName ?? null,
      decision: input.decision,
      quantity: input.quantity ?? null,
      formula: input.formula ?? null,
      comment: input.comment ?? null,
      colorKey: partyColorKey(input.partyType),
      source: "REVIEW",
      previousReviewId: prev?.id ?? null,
      isEffective: true,
    },
  });
  await logChange("MEASUREMENT_ITEM", item.id, "quantity", item.quantity, input.quantity, input.userId, input.partyType, input.comment ?? undefined);
  // تغییر ریزمتره → خلاصه/برگه مالی/صورت‌وضعیت/تعدیل stale
  await markDependentsStale(item.projectId, "MEASUREMENT_DETAIL", "رسیدگی/اصلاح ریزمتره").catch(() => {});
  return { review };
}

export async function measurementReviewSummary(projectId: string) {
  const items = await db.detailBoq.findMany({ where: { projectId }, include: { reviews: { where: { isEffective: true } } } });
  let reviewed = 0, revised = 0;
  for (const it of items) {
    if (it.reviews.length) reviewed++;
    if (it.reviews.some((r) => r.decision === "REVISED" || r.decision === "REJECTED")) revised++;
  }
  return { total: items.length, reviewed, revised };
}
