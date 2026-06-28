import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess, requireProjectPermission, PermissionError } from "@/lib/auth/permissions";
import {
  findTransition,
  availableActionsForUser,
  STATE_LABELS_FA,
  ACTION_LABELS_FA,
  type PaymentState,
  type PaymentAction,
} from "@/lib/workflows/payment-certificate";

// GET — وضعیت فعلی + اقدام‌های مجاز برای کاربر فعلی
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; period: string }> }
) {
  const { id, period } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: parseInt(period, 10) },
  });
  if (!payment) return NextResponse.json({ error: "صورت‌وضعیت یافت نشد" }, { status: 404 });

  const access = await getProjectAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });

  const state = payment.status as PaymentState;
  const actions = availableActionsForUser(state, access.permissions, access.member.partyType as never).map((r) => ({
    action: r.action,
    label: ACTION_LABELS_FA[r.action],
    to: r.to,
    toLabel: STATE_LABELS_FA[r.to],
    requiresNote: r.requiresNote,
  }));

  return NextResponse.json({
    state,
    stateLabel: STATE_LABELS_FA[state] ?? state,
    role: access.member.role,
    partyType: access.member.partyType,
    availableActions: actions,
  });
}

// POST — اجرای یک transition. body: { action, note? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; period: string }> }
) {
  const { id, period } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; note?: string };
  const action = body.action as PaymentAction | undefined;
  if (!action) return NextResponse.json({ error: "اقدام مشخص نشده است" }, { status: 400 });

  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: parseInt(period, 10) },
    include: { project: true },
  });
  if (!payment) return NextResponse.json({ error: "صورت‌وضعیت یافت نشد" }, { status: 404 });

  const fromState = payment.status as PaymentState;
  const rule = findTransition(fromState, action);
  if (!rule) {
    return NextResponse.json(
      { error: `انتقال «${ACTION_LABELS_FA[action] ?? action}» از وضعیت «${STATE_LABELS_FA[fromState] ?? fromState}» مجاز نیست` },
      { status: 400 }
    );
  }
  if (rule.requiresNote && !(body.note && body.note.trim())) {
    return NextResponse.json({ error: "برای این اقدام، ثبت یادداشت/دلیل الزامی است" }, { status: 400 });
  }

  // کنترل مجوز سمت سرور
  let access;
  try {
    access = await requireProjectPermission(id, user.id, rule.permission);
  } catch (e) {
    if (e instanceof PermissionError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  // اعتبارسنجی طرف
  if (access.member.partyType !== rule.byParty) {
    return NextResponse.json(
      { error: "این اقدام مخصوص طرف دیگری از پروژه است" },
      { status: 403 }
    );
  }

  // اعمال انتقال + ثبت‌ها به‌صورت یک تراکنش
  const now = new Date();
  const historyEntry = {
    from: fromState,
    to: rule.to,
    action,
    by: user.name,
    at: now.toISOString(),
    note: body.note ?? null,
  };
  let history: unknown[] = [];
  try {
    history = JSON.parse(payment.stateHistory) as unknown[];
  } catch {
    history = [];
  }
  history.push(historyEntry);

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: rule.to,
      stateHistory: JSON.stringify(history),
      ...(action === "submit_to_consultant" || action === "resubmit_to_consultant"
        ? { submittedBy: user.name, submittedAt: now }
        : {}),
      ...(action === "approve_by_consultant" ? { consultantApprovedBy: user.name, consultantApprovedAt: now } : {}),
      ...(action === "approve_by_employer" ? { finalizedBy: user.name, finalizedAt: now } : {}),
      ...(rule.workflowAction === "RETURN" ? { rejectedBy: user.name, rejectedAt: now, rejectReason: body.note ?? null } : {}),
      ...(action === "lock" ? { lockedBy: user.name, lockedAt: now } : {}),
    },
  });

  // WorkflowInstance + WorkflowAction
  let instance = await db.workflowInstance.findFirst({
    where: { projectId: id, entityType: "PAYMENT", entityId: payment.id },
  });
  if (!instance) {
    instance = await db.workflowInstance.create({
      data: {
        projectId: id,
        templateCode: "PAYMENT_STATEMENT",
        entityType: "PAYMENT",
        entityId: payment.id,
        state: rule.to,
        createdById: user.id,
        createdByName: user.name,
      },
    });
  } else {
    await db.workflowInstance.update({ where: { id: instance.id }, data: { state: rule.to } });
  }
  await db.workflowAction.create({
    data: {
      instanceId: instance.id,
      actorId: user.id,
      actorName: user.name,
      actorPartyType: access.member.partyType,
      action: rule.workflowAction,
      note: body.note ?? null,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      tenantId: payment.project.tenantId,
      projectId: id,
      userId: user.id,
      userName: user.name,
      action: rule.workflowAction,
      entityType: "PAYMENT",
      entityId: payment.id,
      before: JSON.stringify({ status: fromState }),
      after: JSON.stringify({ status: rule.to }),
    },
  });

  // پیام سیستمی در کانال صورت‌وضعیت
  const channel = await db.projectChannel.findFirst({
    where: { projectId: id, entityType: "PAYMENT", entityId: payment.id },
  });
  if (channel) {
    await db.message.create({
      data: {
        channelId: channel.id,
        senderId: "system",
        senderName: "سامانه",
        systemType: rule.workflowAction,
        entityType: "PAYMENT",
        entityId: payment.id,
        body: rule.systemMessage({ periodNo: payment.periodNo, actorName: user.name }),
      },
    });
  }

  // notification برای طرف مسئول بعدی
  if (rule.nextResponsible) {
    await db.alert.create({
      data: {
        tenantId: payment.project.tenantId,
        projectId: id,
        type: "WORKFLOW",
        severity: "INFO",
        title: `اقدام لازم — صورت‌وضعیت ${payment.periodNo}`,
        message: rule.systemMessage({ periodNo: payment.periodNo, actorName: user.name }),
        relatedType: "PAYMENT",
        relatedId: payment.id,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    from: fromState,
    to: rule.to,
    stateLabel: STATE_LABELS_FA[rule.to],
  });
}
