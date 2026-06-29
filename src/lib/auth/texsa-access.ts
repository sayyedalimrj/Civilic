/**
 * texsa-access.ts — کنترل دسترسی برای عملیات تکسا.
 * TexsaImport سراسری است (بدون tenantId)، پس مجوز را از روی عضویت‌های پروژه‌ی کاربر
 * یا دسترسی پلتفرم استنتاج می‌کنیم.
 */
import { db } from "@/lib/db";
import { getPlatformAccess, permissionsForRole, type Permission } from "@/lib/auth/permissions";

/** آیا کاربر مجوز موردنظر تکسا را (حداقل در یک پروژه) دارد یا مدیر سامانه است؟ */
export async function canUseTexsa(userId: string, perm: Permission): Promise<boolean> {
  const platform = await getPlatformAccess(userId);
  if (platform) return true;

  const memberships = await db.projectMember.findMany({
    where: { userId, isActive: true },
    select: { role: true },
  });
  return memberships.some((m) => permissionsForRole(m.role).includes(perm));
}
