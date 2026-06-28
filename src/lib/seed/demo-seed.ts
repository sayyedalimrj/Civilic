/**
 * demo-seed.ts — منطق seed دموی Civilic، قابل استفاده‌ی مجدد و idempotent.
 *
 * استفاده:
 *  - prisma/seed.ts (CLI محلی) با { reset: true } → پاکسازی و ساخت کامل.
 *  - /api/bootstrap/demo-seed (preview/دمو) با { reset: false } → idempotent، بدون حذف داده.
 *
 * مهم: «خاتم» فقط داده‌ی دمو است. این تابع چیزی را به‌جز در حالت reset حذف نمی‌کند.
 */
import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../auth/password";
import {
  ROLE_PERMISSIONS,
  ROLE_LABELS_FA,
  PLATFORM_ROLE_PERMISSIONS,
  PLATFORM_ROLE_LABELS_FA,
  partyTypeOfRole,
} from "../auth/permissions";

export interface SeedSummary {
  reset: boolean;
  tenants: number;
  organizations: number;
  plans: number;
  users: { email: string; name: string; platformRole: string | null }[];
  project: { id: string; name: string; code: string } | null;
  payments: number;
}

export async function runDemoSeed(db: PrismaClient, opts: { reset?: boolean } = {}): Promise<SeedSummary> {
  const reset = opts.reset ?? false;
  const PWD = hashPassword("civilic");

  if (reset) {
    // فقط در حالت reset (CLI محلی) داده پاک می‌شود — هرگز در bootstrap پیش‌فرض.
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
  }

  // ── RoleTemplateها (idempotent) ──
  let sort = 0;
  for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const pt = partyTypeOfRole(key as never);
    if (pt === "SYSTEM") continue;
    await db.roleTemplate.upsert({
      where: { key },
      create: { key, scope: "PROJECT", partyType: pt, labelFa: ROLE_LABELS_FA[key as never] ?? key, permissionsJson: JSON.stringify(perms), isSystem: true, sortOrder: sort++ },
      update: { permissionsJson: JSON.stringify(perms), labelFa: ROLE_LABELS_FA[key as never] ?? key },
    });
  }
  for (const [key, perms] of Object.entries(PLATFORM_ROLE_PERMISSIONS)) {
    await db.roleTemplate.upsert({
      where: { key },
      create: { key, scope: "PLATFORM", labelFa: PLATFORM_ROLE_LABELS_FA[key as never] ?? key, permissionsJson: JSON.stringify(perms), isSystem: true, sortOrder: sort++ },
      update: { permissionsJson: JSON.stringify(perms) },
    });
  }

  // ── پلن‌ها (idempotent بر key) ──
  const planDefs = [
    { key: "trial", name: "آزمایشی", monthlyPrice: 0, yearlyPrice: 0, maxProjects: 1, maxUsers: 5, maxStorageMb: 512, maxTexsaImportsPerMonth: 1, maxExportsPerMonth: 5, sortOrder: 0, enabledFeaturesJson: JSON.stringify(["payment", "chat"]) },
    { key: "basic", name: "پایه", monthlyPrice: 3_000_000, yearlyPrice: 30_000_000, maxProjects: 5, maxUsers: 25, maxStorageMb: 5120, maxTexsaImportsPerMonth: 10, maxExportsPerMonth: 50, sortOrder: 1, enabledFeaturesJson: JSON.stringify(["payment", "chat", "adjustment", "correspondence"]) },
    { key: "pro", name: "حرفه‌ای", monthlyPrice: 9_000_000, yearlyPrice: 90_000_000, maxProjects: 25, maxUsers: 150, maxStorageMb: 51200, maxTexsaImportsPerMonth: 100, maxExportsPerMonth: 500, sortOrder: 2, enabledFeaturesJson: JSON.stringify(["payment", "chat", "adjustment", "correspondence", "texsa", "documents"]) },
    { key: "enterprise", name: "سازمانی", monthlyPrice: 30_000_000, yearlyPrice: 300_000_000, maxProjects: 1000, maxUsers: 2000, maxStorageMb: 512000, maxTexsaImportsPerMonth: 1000, maxExportsPerMonth: 5000, sortOrder: 3, enabledFeaturesJson: JSON.stringify(["payment", "chat", "adjustment", "correspondence", "texsa", "documents", "sso", "api"]) },
  ];
  for (const p of planDefs) {
    await db.plan.upsert({ where: { key: p.key }, create: p, update: p });
  }
  const proPlan = await db.plan.findUnique({ where: { key: "pro" } });

  // ── tenant پلتفرم + کاربران پلتفرم (idempotent بر slug/email) ──
  const platformTenant = await db.tenant.upsert({
    where: { slug: "platform" },
    create: { name: "Civilic Platform", slug: "platform", isActive: true },
    update: {},
  });
  const owner = await ensurePlatformUser(db, "owner@civilic.ir", "مالک سامانه", platformTenant.id, "platform_owner", PWD);
  const admin = await ensurePlatformUser(db, "admin@civilic.ir", "مدیر سامانه", platformTenant.id, "platform_admin", PWD);

  // ── tenant دمو + اشتراک ──
  const tenant = await db.tenant.upsert({
    where: { slug: "demo" },
    create: { name: "دموی Civilic", slug: "demo", isActive: true },
    update: {},
  });
  if (proPlan) {
    const sub = await db.subscription.findFirst({ where: { tenantId: tenant.id } });
    if (!sub) {
      const now = new Date();
      await db.subscription.create({
        data: { tenantId: tenant.id, planId: proPlan.id, status: "ACTIVE", billingCycle: "MONTHLY", startedAt: now, currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 30 * 86400000) },
      });
    }
  }

  // ── سازمان‌ها ──
  const employerOrg = await ensureOrg(db, tenant.id, "دانشگاه خاتم", "EMPLOYER");
  const consultantOrg = await ensureOrg(db, tenant.id, "مهندسین مشاور شارستان", "CONSULTANT");
  const contractorOrg = await ensureOrg(db, tenant.id, "شرکت سیوان تدبیر تجارت", "CONTRACTOR");

  // ── کاربران سازمان‌ها ──
  const mk = (name: string, email: string, orgId: string) => ensureOrgUser(db, email, name, tenant.id, orgId, PWD);
  const empPM = await mk("مدیر پروژه کارفرما", "pm@khatam.ac.ir", employerOrg.id);
  const empFinance = await mk("کارشناس مالی کارفرما", "finance@khatam.ac.ir", employerOrg.id);
  const empApprover = await mk("مقام تأیید کارفرما", "approver@khatam.ac.ir", employerOrg.id);
  const conResident = await mk("ناظر مقیم", "resident@sharestan.ir", consultantOrg.id);
  const conTech = await mk("کارشناس دفتر فنی مشاور", "techoffice@sharestan.ir", consultantOrg.id);
  const conReviewer = await mk("رسیدگی صورت‌وضعیت مشاور", "review@sharestan.ir", consultantOrg.id);
  const conApprover = await mk("تأییدکننده مشاور", "approver@sharestan.ir", consultantOrg.id);
  const conrPM = await mk("مدیر پروژه پیمانکار", "pm@sivantadbir.ir", contractorOrg.id);
  const conrSite = await mk("رئیس کارگاه", "site@sivantadbir.ir", contractorOrg.id);
  const conrSurveyor = await mk("مترور", "surveyor@sivantadbir.ir", contractorOrg.id);
  const conrPreparer = await mk("کارشناس صورت‌وضعیت", "preparer@sivantadbir.ir", contractorOrg.id);
  const conrSubmitter = await mk("تأییدکننده پیمانکار", "submitter@sivantadbir.ir", contractorOrg.id);

  // ── فهرست‌بها ──
  const priceList = await db.priceList.upsert({
    where: { year_discipline: { year: 1403, discipline: "ابنیه" } },
    create: { year: 1403, discipline: "ابنیه", title: "فهرست‌بهای ابنیه ۱۴۰۳" },
    update: {},
  });

  // ── پروژه (idempotent بر tenant+code) ──
  let project = await db.project.findFirst({ where: { tenantId: tenant.id, code: "C-KH-03-052" } });
  const projectCreated = !project;
  if (!project) {
    project = await db.project.create({
      data: {
        tenantId: tenant.id,
        name: "اجرای سازه ساختمان پارکینگ شرقی پروژه مجموعه آموزشی و فناوری خاتم",
        code: "C-KH-03-052", contractNo: "C-KH-03-052", year: 1403,
        priceListId: priceList.id, priceListYear: 1403, discipline: "ابنیه",
        contractAmount: 3309443989166, status: "ACTIVE", location: "پردیس- دانشگاه خاتم",
        description: "نمونه‌ی دمو (وارد شده از تکسا). قابل ویرایش/حذف مانند هر پروژه‌ی دیگر.",
        recordSource: "TEXSA", contractDate: new Date("2024-06-21"), startDate: new Date("2024-07-20"), durationDays: 530,
      },
    });
  }

  // ── طرفین ──
  const employerParty = await ensureParty(db, project.id, "EMPLOYER", employerOrg.id, "کارفرما — دانشگاه خاتم");
  const consultantParty = await ensureParty(db, project.id, "CONSULTANT", consultantOrg.id, "مشاور — مهندسین مشاور شارستان");
  const contractorParty = await ensureParty(db, project.id, "CONTRACTOR", contractorOrg.id, "پیمانکار — سیوان تدبیر تجارت");

  // ── اعضای پروژه ──
  const member = (userId: string, partyId: string, role: string, canApprove = false, canSign = false) =>
    db.projectMember.upsert({
      where: { projectId_userId: { projectId: project!.id, userId } },
      create: { projectId: project!.id, userId, projectPartyId: partyId, role, canApprove, canSign, isActive: true },
      update: { role, projectPartyId: partyId, canApprove, canSign, isActive: true },
    });
  await member(empPM.id, employerParty.id, "employer_project_manager");
  await member(empFinance.id, employerParty.id, "employer_finance");
  await member(empApprover.id, employerParty.id, "employer_final_approver", true, true);
  await member(conResident.id, consultantParty.id, "resident_supervisor");
  await member(conTech.id, consultantParty.id, "consultant_technical_office");
  await member(conReviewer.id, consultantParty.id, "consultant_payment_reviewer");
  await member(conApprover.id, consultantParty.id, "consultant_final_approver", true, true);
  await member(conrPM.id, contractorParty.id, "contractor_project_manager");
  await member(conrSite.id, contractorParty.id, "site_manager");
  await member(conrSurveyor.id, contractorParty.id, "quantity_surveyor");
  await member(conrPreparer.id, contractorParty.id, "payment_claim_preparer");
  await member(conrSubmitter.id, contractorParty.id, "contractor_final_submitter", false, true);

  // ── صورت‌وضعیت‌ها (idempotent بر projectId+periodNo) ──
  const payStates: { period: number; status: string; amount: number }[] = [
    { period: 1, status: "PAYMENT_REGISTERED", amount: 94775623725 },
    { period: 2, status: "SUBMITTED_TO_EMPLOYER", amount: 60822769244 },
    { period: 3, status: "RETURNED_BY_CONSULTANT", amount: 41200000000 },
    { period: 4, status: "UNDER_CONSULTANT_REVIEW", amount: 38500000000 },
    { period: 5, status: "DRAFT", amount: 22000000000 },
  ];
  const payments: { id: string }[] = [];
  for (const p of payStates) {
    const guarantee = p.amount * 0.05, insurance = p.amount * 0.02, tax = p.amount * 0.05;
    const pay = await db.payment.upsert({
      where: { projectId_periodNo: { projectId: project.id, periodNo: p.period } },
      create: {
        projectId: project.id, periodNo: p.period, status: p.status, executedAmount: p.amount,
        guarantee, insurance, tax, netPayable: p.amount - guarantee - insurance - tax, recordSource: "TEXSA",
        rejectReason: p.status === "RETURNED_BY_CONSULTANT" ? "اختلاف در احجام فصل ۶." : null,
        submittedBy: p.period <= 4 ? conrPreparer.name : null, submittedAt: p.period <= 4 ? new Date("2024-09-01") : null,
      },
      update: {},
    });
    payments.push(pay);
  }

  // ── محتوای غنی دمو: فقط وقتی پروژه تازه ساخته شده یا کانالی ندارد ──
  const channelCount = await db.projectChannel.count({ where: { projectId: project.id } });
  if (projectCreated || channelCount === 0) {
    await db.chapter.create({ data: { projectId: project.id, chapterNo: 6, title: "بتن درجا", amount: 129528960, percent: 40 } }).catch(() => {});
    // اقلام صورت‌وضعیت (برای نمونه‌های رسیدگی) + ردیف‌های ریزمتره
    const payItems: Record<number, { id: string }[]> = {};
    for (const p of payStates) {
      const pay = payments[p.period - 1];
      const a = await db.paymentItem.create({ data: { paymentId: pay.id, code: "060102", description: "بتن‌ریزی پی و شالوده", unit: "مترمکعب", totalQuantity: 112.95, executedQuantity: 112.95 * (p.period / 5), unitPrice: 1120000, executedAmount: p.amount * 0.8 } });
      const b = await db.paymentItem.create({ data: { paymentId: pay.id, code: "060805", description: "آرماتوربندی میلگرد", unit: "کیلوگرم", totalQuantity: 10.96, executedQuantity: 10.96 * (p.period / 5), unitPrice: 276000, executedAmount: p.amount * 0.2 } });
      payItems[p.period] = [a, b];
    }
    const detailRows = await Promise.all([
      db.detailBoq.create({ data: { projectId: project.id, code: "060102", description: "بتن‌ریزی پی و شالوده", unit: "مترمکعب", quantity: 112.95, recordSource: "TEXSA" } }),
      db.detailBoq.create({ data: { projectId: project.id, code: "060805", description: "آرماتوربندی میلگرد", unit: "کیلوگرم", quantity: 10.96, recordSource: "TEXSA" } }),
    ]);
    // نمونه‌های لایه‌ی رسیدگی (redline)
    const C = conReviewer.name, E = empApprover.name;
    // دوره ۴: مشاور ردیف اول را بدون تغییر تایید، ردیف دوم را اصلاح کرد
    await db.paymentCertificateItemReview.create({ data: { paymentCertificateItemId: payItems[4][0].id, partyType: "CONSULTANT", reviewStage: "CONSULTANT_REVIEW", decision: "APPROVED_AS_IS", colorKey: "consultant", source: "REVIEW", reviewerName: C } });
    await db.paymentCertificateItemReview.create({ data: { paymentCertificateItemId: payItems[4][1].id, partyType: "CONSULTANT", reviewStage: "CONSULTANT_REVIEW", decision: "REVISED", amount: payStates[3].amount * 0.18, comment: "اصلاح وزن آرماتور مطابق صورت‌جلسه", colorKey: "consultant", source: "REVIEW", reviewerName: C } });
    // دوره ۲: مشاور تایید، کارفرما ردیف اول را اصلاح نهایی کرد
    await db.paymentCertificateItemReview.create({ data: { paymentCertificateItemId: payItems[2][0].id, partyType: "CONSULTANT", reviewStage: "CONSULTANT_REVIEW", decision: "APPROVED_AS_IS", colorKey: "consultant", source: "REVIEW", reviewerName: C } });
    await db.paymentCertificateItemReview.create({ data: { paymentCertificateItemId: payItems[2][0].id, partyType: "EMPLOYER", reviewStage: "EMPLOYER_REVIEW", decision: "REVISED", amount: payStates[1].amount * 0.72, comment: "کاهش جزئی مطابق رسیدگی کارفرما", colorKey: "employer", source: "REVIEW", reviewerName: E } });
    // دوره ۳ (برگشتی): مشاور احجام تاییدنشده را کسر کرد
    await db.paymentCertificateItemReview.create({ data: { paymentCertificateItemId: payItems[3][0].id, partyType: "CONSULTANT", reviewStage: "CONSULTANT_REVIEW", decision: "REVISED", amount: payStates[2].amount * 0.6, comment: "کسر احجام تاییدنشده فصل ۶", colorKey: "consultant", source: "REVIEW", reviewerName: C } });
    // متره: مشاور حجم ردیف اول را اصلاح کرد
    await db.measurementItemReview.create({ data: { measurementItemId: detailRows[0].id, partyType: "CONSULTANT", decision: "REVISED", quantity: 108.5, comment: "اصلاح حجم بتن مطابق برداشت", colorKey: "consultant", source: "REVIEW", reviewerName: C } });
    const defaultChannels = [
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
      await db.message.create({ data: { channelId: ch.id, senderId: "system", senderName: "سامانه", systemType: "SUBMIT", entityType: "PAYMENT", entityId: payments[p.period - 1].id, body: `کانال صورت‌وضعیت شماره ${p.period} ایجاد شد.` } });
    }
    const letter = await db.letter.create({ data: { projectId: project.id, fromPartyId: consultantParty.id, toPartyId: contractorParty.id, subject: "درخواست اصلاح صورت‌وضعیت شماره ۳", body: "احجام فصل ۶ نیازمند صورت‌جلسه‌ی تأییدشده است.", letterNo: "SH-1403-118", letterDate: new Date("2024-09-10"), status: "SENT" } });
    await db.correspondenceRecipient.create({ data: { letterId: letter.id, partyId: contractorParty.id, kind: "TO" } });
    await db.correspondenceRecipient.create({ data: { letterId: letter.id, partyId: employerParty.id, kind: "CC" } });
    const doc = await db.document.create({ data: { projectId: project.id, title: "صورت‌جلسه احجام فصل ۶", type: "MINUTES", entityType: "PAYMENT", entityId: payments[2].id } });
    const ver = await db.documentVersion.create({ data: { documentId: doc.id, versionNo: 1, fileUrl: "/uploads/demo/minutes.pdf", fileName: "minutes.pdf", fileSizeBytes: 102400, uploadedById: conResident.id, uploadedByName: conResident.name } });
    await db.document.update({ where: { id: doc.id }, data: { currentVersionId: ver.id } });
    const adjRow = await db.adjustmentReportRow.create({ data: { tenantId: tenant.id, projectId: project.id, paymentId: payments[1].id, periodLabel: "سه‌ماهه دوم ۱۴۰۳", chapterNo: 6, workPeriodAmount: 60822769244, baseIndex: 6970.7, currentIndex: 8120.4, adjustmentFactor: 1.165, adjustmentAmount: 60822769244 * 0.165, adjustmentType: "TEMPORARY", recordSource: "TEXSA" } });
    // تعدیل: مشاور اصلاح، کارفرما تایید نهایی
    await db.adjustmentItemReview.create({ data: { adjustmentItemId: adjRow.id, partyType: "CONSULTANT", reviewStage: "CONSULTANT_REVIEW", decision: "REVISED", adjustmentAmount: 60822769244 * 0.15, comment: "اصلاح شاخص دوره", colorKey: "consultant", source: "REVIEW", reviewerName: C } });
    await db.adjustmentItemReview.create({ data: { adjustmentItemId: adjRow.id, partyType: "EMPLOYER", reviewStage: "EMPLOYER_REVIEW", decision: "APPROVED_AS_IS", adjustmentAmount: 60822769244 * 0.15, colorKey: "employer", source: "REVIEW", reviewerName: E } });
    // نمونه‌ی وضعیت محاسبه‌ی stale (تعدیل پس از تغییر صورت‌وضعیت نیازمند بروزرسانی)
    await db.calculationNode.upsert({ where: { projectId_stage: { projectId: project.id, stage: "ADJUSTMENT" } }, create: { projectId: project.id, entityType: "ADJUSTMENT", entityId: `${project.id}:ADJUSTMENT`, stage: "ADJUSTMENT", status: "STALE", parity: "NEEDS_TEXSA_PARITY_REVIEW", dependsOnJson: JSON.stringify(["PAYMENT_CERTIFICATE"]), staleReason: "مبلغ صورت‌وضعیت پس از رسیدگی تغییر کرد" }, update: {} });
    await db.calculationNode.upsert({ where: { projectId_stage: { projectId: project.id, stage: "MEASUREMENT_SUMMARY" } }, create: { projectId: project.id, entityType: "MEASUREMENT_SUMMARY", entityId: `${project.id}:MEASUREMENT_SUMMARY`, stage: "MEASUREMENT_SUMMARY", status: "STALE", parity: "NEEDS_TEXSA_PARITY_REVIEW", dependsOnJson: JSON.stringify(["MEASUREMENT_DETAIL"]), staleReason: "اصلاح ریزمتره توسط مشاور" }, update: {} });
    await db.alert.create({ data: { tenantId: tenant.id, projectId: project.id, type: "WORKFLOW", severity: "WARNING", title: "صورت‌وضعیت برگشتی", message: "صورت‌وضعیت شماره ۳ توسط مشاور برگشت داده شده است.", relatedType: "PAYMENT", relatedId: payments[2].id } });
  }

  // ── صورتحساب SaaS نمونه ──
  const invCount = await db.invoice.count({ where: { tenantId: tenant.id } });
  if (invCount === 0) {
    const now = new Date();
    await db.invoice.create({ data: { tenantId: tenant.id, number: `INV-1403-0001`, amount: 9_000_000, status: "PAID", issuedAt: now, dueAt: new Date(now.getTime() + 7 * 86400000), paidAt: now, note: "اشتراک ماهانه پلن حرفه‌ای" } });
  }

  const [tenants, organizations, plans] = await Promise.all([db.tenant.count(), db.organization.count(), db.plan.count()]);

  return {
    reset,
    tenants,
    organizations,
    plans,
    users: [
      { email: owner.email, name: owner.name, platformRole: owner.platformRole },
      { email: admin.email, name: admin.name, platformRole: admin.platformRole },
      { email: conrPreparer.email, name: conrPreparer.name, platformRole: null },
      { email: conReviewer.email, name: conReviewer.name, platformRole: null },
      { email: empApprover.email, name: empApprover.name, platformRole: null },
    ],
    project: { id: project.id, name: project.name, code: project.code },
    payments: payments.length,
  };
}

