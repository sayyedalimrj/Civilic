import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/projects/[id]/change-orders — لیست درخواست‌های تغییر
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const changes = await db.changeOrder.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    total: changes.length,
    pending: changes.filter((c) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW").length,
    approved: changes.filter((c) => c.status === "APPROVED" || c.status === "IMPLEMENTED").length,
    rejected: changes.filter((c) => c.status === "REJECTED").length,
    totalCostImpact: changes.reduce((s, c) => s + c.costImpact, 0),
    totalScheduleImpact: changes.reduce((s, c) => s + c.scheduleImpact, 0),
  };

  return NextResponse.json({ changes, summary });
}

// POST /api/projects/[id]/change-orders — ایجاد درخواست تغییر
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    title,
    description,
    type,
    priority,
    costImpact,
    scheduleImpact,
    requestedBy,
    requestedByName,
  } = body;

  if (!title || !type) {
    return NextResponse.json(
      { error: "عنوان و نوع تغییر الزامی است" },
      { status: 400 }
    );
  }

  // شماره تغییر خودکار
  const count = await db.changeOrder.count({ where: { projectId: id } });
  const changeNo = `CO-${String(count + 1).padStart(3, "0")}`;

  const change = await db.changeOrder.create({
    data: {
      tenantId: TENANT_ID,
      projectId: id,
      changeNo,
      title,
      description,
      type,
      priority: priority || "MEDIUM",
      costImpact: Number(costImpact) || 0,
      scheduleImpact: Number(scheduleImpact) || 0,
      status: "SUBMITTED",
      requestedBy: requestedBy || "user-admin",
      requestedByName: requestedByName || "سید علی میرجعفری",
    },
  });

  return NextResponse.json({ change });
}
