import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPlatform, platformAudit } from "@/lib/auth/admin-guard";
import { hashPassword } from "@/lib/auth/password";

// GET /api/admin/users?tenantId= — فهرست کاربران (اختیاری بر اساس مستاجر)
export async function GET(req: NextRequest) {
  const g = await guardPlatform("platform.user.manage");
  if ("error" in g) return g.error;
  const tenantId = req.nextUrl.searchParams.get("tenantId") || undefined;

  const users = await db.user.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { tenant: { select: { name: true } }, organization: { select: { name: true } } },
  });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, isActive: u.isActive,
      isPlatformAdmin: u.isPlatformAdmin, platformRole: u.platformRole,
      tenant: u.tenant?.name ?? null, organization: u.organization?.name ?? null,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email("ایمیل نامعتبر"),
  tenantId: z.string().min(1, "مستاجر الزامی است"),
  organizationId: z.string().optional(),
  password: z.string().min(4).optional(),
  platformRole: z.string().optional(),
});

// POST /api/admin/users — ساخت/دعوت کاربر
export async function POST(req: NextRequest) {
  const g = await guardPlatform("platform.user.manage");
  if ("error" in g) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const { name, email, tenantId, organizationId, password, platformRole } = parsed.data;

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "کاربری با این ایمیل وجود دارد" }, { status: 409 });

  const user = await db.user.create({
    data: {
      tenantId,
      organizationId: organizationId || null,
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(password || "civilic"),
      isPlatformAdmin: !!platformRole,
      platformRole: platformRole || null,
      role: platformRole || "member",
    },
  });
  await db.tenantMember.create({ data: { tenantId, userId: user.id, role: "tenant_member" } }).catch(() => {});
  if (organizationId) {
    await db.organizationMember.create({ data: { organizationId, userId: user.id, role: "org_member" } }).catch(() => {});
  }
  await platformAudit(g.ctx, "USER_CREATE", "USER", user.id, { email });
  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}
