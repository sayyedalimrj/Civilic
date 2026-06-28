import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/documents/[id]/versions — لیست نسخه‌های یک مستند
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await db.documentFile.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  // پیدا کردن مستند اصلی (parent یا خودش)
  const rootId = doc.parentDocId || doc.id;

  const versions = await db.documentFile.findMany({
    where: {
      OR: [
        { id: rootId },
        { parentDocId: rootId },
      ],
    },
    orderBy: { version: "asc" },
  });

  return NextResponse.json({ versions, current: id });
}

// POST /api/documents/[id]/versions — آپلود نسخه‌ی جدید
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await db.documentFile.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  const rootId = doc.parentDocId || doc.id;

  // شمارش نسخه‌های قبلی
  const allVersions = await db.documentFile.findMany({
    where: {
      OR: [{ id: rootId }, { parentDocId: rootId }],
    },
  });
  const newVersion = allVersions.length + 1;

  // علامت‌گذاری نسخه‌های قبلی به‌عنوان غیر latest
  await db.documentFile.updateMany({
    where: {
      OR: [{ id: rootId }, { parentDocId: rootId }],
    },
    data: { isLatest: false },
  });

  // دریافت فایل جدید
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const description = (formData.get("description") as string) || null;
  const uploadedByName = (formData.get("uploadedByName") as string) || "کاربر";

  if (!file) {
    return NextResponse.json({ error: "فایل الزامی است" }, { status: 400 });
  }

  // نام هوشمند برای نسخه‌ی جدید
  const ext = file.name.split(".").pop() || "bin";
  const storedName = doc.storedName.replace(/\.\w+$/, `_v${newVersion}.${ext}`);

  // ذخیره‌ی فایل
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fs = await import("fs/promises");
  const path = await import("path");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, storedName), buffer);

  // ایجاد رکورد نسخه‌ی جدید
  const newDoc = await db.documentFile.create({
    data: {
      tenantId: doc.tenantId,
      projectId: doc.projectId,
      entityType: doc.entityType,
      entityId: doc.entityId,
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      projectCode: doc.projectCode,
      paymentPeriod: doc.paymentPeriod,
      itemCode: doc.itemCode,
      uploadDate: doc.uploadDate,
      description: description || doc.description,
      category: doc.category,
      uploadedByName,
      version: newVersion,
      parentDocId: rootId,
      isLatest: true,
    },
  });

  return NextResponse.json({ document: newDoc });
}
