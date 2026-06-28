import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/projects/[id]/risks — لیست ریسک‌های پروژه
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const risks = await db.risk.findMany({
    where: { projectId: id },
    orderBy: [{ status: "asc" }, { riskScore: "desc" }],
  });

  // محاسبه‌ی آمار
  const summary = {
    total: risks.length,
    critical: risks.filter((r) => r.severity === "CRITICAL").length,
    high: risks.filter((r) => r.severity === "HIGH").length,
    medium: risks.filter((r) => r.severity === "MEDIUM").length,
    low: risks.filter((r) => r.severity === "LOW").length,
    open: risks.filter((r) => r.status !== "CLOSED").length,
    closed: risks.filter((r) => r.status === "CLOSED").length,
    totalEstimatedCost: risks.reduce((s, r) => s + r.estimatedCost, 0),
    avgScore:
      risks.length > 0
        ? risks.reduce((s, r) => s + r.riskScore, 0) / risks.length
        : 0,
  };

  // توزیع بر اساس دسته
  const byCategory = risks.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({ risks, summary, byCategory });
}

// POST /api/projects/[id]/risks — ایجاد ریسک جدید
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    title,
    description,
    category,
    probability = 0.5,
    impact = 0.5,
    response,
    mitigation,
    contingency,
    owner,
    dueDate,
    estimatedCost = 0,
  } = body;

  if (!title || !category) {
    return NextResponse.json(
      { error: "عنوان و دسته‌بندی الزامی است" },
      { status: 400 }
    );
  }

  const riskScore = probability * impact;
  let severity = "LOW";
  if (riskScore >= 0.6) severity = "CRITICAL";
  else if (riskScore >= 0.4) severity = "HIGH";
  else if (riskScore >= 0.2) severity = "MEDIUM";

  const risk = await db.risk.create({
    data: {
      tenantId: TENANT_ID,
      projectId: id,
      title,
      description: description || null,
      category,
      probability,
      impact,
      riskScore,
      severity,
      status: "IDENTIFIED",
      response: response || null,
      mitigation: mitigation || null,
      contingency: contingency || null,
      owner: owner || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedCost,
    },
  });

  return NextResponse.json({ risk });
}
