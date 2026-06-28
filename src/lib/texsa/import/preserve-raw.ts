/**
 * preserve-raw.ts — ذخیره‌ی بدون‌تلفات داده‌ی خام تکسا در دیتابیس.
 * هر ردیف به TexsaRawRow (با rawJson و rowOrder) و هر جدول/ستون به schema models نگاشت می‌شود.
 */
import { db } from "@/lib/db";
import type { TexsaRow } from "./parse-svzt";
import type { TableSchema } from "./analyze-schema";

/** ذخیره‌ی schema جدول‌ها/ستون‌ها برای یک import */
export async function persistSchema(importId: string, schema: TableSchema[]): Promise<void> {
  for (const t of schema) {
    const ts = await db.texsaTableSchema.create({
      data: {
        importId,
        tableName: t.name,
        tableOrder: t.order,
        rowCount: t.rowCount,
        domain: t.domain,
        normalized: t.normalized,
      },
    });
    if (t.columns.length) {
      await db.texsaColumnSchema.createMany({
        data: t.columns.map((c) => ({
          tableSchemaId: ts.id,
          columnName: c.name,
          columnOrder: c.order,
          nonEmptyCount: c.nonEmptyCount,
        })),
      });
    }
  }
}

/** درج دسته‌ای ردیف‌های خام (با حفظ ترتیب در rawJson به‌صورت {col:val} و columnOrder). */
export async function persistRawRowsBatch(importId: string, rows: TexsaRow[]): Promise<number> {
  if (!rows.length) return 0;
  await db.texsaRawRow.createMany({
    data: rows.map((r) => ({
      importId,
      tableName: r.table,
      rowOrder: r.rowOrder,
      rawJson: JSON.stringify({ columnOrder: r.columnOrder, fields: r.fields }),
    })),
  });
  return rows.length;
}

/** بازخوانی ردیف‌های خام یک جدول به‌ترتیب اصلی (برای normalize/export). */
export async function readRawRows(importId: string, tableName: string): Promise<TexsaRow[]> {
  const rows = await db.texsaRawRow.findMany({
    where: { importId, tableName },
    orderBy: { rowOrder: "asc" },
  });
  return rows.map((r) => {
    const parsed = JSON.parse(r.rawJson) as { columnOrder: string[]; fields: Record<string, string> };
    return {
      table: tableName,
      rowOrder: r.rowOrder,
      fields: parsed.fields,
      columnOrder: parsed.columnOrder,
    };
  });
}
