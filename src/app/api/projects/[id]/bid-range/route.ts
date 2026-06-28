import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/bid-range — دریافت دامنه قیمت پیشنهادی پروژه
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bidRange = await db.bidRange.findFirst({
    where: { projectId: id },
    orderBy: { updatedAt: "desc" },
  });

  // گرفتن مبلغ پایه از برگه مالی
  const financial = await db.financialSheetItem.findMany({
    where: { projectId: id },
    select: { totalAmount: true },
  });
  const computedBase = financial.reduce((s, f) => s + f.totalAmount, 0);

  return NextResponse.json({
    bidRange,
    computedBase,
  });
}

// POST /api/projects/[id]/bid-range — محاسبه و ذخیره دامنه قیمت
// body: { overheadPct, profitPct, riskPct, baseAmount?, notes? }
//
// فرمول:
//   baseAmount = مجموع برگه مالی (اگر ارسال نشود از محاسبه می‌گیریم)
//   overheadAmount = baseAmount × overheadPct / 100
//   profitAmount = (baseAmount + overheadAmount) × profitPct / 100
//   riskAmount = (baseAmount + overheadAmount + profitAmount) × riskPct / 100
//   ceilingAmount = baseAmount + overheadAmount + profitAmount + riskAmount
//   floorAmount = baseAmount × 0.92  (کف قانونی مناقصه — ۸٪ پایین‌تر)
//   suggestedAmount = (ceilingAmount + floorAmount) / 2
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    overheadPct = 15.0,
    profitPct = 8.0,
    riskPct = 5.0,
    baseAmount,
    notes,
  } = body;

  // مبلغ پایه
  let base = baseAmount;
  if (!base || base <= 0) {
    const financial = await db.financialSheetItem.findMany({
      where: { projectId: id },
      select: { totalAmount: true },
    });
    base = financial.reduce((s, f) => s + f.totalAmount, 0);
  }

  const overheadAmount = (base * overheadPct) / 100;
  const profitAmount = ((base + overheadAmount) * profitPct) / 100;
  const riskAmount =
    ((base + overheadAmount + profitAmount) * riskPct) / 100;
  const ceilingAmount = base + overheadAmount + profitAmount + riskAmount;
  const floorAmount = base * 0.92;
  const suggestedAmount = (ceilingAmount + floorAmount) / 2;

  // حذف قبلی و ایجاد جدید (یا به‌روزرسانی)
  const existing = await db.bidRange.findFirst({
    where: { projectId: id },
  });

  let bidRange;
  if (existing) {
    bidRange = await db.bidRange.update({
      where: { id: existing.id },
      data: {
        overheadPct,
        profitPct,
        riskPct,
        baseAmount: base,
        floorAmount,
        ceilingAmount,
        suggestedAmount,
        notes: notes || null,
      },
    });
  } else {
    bidRange = await db.bidRange.create({
      data: {
        projectId: id,
        overheadPct,
        profitPct,
        riskPct,
        baseAmount: base,
        floorAmount,
        ceilingAmount,
        suggestedAmount,
        notes: notes || null,
      },
    });
  }

  return NextResponse.json({
    bidRange,
    computation: {
      base,
      overheadAmount,
      profitAmount,
      riskAmount,
      ceilingAmount,
      floorAmount,
      suggestedAmount,
    },
  });
}
