// ─────────────────────────────────────────────────────────────
//  Civilic seed — پلتفرم عمومی SaaS + داده‌ی دمو
//
//  مهم: Civilic یک محصول عمومی چندمستاجرتی است. پروژه‌ی «خاتم» فقط داده‌ی دمو
//  در یک tenant دمو است و مثل هر داده‌ی دیگری قابل ویرایش/حذف است. هیچ بخشی از کد
//  وجود همیشگی آن را فرض نمی‌کند.
//
//  این seed می‌سازد:
//   1) tenant پلتفرم + کاربر مالک سامانه (platform owner) و مدیر سامانه
//   2) RoleTemplateهای پیش‌فرض (پروژه‌ای + پلتفرمی) — نقش‌ها DB-driven هستند
//   3) پلن‌ها: Trial / Basic / Pro / Enterprise
//   4) tenant دمو «دموی Civilic» + اشتراک
//   5) داده‌ی دموی خاتم (سازمان‌ها/پروژه/کاربران/گردش‌کار) زیر همان tenant
//
//  اجرا: `bun prisma/seed.ts` (نیازمند DATABASE_URL به یک PostgreSQL)
// ─────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import {
  ROLE_PERMISSIONS,
  ROLE_LABELS_FA,
  PLATFORM_ROLE_PERMISSIONS,
  PLATFORM_ROLE_LABELS_FA,
  partyTypeOfRole,
} from "../src/lib/auth/permissions";

const db = new PrismaClient();
const PWD = hashPassword("civilic");

