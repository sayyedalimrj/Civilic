import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/users/[id] — به‌روزرسانی کاربر
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password !== undefined) data.passwordHash = body.password;

  try {
    const user = await db.user.update({ where: { id }, data });
    return NextResponse.json({ user });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است" }, { status: 409 });
    }
    return NextResponse.json({ error: "خطا در به‌روزرسانی کاربر" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — حذف کاربر
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در حذف کاربر" }, { status: 500 });
  }
}
