import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/texsa/imports/[id] — get import details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const importRecord = await db.texsaImport.findUnique({
    where: { id },
  });

  if (!importRecord) {
    return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });
  }

  // Get issues separately
  const issues = await db.texsaImportIssue.findMany({
    where: { importId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tableCounts = JSON.parse(importRecord.tableCountsJson || "{}");
  const warnings = JSON.parse(importRecord.warningsJson || "[]");
  const errors = JSON.parse(importRecord.errorsJson || "[]");

  return NextResponse.json({
    import: { ...importRecord, issues },
    tableCounts,
    warnings,
    errors,
  });
}
