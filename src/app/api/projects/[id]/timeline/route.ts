import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/timeline — داده‌های تایم‌لاین/گانت پروژه
// خروجی: فازها، milestone‌ها و صورت‌وضعیت‌ها به‌صورت سری زمانی
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { periodNo: "asc" },
        select: {
          id: true,
          periodNo: true,
          status: true,
          executedAmount: true,
          createdAt: true,
          updatedAt: true,
          dueDate: true,
          submittedAt: true,
          consultantApprovedAt: true,
          finalizedAt: true,
        },
      },
      chapters: {
        orderBy: { chapterNo: "asc" },
        select: {
          chapterNo: true,
          title: true,
          amount: true,
          percent: true,
          isWorkshopSetup: true,
        },
      },
      alerts: {
        where: { type: "SCHEDULE" },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          message: true,
          dueDate: true,
          severity: true,
          isResolved: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  // فازهای پروژه (بر اساس فصول)
  const phases = project.chapters.map((c, idx) => {
    const startDate = new Date(project.createdAt);
    startDate.setMonth(startDate.getMonth() + idx * 2);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);
    return {
      id: `phase-${c.chapterNo}`,
      title: `فصل ${c.chapterNo} — ${c.title}`,
      type: c.isWorkshopSetup ? "WORKSHOP" : "CHAPTER",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      progress: c.percent,
      amount: c.amount,
      chapterNo: c.chapterNo,
    };
  });

  // milestone‌ها (صورت‌وضعیت‌ها)
  const milestones = project.payments.map((p) => {
    const rawDate = p.finalizedAt || p.consultantApprovedAt || p.submittedAt || p.updatedAt;
    return {
      id: `payment-${p.id}`,
      title: `صورت‌وضعیت دوره ${p.periodNo}`,
      type: "PAYMENT",
      date: rawDate ? rawDate.toISOString() : null,
      status: p.status,
      amount: p.executedAmount,
      periodNo: p.periodNo,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    };
  });

  // milestone‌های آینده (هشدارهای زمان‌بندی)
  const upcomingMilestones = project.alerts.map((a) => ({
    id: `alert-${a.id}`,
    title: a.title,
    type: "ALERT",
    date: a.dueDate,
    severity: a.severity,
    isResolved: a.isResolved,
    message: a.message,
  }));

  // محاسبه‌ی تاریخ‌های کلیدی
  const allDates = [
    ...phases.map((p) => new Date(p.start)),
    ...phases.map((p) => new Date(p.end)),
    ...milestones.filter((m) => m.date).map((m) => new Date(m.date as string)),
  ].filter((d) => !isNaN(d.getTime()));

  const timelineStart = allDates.length
    ? new Date(Math.min(...allDates.map((d) => d.getTime())))
    : new Date(project.createdAt);
  const timelineEnd = allDates.length
    ? new Date(Math.max(...allDates.map((d) => d.getTime())))
    : new Date();

  // اطمینان از اینکه تایم‌لاین حداقل ۶ ماه است
  const minSpan = 180 * 24 * 60 * 60 * 1000;
  if (timelineEnd.getTime() - timelineStart.getTime() < minSpan) {
    timelineEnd.setMonth(timelineEnd.getMonth() + 4);
  }

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      createdAt: project.createdAt,
      contractAmount: project.contractAmount,
    },
    phases,
    milestones,
    upcomingMilestones,
    timelineStart: timelineStart.toISOString(),
    timelineEnd: timelineEnd.toISOString(),
    summary: {
      totalPhases: phases.length,
      completedPhases: phases.filter((p) => p.progress >= 100).length,
      totalMilestones: milestones.length,
      finalizedMilestones: milestones.filter((m) => m.status === "FINALIZED").length,
      upcomingAlerts: upcomingMilestones.filter((a) => !a.isResolved).length,
    },
  });
}
