import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const PARTY_TYPES = ["EMPLOYER", "CONSULTANT", "CONTRACTOR", "LAB", "SUPPLIER", "OPERATOR", "OTHER"] as const;

// GET /api/projects/[id]/parties — طرف‌های پروژه
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });

  const parties = await db.projectParty.findMany({
    where: { projectId },
    include: {
      organization: { select: { id: true, name: true, type: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ parties });
}

const addSchema = z.object({
  partyType: z.enum(PARTY_TYPES),
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  displayTitle: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

// POST /api/projects/[id]/parties — افزودن طرف (سازمان موجود یا ساخت جدید)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return NextResponse.json({ error: "عضو این پروژه نیستید" }, { status: 403 });
  if (!access.permissions.includes("members.edit")) {
    return NextResponse.json({ error: "مجوز مدیریت طرف‌های پروژه را ندارید" }, { status: 403 });
  }

  const parsed = addSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const d = parsed.data;

  const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } });
  if (!project) return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });

  // سازمان: موجود (و متعلق به همان مستاجر) یا ساخت جدید
  let orgId = d.organizationId;
  if (orgId) {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { tenantId: true } });
    if (!org || org.tenantId !== project.tenantId) {
      return NextResponse.json({ error: "سازمان نامعتبر است" }, { status: 400 });
    }
  } else if (d.organizationName) {
    const org = await db.organization.create({
      data: { tenantId: project.tenantId, name: d.organizationName, type: d.partyType },
    });
    orgId = org.id;
  } else {
    return NextResponse.json({ error: "سازمان موجود یا نام سازمان جدید الزامی است" }, { status: 400 });
  }

  const party = await db.projectParty.create({
    data: {
      projectId,
      organizationId: orgId,
      partyType: d.partyType,
      displayTitle: d.displayTitle || d.organizationName || d.partyType,
      isPrimary: d.isPrimary ?? false,
    },
  });

  await writeAudit({
    tenantId: project.tenantId, projectId, userId: user.id, userName: user.name,
    action: "CREATE", entityType: "PROJECT_PARTY", entityId: party.id,
    after: { partyType: party.partyType, organizationId: orgId }, ipAddr: clientIp(req.headers),
  });

  return NextResponse.json({ party }, { status: 201 });
}
