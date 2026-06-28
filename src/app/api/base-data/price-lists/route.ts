import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/base-data/price-lists — همه فهرست‌های بها با آیتم‌ها
export async function GET() {
  const lists = await db.priceList.findMany({
    orderBy: [{ year: "desc" }, { discipline: "asc" }],
    include: {
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json({ lists });
}
