import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toJalali } from "@/lib/fa";

const TENANT_ID = "tenant-demo";

// GET /api/documents?projectId=X&entityType=Y&entityId=Z
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const category = searchParams.get("category");

  const where: any = { tenantId: TENANT_ID };
  if (projectId) where.projectId = projectId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (category) where.category = category;

  const documents = await db.documentFile.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

// POST /api/documents — آپلود فایل با نام‌گذاری هوشمند
// فرم multipart با فیلدهای: file, projectId, entityType, entityId, itemCode, paymentPeriod, description, category
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const itemCode = (formData.get("itemCode") as string) || null;
    const paymentPeriod = formData.get("paymentPeriod")
      ? Number(formData.get("paymentPeriod"))
      : null;
    const description = (formData.get("description") as string) || null;
    const category = (formData.get("category") as string) || "OTHER";
    const uploadedByName = (formData.get("uploadedByName") as string) || "کاربر";

    if (!file || !projectId || !entityType || !entityId) {
      return NextResponse.json(
        { error: "فایل، projectId، entityType، entityId الزامی است" },
        { status: 400 }
      );
    }

    // دریافت کد پروژه
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { code: true },
    });
    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
    }

    // تاریخ شمسی امروز (بدون اسلش)
    const todayJalali = toJalali(new Date()).replace(/\//g, "-");

    // پسوند فایل
    const ext = file.name.split(".").pop() || "bin";

    // نام‌گذاری هوشمند: [کد پروژه]_[شماره صورت وضعیت]_[کد آیتم]_[تاریخ]_[توضیحات].پسوند
    const parts: string[] = [project.code];
    parts.push(paymentPeriod ? `SW${paymentPeriod}` : "SW0");
    parts.push(itemCode || "NOCODE");
    parts.push(todayJalali);
    if (description) {
      // حذف کاراکترهای غیرمجاز و کوتاه کردن
      const safeDesc = description
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")
        .slice(0, 50);
      parts.push(safeDesc);
    }
    const storedName = `${parts.join("_")}.${ext}`;

    // ذخیره‌ی فایل در public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, storedName);
    await fs.writeFile(filePath, buffer);

    // ذخیره‌ی رکورد در دیتابیس
    const doc = await db.documentFile.create({
      data: {
        tenantId: TENANT_ID,
        projectId,
        entityType,
        entityId,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        projectCode: project.code,
        paymentPeriod,
        itemCode,
        uploadDate: todayJalali,
        description,
        category,
        uploadedById: null,
        uploadedByName,
      },
    });

    return NextResponse.json({
      document: doc,
      url: `/uploads/${storedName}`,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "خطا در آپلود فایل" },
      { status: 500 }
    );
  }
}
