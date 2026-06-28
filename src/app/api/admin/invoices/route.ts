import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPlatform, platformAudit } from "@/lib/auth/admin-guard";

// GET /api/admin/invoices
export async function GET(req: NextRequest) {
  const g = await guardPlatform("billing.manage");
  if ("error" in g) return g.error;
  const tenantId = req.nextUrl.searchParams.get("tenantId") || undefined;
  const invoices = await db.invoice.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { tenant: { select: { name: true } } },
  });
  return NextResponse.json({
    invoices: invoices.map((i) => ({
      id: i.id, number: i.number, amount: i.amount, status: i.status,
      issuedAt: i.issuedAt, dueAt: i.dueAt, paidAt: i.paidAt, tenant: i.tenant?.name ?? null,
    })),
  });
}

const schema = z.object({
  tenantId: z.string().min(1, "مستاجر الزامی است"),
  amount: z.number().int().min(0),
  dueInDays: z.number().int().min(0).default(7),
  note: z.string().optional(),
});

// POST /api/admin/invoices — صدور صورتحساب
export async function POST(req: NextRequest) {
  const g = await guardPlatform("invoice.create");
  if ("error" in g) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const { tenantId, amount, dueInDays, note } = parsed.data;
  const now = new Date();
  const count = await db.invoice.count();
  const number = `INV-${now.getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const invoice = await db.invoice.create({
    data: {
      tenantId, number, amount, status: "ISSUED",
      issuedAt: now, dueAt: new Date(now.getTime() + dueInDays * 86400000), note: note || null,
    },
  });
  await platformAudit(g.ctx, "INVOICE_CREATE", "INVOICE", invoice.id, { tenantId, amount });
  return NextResponse.json({ invoice: { id: invoice.id, number: invoice.number } }, { status: 201 });
}
