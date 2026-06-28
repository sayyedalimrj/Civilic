import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/cost-analysis — تحلیل هزینه‌ی پروژه به تفکیک عوامل چهارگانه
// خروجی: تجزیه‌ی هزینه به دستمزد، ماشین‌آلات، مصالح، حمل + توزیع بر اساس فصول و آیتم‌ها
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      financialSheet: {
        select: {
          id: true,
          code: true,
          description: true,
          unit: true,
          quantity: true,
          unitPrice: true,
          totalAmount: true,
          chapterNo: true,
          isStarred: true,
          analysis: true,
        },
        orderBy: { chapterNo: "asc" },
      },
      chapters: {
        orderBy: { chapterNo: "asc" },
        select: { chapterNo: true, title: true, amount: true, percent: true },
      },
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        select: { executedAmount: true, netPayable: true, guarantee: true, insurance: true, tax: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  // تجزیه‌ی هزینه‌ها به ۴ عامل
  let totalLabor = 0;
  let totalEquipment = 0;
  let totalMaterial = 0;
  let totalTransport = 0;
  let grandTotal = 0;

  // توزیع بر اساس فصول
  const chapterBreakdown: Record<number, { labor: number; equipment: number; material: number; transport: number; total: number }> = {};

  // آیتم‌های برتر (Top 10 بر اساس مبلغ)
  const itemCosts: Array<{
    code: string;
    description: string;
    totalAmount: number;
    labor: number;
    equipment: number;
    material: number;
    transport: number;
    chapterNo: number;
  }> = [];

  for (const item of project.financialSheet) {
    let analysis: any = { labor: 0, equipment: 0, material: 0, transport: 0, total: 0 };
    try {
      analysis = JSON.parse(item.analysis || "{}");
    } catch {}

    // اگر analysis خالی است، محاسبه‌ی پیش‌فرض
    const total = item.totalAmount || analysis.total || 0;
    const labor = analysis.labor || total * 0.25;
    const equipment = analysis.equipment || total * 0.15;
    const material = analysis.material || total * 0.55;
    const transport = analysis.transport || total * 0.05;

    totalLabor += labor;
    totalEquipment += equipment;
    totalMaterial += material;
    totalTransport += transport;
    grandTotal += total;

    // توزیع فصلی
    if (!chapterBreakdown[item.chapterNo]) {
      chapterBreakdown[item.chapterNo] = { labor: 0, equipment: 0, material: 0, transport: 0, total: 0 };
    }
    chapterBreakdown[item.chapterNo].labor += labor;
    chapterBreakdown[item.chapterNo].equipment += equipment;
    chapterBreakdown[item.chapterNo].material += material;
    chapterBreakdown[item.chapterNo].transport += transport;
    chapterBreakdown[item.chapterNo].total += total;

    itemCosts.push({
      code: item.code,
      description: item.description,
      totalAmount: total,
      labor,
      equipment,
      material,
      transport,
      chapterNo: item.chapterNo,
    });
  }

  // مرتب‌سازی آیتم‌ها بر اساس مبلغ کل (نزولی)
  itemCosts.sort((a, b) => b.totalAmount - a.totalAmount);
  const topItems = itemCosts.slice(0, 10);

  // درصد هر عامل
  const factors = [
    {
      key: "labor",
      label: "دستمزد",
      amount: totalLabor,
      percent: grandTotal > 0 ? (totalLabor / grandTotal) * 100 : 0,
      color: "#d97706",
      icon: "HardHat",
    },
    {
      key: "equipment",
      label: "ماشین‌آلات",
      amount: totalEquipment,
      percent: grandTotal > 0 ? (totalEquipment / grandTotal) * 100 : 0,
      color: "#0891b2",
      icon: "Truck",
    },
    {
      key: "material",
      label: "مصالح",
      amount: totalMaterial,
      percent: grandTotal > 0 ? (totalMaterial / grandTotal) * 100 : 0,
      color: "#16a34a",
      icon: "Package",
    },
    {
      key: "transport",
      label: "حمل",
      amount: totalTransport,
      percent: grandTotal > 0 ? (totalTransport / grandTotal) * 100 : 0,
      color: "#9333ea",
      icon: "Ship",
    },
  ];

  // توزیع فصلی با درصد
  const chapterAnalysis = Object.entries(chapterBreakdown)
    .map(([chNo, data]) => {
      const chapter = project.chapters.find((c) => c.chapterNo === Number(chNo));
      return {
        chapterNo: Number(chNo),
        title: chapter?.title || `فصل ${chNo}`,
        ...data,
        percentOfTotal: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      };
    })
    .sort((a, b) => a.chapterNo - b.chapterNo);

  // کسورات قانونی
  const totalDeductions = project.payments.reduce(
    (s, p) => s + p.guarantee + p.insurance + p.tax,
    0
  );
  const totalExecuted = project.payments.reduce((s, p) => s + p.executedAmount, 0);
  const totalNet = project.payments.reduce((s, p) => s + p.netPayable, 0);

  const deductions = {
    guarantee: project.payments.reduce((s, p) => s + p.guarantee, 0),
    insurance: project.payments.reduce((s, p) => s + p.insurance, 0),
    tax: project.payments.reduce((s, p) => s + p.tax, 0),
    total: totalDeductions,
    guaranteePct: totalExecuted > 0 ? (totalDeductions * 0.05 * 20 / totalExecuted) : 0, // approximation
  };

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      contractAmount: project.contractAmount,
    },
    factors,
    grandTotal,
    chapterAnalysis,
    topItems,
    executed: {
      total: totalExecuted,
      net: totalNet,
      deductions,
    },
    summary: {
      totalItems: project.financialSheet.length,
      starredItems: project.financialSheet.filter((f) => f.isStarred).length,
      avgItemCost: project.financialSheet.length > 0 ? grandTotal / project.financialSheet.length : 0,
      maxItemCost: itemCosts[0]?.totalAmount || 0,
      minItemCost: itemCosts[itemCosts.length - 1]?.totalAmount || 0,
    },
  });
}
