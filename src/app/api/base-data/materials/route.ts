import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/base-data/materials
export async function GET() {
  const materials = await db.materialRate.findMany({
    orderBy: [{ year: "desc" }, { material: "asc" }],
  });
  return NextResponse.json({ materials });
}
