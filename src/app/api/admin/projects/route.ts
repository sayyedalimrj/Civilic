import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPlatform } from "@/lib/auth/admin-guard";

// GET /api/admin/projects?tenantId= — فهرست پروژه‌ها در سطح پلتفرم
export async function GET(req: NextRequest) {
  const g = await guardPlatform("platform.project.view");
  if ("error" in g) return g.error;
  const tenantId = req.nextUrl.searchParams.get("tenantId") || undefined;

  const projects = await db.project.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      tenant: { select: { name: true } },
      _count: { select: { parties: true, payments: true } },
    },
  });
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id, name: p.name, code: p.code, status: p.status,
      contractAmount: p.contractAmount, recordSource: p.recordSource,
      tenant: p.tenant?.name ?? null, parties: p._count.parties, payments: p._count.payments,
    })),
  });
}
