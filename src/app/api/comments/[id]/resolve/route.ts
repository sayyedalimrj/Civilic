import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/comments/[id]/resolve — تاگل وضعیت resolved
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "کامنت یافت نشد" }, { status: 404 });
  }

  const updated = await db.comment.update({
    where: { id },
    data: { resolved: !comment.resolved },
  });

  return NextResponse.json({ comment: updated });
}
