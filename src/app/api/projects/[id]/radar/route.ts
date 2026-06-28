import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/radar — ارزیابی چندبعدی پروژه با نمودار رادار
// ۸ محور: پیشرفت، کیفیت، زمان‌بندی، مالی، ایمنی، مستندات، ریسک، رضایت
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      financialSheet: { select: { totalAmount: true, isStarred: true } },
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        select: { executedAmount: true, status: true },
      },
      chapters: { select: { percent: true, amount: true } },
      risks: { select: { severity: true, status: true } },
      documents: { select: { id: true } },
      comments: { select: { id: true, resolved: true } },
      changeOrders: { select: { status: true, costImpact: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  const contractAmount = project.contractAmount || 0;
  const executedAmount = project.payments.reduce((s, p) => s + p.executedAmount, 0);

  // ۱. محور پیشرفت (0-100)
  const progressScore = contractAmount > 0
    ? Math.min(100, (executedAmount / contractAmount) * 100)
    : 0;

  // ۲. محور کیفیت (بر اساس درصد آیتم‌های ستاره‌دار و کامنت‌های حل‌شده)
  const totalItems = project.financialSheet.length;
  const starredItems = project.financialSheet.filter((f) => f.isStarred).length;
  const totalComments = project.comments.length;
  const resolvedComments = project.comments.filter((c) => c.resolved).length;
  const qualityScore = totalItems > 0
    ? ((totalItems - starredItems) / totalItems) * 50 +
      (totalComments > 0 ? (resolvedComments / totalComments) * 50 : 50)
    : 50;

  // ۳. محور زمان‌بندی (بر اساس وضعیت صورت‌وضعیت‌ها)
  const finalizedCount = project.payments.filter((p) => p.status === "FINALIZED").length;
  const submittedCount = project.payments.filter((p) => p.status === "SUBMITTED").length;
  const scheduleScore = project.payments.length > 0
    ? (finalizedCount / project.payments.length) * 70 +
      ((project.payments.length - submittedCount) / project.payments.length) * 30
    : 50;

  // ۴. محور مالی (بر اساس نسبت اجرا به پیمان)
  const financialRatio = contractAmount > 0 ? executedAmount / contractAmount : 0;
  const financialScore = Math.min(100, financialRatio * 100);

  // ۵. محور ایمنی (بر اساس ریسک‌های SAFETY بسته‌شده)
  const safetyRisks = project.risks.filter((r) =>
    (r as any).category === "SAFETY" || r.severity === "CRITICAL"
  );
  const closedSafetyRisks = safetyRisks.filter((r) => r.status === "CLOSED").length;
  const safetyScore = safetyRisks.length > 0
    ? (closedSafetyRisks / safetyRisks.length) * 100
    : 90; // اگر ریسک ایمنی نیست، امتیاز بالا

  // ۶. محور مستندات (بر اساس تعداد مستندات و کامنت‌ها)
  const docCount = project.documents.length;
  const documentationScore = Math.min(100, (docCount * 10) + (totalComments * 5));

  // ۷. محور ریسک (برعکس — هرچه ریسک کمتر، امتیاز بالاتر)
  const openRisks = project.risks.filter((r) => r.status !== "CLOSED").length;
  const criticalRisks = project.risks.filter((r) => r.severity === "CRITICAL" && r.status !== "CLOSED").length;
  const riskScore = Math.max(0, 100 - (openRisks * 10) - (criticalRisks * 20));

  // ۸. محور رضایت (بر اساس تغییرات رد‌شده و کامنت‌های حل‌شده)
  const rejectedChanges = project.changeOrders.filter((c) => c.status === "REJECTED").length;
  const satisfactionScore = Math.max(0,
    100 - (rejectedChanges * 15) - (submittedCount * 5)
  );

  const radarData = [
    { axis: "پیشرفت", value: Math.round(progressScore), fullMark: 100 },
    { axis: "کیفیت", value: Math.round(qualityScore), fullMark: 100 },
    { axis: "زمان‌بندی", value: Math.round(scheduleScore), fullMark: 100 },
    { axis: "مالی", value: Math.round(financialScore), fullMark: 100 },
    { axis: "ایمنی", value: Math.round(safetyScore), fullMark: 100 },
    { axis: "مستندات", value: Math.round(documentationScore), fullMark: 100 },
    { axis: "مدیریت ریسک", value: Math.round(riskScore), fullMark: 100 },
    { axis: "رضایت", value: Math.round(satisfactionScore), fullMark: 100 },
  ];

  // میانگین کلی
  const overallScore = Math.round(
    radarData.reduce((s, d) => s + d.value, 0) / radarData.length
  );

  // مقایسه با میانگین سازمانی (benchmark)
  const allProjects = await db.project.findMany({
    where: { tenantId: "tenant-demo", id: { not: id } },
    include: {
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        select: { executedAmount: true },
      },
      risks: { select: { severity: true, status: true } },
    },
  });

  const orgBenchmark = allProjects.length > 0
    ? allProjects.map((p) => {
        const pExecuted = p.payments.reduce((s, pp) => s + pp.executedAmount, 0);
        const pProgress = p.contractAmount > 0 ? (pExecuted / p.contractAmount) * 100 : 0;
        const pOpenRisks = p.risks.filter((r) => r.status !== "CLOSED").length;
        const pRiskScore = Math.max(0, 100 - pOpenRisks * 10);
        return { progress: pProgress, risk: pRiskScore };
      })
    : [];

  const benchmark = [
    { axis: "پیشرفت", value: Math.round(orgBenchmark.reduce((s, p) => s + p.progress, 0) / Math.max(1, orgBenchmark.length)) || 50 },
    { axis: "کیفیت", value: 65 },
    { axis: "زمان‌بندی", value: 60 },
    { axis: "مالی", value: Math.round(orgBenchmark.reduce((s, p) => s + p.progress, 0) / Math.max(1, orgBenchmark.length)) || 50 },
    { axis: "ایمنی", value: 75 },
    { axis: "مستندات", value: 55 },
    { axis: "مدیریت ریسک", value: Math.round(orgBenchmark.reduce((s, p) => s + p.risk, 0) / Math.max(1, orgBenchmark.length)) || 60 },
    { axis: "رضایت", value: 70 },
  ];

  // توصیه‌های هوشمند
  const recommendations: Array<{ axis: string; score: number; message: string; priority: "HIGH" | "MEDIUM" | "LOW" }> = [];
  for (const d of radarData) {
    if (d.value < 40) {
      recommendations.push({
        axis: d.axis,
        score: d.value,
        message: `${d.axis} بحرانی است (${d.value}٪) — نیاز به اقدام فوری`,
        priority: "HIGH",
      });
    } else if (d.value < 60) {
      recommendations.push({
        axis: d.axis,
        score: d.value,
        message: `${d.axis} نیازمند بهبود است (${d.value}٪)`,
        priority: "MEDIUM",
      });
    } else if (d.value < 75) {
      recommendations.push({
        axis: d.axis,
        score: d.value,
        message: `${d.axis} قابل‌قبول اما قابل‌بهبود (${d.value}٪)`,
        priority: "LOW",
      });
    }
  }

  let healthStatus: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
  if (overallScore < 50) healthStatus = "CRITICAL";
  else if (overallScore < 70) healthStatus = "WARNING";

  return NextResponse.json({
    project: { id: project.id, name: project.name, code: project.code },
    radarData,
    benchmark,
    overallScore,
    healthStatus,
    recommendations: recommendations.sort((a, b) => a.score - b.score),
  });
}
