// ═══════════════════════════════════════════════════════════
//  Cascade Engine — موتور محاسبات زنجیره‌ای
//  هر تابع Pure است: ورودی → خروجی، بدون side-effect
// ═══════════════════════════════════════════════════════════

export interface Coefficients {
  general: number;
  regional: number;
  altitude: number;
  floors: number;
  tunnelHardship: number;
}

export interface DetailBoqRow {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}

export interface SummaryBoqRow {
  code: string;
  description: string;
  unit: string;
  totalQuantity: number;
}

export interface AnalysisResult {
  labor: number;
  equipment: number;
  material: number;
  transport: number;
  total: number;
}

// ─── مرحله ۱: تجمیع ریزمتره → خلاصه متره ───
export function recomputeSummary(details: DetailBoqRow[]): SummaryBoqRow[] {
  const map = new Map<string, SummaryBoqRow>();
  for (const d of details) {
    const existing = map.get(d.code);
    if (existing) {
      existing.totalQuantity += d.quantity;
    } else {
      map.set(d.code, {
        code: d.code,
        description: d.description,
        unit: d.unit,
        totalQuantity: d.quantity,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

// ─── مرحله ۲: محاسبه‌ی برگه مالی ───
export function computeFinancialRow(
  summary: SummaryBoqRow,
  unitPrice: number,
  coeffs: Coefficients
): { total: number; adjustedTotal: number; analysis: AnalysisResult } {
  const combinedCoeff =
    coeffs.general *
    coeffs.regional *
    coeffs.altitude *
    coeffs.floors *
    (coeffs.tunnelHardship > 1 ? coeffs.tunnelHardship : 1);

  const baseTotal = summary.totalQuantity * unitPrice;
  const adjustedTotal = baseTotal * combinedCoeff;

  const analysis: AnalysisResult = {
    labor: adjustedTotal * 0.25,
    equipment: adjustedTotal * 0.15,
    material: adjustedTotal * 0.55,
    transport: adjustedTotal * 0.05,
    total: adjustedTotal,
  };

  return { total: baseTotal, adjustedTotal, analysis };
}

// ─── مرحله ۳: توزیع روی فصول ───
export function distributeToChapters(
  financialRows: { chapterNo: number; totalAmount: number }[]
): { chapterNo: number; amount: number; percent: number }[] {
  const total = financialRows.reduce((s, r) => s + r.totalAmount, 0);
  const map = new Map<number, number>();
  for (const r of financialRows) {
    map.set(r.chapterNo, (map.get(r.chapterNo) || 0) + r.totalAmount);
  }
  return Array.from(map.entries())
    .map(([chapterNo, amount]) => ({
      chapterNo,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => a.chapterNo - b.chapterNo);
}

// ─── مرحله ۴: محاسبه‌ی صورت‌وضعیت ───
export interface PaymentItemInput {
  totalQuantity: number;
  executedQuantity: number;
  unitPrice: number;
  adjustedAmount?: number;
}

export interface DeductionRates {
  guarantee: number;
  insurance: number;
  tax: number;
}

export function computePayment(
  items: PaymentItemInput[],
  deductions: DeductionRates
) {
  let executed = 0;
  let adjusted = 0;
  for (const it of items) {
    const execAmt = it.executedQuantity * it.unitPrice;
    executed += execAmt;
    adjusted += it.adjustedAmount ?? execAmt;
  }
  const baseForDeduction = adjusted;
  const guarantee = (baseForDeduction * deductions.guarantee) / 100;
  const insurance = (baseForDeduction * deductions.insurance) / 100;
  const tax = (baseForDeduction * deductions.tax) / 100;
  const netPayable = baseForDeduction - guarantee - insurance - tax;

  return {
    executedAmount: executed,
    adjustedAmount: adjusted,
    guarantee,
    insurance,
    tax,
    netPayable,
  };
}

// ─── مرحله ۴-ب: تعدیل با شاخص ───
export function applyAdjustment(
  baseAmount: number,
  indexFrom: number,
  indexTo: number
): number {
  if (indexFrom <= 0) return baseAmount;
  return baseAmount * (indexTo / indexFrom);
}

// ─── فرمول نزولی بها (بخشنامه ۴۹۵۱) ───
export function descendingPriceAdjustment(totalAmount: number, threshold = 0.8) {
  const belowThreshold = totalAmount * threshold;
  const adjustment = totalAmount - belowThreshold;
  return {
    belowThreshold,
    adjustment,
    finalAmount: belowThreshold,
  };
}

// ─── فرم آهن و سیمان — اعمال ضریب پرت ───
export function computeMaterialWithWaste(
  baseQuantity: number,
  wasteFactor: number = 1.0,
  deduction: number = 0
) {
  const netQuantity = baseQuantity * (1 - deduction / 100);
  const withWaste = netQuantity * wasteFactor;
  return { netQuantity, withWaste, finalQuantity: withWaste };
}

// ─── محاسبه‌ی مابه‌التفاوت حمل ───
export function computeTransportDiff(
  distance: number,
  unitRate: number,
  contractDistance: number = 0
) {
  const actualTransport = distance * unitRate;
  const baseTransport = contractDistance * unitRate;
  return {
    baseTransport,
    actualTransport,
    difference: actualTransport - baseTransport,
  };
}

// ─── ضریب ترکیبی پروژه ───
export function combinedCoefficient(coeffs: Coefficients): number {
  return (
    coeffs.general *
    coeffs.regional *
    coeffs.altitude *
    coeffs.floors *
    (coeffs.tunnelHardship || 1)
  );
}

// ─── محاسبه‌ی پیشرفت کلی پروژه ───
export function projectProgress(
  executedAmount: number,
  totalAmount: number
): number {
  if (totalAmount <= 0) return 0;
  return Math.min(100, (executedAmount / totalAmount) * 100);
}
