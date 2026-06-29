"use client";

/**
 * PermissionGate — نمایش شرطی محتوا بر اساس مجوز.
 *
 * این فقط لایه‌ی UX است؛ امنیت واقعی سمت سرور اعمال می‌شود.
 * استفاده:
 *   <PermissionGate allowed={canUpload}>...</PermissionGate>
 *   <PermissionGate allowed={perms} need="document.create">...</PermissionGate>
 */
import type { ReactNode } from "react";

interface PermissionGateProps {
  /** یا یک boolean آماده، یا فهرست مجوزها همراه با need */
  allowed?: boolean | string[];
  need?: string;
  children: ReactNode;
  /** محتوای جایگزین در صورت نبود دسترسی (پیش‌فرض: هیچ) */
  fallback?: ReactNode;
}

export function PermissionGate({ allowed, need, children, fallback = null }: PermissionGateProps) {
  let ok = false;
  if (typeof allowed === "boolean") ok = allowed;
  else if (Array.isArray(allowed) && need) ok = allowed.includes(need);
  return <>{ok ? children : fallback}</>;
}
