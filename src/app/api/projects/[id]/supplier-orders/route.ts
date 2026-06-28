import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/projects/[id]/supplier-orders — لیست سفارشات تأمین‌کننده
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const orders = await db.supplierOrder.findMany({
    where: { projectId: id },
    orderBy: { orderDate: "desc" },
    include: { supplier: true },
  });

  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    delivered: orders.filter((o) => o.status === "DELIVERED" || o.status === "RECEIVED").length,
    totalValue: orders.reduce((s, o) => s + o.totalAmount, 0),
    avgDeliveryRating:
      orders.filter((o) => o.deliveryRating > 0).length > 0
        ? orders.reduce((s, o) => s + o.deliveryRating, 0) /
          orders.filter((o) => o.deliveryRating > 0).length
        : 0,
  };

  return NextResponse.json({ orders, summary });
}

// POST /api/projects/[id]/supplier-orders — ایجاد سفارش
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    supplierId,
    orderNo,
    description,
    quantity,
    unit,
    unitPrice,
    deliveryDate,
    notes,
  } = body;

  if (!supplierId || !description) {
    return NextResponse.json(
      { error: "تأمین‌کننده و شرح الزامی است" },
      { status: 400 }
    );
  }

  const totalAmount = (quantity || 0) * (unitPrice || 0);

  const order = await db.supplierOrder.create({
    data: {
      tenantId: TENANT_ID,
      projectId: id,
      supplierId,
      orderNo: orderNo || `ORD-${Date.now()}`,
      description,
      quantity: Number(quantity) || 0,
      unit: unit || "عدد",
      unitPrice: Number(unitPrice) || 0,
      totalAmount,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      notes: notes || null,
      status: "PENDING",
    },
  });

  // به‌روزرسانی آمار تأمین‌کننده
  await db.supplier.update({
    where: { id: supplierId },
    data: {
      totalOrders: { increment: 1 },
      totalValue: { increment: totalAmount },
    },
  });

  return NextResponse.json({ order });
}
