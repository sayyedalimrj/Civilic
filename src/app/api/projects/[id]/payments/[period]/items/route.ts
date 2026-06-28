import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computePayment, applyAdjustment } from "@/lib/calc/cascade";

// GET /api/projects/[id]/payments/[period]/items
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; period: string }> }
) {
  const { id, period } = await params;
  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: Number(period) },
    include: { items: true },
  });
  if (!payment) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json({ payment });
}

// PUT — به‌روزرسانی ردیف صورت‌وضعیت (ثبت اجرا) با محاسبه‌ی خودکار کسورات
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; period: string }> }
) {
  const { id, period } = await params;
  const body = await req.json();
  const { itemId, executedQuantity, executedPercent, isAdjusted, indexFrom, indexTo } = body;

  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: Number(period) },
    include: { items: true },
  });
  if (!payment) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const item = payment.items.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "ردیف یافت نشد" }, { status: 404 });

  let execQty = item.executedQuantity;
  let execPct = item.executedPercent;
  if (executedQuantity !== undefined) {
    execQty = Number(executedQuantity);
    execPct = item.totalQuantity > 0 ? (execQty / item.totalQuantity) * 100 : 0;
  } else if (executedPercent !== undefined) {
    execPct = Number(executedPercent);
    execQty = (execPct / 100) * item.totalQuantity;
  }
  const execAmt = execQty * item.unitPrice;
  let adjAmt = execAmt;
  if (isAdjusted && indexFrom && indexTo) {
    adjAmt = applyAdjustment(execAmt, Number(indexFrom), Number(indexTo));
  }

  const updated = await db.paymentItem.update({
    where: { id: itemId },
    data: {
      executedQuantity: execQty,
      executedPercent: execPct,
      executedAmount: execAmt,
      adjustedAmount: adjAmt,
      isAdjusted: !!isAdjusted,
    },
  });

  // بازمحاسبه‌ی کل صورت‌وضعیت
  const allItems = await db.paymentItem.findMany({ where: { paymentId: payment.id } });
  const calc = computePayment(
    allItems.map((i) => ({
      totalQuantity: i.totalQuantity,
      executedQuantity: i.executedQuantity,
      unitPrice: i.unitPrice,
      adjustedAmount: i.adjustedAmount || undefined,
    })),
    {
      guarantee: payment.guaranteePct,
      insurance: payment.insurancePct,
      tax: payment.taxPct,
    }
  );

  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: calc,
  });

  // به‌روزرسانی cachedExecuted پروژه
  const executedSum = await db.payment.aggregate({
    where: { projectId: id },
    _sum: { executedAmount: true },
  });
  await db.project.update({
    where: { id },
    data: { cachedExecuted: executedSum._sum.executedAmount || 0 },
  });

  return NextResponse.json(
    { item: updated, payment: updatedPayment },
    { headers: { "X-Cascade-Update": "true" } }
  );
}
