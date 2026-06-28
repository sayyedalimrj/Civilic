/**
 * session.ts — کمک‌تابع‌های سمت‌سرور برای کاربر فعلی و context پروژه
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { getProjectAccess, type ProjectAccess } from "@/lib/auth/permissions";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  organizationId: string | null;
  tenantId: string | null;
  role: string;
}

/** کاربر فعلی از session (سمت سرور). در صورت نبود session، null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as Record<string, unknown> | undefined;
  if (!u || !u.id) return null;
  return {
    id: String(u.id),
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    organizationId: (u.organizationId as string) ?? null,
    tenantId: (u.tenantId as string) ?? null,
    role: String(u.role ?? ""),
  };
}

/**
 * context کاربر در یک پروژه: کاربر فعلی + دسترسی پروژه.
 * در صورت نبود کاربر یا عدم عضویت، فیلد مربوطه null است.
 */
export async function getProjectContext(
  projectId: string
): Promise<{ user: CurrentUser | null; access: ProjectAccess | null }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, access: null };
  const access = await getProjectAccess(projectId, user.id);
  return { user, access };
}
