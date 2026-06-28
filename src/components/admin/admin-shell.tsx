"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Building2, Users, FolderKanban, CreditCard, Receipt, LogOut, ShieldCheck,
  Network, KeyRound, Gauge, ScrollText, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "پیشخوان مدیریت", icon: LayoutDashboard, exact: true },
  { href: "/admin/tenants", label: "مشتری‌ها", icon: Building2 },
  { href: "/admin/organizations", label: "سازمان‌ها", icon: Network },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/projects", label: "پروژه‌ها", icon: FolderKanban },
  { href: "/admin/roles", label: "نقش‌ها و دسترسی‌ها", icon: KeyRound },
  { href: "/admin/plans", label: "پلن‌ها", icon: CreditCard },
  { href: "/admin/invoices", label: "صورتحساب‌ها", icon: Receipt },
  { href: "/admin/usage", label: "مصرف و محدودیت‌ها", icon: Gauge },
  { href: "/admin/logs", label: "لاگ و پشتیبانی", icon: ScrollText },
  { href: "/admin/settings", label: "تنظیمات سامانه", icon: Settings2 },
];

export function AdminShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-l bg-card">
        <div className="flex items-center gap-2.5 border-b px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">مدیریت سامانه</div>
            <div className="text-[11px] text-muted-foreground">Civilic Platform</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-slate-800 text-white" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link href="/" className="mb-2 block rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            ← بازگشت به اپ کاربری
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="size-4" />
            خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <span className="text-sm font-semibold">پنل مدیریت سامانه Civilic</span>
          <span className="text-xs text-muted-foreground">{userName}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
