import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/bi — داشبورد BI با فیلترهای پیشرفته
// پارامترها: status, year, minAmount, maxAmount, sortBy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const year = searchParams.get("year");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");
  const sortBy = searchParams.get("sortBy") || "contractAmount";

  const where: any = { tenantId: "tenant-demo" };
  if (status && status !== "ALL") where.status = status;
  if (year) where.year = Number(year);
  if (minAmount || maxAmount) {
    where.contractAmount = {};
    if (minAmount) where.contractAmount.gte = Number(minAmount);
    if (maxAmount) where.contractAmount.lte = Number(maxAmount);
  }

  const projects = await db.project.findMany({
    where,
    orderBy: sortBy === "name"
      ? { name: "asc" }
      : sortBy === "createdAt"
      ? { createdAt: "desc" }
      : { contractAmount: "desc" },
    include: {
      _count: {
        select: {
          detailBoqs: true,
          financialSheet: true,
          payments: true,
          risks: true,
          changeOrders: true,
          documents: true,
        },
      },
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        select: { executedAmount: true, netPayable: true, status: true, guarantee: true, insurance: true, tax: true },
      },
      risks: { select: { severity: true, status: true, estimatedCost: true } },
      changeOrders: { select: { status: true, costImpact: true } },
    },
  });

  // محاسبه‌ی متریک‌ها برای هر پروژه
  const enrichedProjects = projects.map((p) => {
    const executedAmount = p.payments.reduce((s, pp) => s + pp.executedAmount, 0);
    const netPaid = p.payments.reduce((s, pp) => s + pp.netPayable, 0);
    const deductions = p.payments.reduce((s, pp) => s + pp.guarantee + pp.insurance + pp.tax, 0);
    const progress = p.contractAmount > 0 ? (executedAmount / p.contractAmount) * 100 : 0;

    const openRisks = p.risks.filter((r) => r.status !== "CLOSED").length;
    const criticalRisks = p.risks.filter((r) => r.severity === "CRITICAL" && r.status !== "CLOSED").length;
    const totalRiskCost = p.risks.reduce((s, r) => s + r.estimatedCost, 0);

    const pendingChanges = p.changeOrders.filter((c) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW").length;
    const totalCostImpact = p.changeOrders.reduce((s, c) => s + c.costImpact, 0);

    // Health Score
    let healthScore = 100;
    if (p.status === "DRAFT") healthScore -= 20;
    if (progress < 10 && p.status === "ACTIVE") healthScore -= 15;
    healthScore -= openRisks * 8;
    healthScore -= criticalRisks * 12;
    healthScore -= pendingChanges * 3;
    healthScore = Math.max(0, Math.min(100, healthScore));

    let healthStatus: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
    if (healthScore < 50) healthStatus = "CRITICAL";
    else if (healthScore < 75) healthStatus = "WARNING";

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      status: p.status,
      year: p.year,
      location: p.location,
      contractAmount: p.contractAmount,
      executedAmount,
      netPaid,
      deductions,
      progress: Math.min(progress, 100),
      remaining: p.contractAmount - executedAmount,
      detailBoqCount: p._count.detailBoqs,
      financialSheetCount: p._count.financialSheet,
      paymentCount: p._count.payments,
      documentCount: p._count.documents,
      openRisks,
      criticalRisks,
      totalRiskCost,
      pendingChanges,
      totalCostImpact,
      healthScore,
      healthStatus,
      createdAt: p.createdAt,
    };
  });

  // آمار تجمیعی
  const totals = {
    count: enrichedProjects.length,
    totalContract: enrichedProjects.reduce((s, p) => s + p.contractAmount, 0),
    totalExecuted: enrichedProjects.reduce((s, p) => s + p.executedAmount, 0),
    totalNet: enrichedProjects.reduce((s, p) => s + p.netPaid, 0),
    totalDeductions: enrichedProjects.reduce((s, p) => s + p.deductions, 0),
    avgProgress: enrichedProjects.length > 0
      ? enrichedProjects.reduce((s, p) => s + p.progress, 0) / enrichedProjects.length
      : 0,
    avgHealth: enrichedProjects.length > 0
      ? enrichedProjects.reduce((s, p) => s + p.healthScore, 0) / enrichedProjects.length
      : 0,
    healthy: enrichedProjects.filter((p) => p.healthStatus === "HEALTHY").length,
    warning: enrichedProjects.filter((p) => p.healthStatus === "WARNING").length,
    critical: enrichedProjects.filter((p) => p.healthStatus === "CRITICAL").length,
    totalOpenRisks: enrichedProjects.reduce((s, p) => s + p.openRisks, 0),
    totalPendingChanges: enrichedProjects.reduce((s, p) => s + p.pendingChanges, 0),
    totalRiskCost: enrichedProjects.reduce((s, p) => s + p.totalRiskCost, 0),
    totalCostImpact: enrichedProjects.reduce((s, p) => s + p.totalCostImpact, 0),
  };

  // فیلترهای موجود
  const allProjects = await db.project.findMany({
    where: { tenantId: "tenant-demo" },
    select: { year: true, status: true, contractAmount: true },
  });
  const filters = {
    statuses: Array.from(new Set(allProjects.map((p) => p.status))),
    years: Array.from(new Set(allProjects.map((p) => p.year))).sort((a, b) => b - a),
    minContractAmount: Math.min(...allProjects.map((p) => p.contractAmount), 0),
    maxContractAmount: Math.max(...allProjects.map((p) => p.contractAmount), 0),
  };

  return NextResponse.json({
    projects: enrichedProjects,
    totals,
    filters,
  });
}
