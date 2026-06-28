import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/materials-at-site — لیست مصالح پای کار
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const materials = await db.materialAtSite.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });

  const total = materials.reduce((s, m) => s + m.totalCost, 0);
  const totalRemaining = materials.reduce(
    (s, m) => s + m.remainingQuantity,
    0
  );

  return NextResponse.json({
    materials,
    summary: {
      count: materials.length,
      totalCost: total,
      totalRemaining,
    },
  });
}

// POST /api/projects/[id]/materials-at-site — افزودن مصالح پای کار
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    code,
    description,
    unit,
    purchasedQuantity,
    previousExecuted = 0,
    currentExecuted = 0,
    invoiceNo,
    supplier,
    purchaseDate,
    unitPrice = 0,
    notes,
  } = body;

  if (!code || !description || !unit) {
    return NextResponse.json(
      { error: "کد، شرح و واحد الزامی است" },
      { status: 400 }
    );
  }

  const remainingQuantity =
    (purchasedQuantity || 0) - (previousExecuted || 0) - (currentExecuted || 0);
  const totalCost = (purchasedQuantity || 0) * (unitPrice || 0);

  const material = await db.materialAtSite.create({
    data: {
      projectId: id,
      financialSheetId: null,
      code,
      description,
      unit,
      purchasedQuantity: purchasedQuantity || 0,
      previousExecuted: previousExecuted || 0,
      currentExecuted: currentExecuted || 0,
      remainingQuantity,
      invoiceNo: invoiceNo || null,
      supplier: supplier || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      unitPrice: unitPrice || 0,
      totalCost,
      notes: notes || null,
    },
  });

  return NextResponse.json({ material });
}
