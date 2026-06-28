/**
 * build-newdataset.ts — بازسازی ساختار NewDataSet از یک import (حفظ ترتیب جدول/ردیف/ستون).
 *
 * استراتژی export صریح:
 *  - ROUND_TRIP_RAW: همان raw حفظ‌شده بدون تغییر (پیش‌فرض، بیشترین سازگاری).
 *  - UPDATE_TEXSA_ROW: ردیف خام با مقادیر ویرایش‌شده‌ی Civilic به‌روزرسانی می‌شود.
 *  - CREATE_TEXSA_ROW: رکورد Civilic-only به ردیف جدید تکسا تبدیل می‌شود.
 *  - CIVILIC_ONLY: فقط در Civilic، در خروجی تکسا نمی‌آید.
 *  - NOT_EXPORTABLE: قابل تبدیل به تکسا نیست (هشدار).
 *
 * این پیاده‌سازی پایه، حالت ROUND_TRIP_RAW را کامل پشتیبانی می‌کند (بازتولید وفادار فایل ورودی).
 */
import { db } from "@/lib/db";
import type { ExportTable } from "./serialize-xml";

export type ExportStrategy =
  | "ROUND_TRIP_RAW"
  | "UPDATE_TEXSA_ROW"
  | "CREATE_TEXSA_ROW"
  | "CIVILIC_ONLY"
  | "NOT_EXPORTABLE";

export interface BuildResult {
  tables: ExportTable[];
  tableCount: number;
  rowCount: number;
}

/**
 * ساختار NewDataSet را از ردیف‌های خام حفظ‌شده بازسازی می‌کند، با ترتیب جدول‌ها طبق TexsaTableSchema.
 */
export async function buildNewDataSet(
  importId: string,
  strategy: ExportStrategy = "ROUND_TRIP_RAW"
): Promise<BuildResult> {
  const schemas = await db.texsaTableSchema.findMany({
    where: { importId },
    orderBy: { tableOrder: "asc" },
  });

  const tables: ExportTable[] = [];
  let rowCount = 0;

  for (const ts of schemas) {
    const raw = await db.texsaRawRow.findMany({
      where: { importId, tableName: ts.tableName },
      orderBy: { rowOrder: "asc" },
    });
    const rows = raw.map((r) => {
      const parsed = JSON.parse(r.rawJson) as { columnOrder: string[]; fields: Record<string, string> };
      return { columnOrder: parsed.columnOrder, fields: parsed.fields };
    });
    // در نسخه‌های بعدی: اعمال تغییرات Civilic بر اساس strategy روی ردیف‌های isEdited.
    void strategy;
    rowCount += rows.length;
    tables.push({ name: ts.tableName, rows });
  }

  return { tables, tableCount: tables.length, rowCount };
}
