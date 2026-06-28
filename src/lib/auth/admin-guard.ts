/**
 * admin-guard.ts — کمک‌تابع‌های گارد برای APIهای پنل مدیریت سامانه (/api/admin/*).
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  requirePlatformPermission,
  PermissionError,
  type PlatformPermission,
} from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export interface AdminContext {
  userId: string;
  userName: string;
  platformRole: string;
}

/**
 * بررسی دسترسی پلتفرم. در صورت موفقیت AdminContext را برمی‌گرداند،
 * وگرنه یک NextResponse خطا (که باید همان را return کنید).
 */
export async function guardPlatform(
  perm: PlatformPermission
): Promise<{ ctx: AdminContext } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 }) };
  }
  try {
    const access = await requirePlatformPermission(user.id, perm);
    return { ctx: { userId: user.id, userName: user.name, platformRole: access.platformRole } };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: NextResponse.json({ error: e.message }, { status: 403 }) };
    }
    throw e;
  }
}

/** ثبت لاگ ممیزی سطح پلتفرم */
export async function platformAudit(
  ctx: AdminContext,
  action: string,
  targetType?: string,
  targetId?: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  await db.platformAuditLog.create({
    data: {
      actorId: ctx.userId,
      actorName: ctx.userName,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      metaJson: JSON.stringify(meta),
    },
  });
}
