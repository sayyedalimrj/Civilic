import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tenant — اطلاعات سازمان و امضاها
export async function GET() {
  const tenant = await db.tenant.findFirst({
    where: { id: "tenant-demo" },
    include: { users: true },
  });
  return NextResponse.json({ tenant });
}

// PATCH /api/tenant — به‌روزرسانی تنظیمات سازمان
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
  if (body.letterheadUrl !== undefined) data.letterheadUrl = body.letterheadUrl;
  if (body.signatures !== undefined) data.signatures = JSON.stringify(body.signatures);

  try {
    const tenant = await db.tenant.update({
      where: { id: "tenant-demo" },
      data,
      include: { users: true },
    });
    return NextResponse.json({ tenant });
  } catch (error) {
    return NextResponse.json({ error: "خطا در به‌روزرسانی تنظیمات" }, { status: 500 });
  }
}
