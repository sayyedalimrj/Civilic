import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/documents/[id]/star — toggle star
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await db.documentFile.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  const updated = await db.documentFile.update({
    where: { id },
    data: { isStarred: !doc.isStarred },
  });

  return NextResponse.json({ document: updated });
}
