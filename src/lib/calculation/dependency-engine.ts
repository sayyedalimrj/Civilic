/**
 * dependency-engine.ts — موتور سبک وابستگی/بازمحاسبه‌ی Civilic.
 *
 * مراحل (مطابق توالی تکسا — docs/texsa-calculation-sequence.md):
 *  CONTRACT → PRICE_LIST → PRICE_LIST_ITEM → MEASUREMENT_DETAIL → MEASUREMENT_SUMMARY
 *  → FINANCIAL_SHEET → PAYMENT_CERTIFICATE → (DEDUCTION | ADJUSTMENT) → TRANSPORT → EXPORT
 *
 * قاعده: تغییر یک مرحله، مراحل پایین‌دست را STALE می‌کند (مگر LOCKED).
 * برای پروژه‌های واردشده از تکسا، مقادیر import شده source of truth می‌مانند و parity = NEEDS_TEXSA_PARITY_REVIEW
 * تا زمانی که محاسبه‌ی Civilic با parity تکسا تأیید شود.
 */
import { db } from "@/lib/db";

export type CalcStage =
  | "CONTRACT" | "PRICE_LIST" | "PRICE_LIST_ITEM" | "MEASUREMENT_DETAIL" | "MEASUREMENT_SUMMARY"
  | "FINANCIAL_SHEET" | "PAYMENT_CERTIFICATE" | "DEDUCTION" | "ADJUSTMENT" | "TRANSPORT" | "EXPORT";

export type CalcStatus = "FRESH" | "STALE" | "NEEDS_REVIEW" | "LOCKED";
export type CalcParity = "IMPORTED_FROM_TEXSA" | "CIVILIC_CALCULATED" | "NEEDS_TEXSA_PARITY_REVIEW";

/** ترتیب خطی مراحل و وابستگی هر مرحله به بالادست */
export const STAGE_ORDER: CalcStage[] = [
  "CONTRACT", "PRICE_LIST", "PRICE_LIST_ITEM", "MEASUREMENT_DETAIL", "MEASUREMENT_SUMMARY",
  "FINANCIAL_SHEET", "PAYMENT_CERTIFICATE", "DEDUCTION", "ADJUSTMENT", "TRANSPORT", "EXPORT",
];

export const STAGE_DEPENDS_ON: Record<CalcStage, CalcStage[]> = {
  CONTRACT: [],
  PRICE_LIST: ["CONTRACT"],
  PRICE_LIST_ITEM: ["PRICE_LIST"],
  MEASUREMENT_DETAIL: ["PRICE_LIST_ITEM"],
  MEASUREMENT_SUMMARY: ["MEASUREMENT_DETAIL"],
  FINANCIAL_SHEET: ["MEASUREMENT_SUMMARY", "PRICE_LIST_ITEM"],
  PAYMENT_CERTIFICATE: ["FINANCIAL_SHEET"],
  DEDUCTION: ["PAYMENT_CERTIFICATE"],
  ADJUSTMENT: ["PAYMENT_CERTIFICATE"],
  TRANSPORT: ["MEASUREMENT_DETAIL"],
  EXPORT: ["PAYMENT_CERTIFICATE", "DEDUCTION", "ADJUSTMENT"],
};

export const STAGE_LABELS_FA: Record<CalcStage, string> = {
  CONTRACT: "پیمان", PRICE_LIST: "فهرست‌بها", PRICE_LIST_ITEM: "اقلام فهرست‌بها",
  MEASUREMENT_DETAIL: "ریزمتره", MEASUREMENT_SUMMARY: "خلاصه متره", FINANCIAL_SHEET: "برگه مالی",
  PAYMENT_CERTIFICATE: "صورت‌وضعیت", DEDUCTION: "کسورات", ADJUSTMENT: "تعدیل", TRANSPORT: "حمل", EXPORT: "خروجی",
};

export const STATUS_LABELS_FA: Record<CalcStatus, string> = {
  FRESH: "آماده", STALE: "نیازمند بروزرسانی", NEEDS_REVIEW: "نیازمند رسیدگی", LOCKED: "قفل‌شده",
};

/** مرحله‌هایی که مستقیماً به یک مرحله وابسته‌اند (پایین‌دست). */
export function directDependents(stage: CalcStage): CalcStage[] {
  return STAGE_ORDER.filter((s) => STAGE_DEPENDS_ON[s].includes(stage));
}

