"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Inbox, FolderTree, MessageSquare, FileText, FileBarChart, Settings,
  ChevronLeft, ChevronRight, Search,
} from "lucide-react";
import { useAppStore, type ViewMode } from "@/lib/store";
import { cn } from "@/lib/utils";
import { faMoney } from "@/lib/fa";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const NAV_ITEMS: { id: ViewMode; label: string; icon: typeof Inbox }[] = [
  { id: "workbench", label: "کارتابل من", icon: Inbox },
  { id: "projects", label: "پروژه‌ها", icon: FolderTree },
  { id: "messages", label: "پیام‌ها", icon: MessageSquare },
  { id: "documents", label: "اسناد و مکاتبات", icon: FileText },
  { id: "reports", label: "گزارش‌ها و خروجی", icon: FileBarChart },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

interface ProjectItem {
  id: string; name: string; code: string; status: string;
  contractAmount: number;
}

export function AppSidebar() {
  const { view, setView, selectProject, selectedProjectId, sidebarCollapsed, toggleSidebar, currentUser } = useAppStore();
  const [search, setSearch] = useState("");

  const { data: projectsData } = useQuery<{ projects: ProjectItem[] }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects");
      return r.json();
    },
  });

  const projects = (projectsData?.projects || []).filter((p) =>
    !search || p.name.includes(search) || p.code.includes(search)
  );

  // Role display
  const ROLE_LABELS: Record<string, string> = {
    RESIDENT_ENGINEER: "ناظر مقیم",
    CONSULTANT_REVIEWER: "دفتر فنی مشاور",
    CONSULTANT_APPROVER: "تأییدکننده مشاور",
    CONTRACTOR_PM: "مدیر پروژه پیمانکار",
    SITE_MANAGER: "رئیس کارگاه",
    QUANTITY_SURVEYOR: "مترور",
    BILLING_EXPERT: "کارشناس صورت‌وضعیت",
    EMPLOYER_PM: "مدیر پروژه کارفرما",
    EMPLOYER_REVIEWER: "رسیدگی‌کننده کارفرما",
    EMPLOYER_APPROVER: "مقام تأیید کارفرما",
    PAYMENT_OFFICER: "مسئول پرداخت",
    PROJECT_MANAGER: "مدیر پروژه",
    ORG_OWNER: "مدیر سازمان",
  };
  const PARTY_LABELS: Record<string, string> = {
    EMPLOYER: "کارفرما",
    CONSULTANT: "مشاور",
    CONTRACTOR: "پیمانکار",
  };

  // Collapsed
  if (sidebarCollapsed) {
    return (
      <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-l bg-card py-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors",
              view === item.id ? "bg-amber-600 text-white" : "text-muted-foreground hover:bg-muted"
            )}
            title={item.label}
          >
            <item.icon className="size-5" />
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={toggleSidebar} className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" title="باز کردن">
            <ChevronLeft className="size-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l bg-card">
      {/* Current user identity */}
      <div className="border-b p-3">
        <div className="text-xs font-bold">{currentUser.userName}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {PARTY_LABELS[currentUser.partyType]} • {ROLE_LABELS[currentUser.role] || currentUser.role}
        </div>
      </div>

      {/* Nav items */}
      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              view === item.id ? "bg-amber-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Project search + list */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی پروژه..." className="h-8 pr-7 text-xs" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-3 pb-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={cn(
                "flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-right transition-colors",
                selectedProjectId === p.id ? "bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-200" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{p.name}</span>
                <span className={cn("size-2 rounded-full shrink-0", p.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400")} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono">{p.code}</span>
                <span>{faMoney(p.contractAmount)}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Collapse */}
      <div className="border-t p-2">
        <button onClick={toggleSidebar} className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] text-muted-foreground hover:bg-muted">
          <ChevronRight className="size-4" />
          جمع کردن
        </button>
      </div>
    </aside>
  );
}
