import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPlatform, platformAudit } from "@/lib/auth/admin-guard";

// GET /api/admin/tenants — فهرست مستاجرها
export async function GET() {
  const g = await guardPlatform("tenant.view");
  if ("error" in g) return g.error;

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { projects: true, users: true, organizations: true } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
    },
  });

  return NextResponse.json({
    tenants: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isActive: t.isActive,
      createdAt: t.createdAt,
      projects: t._count.projects,
      users: t._count.users,
      organizations: t._count.organizations,
      plan: t.subscriptions[0]?.plan?.name ?? null,
      subscriptionStatus: t.subscriptions[0]?.status ?? null,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(2, "نام مستاجر الزامی است"),
  slug: z.string().optional(),
  planKey: z.string().optional(),
});

// POST /api/admin/tenants — ساخت مستاجر جدید (+ اشتراک اختیاری)
export async function POST(req: NextRequest) {
  const g = await guardPlatform("tenant.create");
  if ("error" in g) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const { name, slug, planKey } = parsed.data;

  const tenant = await db.tenant.create({ data: { name, slug: slug || null, isActive: true } });

  if (planKey) {
    const plan = await db.plan.findUnique({ where: { key: planKey } });
    if (plan) {
      const now = new Date();
      await db.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: "TRIALING",
          startedAt: now,
          trialEndsAt: new Date(now.getTime() + 14 * 86400000),
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
        },
      });
    }
  }

  await platformAudit(g.ctx, "TENANT_CREATE", "TENANT", tenant.id, { name });
  return NextResponse.json({ tenant: { id: tenant.id, name: tenant.name } }, { status: 201 });
}
