"use client";

import { create } from "zustand";

// ─── ناوبری محصول — حول کارتابل و پروژه ───
export type ViewMode =
  | "workbench"      // کارتابل من
  | "projects"       // پروژه‌ها
  | "messages"       // پیام‌ها
  | "documents"      // اسناد و مکاتبات
  | "reports"        // گزارش‌ها و خروجی
  | "settings";      // تنظیمات

// ─── تب‌های پروژه عمرانی ───
export type ProjectTab =
  | "overview"       // پیشخوان پروژه
  | "documents"      // اسناد و مکاتبات
  | "metering"       // متره و صورتجلسات
  | "payment"        // صورت‌وضعیت‌ها
  | "adjustment"     // تعدیل
  | "discussion"     // گفتگو
  | "export";        // گزارش و خروجی

// ─── نقش فعلی کاربر (دمو) ───
export type CurrentUserRole = {
  userId: string;
  userName: string;
  partyType: "EMPLOYER" | "CONSULTANT" | "CONTRACTOR";
  role: string;
  canSign: boolean;
  canApprove: boolean;
};

interface AppState {
  view: ViewMode;
  selectedProjectId: string | null;
  selectedProjectTab: ProjectTab;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  currentUser: CurrentUserRole;
  setView: (v: ViewMode) => void;
  selectProject: (id: string | null, tab?: ProjectTab) => void;
  setProjectTab: (t: ProjectTab) => void;
  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
  setCurrentUser: (u: CurrentUserRole) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "workbench",
  selectedProjectId: null,
  selectedProjectTab: "overview",
  // دسکتاپ‌محور: سایدبار به‌صورت پیش‌فرض باز است
  sidebarCollapsed: false,
  mobileNavOpen: false,
  // کاربر فعلی: مشاور/ناظر مقیم (دمو)
  currentUser: {
    userId: "user-admin",
    userName: "سید علی میرجعفری",
    partyType: "CONSULTANT",
    role: "RESIDENT_ENGINEER",
    canSign: true,
    canApprove: true,
  },
  setView: (v) => set({ view: v, selectedProjectId: v === "projects" ? null : (undefined as never), mobileNavOpen: false }),
  selectProject: (id, tab = "overview") =>
    set({ selectedProjectId: id, view: "projects", selectedProjectTab: tab, mobileNavOpen: false }),
  setProjectTab: (t) => set({ selectedProjectTab: t }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
  setCurrentUser: (u) => set({ currentUser: u }),
}));
