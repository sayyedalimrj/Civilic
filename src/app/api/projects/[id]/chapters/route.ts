import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/chapters
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chapters = await db.chapter.findMany({
    where: { projectId: id },
    orderBy: { chapterNo: "asc" },
  });
  return NextResponse.json({ chapters });
}
