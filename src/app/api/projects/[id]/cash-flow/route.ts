import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/cash-flow — پیش‌بینی جریان نقدی پروژه
// خروجی: سری زمانی درآمد (دریافت) و هزینه (پرداخت) در طول پروژه
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
          guarantee: true,
          insurance: true,
          tax: true,
          createdAt: true,
          updatedAt: true,
          finalizedAt: true,
        },
      },
      chapters: {
        orderBy: { chapterNo: "asc" },
        select: { chapterNo: true, title: true, amount: true, percent: true },
      },
      materialsAtSite: {
        select: { totalCost: true, purchaseDate: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  const contractAmount = project.contractAmount || 0;

  // داده‌های تاریخی (بر اساس صورت‌وضعیت‌های قبلی)
  let cumulativeInflow = 0;
  let cumulativeOutflow = 0;
  const historical: any[] = [];

  for (const p of project.payments) {
    if (p.status === "REJECTED" || p.status === "DRAFT") continue;
    const inflow = p.netPayable; // دریافتی خالص پیمانکار
    const outflow = p.executedAmount * 0.85; // هزینه‌ی واقعی (۸۵٪ — ۱۵٪ بالاسری/سود)
    cumulativeInflow += inflow;
    cumulativeOutflow += outflow;
    historical.push({
      period: `دوره ${p.periodNo}`,
      periodNo: p.periodNo,
      date: p.finalizedAt || p.updatedAt,
      inflow,
      outflow,
      net: inflow - outflow,
      cumulativeInflow,
      cumulativeOutflow,
      cumulativeNet: cumulativeInflow - cumulativeOutflow,
    });
  }

  // هزینه‌ی مصالح پای کار (تأثیر بر outflow)
  const materialCosts = project.materialsAtSite.reduce((s, m) => s + m.totalCost, 0);

  // پیش‌بینی آینده (۴ دوره آینده)
  const forecast: any[] = [];
  const lastPayment = project.payments[project.payments.length - 1];
  const avgInflow =
    historical.length > 0 ? cumulativeInflow / historical.length : contractAmount / 12;
  const avgOutflow = avgInflow * 0.85;
  const startPeriod = (lastPayment?.periodNo || 0) + 1;

  for (let i = 0; i < 4; i++) {
    const periodNo = startPeriod + i;
    const futureInflow = Math.min(avgInflow, contractAmount - cumulativeInflow);
    const futureOutflow = avgOutflow;
    cumulativeInflow += futureInflow;
    cumulativeOutflow += futureOutflow;
    forecast.push({
      period: `پیش‌بینی ${periodNo}`,
      periodNo,
      inflow: futureInflow,
      outflow: futureOutflow,
      net: futureInflow - futureOutflow,
      cumulativeInflow,
      cumulativeOutflow,
      cumulativeNet: cumulativeInflow - cumulativeOutflow,
      isForecast: true,
    });
  }

  // KPIهای جریان نقدی
  const totalInflow = historical.reduce((s, h) => s + h.inflow, 0);
  const totalOutflow = historical.reduce((s, h) => s + h.outflow, 0);
  const currentBalance = totalInflow - totalOutflow;
  const profitMargin = totalInflow > 0 ? ((totalInflow - totalOutflow) / totalInflow) * 100 : 0;
  const breakEvenPoint = avgOutflow > 0 ? Math.ceil(contractAmount / avgInflow) : 0;

  // توزیع هزینه بر اساس فصول (برای نمودار donut)
  const chapterCosts = project.chapters.map((c) => ({
    name: `فصل ${c.chapterNo}`,
    value: c.amount,
    percent: c.percent,
  }));

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      contractAmount,
    },
    historical,
    forecast,
    kpis: {
      totalInflow,
      totalOutflow,
      currentBalance,
      profitMargin,
      breakEvenPoint,
      materialCosts,
      avgInflowPerPeriod: avgInflow,
      avgOutflowPerPeriod: avgOutflow,
    },
    chapterCosts,
  });
}
