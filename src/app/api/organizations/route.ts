import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlatformAccess } from "@/lib/auth/permissions";
import { canManageTenant, isTenantMember } from "@/lib/auth/tenant-access";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const PARTY_TYPES = ["EMPLOYER", "CONSULTANT", "CONTRACTOR", "LAB", "SUPPLIER", "OPERATOR", "OTHER"] as const;

// GET /api/organizations?tenantId= — سازمان‌های یک مستاجر (پیش‌فرض: مستاجر کاربر)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const platform = await getPlatformAccess(user.id);
  const qTenant = req.nextUrl.searchParams.get("tenantId");
  const tenantId = platform && qTenant ? qTenant : user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "مستاجر نامشخص است" }, { status: 400 });

  if (!(await isTenantMember(user.id, tenantId))) {
    return NextResponse.json({ error: "به این مستاجر دسترسی ندارید" }, { status: 403 });
  }

  const organizations = await db.organization.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, type: true, nationalId: true, phone: true, address: true,
      _count: { select: { projectParties: true, members: true } },
    },
  });
  return NextResponse.json({ organizations });
}

const createSchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().min(2, "نام سازمان الزامی است"),
  type: z.enum(PARTY_TYPES).default("OTHER"),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// POST /api/organizations — ساخت سازمان (فقط مدیر سامانه یا مدیر/مالک مستاجر)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const d = parsed.data;
  const platform = await getPlatformAccess(user.id);
  const tenantId = platform && d.tenantId ? d.tenantId : user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "مستاجر نامشخص است" }, { status: 400 });

  if (!(await canManageTenant(user.id, tenantId))) {
    return NextResponse.json({ error: "مجوز ساخت سازمان در این مستاجر را ندارید" }, { status: 403 });
  }

  const org = await db.organization.create({
    data: {
      tenantId,
      name: d.name,
      type: d.type,
      nationalId: d.nationalId ?? null,
      phone: d.phone ?? null,
      address: d.address ?? null,
    },
  });

  await writeAudit({
    tenantId, userId: user.id, userName: user.name,
    action: "CREATE", entityType: "ORGANIZATION", entityId: org.id,
    after: { name: org.name, type: org.type }, ipAddr: clientIp(req.headers),
  });

  return NextResponse.json({ organization: org }, { status: 201 });
}
