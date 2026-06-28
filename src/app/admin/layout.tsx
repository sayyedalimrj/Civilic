import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlatformAccess } from "@/lib/auth/permissions";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");

  const access = await getPlatformAccess(user.id);
  if (!access) {
    // کاربر عادی حق ورود به پنل مدیریت سامانه را ندارد
    redirect("/");
  }

  return <AdminShell userName={user.name}>{children}</AdminShell>;
}
