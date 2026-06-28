import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/suppliers?category=X — لیست تأمین‌کنندگان
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: any = { tenantId: TENANT_ID };
  if (category) where.category = category;

  const suppliers = await db.supplier.findMany({
    where,
    orderBy: { rating: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  const summary = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.isActive).length,
    avgRating:
      suppliers.length > 0
        ? suppliers.reduce((s, sup) => s + sup.rating, 0) / suppliers.length
        : 0,
    byCategory: suppliers.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return NextResponse.json({ suppliers, summary });
}

// POST /api/suppliers — ایجاد تأمین‌کننده جدید
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    category,
    contactPerson,
    phone,
    email,
    address,
    taxId,
    notes,
  } = body;

  if (!name || !category) {
    return NextResponse.json(
      { error: "نام و دسته‌بندی الزامی است" },
      { status: 400 }
    );
  }

  const supplier = await db.supplier.create({
    data: {
      tenantId: TENANT_ID,
      name,
      category,
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      taxId: taxId || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ supplier });
}
