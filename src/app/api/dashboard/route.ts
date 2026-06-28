import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectProgress } from "@/lib/calc/cascade";

// GET /api/dashboard — آمار کلی برای داشبورد
export async function GET() {
  const tenant = await db.tenant.findFirst({
    where: { id: "tenant-demo" },
  });
  const users = await db.user.findMany({ where: { tenantId: "tenant-demo" } });
  const projects = await db.project.findMany({
    where: { tenantId: "tenant-demo" },
    include: {
      _count: {
        select: {
          detailBoqs: true,
          financialSheet: true,
          payments: true,
        },
      },
    },
  });

  const totalContract = projects.reduce((s, p) => s + p.contractAmount, 0);
  const totalExecuted = projects.reduce((s, p) => s + p.cachedExecuted, 0);
  const totalComputed = projects.reduce((s, p) => s + p.cachedTotal, 0);
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const draftProjects = projects.filter((p) => p.status === "DRAFT").length;

  // آمار پروژه‌ها با پیشرفت
  const projectStats = projects.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    status: p.status,
    contractAmount: p.contractAmount,
    computedTotal: p.cachedTotal,
    executed: p.cachedExecuted,
    progress: projectProgress(p.cachedExecuted, p.cachedTotal || p.contractAmount),
    detailCount: p._count.detailBoqs,
    paymentCount: p._count.payments,
    location: p.location,
    year: p.year,
  }));

  // توزیع هزینه بر اساس فصل (از همه پروژه‌ها)
  const allChapters = await db.chapter.findMany({
    where: { project: { tenantId: "tenant-demo" } },
  });
  const chapterDist = new Map<number, { title: string; amount: number }>();
  for (const c of allChapters) {
    const key = c.chapterNo;
    const existing = chapterDist.get(key);
    if (existing) existing.amount += c.amount;
    else chapterDist.set(key, { title: c.title, amount: c.amount });
  }

  // روند صورت‌وضعیت‌ها (مجموع هر دوره)
  const allPayments = await db.payment.findMany({
    where: { project: { tenantId: "tenant-demo" } },
    orderBy: { periodNo: "asc" },
  });
  const paymentTrend = allPayments.map((p) => ({
    period: `دوره ${p.periodNo}`,
    amount: p.executedAmount,
    net: p.netPayable,
    status: p.status,
  }));

  return NextResponse.json({
    tenant,
    users,
    stats: {
      totalProjects: projects.length,
      activeProjects,
      draftProjects,
      totalContract,
      totalExecuted,
      totalComputed,
      overallProgress: projectProgress(totalExecuted, totalComputed || totalContract),
      userCount: users.length,
    },
    projectStats,
    chapterDistribution: Array.from(chapterDist.entries()).map(([no, v]) => ({
      chapterNo: no,
      title: v.title,
      amount: v.amount,
    })),
    paymentTrend,
  });
}
