import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/base-data/coefficients
export async function GET() {
  const coeffs = await db.coefficient.findMany({
    orderBy: [{ year: "desc" }, { discipline: "asc" }],
  });
  return NextResponse.json({ coefficients: coeffs });
}
