import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPlatform } from "@/lib/auth/admin-guard";

// GET /api/admin/overview — آمار داشبورد مدیریت سامانه
export async function GET() {
  const g = await guardPlatform("platform.dashboard.view");
  if ("error" in g) return g.error;

  const [
    tenants,
    activeTenants,
    projects,
    users,
    platformUsers,
    subscriptions,
    invoices,
    paidInvoices,
    overdueInvoices,
  ] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { isActive: true } }),
    db.project.count(),
    db.user.count(),
    db.user.count({ where: { isPlatformAdmin: true } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.invoice.count(),
    db.invoice.findMany({ where: { status: "PAID" }, select: { amount: true } }),
    db.invoice.count({ where: { status: "OVERDUE" } }),
  ]);

  const revenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
  const usage = await db.usageMetric.findMany({ orderBy: { period: "desc" }, take: 50 });
  const storageUsedMb = usage.reduce((s, u) => s + u.storageUsedMb, 0);
  const texsaImports = usage.reduce((s, u) => s + u.texsaImportsCount, 0);

  return NextResponse.json({
    tenants,
    activeTenants,
    projects,
    users,
    platformUsers,
    activeSubscriptions: subscriptions,
    invoices,
    overdueInvoices,
    revenue,
    storageUsedMb,
    texsaImports,
  });
}
