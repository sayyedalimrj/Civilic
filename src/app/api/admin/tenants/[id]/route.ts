import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPlatform, platformAudit } from "@/lib/auth/admin-guard";

// GET /api/admin/tenants/[id] — جزئیات مستاجر
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guardPlatform("tenant.view");
  if ("error" in g) return g.error;
  const { id } = await params;

  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      organizations: true,
      projects: { select: { id: true, name: true, code: true, status: true } },
      users: { select: { id: true, name: true, email: true, isActive: true } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!tenant) return NextResponse.json({ error: "مستاجر یافت نشد" }, { status: 404 });
  return NextResponse.json({ tenant });
}

// PATCH /api/admin/tenants/[id] — فعال/غیرفعال یا ویرایش
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guardPlatform("tenant.edit");
  if ("error" in g) return g.error;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { isActive?: boolean; name?: string; slug?: string };

  if (body.isActive === false) {
    const dis = await guardPlatform("tenant.disable");
    if ("error" in dis) return dis.error;
  }

  const tenant = await db.tenant.update({
    where: { id },
    data: {
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(body.name ? { name: body.name } : {}),
      ...(body.slug !== undefined ? { slug: body.slug || null } : {}),
    },
  });
  await platformAudit(g.ctx, body.isActive === false ? "TENANT_DISABLE" : "TENANT_EDIT", "TENANT", id);
  return NextResponse.json({ tenant: { id: tenant.id, isActive: tenant.isActive } });
}
