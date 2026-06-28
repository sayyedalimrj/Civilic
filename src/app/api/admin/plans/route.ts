import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPlatform, platformAudit } from "@/lib/auth/admin-guard";

// GET /api/admin/plans
export async function GET() {
  const g = await guardPlatform("platform.dashboard.view");
  if ("error" in g) return g.error;
  const plans = await db.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return NextResponse.json({
    plans: plans.map((p) => ({
      id: p.id, key: p.key, name: p.name, monthlyPrice: p.monthlyPrice, yearlyPrice: p.yearlyPrice,
      maxProjects: p.maxProjects, maxUsers: p.maxUsers, maxStorageMb: p.maxStorageMb,
      maxTexsaImportsPerMonth: p.maxTexsaImportsPerMonth, maxExportsPerMonth: p.maxExportsPerMonth,
      isActive: p.isActive, subscriptions: p._count.subscriptions,
    })),
  });
}

const schema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  monthlyPrice: z.number().int().min(0).default(0),
  yearlyPrice: z.number().int().min(0).default(0),
  maxProjects: z.number().int().min(0).default(1),
  maxUsers: z.number().int().min(0).default(5),
  maxStorageMb: z.number().int().min(0).default(1024),
  maxTexsaImportsPerMonth: z.number().int().min(0).default(1),
  maxExportsPerMonth: z.number().int().min(0).default(10),
});

// POST /api/admin/plans — ساخت/به‌روزرسانی پلن
export async function POST(req: NextRequest) {
  const g = await guardPlatform("plan.manage");
  if ("error" in g) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const d = parsed.data;
  const plan = await db.plan.upsert({
    where: { key: d.key },
    create: d,
    update: d,
  });
  await platformAudit(g.ctx, "PLAN_UPSERT", "PLAN", plan.id, { key: d.key });
  return NextResponse.json({ plan: { id: plan.id, key: plan.key } }, { status: 201 });
}
