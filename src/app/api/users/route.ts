import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users — لیست کاربران سازمان
export async function GET() {
  const users = await db.user.findMany({
    where: { tenantId: "tenant-demo" },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

// POST /api/users — ایجاد کاربر جدید
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, role, password } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "نام و ایمل الزامی است" }, { status: 400 });
  }

  try {
    const user = await db.user.create({
      data: {
        tenantId: "tenant-demo",
        name,
        email,
        role: role || "ESTIMATOR",
        passwordHash: password || null,
        isActive: true,
      },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است" }, { status: 409 });
    }
    return NextResponse.json({ error: "خطا در ایجاد کاربر" }, { status: 500 });
  }
}
