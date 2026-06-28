import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/comparison — مقایسه‌ی پروژه‌ها برای داشبورد
// خروجی: لیست پروژه‌ها با متریک‌های قابل‌مقایسه
export async function GET() {
  const projects = await db.project.findMany({
    where: { tenantId: "tenant-demo" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          detailBoqs: true,
          financialSheet: true,
          payments: true,
          alerts: { where: { isRead: false } },
        },
      },
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        select: { executedAmount: true, netPayable: true, status: true },
      },
    },
  });

  const comparison = projects.map((p) => {
    const executedAmount = p.payments.reduce((s, pay) => s + pay.executedAmount, 0);
    const contractAmount = p.contractAmount || 0;
    const progressPercent = contractAmount > 0 ? (executedAmount / contractAmount) * 100 : 0;
    const netPaid = p.payments.reduce((s, pay) => s + pay.netPayable, 0);
    const remaining = contractAmount - executedAmount;
    const finalizedCount = p.payments.filter((pay) => pay.status === "FINALIZED").length;
    const submittedCount = p.payments.filter((pay) => pay.status === "SUBMITTED").length;

    // محاسبه‌ی سلامت پروژه (Health Score)
    let healthScore = 100;
    if (p.status === "DRAFT") healthScore -= 20;
    if (progressPercent < 10 && p.status === "ACTIVE") healthScore -= 15;
    if (p._count.alerts > 3) healthScore -= 20;
    if (p._count.alerts > 0) healthScore -= 5 * p._count.alerts;
    if (submittedCount > 0) healthScore -= 5; // صورت‌وضعیت در انتظار
    healthScore = Math.max(0, Math.min(100, healthScore));

    let healthStatus: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
    if (healthScore < 50) healthStatus = "CRITICAL";
    else if (healthScore < 75) healthStatus = "WARNING";

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      status: p.status,
      location: p.location,
      year: p.year,
      contractAmount,
      executedAmount,
      netPaid,
      remaining,
      progressPercent: Math.min(progressPercent, 100),
      detailBoqCount: p._count.detailBoqs,
      financialSheetCount: p._count.financialSheet,
      paymentCount: p._count.payments,
      pendingPayments: submittedCount,
      finalizedPayments: finalizedCount,
      unreadAlerts: p._count.alerts,
      healthScore,
      healthStatus,
      createdAt: p.createdAt,
    };
  });

  // محاسبه‌ی آمار کلی
  const totals = {
    projects: comparison.length,
    activeProjects: comparison.filter((p) => p.status === "ACTIVE").length,
    draftProjects: comparison.filter((p) => p.status === "DRAFT").length,
    totalContract: comparison.reduce((s, p) => s + p.contractAmount, 0),
    totalExecuted: comparison.reduce((s, p) => s + p.executedAmount, 0),
    totalRemaining: comparison.reduce((s, p) => s + p.remaining, 0),
    avgProgress:
      comparison.length > 0
        ? comparison.reduce((s, p) => s + p.progressPercent, 0) / comparison.length
        : 0,
    healthyProjects: comparison.filter((p) => p.healthStatus === "HEALTHY").length,
    warningProjects: comparison.filter((p) => p.healthStatus === "WARNING").length,
    criticalProjects: comparison.filter((p) => p.healthStatus === "CRITICAL").length,
    totalPendingPayments: comparison.reduce((s, p) => s + p.pendingPayments, 0),
    totalUnreadAlerts: comparison.reduce((s, p) => s + p.unreadAlerts, 0),
  };

  return NextResponse.json({ projects: comparison, totals });
}
