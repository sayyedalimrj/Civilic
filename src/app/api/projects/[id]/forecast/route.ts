import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/forecast — پیش‌بینی هوشمند پروژه
// بر اساس داده‌های تاریخی، روند اجرا و ریسک‌ها
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        orderBy: { periodNo: "asc" },
        select: { periodNo: true, executedAmount: true, netPayable: true, updatedAt: true },
      },
      risks: {
        where: { status: { not: "CLOSED" } },
        select: { severity: true, probability: true, impact: true, estimatedCost: true },
      },
      changeOrders: {
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        select: { costImpact: true, scheduleImpact: true },
      },
      financialSheet: {
        select: { totalAmount: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  const contractAmount = project.contractAmount || 0;
  const executedAmount = project.payments.reduce((s, p) => s + p.executedAmount, 0);
  const remainingAmount = contractAmount - executedAmount;

  // محاسبه‌ی نرخ اجرا (میانگین per period)
  const periods = project.payments.length;
  const avgRatePerPeriod = periods > 0 ? executedAmount / periods : 0;

  // پیش‌بینی تکمیل (بر اساس نرخ فعلی)
  const estimatedRemainingPeriods = avgRatePerPeriod > 0
    ? Math.ceil(remainingAmount / avgRatePerPeriod)
    : 0;

  // پیش‌بینی تاریخ تکمیل (بر اساس تاریخ آخرین صورت‌وضعیت)
  const lastPaymentDate = project.payments[project.payments.length - 1]?.updatedAt || new Date();
  const estimatedCompletionDate = new Date(lastPaymentDate);
  estimatedCompletionDate.setMonth(estimatedCompletionDate.getMonth() + Math.max(1, estimatedRemainingPeriods));

  // تأثیر ریسک‌ها بر پیش‌بینی
  const totalRiskCost = project.risks.reduce((s, r) => s + r.estimatedCost, 0);
  const avgRiskScore = project.risks.length > 0
    ? project.risks.reduce((s, r) => s + r.probability * r.impact, 0) / project.risks.length
    : 0;

  // تأثیر تغییرات در انتظار
  const pendingChangeCost = project.changeOrders.reduce((s, c) => s + c.costImpact, 0);
  const pendingChangeDelay = project.changeOrders.reduce((s, c) => s + c.scheduleImpact, 0);

  // سناریوهای پیش‌بینی
  const scenarios = {
    optimistic: {
      label: "خوش‌بینانه",
      finalCost: contractAmount + totalRiskCost * 0.3 + pendingChangeCost * 0.5,
      completionDate: new Date(estimatedCompletionDate.getTime() - 30 * 86400000),
      probability: 25,
      description: "در صورت حل سریع ریسک‌ها و تأیید تغییرات",
    },
    realistic: {
      label: "واقع‌بینانه",
      finalCost: contractAmount + totalRiskCost * 0.6 + pendingChangeCost * 0.8,
      completionDate: estimatedCompletionDate,
      probability: 50,
      description: "بر اساس روند فعلی و تأثیر متوسط ریسک‌ها",
    },
    pessimistic: {
      label: "بدبینانه",
      finalCost: contractAmount + totalRiskCost + pendingChangeCost + remainingAmount * 0.1,
      completionDate: new Date(estimatedCompletionDate.getTime() + 60 * 86400000),
      probability: 25,
      description: "در صورت تحقق تمام ریسک‌ها و تأخیر در تغییرات",
    },
  };

  // توصیه‌های هوشمند
  const recommendations: Array<{ type: string; priority: string; message: string }> = [];

  if (avgRiskScore > 0.5) {
    recommendations.push({
      type: "RISK",
      priority: "HIGH",
      message: "میانگین امتیاز ریسک بالا است — نیاز به اقدام فوری برای کاهش ریسک‌های بحرانی",
    });
  }

  if (estimatedRemainingPeriods > 12) {
    recommendations.push({
      type: "SCHEDULE",
      priority: "MEDIUM",
      message: `تخمین تکمیل ${estimatedRemainingPeriods} دوره — بررسی امکان تسریع`,
    });
  }

  if (pendingChangeCost > contractAmount * 0.1) {
    recommendations.push({
      type: "COST",
      priority: "HIGH",
      message: `تأثیر مالی تغییرات در انتظار (${pendingChangeCost.toLocaleString()} ریال) بیش از ۱۰٪ پیمان است`,
    });
  }

  if (pendingChangeDelay > 30) {
    recommendations.push({
      type: "SCHEDULE",
      priority: "MEDIUM",
      message: `تأخیر احتمالی ${pendingChangeDelay} روز ناشی از تغییرات در انتظار`,
    });
  }

  if (remainingAmount < contractAmount * 0.2 && project.status === "ACTIVE") {
    recommendations.push({
      type: "COMPLETION",
      priority: "LOW",
      message: "پروژه نزدیک تکمیل است — آماده‌سازی مستندات تحویل موقت",
    });
  }

  // سری زمانی پیش‌بینی
  const forecastSeries: Array<{ period: string; planned: number; forecast: number }> = [];
  let cumulative = executedAmount;
  for (let i = 1; i <= Math.min(8, estimatedRemainingPeriods + 2); i++) {
    const periodLabel = `دوره ${periods + i}`;
    // منحنی S برای planned
    const t = (periods + i) / (periods + estimatedRemainingPeriods);
    const plannedPercent = 100 * (1 - Math.cos(Math.PI * t)) / 2;
    const plannedCumulative = (plannedPercent / 100) * contractAmount;

    // پیش‌بینی با درنظرگرفتن ریسک
    const forecastIncrement = avgRatePerPeriod * (1 - avgRiskScore * 0.3);
    cumulative += forecastIncrement;
    const forecastCumulative = Math.min(cumulative, contractAmount);

    forecastSeries.push({
      period: periodLabel,
      planned: Math.round(plannedCumulative),
      forecast: Math.round(forecastCumulative),
    });
  }

  return NextResponse.json({
    project: { id: project.id, name: project.name, code: project.code, contractAmount },
    current: {
      executedAmount,
      remainingAmount,
      progress: contractAmount > 0 ? (executedAmount / contractAmount) * 100 : 0,
      avgRatePerPeriod,
      periods,
    },
    forecast: {
      estimatedRemainingPeriods,
      estimatedCompletionDate: estimatedCompletionDate.toISOString(),
      totalRiskCost,
      avgRiskScore,
      pendingChangeCost,
      pendingChangeDelay,
    },
    scenarios,
    forecastSeries,
    recommendations,
  });
}
