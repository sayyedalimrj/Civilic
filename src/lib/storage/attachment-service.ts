/**
 * attachment-service.ts — منطق مرکزی پیوست‌ها
 *  - نگاشت ownerType → bucket
 *  - نگاشت ownerType → مجوز لازم برای آپلود/مشاهده
 *  - بررسی visibility (PROJECT | PARTY | INTERNAL) برای نمایش/دانلود
 */
import type { Permission, ProjectAccess } from "@/lib/auth/permissions";
import type { UploadBucket } from "@/lib/storage/upload-config";

export type OwnerType =
  | "PAYMENT"
  | "PAYMENT_ITEM"
  | "ADJUSTMENT"
  | "MEASUREMENT"
  | "CORRESPONDENCE"
  | "DOCUMENT"
  | "CHAT"
  | "TEXSA_IMPORT"
  | "PROJECT";

export const OWNER_TYPES: OwnerType[] = [
  "PAYMENT", "PAYMENT_ITEM", "ADJUSTMENT", "MEASUREMENT",
  "CORRESPONDENCE", "DOCUMENT", "CHAT", "TEXSA_IMPORT", "PROJECT",
];

export function isOwnerType(v: string): v is OwnerType {
  return (OWNER_TYPES as string[]).includes(v);
}

/** هر owner به کدام bucket تعلق دارد */
export function bucketForOwner(ownerType: OwnerType): UploadBucket {
  return ownerType === "TEXSA_IMPORT" ? "texsa" : "documents";
}

/** مجوز لازم برای آپلود روی این owner */
export function uploadPermissionFor(ownerType: OwnerType): Permission {
  switch (ownerType) {
    case "TEXSA_IMPORT":
      return "texsa.import";
    case "CORRESPONDENCE":
      return "correspondence.send";
    case "CHAT":
      return "chat.send";
    default:
      return "document.create";
  }
}

/** مجوز لازم برای دانلود/مشاهده‌ی این owner */
export function viewPermissionFor(ownerType: OwnerType): Permission {
  if (ownerType === "TEXSA_IMPORT") return "texsa.export";
  return "project.view";
}

export interface VisibilityRecord {
  visibility: string;
  partyType: string | null;
  uploadedById: string | null;
}

/**
 * آیا این کاربر اجازه‌ی دیدن این پیوست را دارد؟
 * PROJECT = همه‌ی اعضای پروژه. PARTY/INTERNAL = فقط همان طرف یا آپلودکننده.
 */
export function canViewAttachment(
  att: VisibilityRecord,
  access: ProjectAccess,
  userId: string
): boolean {
  if (att.uploadedById && att.uploadedById === userId) return true;
  if (att.visibility === "PROJECT") return true;
  // PARTY یا INTERNAL → فقط همان نوع طرف
  return !!att.partyType && att.partyType === access.member.partyType;
}
