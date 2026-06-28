import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// DELETE /api/documents/[id] — حذف فایل
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await db.documentFile.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
  }

  // حذف فایل فیزیکی
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", doc.storedName);
    await fs.unlink(filePath);
  } catch {
    // فایل ممکن است قبلاً حذف شده باشد — نادیده می‌گیریم
  }

  await db.documentFile.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
