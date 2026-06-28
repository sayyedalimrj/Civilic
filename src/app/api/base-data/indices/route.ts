import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/base-data/indices
export async function GET() {
  const indices = await db.indexRecord.findMany({
    orderBy: [{ year: "desc" }, { season: "asc" }],
  });
  return NextResponse.json({ indices });
}
