/**
 * serialize-xml.ts — سریال‌سازی ساختار NewDataSet به XML سازگار تکسا.
 * ترتیب جدول/ردیف/ستون و مقادیر رشته‌ای حفظ می‌شوند.
 */
import { encodeXml } from "../import/parse-svzt";

export interface ExportRow {
  columnOrder: string[];
  fields: Record<string, string>;
}

export interface ExportTable {
  name: string;
  rows: ExportRow[];
}

const NL = "\r\n";

export function serializeNewDataSet(tables: ExportTable[]): string {
  let out = `<?xml version="1.0" standalone="yes"?>${NL}<NewDataSet>${NL}`;
  for (const t of tables) {
    for (const row of t.rows) {
      out += `  <${t.name}>${NL}`;
      for (const col of row.columnOrder) {
        const v = row.fields[col] ?? "";
        if (v === "") {
          out += `    <${col} />${NL}`;
        } else {
          out += `    <${col}>${encodeXml(v)}</${col}>${NL}`;
        }
      }
      out += `  </${t.name}>${NL}`;
    }
  }
  out += `</NewDataSet>${NL}`;
  return out;
}
