import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlatformAccess } from "@/lib/auth/permissions";

// وضعیت‌های مرتبط با هر طرف (که اقدام نزد آن طرف است)
const PENDING_BY_PARTY: Record<string, string[]> = {
  CONTRACTOR: ["DRAFT", "RETURNED_BY_CONSULTANT", "RETURNED_BY_EMPLOYER"],
  CONSULTANT: ["SUBMITTED_BY_CONTRACTOR", "UNDER_CONSULTANT_REVIEW", "RESUBMITTED_BY_CONTRACTOR", "SUBMITTED"],
  EMPLOYER: ["SUBMITTED_TO_EMPLOYER", "UNDER_EMPLOYER_REVIEW", "RESUBMITTED_TO_EMPLOYER", "APPROVED_BY_CONSULTANT", "CONSULTANT_APPROVED"],
};

// GET /api/workbench — داده‌ی کارتابل کاربر فعلی (نقش‌محور، tenant-scoped)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const platform = await getPlatformAccess(user.id);

  const memberships = await db.projectMember.findMany({
    where: { userId: user.id, isActive: true },
    include: { projectParty: true, project: true },
  });

  const partyTypes = new Set(memberships.map((m) => m.projectParty?.partyType).filter(Boolean) as string[]);
  const roleByProject = new Map(memberships.map((m) => [m.projectId, { role: m.role, partyType: m.projectParty?.partyType }]));

  // محدوده‌ی پروژه‌ها: عضویت کاربر + (در نبود عضویت) tenant کاربر
  let projects = memberships.map((m) => m.project);
  if (projects.length === 0) {
    projects = await db.project.findMany({
      where: { tenantId: user.tenantId ?? "__none__" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }
  const projectIds = projects.map((p) => p.id);

  // صورت‌وضعیت‌ها
  const payments = projectIds.length
    ? await db.payment.findMany({
        where: { projectId: { in: projectIds } },
        include: { project: { select: { name: true } } },
        orderBy: { periodNo: "desc" },
      })
    : [];

  const relevantStatuses = new Set<string>();
  for (const pt of partyTypes) (PENDING_BY_PARTY[pt] ?? []).forEach((s) => relevantStatuses.add(s));
  // اگر کاربر عضو نباشد (مثلاً مدیر)، همه‌ی موارد در حال بررسی را نشان بده
  const pendingPayments = payments
    .filter((p) => (relevantStatuses.size ? relevantStatuses.has(p.status) : p.status !== "LOCKED" && p.status !== "PAYMENT_REGISTERED"))
    .slice(0, 8)
    .map((p) => ({ id: p.id, projectId: p.projectId, projectName: p.project.name, periodNo: p.periodNo, status: p.status, amount: p.netPayable || p.executedAmount }));

  // همه‌ی صورت‌وضعیت‌های در جریان (برای بخش بررسی)
  const inReview = payments
    .filter((p) => p.status !== "DRAFT" && p.status !== "LOCKED")
    .slice(0, 8)
    .map((p) => ({ id: p.id, projectId: p.projectId, projectName: p.project.name, periodNo: p.periodNo, status: p.status, amount: p.netPayable || p.executedAmount }));

  // هشدارها
  const alerts = projectIds.length
    ? await db.alert.findMany({ where: { projectId: { in: projectIds } }, orderBy: { createdAt: "desc" }, take: 6 })
    : [];

  // مکاتبات اخیر
  const letters = projectIds.length
    ? await db.letter.findMany({ where: { projectId: { in: projectIds } }, orderBy: { createdAt: "desc" }, take: 5 })
    : [];

  // پیام‌های اخیر (تخمین خوانده‌نشده: ارسال‌نشده توسط کاربر)
  const channels = projectIds.length
    ? await db.projectChannel.findMany({ where: { projectId: { in: projectIds } }, select: { id: true } })
    : [];
  const channelIds = channels.map((c) => c.id);
  const recentMessages = channelIds.length
    ? await db.message.findMany({
        where: { channelId: { in: channelIds }, senderId: { not: user.id }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { channel: { select: { title: true, projectId: true } } },
      })
    : [];

  const recentProjects = projects.slice(0, 6).map((p) => ({
    id: p.id, name: p.name, code: p.code, status: p.status, contractAmount: p.contractAmount,
    role: roleByProject.get(p.id)?.role ?? null, partyType: roleByProject.get(p.id)?.partyType ?? null,
  }));

  return NextResponse.json({
    isPlatformAdmin: Boolean(platform),
    partyTypes: Array.from(partyTypes),
    counts: {
      pending: pendingPayments.length,
      inReview: inReview.length,
      unreadMessages: recentMessages.length,
      letters: letters.length,
      alerts: alerts.length,
    },
    pendingPayments,
    inReview,
    alerts: alerts.map((a) => ({ id: a.id, title: a.title, message: a.message, severity: a.severity, projectId: a.projectId, relatedType: a.relatedType, relatedId: a.relatedId })),
    letters: letters.map((l) => ({ id: l.id, letterNo: l.letterNo, subject: l.subject, status: l.status, projectId: l.projectId, date: l.letterDate })),
    messages: recentMessages.map((m) => ({ id: m.id, body: m.body, senderName: m.senderName, channel: m.channel.title, projectId: m.channel.projectId, createdAt: m.createdAt })),
    recentProjects,
  });
}