/** همه‌ی مراحل پایین‌دست (بازگشتی). */
export function allDependents(stage: CalcStage): CalcStage[] {
  const out = new Set<CalcStage>();
  const walk = (s: CalcStage) => {
    for (const d of directDependents(s)) {
      if (!out.has(d)) { out.add(d); walk(d); }
    }
  };
  walk(stage);
  return [...out];
}

/** ایجاد/به‌روزرسانی گره‌ی محاسبه‌ی یک مرحله */
export async function upsertNode(projectId: string, stage: CalcStage, data: Partial<{ status: CalcStatus; parity: CalcParity; entityType: string; entityId: string; texsaSourceRowId: string | null; staleReason: string | null; lastCalculatedBy: string | null }> = {}) {
  return db.calculationNode.upsert({
    where: { projectId_stage: { projectId, stage } },
    create: {
      projectId, stage, entityType: data.entityType ?? stage, entityId: data.entityId ?? `${projectId}:${stage}`,
      status: data.status ?? "FRESH", parity: data.parity ?? "CIVILIC_CALCULATED",
      dependsOnJson: JSON.stringify(STAGE_DEPENDS_ON[stage]), texsaSourceRowId: data.texsaSourceRowId ?? null,
      staleReason: data.staleReason ?? null, lastCalculatedAt: new Date(), lastCalculatedBy: data.lastCalculatedBy ?? null,
    },
    update: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.parity ? { parity: data.parity } : {}),
      ...(data.staleReason !== undefined ? { staleReason: data.staleReason } : {}),
      ...(data.lastCalculatedBy !== undefined ? { lastCalculatedBy: data.lastCalculatedBy } : {}),
    },
  });
}

/** علامت‌گذاری مراحل پایین‌دست به‌عنوان STALE (به‌جز قفل‌شده‌ها). */
export async function markDependentsStale(projectId: string, stage: CalcStage, reason?: string): Promise<CalcStage[]> {
  const deps = allDependents(stage);
  const affected: CalcStage[] = [];
  for (const d of deps) {
    const node = await db.calculationNode.findUnique({ where: { projectId_stage: { projectId, stage: d } } });
    if (node?.status === "LOCKED") continue; // اسناد قفل‌شده دست‌نخورده می‌مانند
    await upsertNode(projectId, d, { status: "STALE", staleReason: reason ?? `تغییر در مرحله‌ی «${STAGE_LABELS_FA[stage]}»` });
    affected.push(d);
  }
  return affected;
}

/** وضعیت کامل محاسبات یک پروژه (برای ریل توالی در UI). */
export async function getCalculationStatus(projectId: string) {
  const nodes = await db.calculationNode.findMany({ where: { projectId } });
  const byStage = new Map(nodes.map((n) => [n.stage, n]));
  return STAGE_ORDER.map((stage) => {
    const n = byStage.get(stage);
    return {
      stage,
      label: STAGE_LABELS_FA[stage],
      status: (n?.status as CalcStatus) ?? "FRESH",
      statusLabel: STATUS_LABELS_FA[(n?.status as CalcStatus) ?? "FRESH"],
      parity: (n?.parity as CalcParity) ?? "CIVILIC_CALCULATED",
      dependsOn: STAGE_DEPENDS_ON[stage].map((s) => STAGE_LABELS_FA[s]),
      staleReason: n?.staleReason ?? null,
      lastCalculatedAt: n?.lastCalculatedAt ?? null,
    };
  });
}

export async function explainStaleReason(projectId: string, stage: CalcStage): Promise<string | null> {
  const n = await db.calculationNode.findUnique({ where: { projectId_stage: { projectId, stage } } });
  return n?.staleReason ?? null;
}

// ─────────────────────────────────────────────────────────────
//  بازمحاسبه‌ها (محافظه‌کارانه؛ مقادیر تکسا source of truth می‌مانند)
// ─────────────────────────────────────────────────────────────

