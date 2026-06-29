import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess, ROLE_PERMISSIONS, ROLE_LABELS_FA } from "@/lib/auth/permissions";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const VALID_ROLES = new Set(Object.keys(ROLE_PERMISSIONS));

// GET /api/projects/[id]/members — اعضای پروژه (با نقش و طرف)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });

  const members = await db.projectMember.findMany({
    where: { projectId },
    include: {
      projectParty: { select: { partyType: true, displayTitle: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // اطلاعات کاربر را جداگانه می‌گیریم (ProjectMember رابطه‌ی مستقیم به User ندارد)
  const userIds = members.map((m) => m.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, isActive: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: userMap.get(m.userId)?.name ?? "نامشخص",
      userEmail: userMap.get(m.userId)?.email ?? null,
      userActive: userMap.get(m.userId)?.isActive ?? false,
      role: m.role,
      roleLabel: ROLE_LABELS_FA[m.role as keyof typeof ROLE_LABELS_FA] ?? m.role,
      partyType: m.projectParty?.partyType ?? null,
      partyTitle: m.projectParty?.displayTitle ?? null,
      canSign: m.canSign,
      canApprove: m.canApprove,
      isActive: m.isActive,
    })),
  });
}

const addSchema = z.object({
  userId: z.string().min(1, "کاربر الزامی است"),
  projectPartyId: z.string().min(1, "طرف پروژه الزامی است"),
  role: z.string().min(1, "نقش الزامی است"),
  canSign: z.boolean().optional(),
  canApprove: z.boolean().optional(),
});

// POST /api/projects/[id]/members — افزودن کاربر به یک طرف پروژه با نقش پروژه‌ای
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });
  if (!access.permissions.includes("members.invite")) {
    return NextResponse.json({ error: "مجوز افزودن عضو به پروژه را ندارید" }, { status: 403 });
  }

  const parsed = addSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const d = parsed.data;
  if (!VALID_ROLES.has(d.role)) {
    return NextResponse.json({ error: "نقش نامعتبر است" }, { status: 400 });
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } });
  if (!project) return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });

  // طرف باید متعلق به همین پروژه باشد
  const party = await db.projectParty.findFirst({ where: { id: d.projectPartyId, projectId } });
  if (!party) return NextResponse.json({ error: "طرف پروژه نامعتبر است" }, { status: 400 });

  // کاربر باید متعلق به همان مستاجر باشد (مرز امنیتی)
  const target = await db.user.findUnique({ where: { id: d.userId }, select: { id: true, tenantId: true } });
  if (!target || (target.tenantId && target.tenantId !== project.tenantId)) {
    return NextResponse.json({ error: "کاربر متعلق به این مستاجر نیست" }, { status: 400 });
  }

  // یکتایی: هر کاربر فقط یک عضویت در هر پروژه
  const existing = await db.projectMember.findFirst({ where: { projectId, userId: d.userId } });
  if (existing) {
    return NextResponse.json({ error: "این کاربر قبلاً عضو پروژه است" }, { status: 409 });
  }

  const member = await db.projectMember.create({
    data: {
      projectId,
      userId: d.userId,
      projectPartyId: d.projectPartyId,
      role: d.role,
      canSign: d.canSign ?? false,
      canApprove: d.canApprove ?? false,
      isActive: true,
    },
  });

  await writeAudit({
    tenantId: project.tenantId, projectId, userId: user.id, userName: user.name,
    action: "CREATE", entityType: "PROJECT_MEMBER", entityId: member.id,
    after: { userId: d.userId, role: d.role, partyType: party.partyType }, ipAddr: clientIp(req.headers),
  });

  return NextResponse.json({ member }, { status: 201 });
}
