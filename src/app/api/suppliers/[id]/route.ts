import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/suppliers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.supplier.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  const updated = await db.supplier.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      category: body.category ?? existing.category,
      contactPerson: body.contactPerson ?? existing.contactPerson,
      phone: body.phone ?? existing.phone,
      email: body.email ?? existing.email,
      address: body.address ?? existing.address,
      taxId: body.taxId ?? existing.taxId,
      rating: body.rating ?? existing.rating,
      qualityScore: body.qualityScore ?? existing.qualityScore,
      onTimeRate: body.onTimeRate ?? existing.onTimeRate,
      isActive: body.isActive ?? existing.isActive,
      notes: body.notes ?? existing.notes,
    },
  });

  return NextResponse.json({ supplier: updated });
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.supplier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
