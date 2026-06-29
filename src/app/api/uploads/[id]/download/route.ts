import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import { writeAudit, clientIp } from "@/lib/audit";
import { openDownloadStream, fileExists, UploadError } from "@/lib/auth/upload-security";
import {
  viewPermissionFor,
  canViewAttachment,
  isOwnerType,
  type OwnerType,
} from "@/lib/storage/attachment-service";
import type { UploadBucket } from "@/lib/storage/upload-config";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { Readable } from "node:stream";

export const runtime = "nodejs";

// GET /api/uploads/[id]/download — استریم فایل با بررسی دسترسی (هرگز سرو عمومی)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const att = await db.attachment.findUnique({ where: { id } });
  if (!att || att.deletedAt) {
    return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
  }

  // tenant boundary
  if (user.tenantId && att.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  // پیوست‌های متصل به پروژه باید عضویت + مجوز را داشته باشند
  if (att.projectId) {
    const access = await getProjectAccess(att.projectId, user.id);
    if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });
    if (isOwnerType(att.ownerType) && !access.permissions.includes(viewPermissionFor(att.ownerType as OwnerType))) {
      return NextResponse.json({ error: "مجوز دانلود ندارید" }, { status: 403 });
    }
    const ok = canViewAttachment(
      { visibility: att.visibility, partyType: att.partyType, uploadedById: att.uploadedById },
      access,
      user.id
    );
    if (!ok) return NextResponse.json({ error: "این فایل با طرف شما به اشتراک گذاشته نشده است" }, { status: 403 });
  }

  try {
    if (!(await fileExists(att.bucket as UploadBucket, att.storagePath))) {
      return NextResponse.json({ error: "فایل روی سرور موجود نیست" }, { status: 404 });
    }
    const { stream } = openDownloadStream(att.bucket as UploadBucket, att.storagePath);

    await writeAudit({
      tenantId: att.tenantId,
      projectId: att.projectId,
      userId: user.id,
      userName: user.name,
      action: "DOWNLOAD",
      entityType: "ATTACHMENT",
      entityId: att.id,
      ipAddr: clientIp(req.headers),
    });

    const webStream = Readable.toWeb(stream) as unknown as NodeReadableStream<Uint8Array>;
    const asciiName = att.originalName.replace(/[^\x20-\x7e]/g, "_");
    const encodedName = encodeURIComponent(att.originalName);
    return new NextResponse(webStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": att.mimeType || "application/octet-stream",
        "Content-Length": String(att.sizeBytes),
        // attachment تا فایل در مرورگر اجرا/render نشود
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[download] error:", err);
    return NextResponse.json({ error: "خطا در دانلود فایل" }, { status: 500 });
  }
}
