/**
 * tenant-access.ts — کنترل دسترسی در سطح مستاجر (Tenant).
 * مدیریت سازمان‌ها/کاربران مستاجر فقط برای مدیر سامانه یا مدیر/مالک مستاجر مجاز است.
 */
import { db } from "@/lib/db";
import { getPlatformAccess } from "@/lib/auth/permissions";

const TENANT_ADMIN_ROLES = new Set(["tenant_owner", "tenant_admin"]);

/** آیا کاربر می‌تواند این مستاجر را مدیریت کند؟ (مدیر سامانه یا مدیر/مالک مستاجر) */
export async function canManageTenant(userId: string, tenantId: string): Promise<boolean> {
  const platform = await getPlatformAccess(userId);
  if (platform && platform.permissions.includes("platform.org.manage")) return true;

  const member = await db.tenantMember.findFirst({
    where: { tenantId, userId, isActive: true },
  });
  return !!member && TENANT_ADMIN_ROLES.has(member.role);
}

/** آیا کاربر عضو فعال این مستاجر است؟ (برای خواندن) */
export async function isTenantMember(userId: string, tenantId: string): Promise<boolean> {
  const platform = await getPlatformAccess(userId);
  if (platform) return true;
  const member = await db.tenantMember.findFirst({
    where: { tenantId, userId, isActive: true },
  });
  return !!member;
}
