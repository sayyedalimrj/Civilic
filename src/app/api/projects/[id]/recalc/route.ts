import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import {
  recalculateMeasurementSummary, recalculateFinancialSheet, recalculatePaymentTotals,
  recalculateDeductions, recalculateAdjustment, type CalcStage,
} from "@/lib/calculation/dependency-engine";

// POST — اجرای بازمحاسبه‌ی یک مرحله. body: { stage, paymentId?, adjustmentId? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const access = await getProjectAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });
  if (!access.permissions.includes("project.view")) return NextResponse.json({ error: "مجوز ندارید" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { stage?: CalcStage; paymentId?: string; adjustmentId?: string };
  const project = await db.project.findUnique({ where: { id }, select: { tenantId: true } });
  let result: unknown = null;
  switch (body.stage) {
    case "MEASUREMENT_SUMMARY": result = await recalculateMeasurementSummary(id, user.name); break;
    case "FINANCIAL_SHEET": result = await recalculateFinancialSheet(id, user.name); break;
    case "PAYMENT_CERTIFICATE": if (body.paymentId) result = await recalculatePaymentTotals(body.paymentId, user.name); break;
    case "DEDUCTION": if (body.paymentId) result = await recalculateDeductions(body.paymentId, user.name); break;
    case "ADJUSTMENT": if (body.adjustmentId) result = await recalculateAdjustment(body.adjustmentId, user.name); break;
    default: return NextResponse.json({ error: "مرحله نامعتبر" }, { status: 400 });
  }
  if (project) {
    await db.auditLog.create({ data: { tenantId: project.tenantId, projectId: id, userId: user.id, userName: user.name, action: "RECALCULATE", entityType: body.stage ?? "", entityId: id } }).catch(() => {});
  }
  return NextResponse.json({ ok: true, result });
}
