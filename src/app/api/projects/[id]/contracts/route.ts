import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/projects/[id]/contracts — لیست قراردادهای پروژه
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contracts = await db.contract.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: {
      milestones: { orderBy: { order: "asc" } },
      _count: { select: { milestones: true } },
    },
  });

  const summary = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "ACTIVE").length,
    draft: contracts.filter((c) => c.status === "DRAFT").length,
    completed: contracts.filter((c) => c.status === "COMPLETED").length,
    totalAmount: contracts.reduce((s, c) => s + c.contractAmount, 0),
    totalAdvance: contracts.reduce((s, c) => s + c.advancePayment, 0),
    totalMilestones: contracts.reduce((s, c) => s + c._count.milestones, 0),
    completedMilestones: contracts.reduce(
      (s, c) => s + c.milestones.filter((m) => m.status === "COMPLETED").length,
      0
    ),
  };

  return NextResponse.json({ contracts, summary });
}

// POST /api/projects/[id]/contracts — ایجاد قرارداد
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    contractNo,
    title,
    type,
    partyName,
    partyRole,
    contractAmount,
    advancePayment,
    retentionPct,
    signDate,
    startDate,
    endDate,
    durationDays,
    status,
    notes,
  } = body;

  if (!title || !type || !partyName) {
    return NextResponse.json(
      { error: "عنوان، نوع و نام طرف الزامی است" },
      { status: 400 }
    );
  }

  const contract = await db.contract.create({
    data: {
      tenantId: TENANT_ID,
      projectId: id,
      contractNo: contractNo || `CON-${Date.now()}`,
      title,
      type,
      partyName,
      partyRole: partyRole || "CONTRACTOR",
      contractAmount: Number(contractAmount) || 0,
      advancePayment: Number(advancePayment) || 0,
      retentionPct: Number(retentionPct) || 5,
      signDate: signDate ? new Date(signDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      durationDays: Number(durationDays) || 0,
      status: status || "DRAFT",
      notes: notes || null,
    },
  });

  return NextResponse.json({ contract });
}
