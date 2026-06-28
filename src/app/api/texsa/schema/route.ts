import { NextResponse } from "next/server";
import schemaData from "@/lib/texsa/schema.json";

// GET /api/texsa/schema — returns the Texsa schema summary
export async function GET() {
  return NextResponse.json(schemaData);
}
