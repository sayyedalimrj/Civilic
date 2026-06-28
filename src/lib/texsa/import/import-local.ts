/**
 * import-local.ts — import فایل .svzt از workspace (dev/local).
 * فایل بزرگ به‌صورت streaming خوانده و دسته‌ای در DB ذخیره می‌شود (بدون بارگذاری کامل در حافظه).
 *
 * در production نباید این مسیر روی فایل ۷۰MB در یک API route معمولی اجرا شود؛
 * به‌جای آن فایل به storage آپلود و با job پردازش می‌شود (TEXSA_IMPORT_MODE=production).
 */
import { statSync } from "node:fs";
import { basename } from "node:path";
import { db } from "@/lib/db";
import { streamSvztRows, type TexsaRow } from "./parse-svzt";
import { SchemaAccumulator } from "./analyze-schema";
import { persistSchema, persistRawRowsBatch } from "./preserve-raw";
import { CONTRACT_FIELD_MAP } from "../table-map";

export interface ImportResult {
  importId: string;
  totalTables: number;
  totalRows: number;
  projectName?: string;
  projectCode?: string;
  texsaVersion?: string;
}

const BATCH = 500;

export async function importLocalSvzt(filePath: string): Promise<ImportResult> {
  const size = statSync(filePath).size;
  const imp = await db.texsaImport.create({
    data: {
      originalFileName: basename(filePath),
      fileSizeBytes: size,
      status: "RUNNING",
      importMode: "LOCAL",
    },
  });

  const acc = new SchemaAccumulator();
  let batch: TexsaRow[] = [];
  let contractFacts: { name?: string; code?: string; version?: string } = {};

  async function flush() {
    if (batch.length) {
      await persistRawRowsBatch(imp.id, batch);
      batch = [];
    }
  }

  try {
    const { totalRows, tables } = await streamSvztRows(filePath, async (row) => {
      acc.addRow(row);
      // استخراج اطلاعات پیمان از brv_contract
      if (row.table === "brv_contract") {
        contractFacts = {
          name: row.fields[CONTRACT_FIELD_MAP.projectName],
          code: row.fields[CONTRACT_FIELD_MAP.projectCode],
          version: row.fields[CONTRACT_FIELD_MAP.texsaVersion],
        };
      }
      batch.push(row);
      if (batch.length >= BATCH) await flush();
    });
    await flush();

    const schema = acc.build();
    await persistSchema(imp.id, schema);

    await db.texsaImport.update({
      where: { id: imp.id },
      data: {
        status: "DONE",
        totalRows,
        totalTables: tables.length,
        projectName: contractFacts.name ?? null,
        projectCode: contractFacts.code ?? null,
        texsaVersion: contractFacts.version ?? null,
        tableCountsJson: JSON.stringify(Object.fromEntries(schema.map((t) => [t.name, t.rowCount]))),
      },
    });

    return {
      importId: imp.id,
      totalTables: tables.length,
      totalRows,
      projectName: contractFacts.name,
      projectCode: contractFacts.code,
      texsaVersion: contractFacts.version,
    };
  } catch (err) {
    await db.texsaImport.update({
      where: { id: imp.id },
      data: { status: "FAILED", errorsJson: JSON.stringify([String(err)]) },
    });
    throw err;
  }
}
