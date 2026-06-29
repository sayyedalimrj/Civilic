import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import { writeAudit, clientIp } from "@/lib/audit";
import { storeUpload, UploadError } from "@/lib/auth/upload-security";
import {
  bucketForOwner,
  uploadPermissionFor,
  viewPermissionFor,
  canViewAttachment,
  isOwnerType,
  type OwnerType,
} from "@/lib/storage/attachment-service";

// اجرا روی Node runtime (دسترسی به فایل‌سیستم)
export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────
//  GET /api/uploads?projectId=&ownerType=&ownerId=
//  فهرست پیوست‌های یک موجودیت (با اعمال دسترسی و visibility)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const ownerType = searchParams.get("ownerType");
  const ownerId = searchParams.get("ownerId");

  if (!projectId || !ownerType || !ownerId) {
    return NextResponse.json({ error: "projectId، ownerType و ownerId الزامی است" }, { status: 400 });
  }
  if (!isOwnerType(ownerType)) {
    return NextResponse.json({ error: "ownerType نامعتبر است" }, { status: 400 });
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });
  if (!access.permissions.includes(viewPermissionFor(ownerType as OwnerType))) {
    return NextResponse.json({ error: "مجوز مشاهده‌ی پیوست‌ها را ندارید" }, { status: 403 });
  }

  const rows = await db.attachment.findMany({
    where: { projectId, ownerType, ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  // اعمال visibility در سطح ردیف
  const visible = rows.filter((a) =>
    canViewAttachment(
      { visibility: a.visibility, partyType: a.partyType, uploadedById: a.uploadedById },
      access,
      user.id
    )
  );

  return NextResponse.json({
    attachments: visible.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      sha256: a.sha256,
      visibility: a.visibility,
      uploadedByName: a.uploadedByName,
      createdAt: a.createdAt,
      canDelete: a.uploadedById === user.id || access.permissions.includes("project.edit"),
      downloadUrl: `/api/uploads/${a.id}/download`,
    })),
  });
}

// ─────────────────────────────────────────────────────────────
//  POST /api/uploads  (multipart)
//  فیلدها: file, projectId, ownerType, ownerId, visibility?, description?
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const projectId = (form.get("projectId") as string) || "";
    const ownerType = (form.get("ownerType") as string) || "";
    const ownerId = (form.get("ownerId") as string) || "";
    const visibility = ((form.get("visibility") as string) || "PROJECT").toUpperCase();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایل ارسال نشده است" }, { status: 400 });
    }
    if (!projectId || !ownerType || !ownerId) {
      return NextResponse.json({ error: "projectId، ownerType و ownerId الزامی است" }, { status: 400 });
    }
    if (!isOwnerType(ownerType)) {
      return NextResponse.json({ error: "ownerType نامعتبر است" }, { status: 400 });
    }
    if (!["PROJECT", "PARTY", "INTERNAL"].includes(visibility)) {
      return NextResponse.json({ error: "visibility نامعتبر است" }, { status: 400 });
    }

    // ── دسترسی پروژه + مجوز آپلود ──
    const access = await getProjectAccess(projectId, user.id);
    if (!access) return NextResponse.json({ error: "شما عضو این پروژه نیستید" }, { status: 403 });
    const perm = uploadPermissionFor(ownerType as OwnerType);
    if (!access.permissions.includes(perm)) {
      return NextResponse.json({ error: "مجوز آپلود برای این بخش را ندارید" }, { status: 403 });
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true },
    });
    if (!project) return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });

    // tenant boundary
    if (user.tenantId && project.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "دسترسی به این مستاجر ندارید" }, { status: 403 });
    }

    const bucket = bucketForOwner(ownerType as OwnerType);
    const buffer = Buffer.from(await file.arrayBuffer());

    // ذخیره‌ی امن روی دیسک (اعتبارسنجی پسوند/حجم + sha256 داخل storeUpload)
    const stored = await storeUpload(bucket, file.name, buffer);

    const attachment = await db.attachment.create({
      data: {
        tenantId: project.tenantId,
        projectId,
        ownerType,
        ownerId,
        originalName: file.name.slice(0, 250),
        storedName: stored.storedName,
        storagePath: stored.storagePath,
        bucket,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: stored.sizeBytes,
        sha256: stored.sha256,
        visibility,
        partyType: access.member.partyType,
        uploadedById: user.id,
        uploadedByName: user.name,
      },
    });

    await writeAudit({
      tenantId: project.tenantId,
      projectId,
      userId: user.id,
      userName: user.name,
      action: "UPLOAD",
      entityType: "ATTACHMENT",
      entityId: attachment.id,
      after: { ownerType, ownerId, originalName: attachment.originalName, sizeBytes: attachment.sizeBytes, sha256: attachment.sha256 },
      ipAddr: clientIp(req.headers),
    });

    return NextResponse.json({
      attachment: {
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        sha256: attachment.sha256,
        visibility: attachment.visibility,
        uploadedByName: attachment.uploadedByName,
        createdAt: attachment.createdAt,
        canDelete: true,
        downloadUrl: `/api/uploads/${attachment.id}/download`,
      },
    });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[uploads] error:", err);
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }
}
