import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/projects/[id]/risks/[riskId] — به‌روزرسانی ریسک
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id, riskId } = await params;
  const body = await req.json();

  const existing = await db.risk.findUnique({ where: { id: riskId } });
  if (!existing || existing.projectId !== id) {
    return NextResponse.json({ error: "ریسک یافت نشد" }, { status: 404 });
  }

  // محاسبه‌ی مجدد riskScore و severity
  const probability = body.probability ?? existing.probability;
  const impact = body.impact ?? existing.impact;
  const riskScore = probability * impact;
  let severity = "LOW";
  if (riskScore >= 0.6) severity = "CRITICAL";
  else if (riskScore >= 0.4) severity = "HIGH";
  else if (riskScore >= 0.2) severity = "MEDIUM";

  const updated = await db.risk.update({
    where: { id: riskId },
    data: {
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      probability,
      impact,
      riskScore,
      severity,
      status: body.status ?? existing.status,
      response: body.response ?? existing.response,
      mitigation: body.mitigation ?? existing.mitigation,
      contingency: body.contingency ?? existing.contingency,
      owner: body.owner ?? existing.owner,
      dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      estimatedCost: body.estimatedCost ?? existing.estimatedCost,
      closedAt: body.status === "CLOSED" ? new Date() : existing.closedAt,
    },
  });

  return NextResponse.json({ risk: updated });
}

// DELETE /api/projects/[id]/risks/[riskId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id, riskId } = await params;
  await db.risk.deleteMany({ where: { id: riskId, projectId: id } });
  return NextResponse.json({ success: true });
}
