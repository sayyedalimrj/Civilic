/**
 * permissions.ts — ماتریس دسترسی مرکزی Civilic
 *
 * هر اقدام مهم باید از طریق این ماژول و به‌صورت سمت‌سرور بررسی شود.
 * مخفی‌کردن دکمه در UI کافی نیست.
 *
 * مدل: کاربر در هر پروژه یک ProjectMember دارد که به یک ProjectParty
 * (با partyType = EMPLOYER | CONSULTANT | CONTRACTOR) متصل است و یک role دارد.
 */

import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
//  انواع پایه
// ─────────────────────────────────────────────────────────────
export type PartyType = "EMPLOYER" | "CONSULTANT" | "CONTRACTOR" | "INTERNAL";

export type SystemRole = "platform_admin" | "support_admin";

export type EmployerRole =
  | "employer_project_manager"
  | "employer_finance"
  | "employer_final_approver"
  | "employer_viewer";

export type ConsultantRole =
  | "resident_supervisor"
  | "consultant_technical_office"
  | "consultant_payment_reviewer"
  | "consultant_final_approver"
  | "consultant_viewer";

export type ContractorRole =
  | "contractor_project_manager"
  | "site_manager"
  | "quantity_surveyor"
  | "payment_claim_preparer"
  | "contractor_final_submitter"
  | "contractor_viewer";

export type ProjectRole =
  | EmployerRole
  | ConsultantRole
  | ContractorRole
  | SystemRole;

// ─────────────────────────────────────────────────────────────
//  مجوزها
// ─────────────────────────────────────────────────────────────
export type Permission =
  // پروژه و اعضا
  | "project.view"
  | "project.edit"
  | "members.invite"
  | "members.edit"
  | "members.disable"
  // اسناد و مکاتبات
  | "document.create"
  | "document.review"
  | "document.approve"
  | "correspondence.send"
  | "correspondence.reply"
  // متره
  | "measurement.create"
  | "measurement.edit"
  | "measurement.submit"
  // صورت‌وضعیت
  | "payment.create"
  | "payment.edit"
  | "payment.submit_to_consultant"
  | "payment.return_to_contractor"
  | "payment.approve_consultant"
  | "payment.submit_to_employer"
  | "payment.return_by_employer"
  | "payment.approve_employer"
  | "payment.register_payment"
  | "payment.lock"
  // تعدیل
  | "adjustment.create"
  | "adjustment.submit"
  | "adjustment.review"
  | "adjustment.approve"
  // چت
  | "chat.send"
  | "chat.manage_channel"
  // تکسا
  | "texsa.import"
  | "texsa.export"
  | "texsa.raw.view";

export const ALL_PERMISSIONS: Permission[] = [
  "project.view", "project.edit", "members.invite", "members.edit", "members.disable",
  "document.create", "document.review", "document.approve", "correspondence.send", "correspondence.reply",
  "measurement.create", "measurement.edit", "measurement.submit",
  "payment.create", "payment.edit", "payment.submit_to_consultant", "payment.return_to_contractor",
  "payment.approve_consultant", "payment.submit_to_employer", "payment.return_by_employer",
  "payment.approve_employer", "payment.register_payment", "payment.lock",
  "adjustment.create", "adjustment.submit", "adjustment.review", "adjustment.approve",
  "chat.send", "chat.manage_channel",
  "texsa.import", "texsa.export", "texsa.raw.view",
];

// مجوزهای پایه‌ای که هر عضو فعال دارد
const BASE: Permission[] = ["project.view", "chat.send"];

// ─────────────────────────────────────────────────────────────
//  نگاشت نقش → مجوزها
// ─────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  // ── سیستمی ──
  platform_admin: [...ALL_PERMISSIONS],
  support_admin: [...ALL_PERMISSIONS],

  // ── کارفرما ──
  employer_project_manager: [
    ...BASE, "project.edit", "members.invite", "members.edit", "members.disable",
    "document.create", "document.review", "correspondence.send", "correspondence.reply",
    "payment.return_by_employer", "adjustment.review", "chat.manage_channel", "texsa.export",
  ],
  employer_finance: [
    ...BASE, "document.review", "correspondence.reply",
    "payment.register_payment", "adjustment.review",
  ],
  employer_final_approver: [
    ...BASE, "document.approve", "correspondence.send", "correspondence.reply",
    "payment.return_by_employer", "payment.approve_employer", "payment.register_payment", "payment.lock",
    "adjustment.approve", "chat.manage_channel",
  ],
  employer_viewer: [...BASE],

  // ── مشاور / دستگاه نظارت ──
  resident_supervisor: [
    ...BASE, "document.create", "document.review", "correspondence.send", "correspondence.reply",
    "measurement.create", "measurement.edit", "measurement.submit",
    "payment.return_to_contractor", "adjustment.review", "chat.manage_channel",
  ],
  consultant_technical_office: [
    ...BASE, "document.create", "document.review", "correspondence.reply",
    "measurement.edit", "payment.return_to_contractor", "adjustment.review",
  ],
  consultant_payment_reviewer: [
    ...BASE, "document.review", "correspondence.reply",
    "payment.return_to_contractor", "payment.approve_consultant", "payment.submit_to_employer",
    "adjustment.review",
  ],
  consultant_final_approver: [
    ...BASE, "document.approve", "correspondence.send", "correspondence.reply",
    "payment.return_to_contractor", "payment.approve_consultant", "payment.submit_to_employer",
    "adjustment.approve", "chat.manage_channel", "texsa.export",
  ],
  consultant_viewer: [...BASE],

  // ── پیمانکار ──
  contractor_project_manager: [
    ...BASE, "project.edit", "members.invite", "members.edit",
    "document.create", "document.review", "correspondence.send", "correspondence.reply",
    "measurement.create", "measurement.edit", "measurement.submit",
    "payment.create", "payment.edit", "payment.submit_to_consultant",
    "adjustment.create", "adjustment.submit", "chat.manage_channel",
    "texsa.import", "texsa.export",
  ],
  site_manager: [
    ...BASE, "document.create", "correspondence.reply",
    "measurement.create", "measurement.edit", "measurement.submit",
  ],
  quantity_surveyor: [
    ...BASE, "document.create",
    "measurement.create", "measurement.edit", "measurement.submit",
    "payment.create", "payment.edit", "adjustment.create",
  ],
  payment_claim_preparer: [
    ...BASE, "document.create",
    "measurement.edit", "payment.create", "payment.edit",
    "adjustment.create", "adjustment.submit", "texsa.import",
  ],
  contractor_final_submitter: [
    ...BASE, "document.create", "document.approve", "correspondence.send", "correspondence.reply",
    "payment.create", "payment.edit", "payment.submit_to_consultant",
    "adjustment.create", "adjustment.submit", "chat.manage_channel",
  ],
  contractor_viewer: [...BASE],
};

