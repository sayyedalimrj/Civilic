import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/scurve — داده‌های نمودار S-Curve پیشرفت پروژه
// خروجی: سری زمانی برنامه‌ریزی‌شده (planned) و واقعی (actual) بر اساس صورت‌وضعیت‌ها
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { periodNo: "asc" },
        select: {
          periodNo: true,
          status: true,
          executedAmount: true,
          netPayable: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      chapters: {
        orderBy: { chapterNo: "asc" },
        select: { chapterNo: true, title: true, amount: true, percent: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  const contractAmount = project.contractAmount || 0;
  const payments = project.payments.filter(
    (p) => p.status !== "REJECTED" && p.status !== "DRAFT"
  );

  // محاسبه‌ی پیشرفت تجمعی واقعی
  let cumulative = 0;
  const actualData = payments.map((p, i) => {
    cumulative += p.executedAmount;
    const percent = contractAmount > 0 ? (cumulative / contractAmount) * 100 : 0;
    return {
      period: `دوره ${p.periodNo}`,
      periodNo: p.periodNo,
      date: p.updatedAt,
      amount: p.executedAmount,
      cumulative,
      percent: Math.min(percent, 100),
      isLast: i === payments.length - 1,
    };
  });

  // محاسبه‌ی پیشرفت برنامه‌ریزی‌شده (S-Curve ایده‌آل)
  // بر اساس تعداد دوره‌های مورد انتظار (مثلاً ۱۲ دوره برای یک پروژه یک‌ساله)
  const expectedPeriods = Math.max(12, payments.length + 4);
  const plannedData: any[] = [];
  for (let i = 0; i <= expectedPeriods; i++) {
    // منحنی S با فرمول: percent = 100 * (1 - cos(π * i / expectedPeriods)) / 2
    // این فرمول یک منحنی S طبیعی تولید می‌کند
    const t = i / expectedPeriods;
    const plannedPercent = 100 * (1 - Math.cos(Math.PI * t)) / 2;
    const plannedCumulative = (plannedPercent / 100) * contractAmount;
    plannedData.push({
      period: `دوره ${i}`,
      periodNo: i,
      plannedPercent,
      plannedCumulative,
    });
  }

  // پیش‌بینی پیشرفت آینده (بر اساس روند فعلی)
  const lastActual = actualData[actualData.length - 1];
  const forecastData: any[] = [];
  if (lastActual) {
    const avgRatePerPeriod =
      actualData.length > 1
        ? lastActual.cumulative / actualData.length
        : lastActual.cumulative;
    for (let i = 1; i <= 4; i++) {
      const futureCumulative = Math.min(
        lastActual.cumulative + avgRatePerPeriod * i,
        contractAmount
      );
      const futurePercent = contractAmount > 0 ? (futureCumulative / contractAmount) * 100 : 0;
      forecastData.push({
        period: `پیش‌بینی +${i}`,
        periodNo: lastActual.periodNo + i,
        cumulative: futureCumulative,
        percent: Math.min(futurePercent, 100),
        isForecast: true,
      });
    }
  }

  // شاخص‌های کلیدی عملکرد (KPIs)
  const actualPercent = lastActual?.percent || 0;
  const plannedPercentNow =
    plannedData[Math.min(actualData.length, plannedData.length - 1)]?.plannedPercent || 0;
  const spi = plannedPercentNow > 0 ? actualPercent / plannedPercentNow : 0; // Schedule Performance Index
  const remainingAmount = contractAmount - (lastActual?.cumulative || 0);
  const avgRate = lastActual && actualData.length > 0
    ? lastActual.cumulative / actualData.length
    : 0;
  const estimatedCompletion = avgRate > 0
    ? Math.ceil(remainingAmount / avgRate)
    : 0;

  // توزیع فصول
  const chapterDistribution = project.chapters.map((c) => ({
    chapterNo: c.chapterNo,
    title: c.title,
    amount: c.amount,
    percent: c.percent,
  }));

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      contractAmount,
    },
    actual: actualData,
    planned: plannedData,
    forecast: forecastData,
    kpis: {
      actualPercent,
      plannedPercentNow,
      spi,
      remainingAmount,
      avgRatePerPeriod: avgRate,
      estimatedRemainingPeriods: estimatedCompletion,
      isAhead: spi >= 1,
      isOnTrack: spi >= 0.95 && spi < 1.05,
      isBehind: spi < 0.95,
    },
    chapterDistribution,
  });
}
