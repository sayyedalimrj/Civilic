import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/alerts/[id]/resolve — رفع هشدار
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const alert = await db.alert.update({
    where: { id },
    data: { isResolved: true, isRead: true, resolvedAt: new Date() },
  });

  return NextResponse.json({ alert });
}