// ── helperها ──
async function ensurePlatformUser(db: PrismaClient, email: string, name: string, tenantId: string, platformRole: string, pwd: string) {
  return db.user.upsert({
    where: { email: email.toLowerCase() },
    create: { tenantId, email: email.toLowerCase(), name, passwordHash: pwd, isPlatformAdmin: true, platformRole, role: platformRole, isActive: true },
    update: { passwordHash: pwd, isPlatformAdmin: true, platformRole, role: platformRole, isActive: true, name },
  });
}

async function ensureOrgUser(db: PrismaClient, email: string, name: string, tenantId: string, orgId: string, pwd: string) {
  const user = await db.user.upsert({
    where: { email: email.toLowerCase() },
    create: { tenantId, organizationId: orgId, email: email.toLowerCase(), name, passwordHash: pwd, isActive: true, role: "member" },
    update: { passwordHash: pwd, isActive: true, name, organizationId: orgId, tenantId },
  });
  await db.tenantMember.upsert({ where: { tenantId_userId: { tenantId, userId: user.id } }, create: { tenantId, userId: user.id, role: "tenant_member" }, update: {} });
  await db.organizationMember.upsert({ where: { organizationId_userId: { organizationId: orgId, userId: user.id } }, create: { organizationId: orgId, userId: user.id, role: "org_member" }, update: {} });
  return user;
}

async function ensureOrg(db: PrismaClient, tenantId: string, name: string, type: string) {
  const found = await db.organization.findFirst({ where: { tenantId, name } });
  if (found) return found;
  return db.organization.create({ data: { tenantId, name, type } });
}

async function ensureParty(db: PrismaClient, projectId: string, partyType: string, organizationId: string, displayTitle: string) {
  const found = await db.projectParty.findFirst({ where: { projectId, partyType } });
  if (found) return found;
  return db.projectParty.create({ data: { projectId, organizationId, partyType, displayTitle, isPrimary: true } });
}
