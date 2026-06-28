import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/base-data/distances?from=تهران&to=اصفهان
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (from && to) {
    const d = await db.cityDistance.findUnique({
      where: { fromCity_toCity: { fromCity: from, toCity: to } },
    });
    return NextResponse.json({ distance: d });
  }

  const cities = await db.cityDistance.findMany({
    distinct: ["fromCity"],
    select: { fromCity: true },
  });
  const all = await db.cityDistance.findMany({ take: 50 });
  return NextResponse.json({
    cities: cities.map((c) => c.fromCity),
    sample: all,
    count: await db.cityDistance.count(),
  });
}
