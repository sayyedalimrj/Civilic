/**
 * analyze-schema.ts — استخراج schema جدول/ستون از ردیف‌های تکسا (با ترتیب و non-empty count).
 */
import type { TexsaRow } from "./parse-svzt";
import { TEXSA_TABLES } from "../table-map";

export interface ColumnSchema {
  name: string;
  order: number;
  nonEmptyCount: number;
}

export interface TableSchema {
  name: string;
  order: number;
  rowCount: number;
  domain: string | null;
  normalized: boolean;
  columns: ColumnSchema[];
}

/** انباره‌ی تجمعی schema که می‌توان آن را ردیف‌به‌ردیف تغذیه کرد (سازگار با streaming). */
export class SchemaAccumulator {
  private tableOrder: string[] = [];
  private rowCounts: Record<string, number> = {};
  private cols: Record<string, Map<string, { order: number; nonEmpty: number }>> = {};

  addRow(row: TexsaRow): void {
    if (!(row.table in this.rowCounts)) {
      this.rowCounts[row.table] = 0;
      this.cols[row.table] = new Map();
      this.tableOrder.push(row.table);
    }
    this.rowCounts[row.table] += 1;
    const map = this.cols[row.table];
    for (const col of row.columnOrder) {
      let entry = map.get(col);
      if (!entry) {
        entry = { order: map.size, nonEmpty: 0 };
        map.set(col, entry);
      }
      if ((row.fields[col] ?? "").trim() !== "") entry.nonEmpty += 1;
    }
  }

  build(): TableSchema[] {
    return this.tableOrder.map((name, order) => {
      const info = TEXSA_TABLES[name];
      const columns: ColumnSchema[] = [];
      this.cols[name].forEach((v, colName) => {
        columns.push({ name: colName, order: v.order, nonEmpty: v.nonEmpty } as never);
      });
      columns.sort((a, b) => a.order - b.order);
      return {
        name,
        order,
        rowCount: this.rowCounts[name],
        domain: info?.domain ?? null,
        normalized: info?.normalized ?? false,
        columns: columns.map((c) => ({ name: c.name, order: c.order, nonEmptyCount: (c as never as { nonEmpty: number }).nonEmpty })),
      };
    });
  }
}

/** استخراج schema از آرایه‌ی کامل ردیف‌ها (برای ورودی کوچک). */
export function analyzeSchema(rows: TexsaRow[]): TableSchema[] {
  const acc = new SchemaAccumulator();
  for (const r of rows) acc.addRow(r);
  return acc.build();
}
