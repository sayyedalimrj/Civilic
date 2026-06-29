import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_LABELS_FA, PARTY_LABELS_FA, partyTypeOfRole, type ProjectRole } from "@/lib/auth/permissions";

export const runtime = "nodejs";

// برچسب طرف‌های اضافی که در PARTY_LABELS_FA نیستند
const EXTRA_PARTY_LABELS: Record<string, string> = {
  LAB: "آزمایشگاه",
  SUPPLIER: "تأمین‌کننده",
  OPERATOR: "بهره‌بردار",
  OTHER: "سایر",
};

// GET /api/meta/roles — گزینه‌های نقش پروژه و برچسب طرف‌ها (برای فرم‌های سمت کلاینت)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const roles = (Object.keys(ROLE_LABELS_FA) as ProjectRole[])
    .map((key) => ({
      key,
      label: ROLE_LABELS_FA[key],
      partyType: partyTypeOfRole(key),
    }))
    // نقش‌های سیستمی پلتفرم در فرم انتخاب عضو پروژه نمایش داده نمی‌شوند
    .filter((r) => r.partyType !== "SYSTEM");

  const parties = [
    ...Object.entries(PARTY_LABELS_FA)
      .filter(([type]) => type !== "INTERNAL")
      .map(([type, label]) => ({ type, label })),
    ...Object.entries(EXTRA_PARTY_LABELS).map(([type, label]) => ({ type, label })),
  ];

  return NextResponse.json({ roles, parties });
}
