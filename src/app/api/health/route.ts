import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/health — سلامت اپ و اتصال دیتابیس (بدون افشای راز)
export async function GET() {
  try {
    const [users, tenants, projects, owner, preparer] = await Promise.all([
      db.user.count(),
      db.tenant.count(),
      db.project.count(),
      db.user.findUnique({ where: { email: "owner@civilic.ir" }, select: { id: true } }),
      db.user.findUnique({ where: { email: "preparer@sivantadbir.ir" }, select: { id: true } }),
    ]);

    return NextResponse.json({
      app: "ok",
      database: "ok",
      counts: { users, tenants, projects },
      seeded: {
        hasPlatformOwner: Boolean(owner),
        hasDemoUser: Boolean(preparer),
      },
      bootstrapEnabled: process.env.ENABLE_DEMO_BOOTSTRAP === "true",
    });
  } catch (e) {
    console.error("[health] database error:", e);
    return NextResponse.json(
      { app: "ok", database: "error", message: "اتصال به دیتابیس برقرار نشد" },
      { status: 503 }
    );
  }
}
