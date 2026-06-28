import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/projects/[id]/payments/[period]/transition — تغییر وضعیت صورت‌وضعیت
// body: { action: "submit" | "approve" | "reject" | "reopen", userId, userName, note? }
//
// State Machine:
//   DRAFT --submit--> SUBMITTED (قفل روی فرستنده)
//   SUBMITTED --approve--> APPROVED (نهایی، قفل دائمی)
//   SUBMITTED --reject--> REJECTED (باز شدن قفل، قابل ویرایش)
//   REJECTED --submit--> SUBMITTED
//   APPROVED --reopen--> DRAFT (فقط ADMIN)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; period: string }> }
) {
  const { id, period } = await params;
  const body = await req.json();
  const { action, userId, userName, note } = body;

  const payment = await db.payment.findFirst({
    where: { projectId: id, periodNo: parseInt(period, 10) },
  });
  if (!payment) {
    return NextResponse.json({ error: "صورت‌وضعیت یافت نشد" }, { status: 404 });
  }

  const state = payment.status;
  let nextState: string | null = null;
  let lockAction: "lock" | "unlock" | "keep" = "keep";

  switch (action) {
    case "submit":
      if (state !== "DRAFT" && state !== "REJECTED") {
        return NextResponse.json(
          { error: `امکان ارسال از وضعیت ${state} وجود ندارد` },
          { status: 400 }
        );
      }
      nextState = "SUBMITTED";
      lockAction = "lock";
      break;
    case "approve":
      if (state !== "SUBMITTED") {
        return NextResponse.json(
          { error: `امکان تأیید از وضعیت ${state} وجود ندارد` },
          { status: 400 }
        );
      }
      nextState = "APPROVED";
      lockAction = "lock";
      break;
    case "reject":
      if (state !== "SUBMITTED") {
        return NextResponse.json(
          { error: `امکان رد از وضعیت ${state} وجود ندارد` },
          { status: 400 }
        );
      }
      nextState = "REJECTED";
      lockAction = "unlock";
      break;
    case "reopen":
      if (state !== "APPROVED") {
        return NextResponse.json(
          { error: `امکان بازگشایی از وضعیت ${state} وجود ندارد` },
          { status: 400 }
        );
      }
      nextState = "DRAFT";
      lockAction = "unlock";
      break;
    default:
      return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
  }

  // تاریخچه‌ی گردش کار
  const history = JSON.parse(payment.stateHistory || "[]") as any[];
  history.push({
    from: state,
    to: nextState,
    action,
    userId,
    userName,
    note: note || null,
    at: new Date().toISOString(),
  });

  const updateData: any = {
    status: nextState,
    stateHistory: JSON.stringify(history),
    lockedBy: lockAction === "lock" ? userId : null,
    lockedAt: lockAction === "lock" ? new Date() : null,
  };

  if (action === "submit") {
    updateData.submittedBy = userId;
    updateData.submittedAt = new Date();
  }
  if (action === "approve" || action === "reject") {
    updateData.reviewedBy = userId;
    updateData.reviewedAt = new Date();
    updateData.reviewNote = note || null;
  }

  const updated = await db.payment.update({
    where: { id: payment.id },
    data: updateData,
  });

  // ساخت هشدار برای طرف مقابل
  if (action === "submit") {
    await db.alert.create({
      data: {
        tenantId: "tenant-demo",
        projectId: id,
        type: "WORKFLOW",
        severity: "INFO",
        title: "صورت‌وضعیت جدید در انتظار بررسی",
        message: `صورت‌وضعیت دوره ${period} توسط ${userName} ارسال شد — در انتظار تأیید`,
        relatedId: payment.id,
        relatedType: "PAYMENT",
      },
    });
  } else if (action === "approve") {
    await db.alert.create({
      data: {
        tenantId: "tenant-demo",
        projectId: id,
        type: "WORKFLOW",
        severity: "INFO",
        title: "صورت‌وضعیت تأیید شد",
        message: `صورت‌وضعیت دوره ${period} توسط ${userName} تأیید شد`,
        relatedId: payment.id,
        relatedType: "PAYMENT",
      },
    });
  } else if (action === "reject") {
    await db.alert.create({
      data: {
        tenantId: "tenant-demo",
        projectId: id,
        type: "WORKFLOW",
        severity: "WARNING",
        title: "صورت‌وضعیت رد شد",
        message: `صورت‌وضعیت دوره ${period} توسط ${userName} رد شد. دلیل: ${note || "—"}`,
        relatedId: payment.id,
        relatedType: "PAYMENT",
      },
    });
  }

  return NextResponse.json({ payment: updated });
}
