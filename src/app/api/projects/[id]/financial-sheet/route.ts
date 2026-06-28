import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recomputeCascade } from "../detail-boq/route";

// GET /api/projects/[id]/financial-sheet
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db.financialSheetItem.findMany({
    where: { projectId: id },
    orderBy: { code: "asc" },
  });
  const total = items.reduce((s, i) => s + i.totalAmount, 0);
  return NextResponse.json({ items, total });
}

// PUT — ویرایش ردیف برگه مالی (قیمت، ستاره‌دار، مرجع)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { itemId, ...fields } = body;

  const data: Record<string, unknown> = {};
  if (fields.unitPrice !== undefined) data.unitPrice = Number(fields.unitPrice);
  if (fields.isStarred !== undefined) data.isStarred = fields.isStarred;
  if (fields.relatedCode !== undefined) data.relatedCode = fields.relatedCode;
  if (fields.reference !== undefined) data.reference = fields.reference;
  if (fields.chapterNo !== undefined) data.chapterNo = Number(fields.chapterNo);

  const item = await db.financialSheetItem.update({
    where: { id: itemId, projectId: id },
    data,
  });

  // بازمحاسبه‌ی totalAmount این ردیف
  const updated = await db.financialSheetItem.update({
    where: { id: itemId },
    data: { totalAmount: item.quantity * item.unitPrice },
  });

  const cascade = await recomputeCascade(id);
  return NextResponse.json(
    { item: updated, cascade },
    { headers: { "X-Cascade-Update": "true" } }
  );
}
