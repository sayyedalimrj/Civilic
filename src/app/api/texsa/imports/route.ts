import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/texsa/imports — list all imports
export async function GET() {
  const imports = await db.texsaImport.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      originalFileName: true,
      fileSizeBytes: true,
      projectName: true,
      projectCode: true,
      status: true,
      totalTables: true,
      totalRows: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ imports });
}
