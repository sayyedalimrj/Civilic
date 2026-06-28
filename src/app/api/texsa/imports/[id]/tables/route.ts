import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import schemaData from "@/lib/texsa/schema.json";

// GET /api/texsa/imports/[id]/tables — list tables with row counts and column info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const importRecord = await db.texsaImport.findUnique({
    where: { id },
    select: { tableCountsJson: true },
  });

  if (!importRecord) {
    return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });
  }

  const tableCounts = JSON.parse(importRecord.tableCountsJson || "{}");
  const schema = schemaData as any;

  // Combine schema with actual counts
  const tables = schema.tables.map((t: any) => ({
    tableName: t.tableName,
    sourceRowCount: t.sourceRowCount,
    columnCount: t.columnCount,
    actualRowCount: tableCounts[t.tableName] || 0,
    columns: t.columns.map((c: any) => c.name),
  }));

  // Add unknown tables
  const knownNames = schema.tables.map((t: any) => t.tableName);
  for (const [name, count] of Object.entries(tableCounts)) {
    if (!knownNames.includes(name)) {
      tables.push({
        tableName: name,
        sourceRowCount: 0,
        columnCount: 0,
        actualRowCount: count as number,
        columns: [],
        isUnknown: true,
      });
    }
  }

  return NextResponse.json({ tables });
}
