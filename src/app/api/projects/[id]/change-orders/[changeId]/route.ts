import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/projects/[id]/change-orders/[changeId] — به‌روزرسانی وضعیت
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  const { id, changeId } = await params;
  const body = await req.json();
  const { status, reviewNote, reviewedBy, reviewedByName } = body;

  const existing = await db.changeOrder.findUnique({ where: { id: changeId } });
  if (!existing || existing.projectId !== id) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  const updateData: any = { status };
  if (status === "APPROVED" || status === "REJECTED") {
    updateData.reviewedBy = reviewedBy;
    updateData.reviewedByName = reviewedByName;
    updateData.reviewNote = reviewNote;
    updateData.reviewedAt = new Date();
  }
  if (status === "IMPLEMENTED") {
    updateData.implementedAt = new Date();
  }

  const updated = await db.changeOrder.update({
    where: { id: changeId },
    data: updateData,
  });

  return NextResponse.json({ change: updated });
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  const { id, changeId } = await params;
  await db.changeOrder.deleteMany({ where: { id: changeId, projectId: id } });
  return NextResponse.json({ success: true });
}
