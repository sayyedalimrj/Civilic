import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess, ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const VALID_ROLES = new Set(Object.keys(ROLE_PERMISSIONS));

const patchSchema = z.object({
  role: z.string().optional(),
  canSign: z.boolean().optional(),
  canApprove: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/projects/[id]/members/[memberId] — ویرایش نقش/امضا/فعال‌بودن عضو
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: projectId, memberId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });
  if (!access.permissions.includes("members.edit")) {
    return NextResponse.json({ error: "مجوز ویرایش اعضا را ندارید" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.role && !VALID_ROLES.has(d.role)) {
    return NextResponse.json({ error: "نقش نامعتبر است" }, { status: 400 });
  }

  const member = await db.projectMember.findFirst({ where: { id: memberId, projectId } });
  if (!member) return NextResponse.json({ error: "عضو یافت نشد" }, { status: 404 });

  // غیرفعال‌سازی عضو نیازمند مجوز جداگانه
  if (d.isActive === false && !access.permissions.includes("members.disable")) {
    return NextResponse.json({ error: "مجوز غیرفعال‌سازی عضو را ندارید" }, { status: 403 });
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } });

  const updated = await db.projectMember.update({
    where: { id: memberId },
    data: {
      role: d.role ?? member.role,
      canSign: d.canSign ?? member.canSign,
      canApprove: d.canApprove ?? member.canApprove,
      isActive: d.isActive ?? member.isActive,
    },
  });

  await writeAudit({
    tenantId: project?.tenantId ?? "", projectId, userId: user.id, userName: user.name,
    action: "UPDATE", entityType: "PROJECT_MEMBER", entityId: memberId,
    before: { role: member.role, canSign: member.canSign, canApprove: member.canApprove, isActive: member.isActive },
    after: { role: updated.role, canSign: updated.canSign, canApprove: updated.canApprove, isActive: updated.isActive },
    ipAddr: clientIp(req.headers),
  });

  return NextResponse.json({ member: updated });
}

// DELETE /api/projects/[id]/members/[memberId] — حذف عضو (از دست رفتن فوری دسترسی)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: projectId, memberId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });
  if (!access.permissions.includes("members.disable")) {
    return NextResponse.json({ error: "مجوز حذف عضو را ندارید" }, { status: 403 });
  }

  const member = await db.projectMember.findFirst({ where: { id: memberId, projectId } });
  if (!member) return NextResponse.json({ error: "عضو یافت نشد" }, { status: 404 });

  const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } });

  await db.projectMember.delete({ where: { id: memberId } });

  await writeAudit({
    tenantId: project?.tenantId ?? "", projectId, userId: user.id, userName: user.name,
    action: "DELETE", entityType: "PROJECT_MEMBER", entityId: memberId,
    before: { userId: member.userId, role: member.role }, ipAddr: clientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