/** خلاصه‌متره: تجمیع DetailBoq بر اساس کد → SummaryBoq.totalQuantity */
export async function recalculateMeasurementSummary(projectId: string, by?: string) {
  const details = await db.detailBoq.findMany({ where: { projectId }, include: { reviews: { where: { isEffective: true } } } });
  const byCode = new Map<string, number>();
  for (const d of details) {
    // مقدار مؤثر: آخرین لایه‌ی رسیدگی با بالاترین طرف، وگرنه مقدار پیمانکار
    const employer = d.reviews.find((r) => r.partyType === "EMPLOYER" && r.quantity != null);
    const consultant = d.reviews.find((r) => r.partyType === "CONSULTANT" && r.quantity != null);
    const qty = employer?.quantity ?? consultant?.quantity ?? d.quantity;
    byCode.set(d.code, (byCode.get(d.code) ?? 0) + qty);
  }
  for (const [code, qty] of byCode) {
    const existing = await db.summaryBoq.findFirst({ where: { projectId, code } });
    if (existing) await db.summaryBoq.update({ where: { id: existing.id }, data: { totalQuantity: qty } });
  }
  const hasTexsa = details.some((d) => d.recordSource === "TEXSA");
  await upsertNode(projectId, "MEASUREMENT_SUMMARY", { status: "FRESH", parity: hasTexsa ? "NEEDS_TEXSA_PARITY_REVIEW" : "CIVILIC_CALCULATED", lastCalculatedBy: by ?? null });
  await markDependentsStale(projectId, "MEASUREMENT_SUMMARY", "خلاصه‌متره بازمحاسبه شد");
  return { codes: byCode.size };
}

/** برگه مالی: FRESH شدن مرحله (محاسبه‌ی ریالی کامل = parity تکسا، در نسخه‌ی بعد). */
export async function recalculateFinancialSheet(projectId: string, by?: string) {
  const items = await db.financialSheetItem.count({ where: { projectId } });
  const hasTexsa = (await db.financialSheetItem.findFirst({ where: { projectId, recordSource: "TEXSA" } })) != null;
  await upsertNode(projectId, "FINANCIAL_SHEET", { status: "FRESH", parity: hasTexsa ? "NEEDS_TEXSA_PARITY_REVIEW" : "CIVILIC_CALCULATED", lastCalculatedBy: by ?? null });
  await markDependentsStale(projectId, "FINANCIAL_SHEET", "برگه مالی بازمحاسبه شد");
  return { items };
}

/** مجموع صورت‌وضعیت: جمع مبلغ مؤثر اقلام و کسر کسورات → خالص قابل پرداخت. */
export async function recalculatePaymentTotals(paymentId: string, by?: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { items: true } });
  if (!payment) return null;
  if (payment.status === "LOCKED") return { locked: true };
  const gross = payment.items.reduce((s, it) => s + (it.adjustedAmount || it.executedAmount || 0), 0);
  const guarantee = gross * 0.05;
  const insurance = gross * 0.02;
  const tax = gross * 0.05;
  const net = gross - guarantee - insurance - tax;
  await db.payment.update({ where: { id: paymentId }, data: { executedAmount: gross, guarantee, insurance, tax, netPayable: net } });
  await upsertNode(payment.projectId, "PAYMENT_CERTIFICATE", { status: "FRESH", lastCalculatedBy: by ?? null });
  await markDependentsStale(payment.projectId, "PAYMENT_CERTIFICATE", "مبالغ صورت‌وضعیت بازمحاسبه شد");
  return { gross, net };
}

/** کسورات صورت‌وضعیت (محافظه‌کارانه؛ از درصدهای موجود). */
export async function recalculateDeductions(paymentId: string, by?: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "LOCKED") return null;
  await upsertNode(payment.projectId, "DEDUCTION", { status: "FRESH", lastCalculatedBy: by ?? null });
  return { ok: true };
}

/** تعدیل: مبنا = مبلغ کارکرد تأییدشده‌ی صورت‌وضعیت مرتبط. */
export async function recalculateAdjustment(adjustmentId: string, by?: string) {
  const row = await db.adjustmentReportRow.findUnique({ where: { id: adjustmentId } });
  if (!row) return null;
  const factor = row.baseIndex > 0 ? row.currentIndex / row.baseIndex : 1;
  const amount = row.workPeriodAmount * (factor - 1);
  await db.adjustmentReportRow.update({ where: { id: adjustmentId }, data: { adjustmentFactor: factor, adjustmentAmount: amount } });
  await upsertNode(row.projectId, "ADJUSTMENT", { status: "FRESH", lastCalculatedBy: by ?? null });
  return { factor, amount };
}
