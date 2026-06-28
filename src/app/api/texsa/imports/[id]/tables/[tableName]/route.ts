import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import schemaData from "@/lib/texsa/schema.json";

// GET /api/texsa/imports/[id]/tables/[tableName] — get rows of a specific table
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tableName: string }> }
) {
  const { id, tableName } = await params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50", 10), 200);
  const search = searchParams.get("search") || "";

  const importRecord = await db.texsaImport.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!importRecord) {
    return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });
  }

  // Find model name
  const schema = schemaData as any;
  const tableInfo = schema.tables.find((t: any) => t.tableName === tableName);
  if (!tableInfo) {
    return NextResponse.json({ error: "جدول یافت نشد در schema" }, { status: 404 });
  }

  const modelName = tableName[0].toUpperCase() + tableName.slice(1);
  const model = (db as any)[modelName];

  if (!model) {
    return NextResponse.json({ error: "مدل یافت نشد" }, { status: 404 });
  }

  const where: any = { importId: id };
  
  // Search filter - search across all tx_ columns
  if (search) {
    const txColumns = tableInfo.columns.map((c: any) => `tx_${c.name.replace(/[^a-zA-Z0-9_]/g, "_")}`);
    where.OR = txColumns.map((col: string) => ({
      [col]: { contains: search },
    }));
  }

  const [total, rows] = await Promise.all([
    model.count({ where }),
    model.findMany({
      where,
      orderBy: { rowOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Extract column names from schema
  const columns = tableInfo.columns.map((c: any) => ({
    name: c.name,
    field: `tx_${c.name.replace(/[^a-zA-Z0-9_]/g, "_")}`,
    type: c.inferredType,
  }));

  return NextResponse.json({
    tableName,
    columns,
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
