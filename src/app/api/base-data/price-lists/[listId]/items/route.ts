import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/base-data/price-lists/[listId]/items
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const { listId } = await params;
  const items = await db.priceListItem.findMany({
    where: { priceListId: listId },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ items });
}
