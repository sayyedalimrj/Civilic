"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import {
  Inbox, FolderTree, MessageSquare, FileText, FileBarChart, Settings,
  ChevronsRight, ChevronsLeft, Search, Building2, LogOut,
} from "lucide-react";
import { useAppStore, type ViewMode } from "@/lib/store";
import { cn } from "@/lib/utils";
import { faMoney, initials } from "@/lib/fa";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS: { id: ViewMode; label: string; icon: typeof Inbox }[] = [
  { id: "workbench", label: "کارتابل من", icon: Inbox },
  { id: "projects", label: "پروژه‌ها", icon: FolderTree },
  { id: "messages", label: "پیام‌ها", icon: MessageSquare },
  { id: "documents", label: "اسناد و مکاتبات", icon: FileText },
  { id: "reports", label: "گزارش‌ها و خروجی", icon: FileBarChart },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

interface ProjectItem { id: string; name: string; code: string; status: string; contractAmount: number }

function NavButton({ item, active, collapsed, onClick }: { item: (typeof NAV_ITEMS)[number]; active: boolean; collapsed: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-0")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Building2 className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight">Civilic</div>
          <div className="text-[10px] text-muted-foreground">سامانه پروژه عمرانی</div>
        </div>
      )}
    </div>
  );
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { view, setView, selectProject, selectedProjectId } = useAppStore();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const userName = (session?.user?.name as string) || "کاربر";
  const userEmail = (session?.user?.email as string) || "";

  const { data: projectsData } = useQuery<{ projects: ProjectItem[] }>({
    queryKey: ["projects"],
    queryFn: async () => (await fetch("/api/projects")).json(),
  });
  const projects = (projectsData?.projects || []).filter((p) => !search || p.name.includes(search) || p.code.includes(search));

  return (
    <div className="flex h-full flex-col">
      <Brand collapsed={collapsed} />
      <div className="border-t" />

      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={view === item.id}
            collapsed={collapsed}
            onClick={() => { setView(item.id); onNavigate?.(); }}
          />
        ))}
      </nav>

      {!collapsed && (
        <>
          <div className="px-3 pb-2 pt-1">
            <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">پروژه‌های اخیر</div>
            <div className="relative">
              <Search className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی پروژه…" className="h-8 pr-7 text-xs" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 px-3 pb-3">
              {projects.length === 0 && <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">پروژه‌ای یافت نشد</div>}
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { selectProject(p.id); onNavigate?.(); }}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-start transition-colors",
                    selectedProjectId === p.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{p.name}</span>
                    <span className={cn("size-2 shrink-0 rounded-full", p.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400")} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono" dir="ltr">{p.code}</span>
                    <span>{faMoney(p.contractAmount)}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
      {collapsed && <div className="flex-1" />}

      {/* User + logout */}
      <div className="border-t p-3">
        {collapsed ? (
          <button onClick={() => signOut({ callbackUrl: "/login" })} title="خروج" className="flex w-full items-center justify-center rounded-lg py-2 text-rose-600 hover:bg-rose-50">
            <LogOut className="size-[18px]" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(userName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{userName}</div>
              <div className="truncate text-[10px] text-muted-foreground" dir="ltr">{userEmail}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} title="خروج" className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** سایدبار دسکتاپ (md به بالا) */
export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-l bg-card transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <SidebarBody collapsed={sidebarCollapsed} />
      <button
        onClick={toggleSidebar}
        title={sidebarCollapsed ? "باز کردن" : "جمع کردن"}
        className="absolute -left-3 top-16 z-10 hidden size-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-foreground md:flex"
      >
        {sidebarCollapsed ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
      </button>
    </aside>
  );
}

/** ناوبری موبایل به‌صورت Sheet از سمت راست */
export function MobileNav() {
  const { mobileNavOpen, setMobileNav } = useAppStore();
  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNav}>
      <SheetContent side="right" className="w-72 p-0 md:hidden">
        <SheetTitle className="sr-only">ناوبری</SheetTitle>
        <SidebarBody collapsed={false} onNavigate={() => setMobileNav(false)} />
      </SheetContent>
    </Sheet>
  );
}
