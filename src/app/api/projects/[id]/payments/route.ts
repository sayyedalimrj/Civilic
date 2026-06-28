import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computePayment } from "@/lib/calc/cascade";

// GET /api/projects/[id]/payments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payments = await db.payment.findMany({
    where: { projectId: id },
    orderBy: { periodNo: "asc" },
    include: { items: true },
  });
  return NextResponse.json({ payments });
}

// POST — ایجاد صورت‌وضعیت جدید
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // تعیین شماره دوره بعدی
  const count = await db.payment.count({ where: { projectId: id } });
  const periodNo = body.periodNo || count + 1;

  const payment = await db.payment.create({
    data: {
      projectId: id,
      periodNo,
      status: "DRAFT",
      guaranteePct: body.guaranteePct ?? 5,
      insurancePct: body.insurancePct ?? 2,
      taxPct: body.taxPct ?? 5,
    },
  });

  // کپی تمام ردیف‌های برگه مالی به صورت‌وضعیت (با اجرا = 0)
  const fsItems = await db.financialSheetItem.findMany({ where: { projectId: id } });
  for (const fs of fsItems) {
    await db.paymentItem.create({
      data: {
        paymentId: payment.id,
        financialSheetId: fs.id,
        code: fs.code,
        description: fs.description,
        unit: fs.unit,
        totalQuantity: fs.quantity,
        executedQuantity: 0,
        executedPercent: 0,
        unitPrice: fs.unitPrice,
        executedAmount: 0,
        adjustedAmount: 0,
        isAdjusted: false,
      },
    });
  }

  const fullPayment = await db.payment.findUnique({
    where: { id: payment.id },
    include: { items: true },
  });
  return NextResponse.json({ payment: fullPayment }, { status: 201 });
}
