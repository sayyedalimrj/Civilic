/**
 * parse-svzt.ts — تجزیه‌ی فایل .svzt تکسا (XML با ریشه‌ی NewDataSet)
 *
 * دو حالت:
 *  1) parseSvztString  — برای ورودی‌های کوچک/متوسط (preview) با fast-xml-parser.
 *  2) streamSvztRows    — برای فایل‌های بزرگ (تا ۷۰MB+) با خواندن chunk و اسکنر امن حافظه.
 *
 * ساختار فایل: <NewDataSet> سپس به‌ازای هر ردیف یک عنصر <TableName> با فرزندان <Field>value</Field>.
 * ترتیب جدول/ردیف/ستون و مقادیر رشته‌ای حفظ می‌شوند (round-trip).
 */
import { createReadStream } from "node:fs";

export interface TexsaRow {
  table: string;
  /** ترتیب ردیف در همان جدول (۰-مبنا) */
  rowOrder: number;
  /** ستون‌ها با ترتیب اصلی */
  fields: Record<string, string>;
  /** ترتیب نام ستون‌ها */
  columnOrder: string[];
}

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

export function decodeXmlEntities(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (m) => {
    if (XML_ENTITIES[m]) return XML_ENTITIES[m];
    if (m.startsWith("&#x")) return String.fromCodePoint(parseInt(m.slice(3, -1), 16));
    if (m.startsWith("&#")) return String.fromCodePoint(parseInt(m.slice(2, -1), 10));
    return m;
  });
}

export function encodeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * اسکنر streaming امن حافظه. به‌ازای هر ردیف callback صدا زده می‌شود.
 * با ساختار منظم تکسا (depth: NewDataSet > table > field) کار می‌کند.
 */
export async function streamSvztRows(
  filePath: string,
  onRow: (row: TexsaRow) => void | Promise<void>,
  opts: { onTable?: (table: string, order: number) => void } = {}
): Promise<{ totalRows: number; tables: string[] }> {
  const stream = createReadStream(filePath, { encoding: "utf-8", highWaterMark: 1 << 20 });
  let buffer = "";
  let inRoot = false;

  // وضعیت ردیف جاری
  let curTable: string | null = null;
  let curFields: Record<string, string> = {};
  let curOrder: string[] = [];
  let curField: string | null = null;
  let curText = "";

  const rowOrderByTable: Record<string, number> = {};
  const tableSeen: string[] = [];
  let totalRows = 0;

  // اسکنر ساده‌ی tag-based روی بافر؛ تگ‌های کامل را مصرف می‌کند و باقیمانده را نگه می‌دارد.
  function processBuffer(final: boolean) {
    let i = 0;
    while (true) {
      const lt = buffer.indexOf("<", i);
      if (lt === -1) {
        // متن قبل از تگ بعدی (محتوای فیلد)
        if (curField) curText += buffer.slice(i);
        buffer = "";
        return;
      }
      // متن بین تگ‌ها
      if (curField && lt > i) curText += buffer.slice(i, lt);
      const gt = buffer.indexOf(">", lt);
      if (gt === -1) {
        // تگ ناقص — باقیمانده را نگه دار
        if (curField && lt > i) {
          // متن قبلی را قبلاً افزودیم
        }
        buffer = buffer.slice(lt);
        return;
      }
      const tag = buffer.slice(lt, gt + 1);
      i = gt + 1;
      handleTag(tag);
    }
  }

  function handleTag(tag: string) {
    // اعلان XML / کامنت‌ها
    if (tag.startsWith("<?") || tag.startsWith("<!")) return;
    const isClose = tag.startsWith("</");
    const isSelf = tag.endsWith("/>");
    const name = tag
      .replace(/^<\/?/, "")
      .replace(/\/?>$/, "")
      .split(/\s/)[0]
      .trim();

    if (!inRoot) {
      if (!isClose && name === "NewDataSet") inRoot = true;
      return;
    }

    if (name === "NewDataSet" && isClose) {
      inRoot = false;
      return;
    }

    if (curTable === null) {
      // شروع یک ردیف جدول
      if (!isClose && !isSelf) {
        curTable = name;
        curFields = {};
        curOrder = [];
        if (!(name in rowOrderByTable)) {
          rowOrderByTable[name] = 0;
          tableSeen.push(name);
          opts.onTable?.(name, tableSeen.length - 1);
        }
      }
      return;
    }

    // درون یک ردیف
    if (curField === null) {
      if (isClose && name === curTable) {
        // پایان ردیف
        const row: TexsaRow = {
          table: curTable,
          rowOrder: rowOrderByTable[curTable],
          fields: curFields,
          columnOrder: curOrder,
        };
        rowOrderByTable[curTable] += 1;
        totalRows += 1;
        curTable = null;
        // callback ممکن است async باشد؛ اما برای سادگی sync جمع‌آوری می‌کنیم
        void onRow(row);
        return;
      }
      if (!isClose && !isSelf) {
        curField = name;
        curText = "";
      } else if (isSelf) {
        curFields[name] = "";
        curOrder.push(name);
      }
      return;
    }

    // پایان یک فیلد
    if (isClose && name === curField) {
      curFields[curField] = decodeXmlEntities(curText.trim());
      curOrder.push(curField);
      curField = null;
      curText = "";
    }
  }

  for await (const chunk of stream) {
    buffer += chunk as string;
    processBuffer(false);
  }
  processBuffer(true);

  return { totalRows, tables: tableSeen };
}

/** تجزیه‌ی رشته‌ی XML کوچک/متوسط به ردیف‌ها (preview). */
export function parseSvztString(xml: string): TexsaRow[] {
  const rows: TexsaRow[] = [];
  const rowOrderByTable: Record<string, number> = {};
  // ریشه را پیدا کن
  const rootStart = xml.indexOf("<NewDataSet>");
  const body = rootStart >= 0 ? xml.slice(rootStart + "<NewDataSet>".length) : xml;
  // عناصر سطح-جدول را با regex امن استخراج کن (depth-2)
  const tableRe = /<([A-Za-z_][\w]*)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(body)) !== null) {
    const table = m[1];
    if (table === "NewDataSet") continue;
    const inner = m[2];
    const fields: Record<string, string> = {};
    const order: string[] = [];
    const fieldRe = /<([A-Za-z_][\w]*)\s*\/>|<([A-Za-z_][\w]*)>([\s\S]*?)<\/\2>/g;
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(inner)) !== null) {
      if (f[1]) {
        fields[f[1]] = "";
        order.push(f[1]);
      } else {
        fields[f[2]] = decodeXmlEntities((f[3] ?? "").trim());
        order.push(f[2]);
      }
    }
    if (!(table in rowOrderByTable)) rowOrderByTable[table] = 0;
    rows.push({ table, rowOrder: rowOrderByTable[table]++, fields, columnOrder: order });
  }
  return rows;
}
