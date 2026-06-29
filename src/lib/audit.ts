/**
 * audit.ts — ثبت لاگ حسابرسی برای اقدامات مهم
 * هرگز خطای ثبت لاگ نباید جریان اصلی را متوقف کند.
 */
import { db } from "@/lib/db";

export interface AuditInput {
  tenantId: string;
  projectId?: string | null;
  userId?: string | null;
  userName?: string | null;
  action: string; // CREATE | UPDATE | DELETE | UPLOAD | DOWNLOAD | SUBMIT | APPROVE | ...
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddr?: string | null;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        tenantId: input.tenantId,
        projectId: input.projectId ?? null,
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before != null ? JSON.stringify(input.before) : null,
        after: input.after != null ? JSON.stringify(input.after) : null,
        ipAddr: input.ipAddr ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write audit log:", e);
  }
}

/** استخراج IP از هدرهای درخواست (در صورت وجود) */
export function clientIp(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}
