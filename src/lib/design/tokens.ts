/**
 * tokens.ts — توکن‌های طراحی Civilic (وضعیت‌ها، رنگ‌ها، نگاشت فارسی)
 * رنگ‌های پایه در globals.css به‌صورت CSS variables هستند؛ این فایل نگاشت‌های منطقی UI را می‌دهد.
 */

export type StatusTone = "neutral" | "info" | "warning" | "success" | "slate" | "danger";

export interface StatusStyle {
  /** کلاس‌های Tailwind برای badge */
  className: string;
}

export const TONE_STYLES: Record<StatusTone, StatusStyle> = {
  neutral: { className: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700" },
  info: { className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900" },
  warning: { className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900" },
  success: { className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900" },
  slate: { className: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700" },
  danger: { className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900" },
};

/** نگاشت وضعیت صورت‌وضعیت → برچسب فارسی + tone */
export const PAYMENT_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "پیش‌نویس", tone: "neutral" },
  SUBMITTED_BY_CONTRACTOR: { label: "ارسال‌شده توسط پیمانکار", tone: "info" },
  UNDER_CONSULTANT_REVIEW: { label: "در حال بررسی مشاور", tone: "info" },
  RETURNED_BY_CONSULTANT: { label: "برگشت‌خورده از مشاور", tone: "warning" },
  RESUBMITTED_BY_CONTRACTOR: { label: "ارسال مجدد توسط پیمانکار", tone: "info" },
  APPROVED_BY_CONSULTANT: { label: "تایید مشاور", tone: "success" },
  SUBMITTED_TO_EMPLOYER: { label: "ارسال‌شده به کارفرما", tone: "info" },
  UNDER_EMPLOYER_REVIEW: { label: "در حال بررسی کارفرما", tone: "info" },
  RETURNED_BY_EMPLOYER: { label: "برگشت‌خورده از کارفرما", tone: "warning" },
  RESUBMITTED_TO_EMPLOYER: { label: "ارسال مجدد به کارفرما", tone: "info" },
  APPROVED_BY_EMPLOYER: { label: "تایید کارفرما", tone: "success" },
  PAYMENT_REGISTERED: { label: "پرداخت ثبت‌شده", tone: "slate" },
  LOCKED: { label: "قفل‌شده", tone: "slate" },
  // وضعیت‌های قدیمی (سازگاری)
  SUBMITTED: { label: "ارسال‌شده", tone: "info" },
  CONSULTANT_APPROVED: { label: "تایید مشاور", tone: "success" },
  FINALIZED: { label: "قطعی‌شده", tone: "slate" },
  REJECTED: { label: "برگشت‌خورده", tone: "warning" },
};

/** نگاشت وضعیت عمومی (پروژه/صورتحساب/اشتراک) */
export const GENERIC_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "فعال", tone: "success" },
  DRAFT: { label: "پیش‌نویس", tone: "neutral" },
  ARCHIVED: { label: "بایگانی", tone: "slate" },
  PAID: { label: "پرداخت‌شده", tone: "success" },
  ISSUED: { label: "صادرشده", tone: "info" },
  OVERDUE: { label: "معوق", tone: "danger" },
  VOID: { label: "باطل", tone: "neutral" },
  TRIALING: { label: "آزمایشی", tone: "info" },
  PAST_DUE: { label: "سررسید گذشته", tone: "danger" },
  SUSPENDED: { label: "تعلیق", tone: "warning" },
  CANCELLED: { label: "لغوشده", tone: "neutral" },
};

export const PARTY_LABELS_FA: Record<string, string> = {
  EMPLOYER: "کارفرما",
  CONSULTANT: "مشاور",
  CONTRACTOR: "پیمانکار",
  OTHER: "سایر",
};

/** برچسب فارسی نقش‌های پروژه (نسخه‌ی client-safe؛ بدون وابستگی به db) */
export const PROJECT_ROLE_LABELS_FA: Record<string, string> = {
  employer_project_manager: "مدیر پروژه کارفرما",
  employer_finance: "کارشناس مالی کارفرما",
  employer_final_approver: "مقام تأیید کارفرما",
  employer_viewer: "مشاهده‌گر کارفرما",
  resident_supervisor: "ناظر مقیم",
  consultant_technical_office: "دفتر فنی مشاور",
  consultant_payment_reviewer: "رسیدگی صورت‌وضعیت",
  consultant_final_approver: "تأییدکننده مشاور",
  consultant_viewer: "مشاهده‌گر مشاور",
  contractor_project_manager: "مدیر پروژه پیمانکار",
  site_manager: "رئیس کارگاه",
  quantity_surveyor: "مترور",
  payment_claim_preparer: "تهیه‌کننده صورت‌وضعیت",
  contractor_final_submitter: "ارسال‌کننده نهایی پیمانکار",
  contractor_viewer: "مشاهده‌گر پیمانکار",
};