// برچسب فارسی نقش‌ها (برای UI)
export const ROLE_LABELS_FA: Record<ProjectRole, string> = {
  platform_admin: "مدیر سامانه",
  support_admin: "پشتیبان سامانه",
  employer_project_manager: "مدیر پروژه کارفرما",
  employer_finance: "کارشناس مالی کارفرما",
  employer_final_approver: "مقام تأیید کارفرما",
  employer_viewer: "مشاهده‌گر کارفرما",
  resident_supervisor: "ناظر مقیم",
  consultant_technical_office: "دفتر فنی مشاور",
  consultant_payment_reviewer: "رسیدگی صورت‌وضعیت (مشاور)",
  consultant_final_approver: "تأییدکننده مشاور",
  consultant_viewer: "مشاهده‌گر مشاور",
  contractor_project_manager: "مدیر پروژه پیمانکار",
  site_manager: "رئیس کارگاه",
  quantity_surveyor: "مترور",
  payment_claim_preparer: "تهیه‌کننده صورت‌وضعیت",
  contractor_final_submitter: "ارسال‌کننده نهایی پیمانکار",
  contractor_viewer: "مشاهده‌گر پیمانکار",
};

export const PARTY_LABELS_FA: Record<PartyType, string> = {
  EMPLOYER: "کارفرما",
  CONSULTANT: "مشاور / دستگاه نظارت",
  CONTRACTOR: "پیمانکار",
  INTERNAL: "داخلی",
};

// نگاشت نقش → نوع طرف (برای استنتاج)
export function partyTypeOfRole(role: ProjectRole): PartyType | "SYSTEM" {
  if (role.startsWith("employer_")) return "EMPLOYER";
  if (role.startsWith("consultant_") || role === "resident_supervisor") return "CONSULTANT";
  if (
    role.startsWith("contractor_") ||
    role === "site_manager" ||
    role === "quantity_surveyor" ||
    role === "payment_claim_preparer"
  )
    return "CONTRACTOR";
  return "SYSTEM";
}

// ─────────────────────────────────────────────────────────────
//  بررسی مجوز (pure)
// ─────────────────────────────────────────────────────────────
export interface MemberLike {
  role: string;
  isActive?: boolean;
  partyType?: string;
}

export function permissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as ProjectRole] ?? [...BASE];
}

export function hasPermission(member: MemberLike | null | undefined, perm: Permission): boolean {
  if (!member) return false;
  if (member.isActive === false) return false;
  return permissionsForRole(member.role).includes(perm);
}

export function isSystemRole(role: string): boolean {
  return role === "platform_admin" || role === "support_admin";
}

// ─────────────────────────────────────────────────────────────
//  گارد سمت‌سرور
// ─────────────────────────────────────────────────────────────
export class PermissionError extends Error {
  status = 403;
  constructor(message = "شما مجوز انجام این اقدام را ندارید") {
    super(message);
    this.name = "PermissionError";
  }
}

export interface ProjectAccess {
  member: {
    id: string;
    userId: string;
    role: string;
    canSign: boolean;
    canApprove: boolean;
    isActive: boolean;
    partyType: PartyType;
    projectPartyId: string;
  };
  permissions: Permission[];
}

/**
 * عضویت کاربر در پروژه را از DB می‌خواند و مجوز را بررسی می‌کند.
 * در صورت نبود مجوز، PermissionError پرتاب می‌کند.
 */
export async function requireProjectPermission(
  projectId: string,
  userId: string,
  perm: Permission
): Promise<ProjectAccess> {
  const access = await getProjectAccess(projectId, userId);
  if (!access) {
    throw new PermissionError("شما عضو این پروژه نیستید");
  }
  if (!access.permissions.includes(perm)) {
    throw new PermissionError();
  }
  return access;
}

/** دسترسی کاربر در پروژه را برمی‌گرداند (بدون پرتاب خطا) */
export async function getProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectAccess | null> {
  const member = await db.projectMember.findFirst({
    where: { projectId, userId, isActive: true },
    include: { projectParty: true },
  });
  if (!member) return null;

  const partyType = (member.projectParty?.partyType as PartyType) ?? "INTERNAL";
  return {
    member: {
      id: member.id,
      userId: member.userId,
      role: member.role,
      canSign: member.canSign,
      canApprove: member.canApprove,
      isActive: member.isActive,
      partyType,
      projectPartyId: member.projectPartyId,
    },
    permissions: permissionsForRole(member.role),
  };
}
