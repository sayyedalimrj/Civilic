"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Bell,
  Settings,
  Moon,
  Sun,
  Menu,
  Search,
  LayoutDashboard,
  FolderTree,
  Database,
  FileBarChart,
  Users,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ArrowLeftRight,
  Eye,
  X,
  MessageCircle,
  UploadCloud,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore, type ViewMode, type ProjectTab } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initials, toFa } from "@/lib/fa";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "@/components/chat/chat-panel";
import { AlertsPanel } from "@/components/alerts/alerts-panel";
import {
  CURRENT_USER_ID,
  ChatThreadListItem,
} from "@/components/chat/types";

// ─── Data Types ────────────────────────────────────────────

interface ProjectItem {
  id: string;
  name: string;
  code: string;
  status: string;
  contractAmount: number;
  cachedTotal: number;
  cachedExecuted: number;
  location?: string | null;
  year: number;
}

interface NotificationItem {
  id: string;
  type: "payment" | "boq" | "project";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  projectId?: string;
}

// ─── Mock Notifications ────────────────────────────────────

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "payment",
    title: "تأیید صورت‌وضعیت",
    description: "صورت‌وضعیت دوره ۲ پروژه متروی تهران تأیید شد",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    projectId: "p1",
  },
  {
    id: "2",
    type: "boq",
    title: "ویرایش ریزمتره",
    description: "احمد میرزایی ریزمتره پروژه پل صدر را ویرایش کرد",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false,
    projectId: "p2",
  },
  {
    id: "3",
    type: "project",
    title: "تغییر وضعیت پروژه",
    description: "پروژه تونل توحید از پیش‌نویس به فعال تغییر یافت",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: true,
    projectId: "p3",
  },
  {
    id: "4",
    type: "payment",
    title: "ثبت صورت‌وضعیت جدید",
    description: "صورت‌وضعیت دوره ۳ پروژه متروی تهران ایجاد شد",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    read: true,
    projectId: "p1",
  },
  {
    id: "5",
    type: "boq",
    title: "بروزرسانی برگه مالی",
    description: "برگه مالی پروژه پل صدر بازمحاسبه شد",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    projectId: "p2",
  },
];

// ─── View/Tab Label Maps ──────────────────────────────────

const VIEW_LABELS: Record<ViewMode, string> = {
  workbench: "کارتابل من",
  projects: "پروژه‌ها",
  messages: "پیام‌ها",
  documents: "اسناد و مکاتبات",
  reports: "گزارش‌ها و خروجی",
  settings: "تنظیمات",
};

const TAB_LABELS: Record<ProjectTab, string> = {
  overview: "پیشخوان",
  documents: "اسناد و مکاتبات",
  metering: "متره",
  payment: "صورت‌وضعیت",
  adjustment: "تعدیل",
  discussion: "گفتگو",
  export: "گزارش و خروجی",
};

// ─── Helper: Relative Time ─────────────────────────────────

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${toFa(mins)} دقیقه پیش`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${toFa(hrs)} ساعت پیش`;
  const days = Math.floor(hrs / 24);
  return `${toFa(days)} روز پیش`;
}

// ─── Notification Icon by Type ─────────────────────────────

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
  switch (type) {
    case "payment":
      return <Receipt className="size-4 text-emerald-600" />;
    case "boq":
      return <Edit3 className="size-4 text-amber-600" />;
    case "project":
      return <ArrowLeftRight className="size-4 text-orange-600" />;
  }
}

