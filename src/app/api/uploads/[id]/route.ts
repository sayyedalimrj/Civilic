import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

// DELETE /api/uploads/[id] — حذف نرم (soft-delete) با لاگ حسابرسی
// فقط آپلودکننده یا دارای project.edit مجاز است.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const att = await db.attachment.findUnique({ where: { id } });
  if (!att || att.deletedAt) {
    return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
  }

  if (user.tenantId && att.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  let canDelete = att.uploadedById === user.id;
  if (!canDelete && att.projectId) {
    const access = await getProjectAccess(att.projectId, user.id);
    canDelete = !!access && access.permissions.includes("project.edit");
  }
  if (!canDelete) {
    return NextResponse.json({ error: "مجوز حذف این فایل را ندارید" }, { status: 403 });
  }

  await db.attachment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAudit({
    tenantId: att.tenantId,
    projectId: att.projectId,
    userId: user.id,
    userName: user.name,
    action: "DELETE",
    entityType: "ATTACHMENT",
    entityId: att.id,
    before: { originalName: att.originalName, ownerType: att.ownerType, ownerId: att.ownerId },
    ipAddr: clientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
