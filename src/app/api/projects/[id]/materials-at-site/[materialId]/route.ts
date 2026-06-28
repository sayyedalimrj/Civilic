import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/projects/[id]/materials-at-site/[materialId] — ویرایش مصالح
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  const { id, materialId } = await params;
  const body = await req.json();
  const {
    code,
    description,
    unit,
    purchasedQuantity,
    previousExecuted,
    currentExecuted,
    invoiceNo,
    supplier,
    purchaseDate,
    unitPrice,
    notes,
  } = body;

  const existing = await db.materialAtSite.findUnique({
    where: { id: materialId },
  });
  if (!existing || existing.projectId !== id) {
    return NextResponse.json({ error: "مصالح یافت نشد" }, { status: 404 });
  }

  const purchased = purchasedQuantity ?? existing.purchasedQuantity;
  const prevExe = previousExecuted ?? existing.previousExecuted;
  const curExe = currentExecuted ?? existing.currentExecuted;
  const price = unitPrice ?? existing.unitPrice;
  const remainingQuantity = purchased - prevExe - curExe;
  const totalCost = purchased * price;

  const updated = await db.materialAtSite.update({
    where: { id: materialId },
    data: {
      code,
      description,
      unit,
      purchasedQuantity: purchased,
      previousExecuted: prevExe,
      currentExecuted: curExe,
      remainingQuantity,
      invoiceNo,
      supplier,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      unitPrice: price,
      totalCost,
      notes,
    },
  });

  return NextResponse.json({ material: updated });
}

// DELETE /api/projects/[id]/materials-at-site/[materialId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  const { id, materialId } = await params;

  await db.materialAtSite.deleteMany({
    where: { id: materialId, projectId: id },
  });

  return NextResponse.json({ success: true });
}
