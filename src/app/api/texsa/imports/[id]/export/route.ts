import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import schemaData from "@/lib/texsa/schema.json";

export const runtime = "nodejs";
export const maxDuration = 300;

// GET /api/texsa/imports/[id]/export — export mirror tables back to .svzt XML
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const importRecord = await db.texsaImport.findUnique({
    where: { id },
    select: { id: true, originalFileName: true, tableCountsJson: true },
  });

  if (!importRecord) {
    return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });
  }

  const tableCounts = JSON.parse(importRecord.tableCountsJson || "{}");
  const schema = schemaData as any;

  // Build XML
  let xml = '<?xml version="1.0" standalone="yes"?>\n<NewDataSet>\n';

  // Process tables in schema order
  for (const tableInfo of schema.tables) {
    const tableName = tableInfo.tableName;
    const modelName = tableName[0].toUpperCase() + tableName.slice(1);
    const model = (db as any)[modelName];

    if (!model) continue;

    // Get all rows for this table
    const rows = await model.findMany({
      where: { importId: id },
      orderBy: { rowOrder: "asc" },
    });

    if (rows.length === 0) continue;

    // Column mapping: tx_ field -> original column name
    const columnMap = tableInfo.columns.map((c: any) => ({
      original: c.name,
      field: `tx_${c.name.replace(/[^a-zA-Z0-9_]/g, "_")}`,
    }));

    for (const row of rows) {
      xml += `  <${tableName}>\n`;

      // Output known columns
      for (const col of columnMap) {
        const value = row[col.field];
        if (value !== null && value !== undefined) {
          xml += `    <${col.original}>${escapeXml(value)}</${col.original}>\n`;
        } else {
          xml += `    <${col.original}></${col.original}>\n`;
        }
      }

      // Output unknown columns from rawJson
      try {
        const rawFields = JSON.parse(row.rawJson || "{}");
        for (const [key, value] of Object.entries(rawFields)) {
          if (value !== null && value !== undefined) {
            xml += `    <${key}>${escapeXml(String(value))}</${key}>\n`;
          }
        }
      } catch {}

      xml += `  </${tableName}>\n`;
    }
  }

  xml += "</NewDataSet>";

  // Return as downloadable .svzt file
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const buffer = await blob.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/xml;charset=utf-8",
      "Content-Disposition": `attachment; filename="${importRecord.originalFileName.replace(/\.[^.]+$/, "")}_export.svzt"`,
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
