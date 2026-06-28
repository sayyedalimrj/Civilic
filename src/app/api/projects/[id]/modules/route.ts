import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[id]/modules — لیست ماژول‌های فعال/غیرفعال پروژه
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const modules = await db.projectModule.findMany({
    where: { projectId: id },
  });

  // ماژول‌های قابل‌تعریف
  const ALL_MODULES = [
    { key: "DETAIL_BOQ", label: "ریزمتره", defaultEnabled: true },
    { key: "FINANCIAL_SHEET", label: "برگه مالی", defaultEnabled: true },
    { key: "CHAPTERS", label: "فصول و تجهیز کارگاه", defaultEnabled: true },
    { key: "PAYMENTS", label: "صورت‌وضعیت", defaultEnabled: true },
    { key: "ADJUSTMENT", label: "تعدیل", defaultEnabled: true },
    { key: "REVERSE_ADJUSTMENT", label: "تعدیل معکوس", defaultEnabled: false },
    { key: "MATERIAL_SITE", label: "مصالح پای کار", defaultEnabled: false },
    { key: "BID_PRICE", label: "دامنه قیمت پیشنهادی", defaultEnabled: false },
    { key: "TRANSPORT_FORM", label: "فرم حمل", defaultEnabled: true },
    { key: "MATERIAL_FORM", label: "فرم آهن و سیمان", defaultEnabled: true },
    { key: "REPORTS", label: "گزارشات و خروجی", defaultEnabled: true },
  ];

  const moduleMap = new Map(modules.map((m) => [m.moduleKey, m.isEnabled]));
  const result = ALL_MODULES.map((m) => ({
    ...m,
    isEnabled: moduleMap.has(m.key) ? moduleMap.get(m.key) : m.defaultEnabled,
  }));

  return NextResponse.json({ modules: result });
}

// PATCH /api/projects/[id]/modules — به‌روزرسانی فعال‌سازی ماژول‌ها
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { modules } = body as { modules: { key: string; isEnabled: boolean }[] };

  // upsert همه‌ی ماژول‌ها
  for (const m of modules) {
    const existing = await db.projectModule.findUnique({
      where: { projectId_moduleKey: { projectId: id, moduleKey: m.key } },
    });
    if (existing) {
      await db.projectModule.update({
        where: { id: existing.id },
        data: { isEnabled: m.isEnabled },
      });
    } else {
      await db.projectModule.create({
        data: { projectId: id, moduleKey: m.key, isEnabled: m.isEnabled },
      });
    }
  }

  return NextResponse.json({ success: true });
}