// ─── Component ─────────────────────────────────────────────

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const userName = (session?.user?.name as string) || "کاربر مهمان";
  const {
    toggleSidebar,
    setMobileNav,
    view,
    selectedProjectId,
    selectedProjectTab,
    setView,
    selectProject,
  } = useAppStore();

  // Command palette state
  const [cmdOpen, setCmdOpen] = useState(false);

  // Chat panel state
  const [chatOpen, setChatOpen] = useState(false);

  // Alerts panel state (real alerts from API)
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch real alerts for badge count
  const { data: alertsData } = useQuery<{
    unreadCount: number;
    criticalCount: number;
  }>({
    queryKey: ["alerts", "header-count"],
    queryFn: async () => {
      const r = await fetch("/api/alerts");
      if (!r.ok) throw new Error();
      return r.json();
    },
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
  const realAlertsCount = alertsData?.unreadCount ?? 0;
  const realCriticalCount = alertsData?.criticalCount ?? 0;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch chat threads to compute unread count
  const { data: chatThreadsData } = useQuery<{ threads: ChatThreadListItem[] }>({
    queryKey: ["chat-threads"],
    queryFn: async () => {
      const r = await fetch("/api/chat/threads");
      if (!r.ok) throw new Error();
      return r.json();
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const chatUnreadCount = (chatThreadsData?.threads || []).reduce((acc, t) => {
    const lm = t.lastMessage;
    if (!lm) return acc;
    if (lm.senderId === CURRENT_USER_ID) return acc;
    if (lm.readBy.includes(CURRENT_USER_ID)) return acc;
    return acc + 1;
  }, 0);

  // Fetch projects for command palette search
  const { data: projectsData } = useQuery<{ projects: ProjectItem[] }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects");
      return r.json();
    },
  });

  // Fetch current project name for breadcrumb
  const { data: projectData } = useQuery<{ project: any }>({
    queryKey: ["project", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const projects = projectsData?.projects || [];
  const currentProjectName = projectData?.project?.name;

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Command palette: run action
  const runCommand = useCallback(
    (command: () => void) => {
      setCmdOpen(false);
      command();
    },
    []
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="flex h-16 items-center gap-3 px-4">
        {/* Mobile: hamburger → drawer | Desktop: toggle sidebar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) setMobileNav(true);
            else toggleSidebar();
          }}
          className="shrink-0"
          aria-label="منوی ناوبری"
        >
          <Menu className="size-5" />
        </Button>

        {/* Brand (mobile only — desktop brand lives in sidebar) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="text-sm font-extrabold">Civilic</span>
        </div>

        {/* Dynamic Breadcrumb */}
        <Breadcrumb className="mr-4 hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() => setView("workbench")}
              >
                {VIEW_LABELS.workbench}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {view !== "workbench" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {view === "projects" && selectedProjectId ? (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => setView("projects")}
                    >
                      {VIEW_LABELS.projects}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{VIEW_LABELS[view]}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}

            {view === "projects" && selectedProjectId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {selectedProjectTab !== "overview" ? (
                    <BreadcrumbLink
                      className="cursor-pointer max-w-32 truncate"
                      onClick={() => selectProject(selectedProjectId, "overview")}
                    >
                      {currentProjectName || "پروژه"}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="max-w-32 truncate">
                      {currentProjectName || "پروژه"}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}

            {view === "projects" &&
              selectedProjectId &&
              selectedProjectTab !== "overview" && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {TAB_LABELS[selectedProjectTab]}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side actions */}
        <div className="mr-auto flex items-center gap-1.5">
          {/* Global Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCmdOpen(true)}
            className="hidden h-9 gap-2 text-muted-foreground sm:flex"
          >
            <Search className="size-4" />
            <span className="text-xs">جستجو...</span>
            <kbd className="pointer-events-none mr-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCmdOpen(true)}
            className="sm:hidden"
            aria-label="جستجو"
          >
            <Search className="size-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="تغییر تم"
            className="relative"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Chat panel trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40"
            aria-label="پیام‌رسان داخلی"
            onClick={() => setChatOpen(true)}
          >
            <MessageCircle className="size-4" />
            {chatUnreadCount > 0 && (
              <Badge
                className="absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center p-0 text-[9px] bg-amber-500 text-white hover:bg-amber-500"
              >
                {toFa(chatUnreadCount)}
              </Badge>
            )}
          </Button>

          {/* Smart Alerts panel trigger */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative",
              realCriticalCount > 0
                ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40"
            )}
            aria-label="هشدارهای هوشمند"
            onClick={() => setAlertsOpen(true)}
          >
            <AlertCircle className="size-4" />
            {realAlertsCount > 0 && (
              <Badge
                className={cn(
                  "absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center p-0 text-[9px]",
                  realCriticalCount > 0
                    ? "bg-rose-500 text-white"
                    : "bg-amber-500 text-white"
                )}
              >
                {toFa(realAlertsCount)}
              </Badge>
            )}
          </Button>

          {/* Notification Dropdown */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="اعلان‌ها"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center p-0 text-[9px]"
                  >
                    {toFa(unreadCount)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 p-0"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">اعلان‌ها</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {toFa(unreadCount)} خوانده‌نشده
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-amber-600 hover:text-amber-700"
                    onClick={markAllRead}
                  >
                    خواندن همه
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.projectId) {
                          selectProject(notif.projectId);
                          setNotifOpen(false);
                        }
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/50",
                        !notif.read && "bg-amber-50/50 dark:bg-amber-950/20"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          notif.type === "payment" &&
                            "bg-emerald-100 dark:bg-emerald-900/30",
                          notif.type === "boq" &&
                            "bg-amber-100 dark:bg-amber-900/30",
                          notif.type === "project" &&
                            "bg-orange-100 dark:bg-orange-900/30"
                        )}
                      >
                        <NotificationIcon type={notif.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              !notif.read && "text-foreground",
                              notif.read && "text-muted-foreground"
                            )}
                          >
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                          {notif.description}
                        </p>
                        <span className="mt-1 text-[10px] text-muted-foreground/70">
                          {relativeTime(notif.timestamp)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t px-4 py-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-amber-600 hover:text-amber-700"
                  onClick={() => setNotifOpen(false)}
                >
                  مشاهده همه اعلان‌ها
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="relative">
                  <Avatar className="size-8 ring-2 ring-amber-200 dark:ring-amber-800">
                    <AvatarFallback className="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900 dark:to-orange-900 dark:text-amber-200">
                      {initials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
                  <span className="absolute -bottom-0.5 -left-0.5 flex size-3 items-center justify-center rounded-full bg-card">
                    <span className="size-2 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-xs font-semibold leading-tight">
                    {userName}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {(session?.user?.email as string) || "—"}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="ml-2 size-4" />
                تنظیمات حساب
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="ml-2 size-4" />
                راهنما و پشتیبانی
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                خروج از حساب
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Command Palette Dialog ──────────────────────── */}
      <CommandDialog
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        title="جستجوی سریع"
        description="جستجو در پروژه‌ها، بخش‌ها و دسترسی سریع"
      >
        <CommandInput placeholder="جستجو در پروژه‌ها و بخش‌ها..." />
        <CommandList>
          <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>

          {/* Quick Navigation */}
          <CommandGroup heading="دسترسی سریع">
            <CommandItem
              onSelect={() => runCommand(() => setView("workbench"))}
            >
              <LayoutDashboard className="ml-2 size-4" />
              خانه
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setView("projects"))}
            >
              <FolderTree className="ml-2 size-4" />
              پروژه‌ها
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setView("settings"))}
            >
              <UploadCloud className="ml-2 size-4" />
              وارد کردن فایل تکسا
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setView("reports"))}
            >
              <FileBarChart className="ml-2 size-4" />
              گزارش‌ها و خروجی
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setView("settings"))}
            >
              <Settings className="ml-2 size-4" />
              تنظیمات
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setView("settings"))}
            >
              <Settings className="ml-2 size-4" />
              تنظیمات
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Project Search */}
          <CommandGroup heading="پروژه‌ها">
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.code}`}
                onSelect={() =>
                  runCommand(() => selectProject(p.id))
                }
              >
                <Building2 className="ml-2 size-4 text-amber-600" />
                <div className="flex flex-1 items-center gap-2">
                  <span>{p.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {toFa(p.code)}
                  </Badge>
                  <span
                    className={cn(
                      "mr-auto size-2 rounded-full",
                      p.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    )}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Recent Searches (static) */}
          <CommandGroup heading="جستجوهای اخیر">
            <CommandItem
              onSelect={() => runCommand(() => setView("workbench"))}
            >
              <Search className="ml-2 size-4 text-muted-foreground" />
              داشبورد
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setView("settings"))}
            >
              <Search className="ml-2 size-4 text-muted-foreground" />
              داده‌های پایه — فهرست بها
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Chat panel — slide-out from left */}
      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />

      {/* Smart alerts panel — slide-out from left */}
      <AlertsPanel open={alertsOpen} onOpenChange={setAlertsOpen} />
    </header>
  );
}