async function main() {
  console.log("🚀 شروع seed — پلتفرم Civilic + داده‌ی دمو...");

  // ── پاکسازی (به ترتیب وابستگی) ──
  await db.paymentTransaction.deleteMany();
  await db.invoice.deleteMany();
  await db.subscription.deleteMany();
  await db.usageMetric.deleteMany();
  await db.featureFlag.deleteMany();
  await db.platformAuditLog.deleteMany();
  await db.supportAccessGrant.deleteMany();
  await db.organizationMember.deleteMany();
  await db.tenantMember.deleteMany();
  await db.role.deleteMany();
  await db.roleTemplate.deleteMany();
  await db.plan.deleteMany();

  await db.messageReadReceipt.deleteMany();
  await db.message.deleteMany();
  await db.channelMember.deleteMany();
  await db.projectChannel.deleteMany();
  await db.correspondenceRecipient.deleteMany();
  await db.letter.deleteMany();
  await db.documentVersion.deleteMany();
  await db.document.deleteMany();
  await db.workflowAction.deleteMany();
  await db.workflowInstance.deleteMany();
  await db.adjustmentReportRow.deleteMany();
  await db.paymentItem.deleteMany();
  await db.payment.deleteMany();
  await db.financialSheetItem.deleteMany();
  await db.chapter.deleteMany();
  await db.summaryBoq.deleteMany();
  await db.detailBoq.deleteMany();
  await db.priceListItem.deleteMany();
  await db.alert.deleteMany();
  await db.comment.deleteMany();
  await db.auditLog.deleteMany();
  await db.projectMember.deleteMany();
  await db.projectParty.deleteMany();
  await db.project.deleteMany();
  await db.priceList.deleteMany();
  await db.user.deleteMany();
  await db.organization.deleteMany();
  await db.tenant.deleteMany();

  // ═══ ۱) RoleTemplateها (DB-driven) ═══
  let sort = 0;
  // پروژه‌ای
  for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const pt = partyTypeOfRole(key as never);
    if (pt === "SYSTEM") continue; // نقش‌های سیستمی را به‌عنوان template پلتفرمی جدا می‌سازیم
    await db.roleTemplate.create({
      data: {
        key,
        scope: "PROJECT",
        partyType: pt,
        labelFa: ROLE_LABELS_FA[key as never] ?? key,
        permissionsJson: JSON.stringify(perms),
        isSystem: true,
        sortOrder: sort++,
      },
    });
  }
  // پلتفرمی
  for (const [key, perms] of Object.entries(PLATFORM_ROLE_PERMISSIONS)) {
    await db.roleTemplate.create({
      data: {
        key,
        scope: "PLATFORM",
        labelFa: PLATFORM_ROLE_LABELS_FA[key as never] ?? key,
        permissionsJson: JSON.stringify(perms),
        isSystem: true,
        sortOrder: sort++,
      },
    });
  }
  console.log(`   ✓ ${sort} RoleTemplate ساخته شد`);

  // ═══ ۲) پلن‌ها ═══
  const plans = await Promise.all([
    db.plan.create({ data: { key: "trial", name: "آزمایشی", monthlyPrice: 0, yearlyPrice: 0, maxProjects: 1, maxUsers: 5, maxStorageMb: 512, maxTexsaImportsPerMonth: 1, maxExportsPerMonth: 5, sortOrder: 0, enabledFeaturesJson: JSON.stringify(["payment", "chat"]) } }),
    db.plan.create({ data: { key: "basic", name: "پایه", monthlyPrice: 3_000_000, yearlyPrice: 30_000_000, maxProjects: 5, maxUsers: 25, maxStorageMb: 5120, maxTexsaImportsPerMonth: 10, maxExportsPerMonth: 50, sortOrder: 1, enabledFeaturesJson: JSON.stringify(["payment", "chat", "adjustment", "correspondence"]) } }),
    db.plan.create({ data: { key: "pro", name: "حرفه‌ای", monthlyPrice: 9_000_000, yearlyPrice: 90_000_000, maxProjects: 25, maxUsers: 150, maxStorageMb: 51200, maxTexsaImportsPerMonth: 100, maxExportsPerMonth: 500, sortOrder: 2, enabledFeaturesJson: JSON.stringify(["payment", "chat", "adjustment", "correspondence", "texsa", "documents"]) } }),
    db.plan.create({ data: { key: "enterprise", name: "سازمانی", monthlyPrice: 30_000_000, yearlyPrice: 300_000_000, maxProjects: 1000, maxUsers: 2000, maxStorageMb: 512000, maxTexsaImportsPerMonth: 1000, maxExportsPerMonth: 5000, sortOrder: 3, enabledFeaturesJson: JSON.stringify(["payment", "chat", "adjustment", "correspondence", "texsa", "documents", "sso", "api"]) } }),
  ]);
  const proPlan = plans.find((p) => p.key === "pro")!;
  console.log(`   ✓ ${plans.length} پلن ساخته شد`);

  // ═══ ۳) tenant پلتفرم + کاربران پلتفرم ═══
  const platformTenant = await db.tenant.create({ data: { name: "Civilic Platform", slug: "platform", isActive: true } });
  await db.user.create({
    data: { tenantId: platformTenant.id, email: "owner@civilic.ir", name: "مالک سامانه", passwordHash: PWD, isPlatformAdmin: true, platformRole: "platform_owner", role: "platform_owner" },
  });
  await db.user.create({
    data: { tenantId: platformTenant.id, email: "admin@civilic.ir", name: "مدیر سامانه", passwordHash: PWD, isPlatformAdmin: true, platformRole: "platform_admin", role: "platform_admin" },
  });
  console.log("   ✓ کاربران پلتفرم: owner@civilic.ir / admin@civilic.ir");

  // ═══ ۴) tenant دمو + اشتراک ═══
  const tenant = await db.tenant.create({ data: { name: "دموی Civilic", slug: "demo", isActive: true } });
  const now = new Date();
  await db.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: proPlan.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
    },
  });
  await db.usageMetric.create({
    data: { tenantId: tenant.id, period: "1403-05", projectsCount: 1, usersCount: 12, storageUsedMb: 42, texsaImportsCount: 1, exportsCount: 3, messagesCount: 7, documentsCount: 1 },
  });

  // ═══ ۵) داده‌ی دموی خاتم (زیر tenant دمو) ═══
  const employerOrg = await db.organization.create({ data: { tenantId: tenant.id, name: "دانشگاه خاتم", type: "EMPLOYER", address: "تهران، پردیس دانشگاه خاتم" } });
  const consultantOrg = await db.organization.create({ data: { tenantId: tenant.id, name: "مهندسین مشاور شارستان", type: "CONSULTANT" } });
  const contractorOrg = await db.organization.create({ data: { tenantId: tenant.id, name: "شرکت سیوان تدبیر تجارت", type: "CONTRACTOR" } });

  async function mkUser(name: string, email: string, orgId: string) {
    const u = await db.user.create({
      data: { tenantId: tenant.id, organizationId: orgId, email: email.toLowerCase(), name, passwordHash: PWD, isActive: true, role: "member" },
    });
    await db.tenantMember.create({ data: { tenantId: tenant.id, userId: u.id, role: "tenant_member" } });
    await db.organizationMember.create({ data: { organizationId: orgId, userId: u.id, role: "org_member" } });
    return u;
  }

  const empPM = await mkUser("مدیر پروژه کارفرما", "pm@khatam.ac.ir", employerOrg.id);
  const empFinance = await mkUser("کارشناس مالی کارفرما", "finance@khatam.ac.ir", employerOrg.id);
  const empApprover = await mkUser("مقام تأیید کارفرما", "approver@khatam.ac.ir", employerOrg.id);
  const conResident = await mkUser("ناظر مقیم", "resident@sharestan.ir", consultantOrg.id);
  const conTech = await mkUser("کارشناس دفتر فنی مشاور", "techoffice@sharestan.ir", consultantOrg.id);
  const conReviewer = await mkUser("رسیدگی صورت‌وضعیت مشاور", "review@sharestan.ir", consultantOrg.id);
  const conApprover = await mkUser("تأییدکننده مشاور", "approver@sharestan.ir", consultantOrg.id);
  const conrPM = await mkUser("مدیر پروژه پیمانکار", "pm@sivantadbir.ir", contractorOrg.id);
  const conrSite = await mkUser("رئیس کارگاه", "site@sivantadbir.ir", contractorOrg.id);
  const conrSurveyor = await mkUser("مترور", "surveyor@sivantadbir.ir", contractorOrg.id);
  const conrPreparer = await mkUser("کارشناس صورت‌وضعیت", "preparer@sivantadbir.ir", contractorOrg.id);
  const conrSubmitter = await mkUser("تأییدکننده پیمانکار", "submitter@sivantadbir.ir", contractorOrg.id);

  const priceList = await db.priceList.create({ data: { year: 1403, discipline: "ابنیه", title: "فهرست‌بهای ابنیه ۱۴۰۳" } });
  await db.priceListItem.createMany({
    data: [
      { priceListId: priceList.id, code: "060102", title: "بتن‌ریزی پی و شالوده", unit: "مترمکعب", unitPrice: 1120000 },
      { priceListId: priceList.id, code: "060805", title: "آرماتوربندی میلگرد", unit: "کیلوگرم", unitPrice: 276000 },
      { priceListId: priceList.id, code: "010210", title: "ایجاد شیار در سطوح بتنی", unit: "مترطول", unitPrice: 1541000 },
    ],
  });

  const project = await db.project.create({
    data: {
      tenantId: tenant.id,
      name: "اجرای سازه ساختمان پارکینگ شرقی پروژه مجموعه آموزشی و فناوری خاتم",
      code: "C-KH-03-052",
      contractNo: "C-KH-03-052",
      year: 1403,
      priceListId: priceList.id,
      priceListYear: 1403,
      discipline: "ابنیه",
      contractAmount: 3309443989166,
      status: "ACTIVE",
      location: "پردیس- دانشگاه خاتم",
      description: "نمونه‌ی دمو (وارد شده از تکسا). قابل ویرایش/حذف مانند هر پروژه‌ی دیگر.",
      recordSource: "TEXSA",
      contractDate: new Date("2024-06-21"),
      startDate: new Date("2024-07-20"),
      durationDays: 530,
    },
  });

  const employerParty = await db.projectParty.create({ data: { projectId: project.id, organizationId: employerOrg.id, partyType: "EMPLOYER", displayTitle: "کارفرما — دانشگاه خاتم", isPrimary: true } });
  const consultantParty = await db.projectParty.create({ data: { projectId: project.id, organizationId: consultantOrg.id, partyType: "CONSULTANT", displayTitle: "مشاور — مهندسین مشاور شارستان", isPrimary: true } });
  const contractorParty = await db.projectParty.create({ data: { projectId: project.id, organizationId: contractorOrg.id, partyType: "CONTRACTOR", displayTitle: "پیمانکار — سیوان تدبیر تجارت", isPrimary: true } });

  async function mkMember(userId: string, partyId: string, role: string, canApprove = false, canSign = false) {
    return db.projectMember.create({ data: { projectId: project.id, userId, projectPartyId: partyId, role, canApprove, canSign, isActive: true } });
  }
  await mkMember(empPM.id, employerParty.id, "employer_project_manager");
  await mkMember(empFinance.id, employerParty.id, "employer_finance");
  await mkMember(empApprover.id, employerParty.id, "employer_final_approver", true, true);
  await mkMember(conResident.id, consultantParty.id, "resident_supervisor");
  await mkMember(conTech.id, consultantParty.id, "consultant_technical_office");
  await mkMember(conReviewer.id, consultantParty.id, "consultant_payment_reviewer");
  await mkMember(conApprover.id, consultantParty.id, "consultant_final_approver", true, true);
  await mkMember(conrPM.id, contractorParty.id, "contractor_project_manager");
  await mkMember(conrSite.id, contractorParty.id, "site_manager");
  await mkMember(conrSurveyor.id, contractorParty.id, "quantity_surveyor");
  await mkMember(conrPreparer.id, contractorParty.id, "payment_claim_preparer");
  await mkMember(conrSubmitter.id, contractorParty.id, "contractor_final_submitter", false, true);

  await db.chapter.create({ data: { projectId: project.id, chapterNo: 6, title: "بتن درجا", amount: 129528960, percent: 40 } });
  await db.financialSheetItem.createMany({
    data: [
      { projectId: project.id, code: "060102", description: "بتن‌ریزی پی و شالوده", unit: "مترمکعب", quantity: 112.95, unitPrice: 1120000, totalAmount: 126504000, chapterNo: 6, recordSource: "TEXSA" },
      { projectId: project.id, code: "060805", description: "آرماتوربندی", unit: "کیلوگرم", quantity: 10.96, unitPrice: 276000, totalAmount: 3024960, chapterNo: 6, recordSource: "TEXSA" },
    ],
  });

  const payStates: { period: number; status: string; amount: number }[] = [
    { period: 1, status: "PAYMENT_REGISTERED", amount: 94775623725 },
    { period: 2, status: "SUBMITTED_TO_EMPLOYER", amount: 60822769244 },
    { period: 3, status: "RETURNED_BY_CONSULTANT", amount: 41200000000 },
    { period: 4, status: "UNDER_CONSULTANT_REVIEW", amount: 38500000000 },
    { period: 5, status: "DRAFT", amount: 22000000000 },
  ];
  const payments: { id: string }[] = [];
  for (const p of payStates) {
    const guarantee = p.amount * 0.05;
    const insurance = p.amount * 0.02;
    const tax = p.amount * 0.05;
    const pay = await db.payment.create({
      data: {
        projectId: project.id, periodNo: p.period, status: p.status,
        executedAmount: p.amount, guarantee, insurance, tax,
        netPayable: p.amount - guarantee - insurance - tax, recordSource: "TEXSA",
        rejectReason: p.status === "RETURNED_BY_CONSULTANT" ? "اختلاف در احجام فصل ۶ — ردیف بتن‌ریزی نیازمند صورت‌جلسه است." : null,
        submittedBy: p.period <= 4 ? conrPreparer.name : null,
        submittedAt: p.period <= 4 ? new Date("2024-09-01") : null,
      },
    });
    payments.push(pay);
    await db.paymentItem.createMany({
      data: [
        { paymentId: pay.id, code: "060102", description: "بتن‌ریزی پی و شالوده", unit: "مترمکعب", totalQuantity: 112.95, executedQuantity: 112.95 * (p.period / 5), unitPrice: 1120000, executedAmount: p.amount * 0.8 },
        { paymentId: pay.id, code: "060805", description: "آرماتوربندی", unit: "کیلوگرم", totalQuantity: 10.96, executedQuantity: 10.96 * (p.period / 5), unitPrice: 276000, executedAmount: p.amount * 0.2 },
      ],
    });
  }

  await db.adjustmentReportRow.create({
    data: {
      tenantId: tenant.id, projectId: project.id, paymentId: payments[1].id, periodLabel: "سه‌ماهه دوم ۱۴۰۳",
      chapterNo: 6, workPeriodAmount: 60822769244, baseIndex: 6970.7, currentIndex: 8120.4,
      adjustmentFactor: 1.165, adjustmentAmount: 60822769244 * 0.165, adjustmentType: "TEMPORARY",
      recordSource: "TEXSA", notes: "تعدیل بر اساس شاخص ابنیه سه‌ماهه دوم ۱۴۰۳.",
    },
  });

  const defaultChannels: { title: string; type: string; visibility: string }[] = [
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
  let generalChannelId = "";
  for (const c of defaultChannels) {
    const ch = await db.projectChannel.create({ data: { projectId: project.id, ...c } });
    if (c.type === "GENERAL" && c.visibility === "ALL_PARTIES") generalChannelId = ch.id;
  }
  if (generalChannelId) {
    await db.message.create({ data: { channelId: generalChannelId, senderId: conrPM.id, senderName: conrPM.name, body: "سلام، گزارش پیشرفت هفته جاری بارگذاری شد." } });
    await db.message.create({ data: { channelId: generalChannelId, senderId: conResident.id, senderName: conResident.name, body: "بازدید ناظر مقیم فردا ساعت ۱۰ انجام می‌شود." } });
  }
  for (const p of payStates) {
    const ch = await db.projectChannel.create({ data: { projectId: project.id, title: `صورت‌وضعیت شماره ${p.period}`, type: "PAYMENT", visibility: "ALL_PARTIES", entityType: "PAYMENT", entityId: payments[p.period - 1].id } });
    await db.message.create({ data: { channelId: ch.id, senderId: "system", senderName: "سامانه", systemType: "SUBMIT", entityType: "PAYMENT", entityId: payments[p.period - 1].id, body: `کانال صورت‌وضعیت شماره ${p.period} ایجاد شد. وضعیت فعلی: ${p.status}` } });
  }

  const letter = await db.letter.create({
    data: { projectId: project.id, fromPartyId: consultantParty.id, toPartyId: contractorParty.id, subject: "درخواست اصلاح صورت‌وضعیت شماره ۳", body: "با سلام، احجام فصل ۶ صورت‌وضعیت شماره ۳ نیازمند صورت‌جلسه‌ی تأییدشده است.", letterNo: "SH-1403-118", letterDate: new Date("2024-09-10"), status: "SENT" },
  });
  await db.correspondenceRecipient.create({ data: { letterId: letter.id, partyId: contractorParty.id, kind: "TO" } });
  await db.correspondenceRecipient.create({ data: { letterId: letter.id, partyId: employerParty.id, kind: "CC" } });

  const doc = await db.document.create({ data: { projectId: project.id, title: "صورت‌جلسه احجام فصل ۶", type: "MINUTES", entityType: "PAYMENT", entityId: payments[2].id } });
  const ver = await db.documentVersion.create({ data: { documentId: doc.id, versionNo: 1, fileUrl: "/uploads/demo/minutes-ch6-v1.pdf", fileName: "minutes-ch6-v1.pdf", fileSizeBytes: 102400, uploadedById: conResident.id, uploadedByName: conResident.name } });
  await db.document.update({ where: { id: doc.id }, data: { currentVersionId: ver.id } });

  await db.alert.create({ data: { tenantId: tenant.id, projectId: project.id, type: "WORKFLOW", severity: "WARNING", title: "صورت‌وضعیت برگشتی", message: "صورت‌وضعیت شماره ۳ توسط مشاور برگشت داده شده است.", relatedType: "PAYMENT", relatedId: payments[2].id } });

  // یک صورتحساب SaaS نمونه برای tenant دمو
  await db.invoice.create({
    data: { tenantId: tenant.id, number: "INV-1403-0001", amount: 9_000_000, status: "PAID", issuedAt: now, dueAt: new Date(now.getTime() + 7 * 86400000), paidAt: now, note: "اشتراک ماهانه پلن حرفه‌ای" },
  });

  console.log("✅ seed کامل شد.");
  console.log("🔑 ورود مدیر سامانه: owner@civilic.ir | کاربر دمو: preparer@sivantadbir.ir — رمز همه: civilic");
}

main()
  .catch((e) => {
    console.error("❌ خطا در seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
