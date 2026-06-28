import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/dimensions/[id]/compute — محاسبه‌ی نتیجه با پارامترهای جدید
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { params: newParams } = body;

  const formula = await db.dimensionFormula.findUnique({ where: { id } });
  if (!formula) {
    return NextResponse.json({ error: "قالب یافت نشد" }, { status: 404 });
  }

  const p = typeof newParams === "string" ? JSON.parse(newParams) : newParams;
  const result = computeShape(formula.shape, p);

  const updated = await db.dimensionFormula.update({
    where: { id },
    data: {
      params: JSON.stringify(p),
      lastResult: result,
    },
  });

  return NextResponse.json({ formula: updated, computed: result });
}

// DELETE /api/dimensions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.dimensionFormula.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/dimensions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.dimensionFormula.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }
  const updated = await db.dimensionFormula.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      shape: body.shape ?? existing.shape,
      params: body.params ? JSON.stringify(body.params) : existing.params,
      unit: body.unit ?? existing.unit,
      isReusable: body.isReusable ?? existing.isReusable,
    },
  });
  return NextResponse.json({ formula: updated });
}

function computeShape(shape: string, p: any): number {
  const length = Number(p.length || 0);
  const width = Number(p.width || 0);
  const height = Number(p.height || 0);
  const count = Number(p.count || 1);
  const radius = Number(p.radius || 0);
  const slope = Number(p.slope || 0);
  const topWidth = Number(p.topWidth || 0);
  const bottomWidth = Number(p.bottomWidth || 0);

  switch (shape) {
    case "RECTANGLE":
      return length * width * height * count;
    case "CIRCLE":
      return Math.PI * radius * radius * height * count;
    case "TRAPEZOID":
      return ((topWidth + bottomWidth) * height / 2) * length * count;
    case "TRIANGLE":
      return (width * height / 2) * length * count;
    case "SLOPED_EXCAVATION":
      return (
        length * width * height +
        slope * height * height * (length + width) +
        (4 / 3) * slope * slope * height * height * height
      ) * count;
    case "COUNT_ONLY":
      return count;
    default:
      return 0;
  }
}
