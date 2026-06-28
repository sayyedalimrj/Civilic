import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { runDemoSeed } from "@/lib/seed/demo-seed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * POST /api/bootstrap/demo-seed — seed یک‌باره‌ی دمو برای preview/دمو.
 * فقط وقتی ENABLE_DEMO_BOOTSTRAP=true و BOOTSTRAP_SECRET صحیح باشد اجرا می‌شود.
 * به‌صورت پیش‌فرض idempotent است (بدون حذف داده). حذف فقط با reset:true و خارج از production.
 *
 * احراز: هدر `x-bootstrap-secret` یا بدنه‌ی { secret }.
 */
export async function POST(req: NextRequest) {
  if (process.env.ENABLE_DEMO_BOOTSTRAP !== "true") {
    return NextResponse.json({ error: "bootstrap غیرفعال است (ENABLE_DEMO_BOOTSTRAP)" }, { status: 403 });
  }
  const expected = process.env.BOOTSTRAP_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "BOOTSTRAP_SECRET تنظیم نشده است" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as { secret?: string; reset?: boolean };
  const provided = req.headers.get("x-bootstrap-secret") || body.secret || "";
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: "secret نامعتبر است" }, { status: 401 });
  }

  // reset فقط در حالت غیر-production و درخواست صریح
  const reset = body.reset === true && process.env.NODE_ENV !== "production";

  try {
    const summary = await runDemoSeed(db, { reset });
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[bootstrap] seed failed:", e);
    return NextResponse.json({ error: "اجرای seed ناموفق بود", detail: String(e) }, { status: 500 });
  }
}
