/**
 * context.ts — context مشترک برای normalize تکسا → موجودیت‌های محصول Civilic.
 */
import { readRawRows } from "../import/preserve-raw";
import type { TexsaRow } from "../import/parse-svzt";

export interface NormalizeContext {
  importId: string;
  tenantId: string;
  /** پروژه‌ی هدف (در normalize پارتی/پیمان ممکن است ساخته شود) */
  projectId?: string;
  /** خواندن ردیف‌های خام یک جدول به‌ترتیب */
  readTable: (table: string) => Promise<TexsaRow[]>;
}

export function makeContext(importId: string, tenantId: string, projectId?: string): NormalizeContext {
  return {
    importId,
    tenantId,
    projectId,
    readTable: (table) => readRawRows(importId, table),
  };
}

/** تبدیل امن رشته به عدد (با حفظ صفر/خالی) */
export function num(v: string | undefined | null): number {
  if (v == null || v.trim() === "") return 0;
  const n = Number(v.replace(/,/g, ""));
  return isFinite(n) ? n : 0;
}

export function bool(v: string | undefined | null): boolean {
  return v === "true" || v === "1";
}

export interface NormalizeStat {
  entity: string;
  created: number;
  skipped: number;
}
