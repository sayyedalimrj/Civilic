import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/org-kpi — KPIهای سازمانی (مجموع تمام پروژه‌ها)
export async function GET() {
  const projects = await db.project.findMany({
    where: { tenantId: "tenant-demo" },
    include: {
      _count: {
        select: {
          detailBoqs: true,
          financialSheet: true,
          payments: true,
          risks: true,
          changeOrders: true,
          documents: true,
          comments: true,
        },
      },
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        select: {
          executedAmount: true,
          netPayable: true,
          guarantee: true,
          insurance: true,
          tax: true,
          status: true,
        },
      },
      risks: { select: { severity: true, status: true, estimatedCost: true } },
      changeOrders: { select: { status: true, costImpact: true, scheduleImpact: true } },
    },
  });

  const alerts = await db.alert.findMany({
    where: { tenantId: "tenant-demo" },
    select: { type: true, severity: true, isRead: true, isResolved: true },
  });

  const suppliers = await db.supplier.findMany({
    where: { tenantId: "tenant-demo" },
    select: { rating: true, isActive: true, totalValue: true, category: true },
  });

  // محاسبه‌ی KPIهای سازمانی
  const totalContract = projects.reduce((s, p) => s + p.contractAmount, 0);
  const totalExecuted = projects.reduce(
    (s, p) => s + p.payments.reduce((ss, pp) => ss + pp.executedAmount, 0),
    0
  );
  const totalNetPaid = projects.reduce(
    (s, p) => s + p.payments.reduce((ss, pp) => ss + pp.netPayable, 0),
    0
  );
  const totalDeductions = projects.reduce(
    (s, p) =>
      s +
      p.payments.reduce(
        (ss, pp) => ss + pp.guarantee + pp.insurance + pp.tax,
        0
      ),
    0
  );

  const overallProgress = totalContract > 0 ? (totalExecuted / totalContract) * 100 : 0;

  // آمار ریسک
  const allRisks = projects.flatMap((p) => p.risks);
  const criticalRisks = allRisks.filter((r) => r.severity === "CRITICAL" && r.status !== "CLOSED").length;
  const highRisks = allRisks.filter((r) => r.severity === "HIGH" && r.status !== "CLOSED").length;
  const totalRiskCost = allRisks.reduce((s, r) => s + r.estimatedCost, 0);

  // آمار تغییرات
  const allChanges = projects.flatMap((p) => p.changeOrders);
  const pendingChanges = allChanges.filter((c) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW").length;
  const approvedChanges = allChanges.filter((c) => c.status === "APPROVED" || c.status === "IMPLEMENTED").length;
  const totalCostImpact = allChanges.reduce((s, c) => s + c.costImpact, 0);
  const totalScheduleImpact = allChanges.reduce((s, c) => s + c.scheduleImpact, 0);

  // آمار هشدارها
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;
  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL" && !a.isResolved).length;

  // آمار تأمین‌کنندگان
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const avgSupplierRating =
    suppliers.length > 0
      ? suppliers.reduce((s, sup) => s + sup.rating, 0) / suppliers.length
      : 0;
  const totalSupplierValue = suppliers.reduce((s, sup) => s + sup.totalValue, 0);

  // آمار فعالیت
  const totalDocuments = projects.reduce((s, p) => s + p._count.documents, 0);
  const totalComments = projects.reduce((s, p) => s + p._count.comments, 0);
  const totalBoqItems = projects.reduce((s, p) => s + p._count.detailBoqs, 0);

  // سری زمانی ۶ ماه گذشته (mock بر اساس داده‌های واقعی)
  const monthlyTrend: Array<{ month: string; executed: number; contract: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    monthlyTrend.push({
      month: date.toLocaleDateString("fa-IR", { month: "short" }),
      executed: totalExecuted * (1 - i * 0.12),
      contract: totalContract,
    });
  }

  return NextResponse.json({
    kpis: {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
      totalContract,
      totalExecuted,
      totalNetPaid,
      totalDeductions,
      overallProgress,
      // ریسک
      totalRisks: allRisks.length,
      criticalRisks,
      highRisks,
      totalRiskCost,
      // تغییرات
      totalChanges: allChanges.length,
      pendingChanges,
      approvedChanges,
      totalCostImpact,
      totalScheduleImpact,
      // هشدارها
      unreadAlerts,
      criticalAlerts,
      // تأمین‌کنندگان
      totalSuppliers: suppliers.length,
      activeSuppliers,
      avgSupplierRating,
      totalSupplierValue,
      // فعالیت
      totalDocuments,
      totalComments,
      totalBoqItems,
    },
    monthlyTrend,
    projectBreakdown: projects.map((p) => ({
      name: p.name,
      code: p.code,
      contract: p.contractAmount,
      executed: p.payments.reduce((s, pp) => s + pp.executedAmount, 0),
      progress:
        p.contractAmount > 0
          ? (p.payments.reduce((s, pp) => s + pp.executedAmount, 0) / p.contractAmount) * 100
          : 0,
      riskCount: p._count.risks,
      changeCount: p._count.changeOrders,
    })),
  });
}
