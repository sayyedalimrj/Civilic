import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE /api/comments/[id] — حذف کامنت
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
