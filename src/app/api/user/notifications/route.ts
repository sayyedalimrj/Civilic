import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/user/notifications — تنظیمات اعلان کاربر
export async function GET() {
  // در نسخه‌ی دمو، تنظیمات از tenant خوانده می‌شود
  const tenant = await db.tenant.findUnique({
    where: { id: "tenant-demo" },
    select: { id: true, name: true, signatures: true },
  });

  // تنظیمات پیش‌فرض
  const defaultPrefs = {
    // انواع اعلان
    enablePaymentAlerts: true,
    enableBOQAlerts: true,
    enableWorkflowAlerts: true,
    enableScheduleAlerts: true,
    enableRiskAlerts: true,
    enableChatNotifications: true,
    enableCommentMentions: true,
    // شدت
    criticalOnly: false,
    // کانال‌ها
    inAppNotifications: true,
    emailNotifications: false,
    // زمان
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    // digest
    dailyDigest: true,
    digestTime: "08:00",
  };

  return NextResponse.json({
    tenant,
    preferences: defaultPrefs,
  });
}

// PATCH /api/user/notifications — به‌روزرسانی تنظیمات
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // در نسخه‌ی دمو، فقط برمی‌گردانیم (در نسخه‌ی واقعی در DB ذخیره می‌شود)
  return NextResponse.json({
    success: true,
    preferences: body,
  });
}
