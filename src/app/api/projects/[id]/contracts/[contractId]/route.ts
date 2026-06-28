import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/projects/[id]/contracts/[contractId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id, contractId } = await params;
  const body = await req.json();

  const existing = await db.contract.findUnique({ where: { id: contractId } });
  if (!existing || existing.projectId !== id) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: {
      title: body.title ?? existing.title,
      type: body.type ?? existing.type,
      partyName: body.partyName ?? existing.partyName,
      partyRole: body.partyRole ?? existing.partyRole,
      contractAmount: body.contractAmount !== undefined ? Number(body.contractAmount) : existing.contractAmount,
      advancePayment: body.advancePayment !== undefined ? Number(body.advancePayment) : existing.advancePayment,
      retentionPct: body.retentionPct !== undefined ? Number(body.retentionPct) : existing.retentionPct,
      signDate: body.signDate ? new Date(body.signDate) : existing.signDate,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
      durationDays: body.durationDays !== undefined ? Number(body.durationDays) : existing.durationDays,
      status: body.status ?? existing.status,
      notes: body.notes ?? existing.notes,
    },
  });

  return NextResponse.json({ contract: updated });
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id, contractId } = await params;
  await db.contract.deleteMany({ where: { id: contractId, projectId: id } });
  return NextResponse.json({ success: true });
}

// POST — Add milestone to contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id, contractId } = await params;
  const body = await req.json();
  const { title, description, dueDate, amount, order } = body;

  if (!title || !dueDate) {
    return NextResponse.json({ error: "عنوان و موعد الزامی است" }, { status: 400 });
  }

  const milestone = await db.contractMilestone.create({
    data: {
      contractId,
      title,
      description: description || null,
      dueDate: new Date(dueDate),
      amount: Number(amount) || 0,
      order: Number(order) || 0,
      status: "PENDING",
    },
  });

  return NextResponse.json({ milestone });
}
