import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/projects/[id]/payments/[period]/transition-v2
// گردش کار سخت‌گیرانه نقش‌ها:
//   پیمانکار: DRAFT → SUBMITTED (قفل پیمانکار)
//   مشاور:    SUBMITTED → CONSULTANT_APPROVED (تأیید)  یا  SUBMITTED → REJECTED (رد، قفل باز)
//   کارفرما:  CONSULTANT_APPROVED → FINALIZED (قطعی)  یا  FINALIZED → DRAFT (بازگشایی)
//
// body: { action, userId, userName, role, note? }
//   action: submit | consultantApprove | reject | finalize | reopen
//   role: CONTRACTOR | CONSULTANT | EMPLOYER
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; period: string }> }
) {
  const { id, period } = await params;
  const body = await req.json();
  const { action, userId, userName, role, note } = body;

  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: parseInt(period, 10) },
  });
  if (!payment) {
    return NextResponse.json({ error: "صورت‌وضعیت یافت نشد" }, { status: 404 });
  }

  const state = payment.status;
  let nextState: string | null = null;
  let lockAction: "lock" | "unlock" = "lock";

  // اعتبارسنجی نقش و انتقال مجاز
  switch (action) {
    case "submit":
      // فقط پیمانکار می‌تواند ارسال کند
      if (role !== "CONTRACTOR" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط پیمانکار می‌تواند صورت‌وضعیت را ارسال کند" },
          { status: 403 }
        );
      }
      if (state !== "DRAFT" && state !== "REJECTED") {
        return NextResponse.json(
          { error: `امکان ارسال از وضعیت ${state} وجود ندارد` },
          { status: 400 }
        );
      }
      nextState = "SUBMITTED";
      lockAction = "lock";
      break;

    case "consultantApprove":
      // فقط مشاور می‌تواند تأیید کند
      if (role !== "CONSULTANT" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط مشاور می‌تواند صورت‌وضعیت را تأیید کند" },
          { status: 403 }
        );
      }
      if (state !== "SUBMITTED") {
        return NextResponse.json(
          { error: "فقط صورت‌وضعیت‌های ارسال‌شده قابل تأیید توسط مشاور هستند" },
          { status: 400 }
        );
      }
      nextState = "CONSULTANT_APPROVED";
      lockAction = "lock";
      break;

    case "reject":
      // فقط مشاور می‌تواند رد کند
      if (role !== "CONSULTANT" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط مشاور می‌تواند صورت‌وضعیت را رد کند" },
          { status: 403 }
        );
      }
      if (state !== "SUBMITTED") {
        return NextResponse.json(
          { error: "فقط صورت‌وضعیت‌های ارسال‌شده قابل رد هستند" },
          { status: 400 }
        );
      }
      nextState = "REJECTED";
      lockAction = "unlock";
      break;

    case "finalize":
      // فقط کارفرما می‌تواند قطعی کند
      if (role !== "EMPLOYER" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط کارفرما می‌تواند صورت‌وضعیت را قطعی کند" },
          { status: 403 }
        );
      }
      if (state !== "CONSULTANT_APPROVED") {
        return NextResponse.json(
          { error: "فقط صورت‌وضعیت‌های تأییدشده توسط مشاور قابل قطعی شدن هستند" },
          { status: 400 }
        );
      }
      nextState = "FINALIZED";
      lockAction = "lock";
      break;

    case "reopen":
      // فقط کارفرما می‌تواند بازگشایی کند (و فقط از FINALIZED)
      if (role !== "EMPLOYER" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط کارفرما می‌تواند صورت‌وضعیت را بازگشایی کند" },
          { status: 403 }
        );
      }
      if (state !== "FINALIZED") {
        return NextResponse.json(
          { error: "فقط صورت‌وضعیت‌های قطعی‌شده قابل بازگشایی هستند" },
          { status: 400 }
        );
      }
      nextState = "DRAFT";
      lockAction = "unlock";
      break;

    default:
      return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
  }

  // ثبت تاریخچه
  const history = JSON.parse(payment.stateHistory || "[]") as any[];
  history.push({
    from: state,
    to: nextState,
    action,
    userId,
    userName,
    role,
    note: note || null,
    at: new Date().toISOString(),
  });

  const updateData: any = {
    status: nextState,
    stateHistory: JSON.stringify(history),
    lockedBy: lockAction === "lock" ? userId : null,
    lockedAt: lockAction === "lock" ? new Date() : null,
  };

  // ثبت اطلاعات هر مرحله
  if (action === "submit") {
    updateData.submittedBy = userId;
    updateData.submittedAt = new Date();
  } else if (action === "consultantApprove") {
    updateData.consultantApprovedBy = userId;
    updateData.consultantApprovedAt = new Date();
  } else if (action === "reject") {
    updateData.rejectedBy = userId;
    updateData.rejectedAt = new Date();
    updateData.rejectReason = note || null;
  } else if (action === "finalize") {
    updateData.finalizedBy = userId;
    updateData.finalizedAt = new Date();
  }

  const updated = await db.payment.update({
    where: { id: payment.id },
    data: updateData,
  });

  // ساخت هشدار برای مرحله‌ی بعد
  const alertMap: Record<string, { type: string; severity: string; title: string; message: string; target: string }> = {
    submit: {
      type: "WORKFLOW",
      severity: "INFO",
      title: "صورت‌وضعیت در انتظار بررسی مشاور",
      message: `صورت‌وضعیت دوره ${period} توسط ${userName} (پیمانکار) ارسال شد — در انتظار بررسی مشاور`,
      target: "CONSULTANT",
    },
    consultantApprove: {
      type: "WORKFLOW",
      severity: "INFO",
      title: "صورت‌وضعیت تأیید مشاور — در انتظار قطعی کارفرما",
      message: `صورت‌وضعیت دوره ${period} توسط ${userName} (مشاور) تأیید شد — در انتظار قطعی کارفرما`,
      target: "EMPLOYER",
    },
    reject: {
      type: "WORKFLOW",
      severity: "WARNING",
      title: "صورت‌وضعیت توسط مشاور رد شد",
      message: `صورت‌وضعیت دوره ${period} توسط ${userName} (مشاور) رد شد. دلیل: ${note || "—"}`,
      target: "CONTRACTOR",
    },
    finalize: {
      type: "WORKFLOW",
      severity: "INFO",
      title: "صورت‌وضعیت قطعی شد",
      message: `صورت‌وضعیت دوره ${period} توسط ${userName} (کارفرما) قطعی شد`,
      target: "ALL",
    },
    reopen: {
      type: "WORKFLOW",
      severity: "WARNING",
      title: "صورت‌وضعیت بازگشایی شد",
      message: `صورت‌وضعیت دوره ${period} توسط ${userName} (کارفرما) بازگشایی شد`,
      target: "ALL",
    },
  };

  const alertInfo = alertMap[action];
  if (alertInfo) {
    await db.alert.create({
      data: {
        tenantId: "tenant-demo",
        projectId: id,
        type: alertInfo.type,
        severity: alertInfo.severity,
        title: alertInfo.title,
        message: alertInfo.message,
        relatedId: payment.id,
        relatedType: "PAYMENT",
      },
    });
  }

  return NextResponse.json({
    payment: updated,
    transition: { from: state, to: nextState, action, role },
  });
}
