import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/alerts/[id]/read — علامت‌گذاری به‌عنوان خوانده‌شده
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const alert = await db.alert.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ alert });
}
