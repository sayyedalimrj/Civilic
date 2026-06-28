import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlatformAccess } from "@/lib/auth/permissions";

// کانال‌های پیش‌فرض هر پروژه
const DEFAULT_CHANNELS: { title: string; type: string; visibility: string }[] = [
  { title: "عمومی پروژه", type: "GENERAL", visibility: "ALL_PARTIES" },
  { title: "دفتر فنی", type: "TECHNICAL", visibility: "ALL_PARTIES" },
  { title: "کارگاه", type: "SITE", visibility: "ALL_PARTIES" },
  { title: "صورت‌وضعیت‌ها", type: "PAYMENT", visibility: "ALL_PARTIES" },
  { title: "تعدیل", type: "ADJUSTMENT", visibility: "ALL_PARTIES" },
  { title: "مکاتبات رسمی", type: "OFFICIAL", visibility: "ALL_PARTIES" },
  { title: "داخلی کارفرما", type: "GENERAL", visibility: "INTERNAL_PARTY" },
  { title: "داخلی مشاور", type: "GENERAL", visibility: "INTERNAL_PARTY" },
  { title: "داخلی پیمانکار", type: "GENERAL", visibility: "INTERNAL_PARTY" },
];

// GET /api/projects — پروژه‌های tenant کاربر فعلی (یا پروژه‌هایی که عضو آن‌هاست)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const platform = await getPlatformAccess(user.id);
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  // محدوده: مدیر سامانه می‌تواند tenant را انتخاب کند؛ کاربر عادی فقط tenant خودش + پروژه‌هایی که عضو است
  const where = platform
    ? tenantId
      ? { tenantId }
      : {}
    : {
        OR: [
          { tenantId: user.tenantId ?? "__none__" },
          { members: { some: { userId: user.id, isActive: true } } },
        ],
      };

  const projects = await db.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { detailBoqs: true, financialSheet: true, payments: true } },
      tenant: { select: { name: true } },
      parties: { include: { organization: { select: { name: true } } } },
      members: { where: { userId: user.id }, select: { role: true, projectParty: { select: { partyType: true } } } },
      payments: { select: { status: true } },
    },
  });

  const OPEN = new Set(["DRAFT", "SUBMITTED_BY_CONTRACTOR", "UNDER_CONSULTANT_REVIEW", "RETURNED_BY_CONSULTANT", "RESUBMITTED_BY_CONTRACTOR", "APPROVED_BY_CONSULTANT", "SUBMITTED_TO_EMPLOYER", "UNDER_EMPLOYER_REVIEW", "RETURNED_BY_EMPLOYER", "RESUBMITTED_TO_EMPLOYER", "SUBMITTED", "CONSULTANT_APPROVED"]);

  const shaped = projects.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    status: p.status,
    year: p.year,
    location: p.location,
    contractAmount: p.contractAmount,
    cachedExecuted: p.cachedExecuted,
    cachedTotal: p.cachedTotal,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    tenant: p.tenant?.name ?? null,
    parties: p.parties.map((pp) => ({ partyType: pp.partyType, name: pp.organization?.name ?? pp.displayTitle })),
    myRole: p.members[0]?.role ?? null,
    myPartyType: p.members[0]?.projectParty?.partyType ?? null,
    openWorkflows: p.payments.filter((pay) => OPEN.has(pay.status)).length,
    paymentCount: p.payments.length,
    detailCount: p._count.detailBoqs,
  }));

  return NextResponse.json({ projects: shaped });
}

const partySchema = z.object({
  partyType: z.enum(["EMPLOYER", "CONSULTANT", "CONTRACTOR", "OTHER"]),
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  displayTitle: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(2, "نام پروژه الزامی است"),
  code: z.string().min(1, "کد پروژه الزامی است"),
  contractNo: z.string().optional(),
  year: z.coerce.number().int().optional(),
  priceListId: z.string().optional(),
  priceListYear: z.coerce.number().int().optional(),
  contractAmount: z.coerce.number().optional(),
  contractDate: z.string().optional(),
  startDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  parties: z.array(partySchema).optional(),
});

// POST /api/projects — ایجاد پروژه‌ی جدید (عمومی، tenant-scoped، با طرفین اختیاری)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }
  const d = parsed.data;

  // tenant مقصد: مدیر سامانه می‌تواند tenant بدهد؛ وگرنه tenant کاربر
  const platform = await getPlatformAccess(user.id);
  const bodyTenant = (await req.clone().json().catch(() => ({}))) as { tenantId?: string };
  const tenantId = platform && bodyTenant.tenantId ? bodyTenant.tenantId : user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "tenant نامشخص است" }, { status: 400 });

  const project = await db.project.create({
    data: {
      tenantId,
      name: d.name,
      code: d.code,
      contractNo: d.contractNo ?? null,
      year: d.year ?? (d.priceListYear ?? new Date().getFullYear() - 621),
      priceListId: d.priceListId || null,
      priceListYear: d.priceListYear ?? null,
      contractAmount: d.contractAmount ?? 0,
      contractDate: d.contractDate ? new Date(d.contractDate) : null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      location: d.location ?? null,
      description: d.description ?? null,
      status: d.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      recordSource: "CIVILIC",
    },
  });

  // طرفین (انتخاب سازمان موجود یا ساخت سازمان جدید)
  for (const p of d.parties ?? []) {
    let orgId = p.organizationId;
    if (!orgId && p.organizationName) {
      const org = await db.organization.create({
        data: { tenantId, name: p.organizationName, type: p.partyType },
      });
      orgId = org.id;
    }
    if (!orgId) continue;
    await db.projectParty.create({
      data: {
        projectId: project.id,
        organizationId: orgId,
        partyType: p.partyType,
        displayTitle: p.displayTitle || p.organizationName || p.partyType,
        isPrimary: true,
      },
    });
  }

  // کانال‌های پیش‌فرض
  await db.projectChannel.createMany({
    data: DEFAULT_CHANNELS.map((c) => ({ projectId: project.id, ...c })),
  });

  return NextResponse.json({ project }, { status: 201 });
}
