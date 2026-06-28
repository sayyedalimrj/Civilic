import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPlatform, platformAudit } from "@/lib/auth/admin-guard";

// POST /api/admin/invoices/[id]/pay — ثبت پرداخت دستی
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guardPlatform("payment.register_saas");
  if ("error" in g) return g.error;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { referenceNumber?: string };

  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "صورتحساب یافت نشد" }, { status: 404 });

  const now = new Date();
  await db.paymentTransaction.create({
    data: { invoiceId: id, amount: invoice.amount, method: "MANUAL", referenceNumber: body.referenceNumber || null, status: "SUCCESS" },
  });
  await db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: now } });
  await platformAudit(g.ctx, "INVOICE_PAID", "INVOICE", id, { amount: invoice.amount });
  return NextResponse.json({ ok: true });
}
