// اسکریپت seed برای پلتفرم متره و برآورد
// شامل: tenant نمونه، کاربران، داده‌های پایه مرجع، پروژه نمونه
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🚀 شروع seed...");

  // ── پاکسازی ──
  await db.auditLog.deleteMany();
  await db.bidRange.deleteMany();
  await db.materialAtSite.deleteMany();
  await db.comment.deleteMany();
  await db.chatMessage.deleteMany();
  await db.risk.deleteMany();
  await db.supplierOrder.deleteMany();
  await db.supplier.deleteMany();
  await db.changeOrder.deleteMany();
  await db.calendarEvent.deleteMany();
  await db.contractMilestone.deleteMany();
  await db.contract.deleteMany();
  await db.chatThread.deleteMany();
  await db.alert.deleteMany();
  await db.projectModule.deleteMany();
  await db.paymentItem.deleteMany();
  await db.payment.deleteMany();
  await db.financialSheetItem.deleteMany();
  await db.chapter.deleteMany();
  await db.summaryBoq.deleteMany();
  await db.detailBoq.deleteMany();
  await db.project.deleteMany();
  await db.priceListItem.deleteMany();
  await db.priceList.deleteMany();
  await db.indexRecord.deleteMany();
  await db.coefficient.deleteMany();
  await db.cityDistance.deleteMany();
  await db.materialRate.deleteMany();
  await db.user.deleteMany();
  await db.tenant.deleteMany();

  // ── ۱. Tenant ──
  const tenant = await db.tenant.create({
    data: {
      id: "tenant-demo",
      name: "سیوان تدبیر تجارت",
      logoUrl: "/logo.svg",
      signatures: JSON.stringify([
        { role: "ناظر", name: "مهندس رضایی", signUrl: "" },
        { role: "مدیر", name: "سید علی میرجعفری", signUrl: "" },
        { role: "پیمانکار", name: "احمد میرزایی", signUrl: "" },
      ]),
    },
  });

  // ── ۲. کاربران ──
  await db.user.create({
    data: {
      id: "user-admin",
      tenantId: tenant.id,
      email: "mirjafari@seivantadbir.ir",
      name: "سید علی میرجعفری",
      role: "ADMIN",
    },
  });
  await db.user.create({
    data: {
      id: "user-estimator",
      tenantId: tenant.id,
      email: "mirzaei@seivantadbir.ir",
      name: "احمد میرزایی",
      role: "ESTIMATOR",
    },
  });
  await db.user.create({
    data: {
      id: "user-biller",
      tenantId: tenant.id,
      email: "rezai@seivantadbir.ir",
      name: "مهندس رضایی",
      role: "BILLER",
    },
  });

  // ── ۳. فهرست‌های بها ──
  const priceListAbnieh = await db.priceList.create({
    data: {
      id: "pl-abnieh-1403",
      year: 1403,
      discipline: "ابنیه",
      title: "فهرست بهای ابنیه - سال ۱۴۰۳",
    },
  });
  const priceListAbnieh1404 = await db.priceList.create({
    data: {
      id: "pl-abnieh-1404",
      year: 1404,
      discipline: "ابنیه",
      title: "فهرست بهای ابنیه - سال ۱۴۰۴",
    },
  });
  await db.priceList.create({
    data: {
      id: "pl-rah-1403",
      year: 1403,
      discipline: "راه و باند",
      title: "فهرست بهی راه و باند - سال ۱۴۰۳",
    },
  });
  await db.priceList.create({
    data: {
      id: "pl-naft-1403",
      year: 1403,
      discipline: "نفت و گاز",
      title: "فهرست بهی نفت و گاز - سال ۱۴۰۳",
    },
  });

  // ── ۴. آیتم‌های فهرست بها (نمونه‌های واقعی) ──
  const priceItems = [
    { pl: priceListAbnieh1404.id, code: "010101", title: "خاکبرداری دستی در زمین معمولی تا عمق ۱.۵ متر", unit: "مترمکعب", price: 85000 },
    { pl: priceListAbnieh1404.id, code: "010102", title: "خاکبرداری با ماشین در زمین معمولی", unit: "مترمکعب", price: 65000 },
    { pl: priceListAbnieh1404.id, code: "010201", title: "خاکریزی و تراکم در لایه‌های ۳۰ سانتی", unit: "مترمکعب", price: 120000 },
    { pl: priceListAbnieh1404.id, code: "020101", title: "بتن‌ریزی M200 پی منفرد", unit: "مترمکعب", price: 2850000 },
    { pl: priceListAbnieh1404.id, code: "020102", title: "بتن‌ریزی M250 ستون", unit: "مترمکعب", price: 3200000 },
    { pl: priceListAbnieh1404.id, code: "020201", title: "آرماتوربندی میلگرد A3", unit: "کیلوگرم", price: 92000 },
    { pl: priceListAbnieh1404.id, code: "020301", title: "قالب‌بندی چوبی دیوار", unit: "مترمربع", price: 380000 },
    { pl: priceListAbnieh1404.id, code: "030101", title: "آجرچینی دیوار ۲۰ با ملات ماسه-سیمان", unit: "مترمربع", price: 920000 },
    { pl: priceListAbnieh1404.id, code: "030201", title: "دیوارچینی بلوک سیمانی ۱۵", unit: "مترمربع", price: 680000 },
    { pl: priceListAbnieh1404.id, code: "040101", title: "گچ‌کاری سفید دیوار", unit: "مترمربع", price: 185000 },
    { pl: priceListAbnieh1404.id, code: "050101", title: "عایق‌بندی قیرگونی پشت‌بام", unit: "مترمربع", price: 540000 },
    { pl: priceListAbnieh1404.id, code: "060101", title: "نصب درب فلزی ضدسرقت", unit: "عدد", price: 8500000 },
    { pl: priceListAbnieh1404.id, code: "060201", title: "نصب پنجره UPVC دوجداره", unit: "مترمربع", price: 4200000 },
    { pl: priceListAbnieh1404.id, code: "070101", title: "تأسیسات تأثيرگذار بر قیمت کلی", unit: "خواهش", price: 0 },
  ];
  for (const it of priceItems) {
    await db.priceListItem.create({
      data: {
        priceListId: it.pl,
        code: it.code,
        title: it.title,
        unit: it.unit,
        unitPrice: it.price,
      },
    });
  }

  // ── ۵. شاخص‌ها ──
  const indices = [
    { year: 1402, season: "بهار", discipline: "ابنیه", value: 1.0 },
    { year: 1402, season: "تابستان", discipline: "ابنیه", value: 1.08 },
    { year: 1402, season: "پاییز", discipline: "ابنیه", value: 1.15 },
    { year: 1402, season: "زمستان", discipline: "ابنیه", value: 1.22 },
    { year: 1403, season: "بهار", discipline: "ابنیه", value: 1.31 },
    { year: 1403, season: "تابستان", discipline: "ابنیه", value: 1.42 },
    { year: 1403, season: "پاییز", discipline: "ابنیه", value: 1.55 },
    { year: 1403, season: "زمستان", discipline: "ابنیه", value: 1.68 },
    { year: 1404, season: "بهار", discipline: "ابنیه", value: 1.78 },
    { year: 1404, season: "تابستان", discipline: "ابنیه", value: 1.89 },
    { year: 1402, season: "کلی", discipline: "کلی", value: 1.0 },
    { year: 1403, season: "کلی", discipline: "کلی", value: 1.45 },
    { year: 1404, season: "کلی", discipline: "کلی", value: 1.82 },
  ];
  for (const ix of indices) {
    await db.indexRecord.create({ data: ix });
  }

  // ── ۶. ضرایب منطقه‌ای و پایه ──
  const coefficients = [
    { year: 1404, discipline: "ابنیه", type: "REGIONAL", value: 1.12 },
    { year: 1404, discipline: "ابنیه", type: "BASE", value: 1.0 },
    { year: 1404, discipline: "ابنیه", type: "ALTITUDE", value: 1.05 },
    { year: 1404, discipline: "ابنیه", type: "FLOOR", value: 1.03 },
    { year: 1404, discipline: "راه و باند", type: "REGIONAL", value: 1.15 },
    { year: 1404, discipline: "راه و باند", type: "BASE", value: 1.0 },
  ];
  for (const c of coefficients) {
    await db.coefficient.create({ data: c });
  }

  // ── ۷. مسافت بین شهرها (نمونه) ──
  const cities = ["تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "اهواز", "کرج", "قم", "رشت", "کرمان"];
  const distances: [string, string, number][] = [
    ["تهران", "اصفهان", 450],
    ["تهران", "شیراز", 920],
    ["تهران", "مشهد", 900],
    ["تهران", "تبریز", 600],
    ["تهران", "اهواز", 770],
    ["تهران", "کرج", 35],
    ["تهران", "قم", 145],
    ["تهران", "رشت", 320],
    ["تهران", "کرمان", 980],
    ["اصفهان", "شیراز", 480],
    ["اصفهان", "اهواز", 540],
    ["مشهد", "کرمان", 1100],
    ["تبریز", "رشت", 380],
    ["اهواز", "شیراز", 420],
    ["کرج", "قم", 165],
  ];
  for (const [from, to, km] of distances) {
    await db.cityDistance.create({ data: { fromCity: from, toCity: to, km } });
    await db.cityDistance.create({ data: { fromCity: to, toCity: from, km } });
  }

  // ── ۸. نرخ مصالح ──
  const materials = [
    { material: "فولاد (میله آرماتور A3)", source: "NET", year: 1404, rate: 92000, wasteFactor: 1.03 },
    { material: "فولاد (میله آرماتور A3)", source: "STATS", year: 1404, rate: 88000, wasteFactor: 1.03 },
    { material: "فولاد (میله آرماتور A3)", source: "DAILY", year: 1404, rate: 95000, wasteFactor: 1.03 },
    { material: "سیمان (کیسه ۵۰ کیلو)", source: "NET", year: 1404, rate: 92000, wasteFactor: 1.06 },
    { material: "سیمان (کیسه ۵۰ کیلو)", source: "STATS", year: 1404, rate: 89000, wasteFactor: 1.06 },
    { material: "سیمان (کیسه ۵۰ کیلو)", source: "DAILY", year: 1404, rate: 96000, wasteFactor: 1.06 },
    { material: "آجر مقیاسی", source: "NET", year: 1404, rate: 4500, wasteFactor: 1.05 },
    { material: "ماسه", source: "NET", year: 1404, rate: 320000, wasteFactor: 1.08 },
    { material: "شن", source: "NET", year: 1404, rate: 380000, wasteFactor: 1.08 },
    { material: "گچ", source: "NET", year: 1404, rate: 180000, wasteFactor: 1.04 },
  ];
  for (const m of materials) {
    await db.materialRate.create({ data: m });
  }

  // ── ۹. پروژه‌های نمونه ──
  const project1 = await db.project.create({
    data: {
      id: "proj-metro7",
      tenantId: tenant.id,
      name: "متروی تهران خط ۷ - ایستگاه شهرک",
      code: "TM7-S25",
      documentCode: "DOC-1403-0451",
      year: 1404,
      priceListId: priceListAbnieh1404.id,
      contractAmount: 2500000000, // ۲.۵ میلیارد ریال → نمایش ۲۵۰ میلیارد
      contractDate: new Date("2024-03-21"),
      status: "ACTIVE",
      location: "تهران",
      latitude: 35.7155,
      longitude: 51.4022,
      description: "ساخت ایستگاه مترو خط ۷ در منطقه شهرک غرب",
      coefficients: JSON.stringify({
        general: 1.0,
        regional: 1.12,
        altitude: 1.05,
        floors: 1.03,
        tunnelHardship: 1.18,
      }),
      cachedTotal: 2680000000,
      cachedExecuted: 1125000000,
      assignedUserIds: JSON.stringify(["user-estimator", "user-biller"]),
    },
  });

  const project2 = await db.project.create({
    data: {
      id: "proj-bridge",
      tenantId: tenant.id,
      name: "پل روگذار امام رضا (ع)",
      code: "PL-IM-12",
      documentCode: "DOC-1403-0388",
      year: 1404,
      priceListId: priceListAbnieh1404.id,
      contractAmount: 1850000000,
      contractDate: new Date("2024-05-15"),
      status: "ACTIVE",
      location: "تهران",
      latitude: 35.6892,
      longitude: 51.3890,
      description: "ساخت پل روگذار ۴ خطه",
      coefficients: JSON.stringify({
        general: 1.0,
        regional: 1.12,
        altitude: 1.0,
        floors: 1.0,
        tunnelHardship: 1.0,
      }),
      cachedTotal: 1920000000,
      cachedExecuted: 680000000,
      assignedUserIds: JSON.stringify(["user-estimator"]),
    },
  });

  const project3 = await db.project.create({
    data: {
      id: "proj-tunnel",
      tenantId: tenant.id,
      name: "تونل ۲ بزرگراه امام علی",
      code: "TN-IA-08",
      documentCode: "DOC-1403-0512",
      year: 1404,
      priceListId: priceListAbnieh1404.id,
      contractAmount: 4200000000,
      contractDate: new Date("2024-01-10"),
      status: "DRAFT",
      location: "تهران",
      latitude: 35.7742,
      longitude: 51.4683,
      description: "حفاری تونل دوم",
      coefficients: JSON.stringify({
        general: 1.0,
        regional: 1.12,
        altitude: 1.05,
        floors: 1.0,
        tunnelHardship: 1.25,
      }),
      cachedTotal: 0,
      cachedExecuted: 0,
      assignedUserIds: JSON.stringify(["user-estimator", "user-biller"]),
    },
  });

  // ── ۱۰. ریزمتره نمونه برای پروژه ۱ ──
  const detailBoqs = [
    { code: "010101", desc: "خاکبرداری دستی در زمین معمولی تا عمق ۱.۵ متر", unit: "مترمکعب", qty: 1250 },
    { code: "010102", desc: "خاکبرداری با ماشین در زمین معمولی", unit: "مترمکعب", qty: 3400 },
    { code: "010201", desc: "خاکریزی و تراکم", unit: "مترمکعب", qty: 850 },
    { code: "020101", desc: "بتن‌ریزی M200 پی منفرد", unit: "مترمکعب", qty: 420 },
    { code: "020102", desc: "بتن‌ریزی M250 ستون", unit: "مترمکعب", qty: 185 },
    { code: "020201", desc: "آرماتوربندی میلگرد A3", unit: "کیلوگرم", qty: 38500 },
    { code: "020301", desc: "قالب‌بندی چوبی دیوار", unit: "مترمربع", qty: 1200 },
    { code: "030101", desc: "آجرچینی دیوار ۲۰", unit: "مترمربع", qty: 950 },
    { code: "030201", desc: "دیوارچینی بلوک سیمانی ۱۵", unit: "مترمربع", qty: 1450 },
    { code: "040101", desc: "گچ‌کاری سفید دیوار", unit: "مترمربع", qty: 2100 },
    { code: "050101", desc: "عایق‌بندی قیرگونی پشت‌بام", unit: "مترمربع", qty: 480 },
    { code: "060101", desc: "نصب درب فلزی ضدسرقت", unit: "عدد", qty: 24 },
    { code: "060201", desc: "نصب پنجره UPVC دوجداره", unit: "مترمربع", qty: 320 },
  ];
  for (const d of detailBoqs) {
    const plItem = await db.priceListItem.findFirst({
      where: { priceListId: priceListAbnieh1404.id, code: d.code },
    });
    await db.detailBoq.create({
      data: {
        projectId: project1.id,
        priceListItemId: plItem?.id,
        code: d.code,
        description: d.desc,
        unit: d.unit,
        quantity: d.qty,
      },
    });
  }

  // ── ۱۱. خلاصه متره + برگه مالی (تجمیع) ──
  const summary = new Map<string, { code: string; desc: string; unit: string; total: number }>();
  for (const d of detailBoqs) {
    const key = d.code;
    if (summary.has(key)) {
      summary.get(key)!.total += d.qty;
    } else {
      summary.set(key, { code: d.code, desc: d.desc, unit: d.unit, total: d.qty });
    }
  }
  for (const [, s] of summary) {
    const plItem = await db.priceListItem.findFirst({
      where: { priceListId: priceListAbnieh1404.id, code: s.code },
    });
    const price = plItem?.unitPrice || 0;
    const total = s.total * price;
    const sb = await db.summaryBoq.create({
      data: {
        projectId: project1.id,
        priceListItemId: plItem?.id,
        code: s.code,
        description: s.desc,
        unit: s.unit,
        totalQuantity: s.total,
      },
    });
    await db.financialSheetItem.create({
      data: {
        projectId: project1.id,
        summaryBoqId: sb.id,
        code: s.code,
        description: s.desc,
        unit: s.unit,
        quantity: s.total,
        unitPrice: price,
        totalAmount: total,
        reference: "NET",
        chapterNo: parseInt(s.code.charAt(0)) || 1,
        isStarred: s.code === "070101",
        analysis: JSON.stringify({
          labor: total * 0.25,
          equipment: total * 0.15,
          material: total * 0.55,
          transport: total * 0.05,
        }),
      },
    });
  }

  // ── ۱۲. فصول ──
  const chapters = [
    { no: 1, title: "فصل اول — عملیات زمینی", amount: 412000000 },
    { no: 2, title: "فصل دوم — اسکلت و سازه", amount: 1280000000 },
    { no: 3, title: "فصل سوم — دیوارچینی و جداره", amount: 580000000 },
    { no: 4, title: "فصل چهارم — نازک‌کاری", amount: 388000000 },
    { no: 5, title: "فصل پنجم — تأسیسات", amount: 0, workshop: true, mode: "درصدی ۵٪" },
    { no: 6, title: "فصل ششم — در و پنجره", amount: 20000000 },
  ];
  for (const c of chapters) {
    await db.chapter.create({
      data: {
        projectId: project1.id,
        chapterNo: c.no,
        title: c.title,
        amount: c.amount,
        isWorkshopSetup: c.workshop || false,
        workshopMode: c.mode || null,
      },
    });
  }

  // ── helper‌های تاریخ (برای استفاده در صورت‌وضعیت‌ها و هشدارها) ──
  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  // ── ۱۳. صورت‌وضعیت دوره ۱ ──
  // گردش کار سخت‌گیرانه: DRAFT → SUBMITTED → CONSULTANT_APPROVED → FINALIZED
  const payment1 = await db.payment.create({
    data: {
      projectId: project1.id,
      periodNo: 1,
      status: "FINALIZED",
      executedAmount: 580000000,
      guarantee: 29000000,
      insurance: 11600000,
      tax: 29000000,
      netPayable: 510400000,
      submittedBy: "user-estimator",
      submittedAt: daysAgo(20),
      consultantApprovedBy: "user-admin",
      consultantApprovedAt: daysAgo(15),
      finalizedBy: "user-admin",
      finalizedAt: daysAgo(10),
      lockedBy: "user-admin",
      lockedAt: daysAgo(10),
      stateHistory: JSON.stringify([
        { from: "DRAFT", to: "SUBMITTED", action: "submit", userId: "user-estimator", userName: "احمد میرزایی", role: "CONTRACTOR", at: daysAgo(20).toISOString() },
        { from: "SUBMITTED", to: "CONSULTANT_APPROVED", action: "consultantApprove", userId: "user-admin", userName: "سید علی میرجعفری", role: "CONSULTANT", at: daysAgo(15).toISOString() },
        { from: "CONSULTANT_APPROVED", to: "FINALIZED", action: "finalize", userId: "user-admin", userName: "سید علی میرجعفری", role: "EMPLOYER", at: daysAgo(10).toISOString() },
      ]),
    },
  });
  const fsItems = await db.financialSheetItem.findMany({
    where: { projectId: project1.id },
    take: 8,
  });
  for (const fs of fsItems) {
    const execQty = fs.quantity * 0.45;
    const execAmt = execQty * fs.unitPrice;
    await db.paymentItem.create({
      data: {
        paymentId: payment1.id,
        financialSheetId: fs.id,
        code: fs.code,
        description: fs.description,
        unit: fs.unit,
        totalQuantity: fs.quantity,
        executedQuantity: execQty,
        executedPercent: 45,
        unitPrice: fs.unitPrice,
        executedAmount: execAmt,
        adjustedAmount: execAmt * 1.12,
        isAdjusted: true,
      },
    });
  }

  // صورت‌وضعیت دوره ۲ — در انتظار تأیید مشاور
  const payment2 = await db.payment.create({
    data: {
      projectId: project1.id,
      periodNo: 2,
      status: "SUBMITTED",
      executedAmount: 545000000,
      guarantee: 27250000,
      insurance: 10900000,
      tax: 27250000,
      netPayable: 479350000,
      submittedBy: "user-estimator",
      submittedAt: daysAgo(2),
      lockedBy: "user-estimator",
      lockedAt: daysAgo(2),
      dueDate: daysFromNow(5),
      stateHistory: JSON.stringify([
        { from: "DRAFT", to: "SUBMITTED", action: "submit", userId: "user-estimator", userName: "احمد میرزایی", role: "CONTRACTOR", at: daysAgo(2).toISOString() },
      ]),
    },
  });
  for (const fs of fsItems) {
    const execQty = fs.quantity * 0.85 - fs.quantity * 0.45;
    const execAmt = execQty * fs.unitPrice;
    await db.paymentItem.create({
      data: {
        paymentId: payment2.id,
        financialSheetId: fs.id,
        code: fs.code,
        description: fs.description,
        unit: fs.unit,
        totalQuantity: fs.quantity,
        executedQuantity: execQty,
        executedPercent: 85,
        unitPrice: fs.unitPrice,
        executedAmount: execAmt,
        adjustedAmount: execAmt * 1.18,
        isAdjusted: true,
      },
    });
  }

  // ریزمتره کوچک برای پروژه ۲
  for (const d of detailBoqs.slice(0, 6)) {
    const plItem = await db.priceListItem.findFirst({
      where: { priceListId: priceListAbnieh1404.id, code: d.code },
    });
    await db.detailBoq.create({
      data: {
        projectId: project2.id,
        priceListItemId: plItem?.id,
        code: d.code,
        description: d.desc,
        unit: d.unit,
        quantity: d.qty * 0.6,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  فاز ۲: ماژول‌های جدید — ماژول‌های پروژه، هشدارها، چت، کامنت
  // ═══════════════════════════════════════════════════════════

  // ── ماژول‌های پروژه ──
  const moduleDefaults = [
    { key: "DETAIL_BOQ", enabled: true },
    { key: "FINANCIAL_SHEET", enabled: true },
    { key: "CHAPTERS", enabled: true },
    { key: "PAYMENTS", enabled: true },
    { key: "ADJUSTMENT", enabled: true },
    { key: "REVERSE_ADJUSTMENT", enabled: false },
    { key: "MATERIAL_SITE", enabled: true },
    { key: "BID_PRICE", enabled: true },
    { key: "TRANSPORT_FORM", enabled: true },
    { key: "MATERIAL_FORM", enabled: true },
    { key: "REPORTS", enabled: true },
  ];
  for (const p of [project1, project2, project3]) {
    for (const m of moduleDefaults) {
      await db.projectModule.create({
        data: { projectId: p.id, moduleKey: m.key, isEnabled: m.enabled },
      });
    }
  }

  // ── هشدارهای هوشمند (Smart Alerts) ──
  const alerts = [
    {
      projectId: project1.id,
      type: "GUARANTEE",
      severity: "WARNING",
      title: "آزادسازی نصف تضمین حسن انجام کار",
      message:
        "پروژه متروی تهران خط ۷ تحویل موقت شده است. زمان آزادسازی ۵۰٪ تضمین حسن انجام کار فرا رسیده.",
      dueDate: daysFromNow(7),
      relatedType: "PROJECT",
      relatedId: project1.id,
    },
    {
      projectId: project2.id,
      type: "SCHEDULE",
      severity: "CRITICAL",
      title: "موعد ارسال صورت‌وضعیت دوره ۳",
      message:
        "صورت‌وضعیت مقطعی دوره ۳ پروژه پل روگذار امام رضا (ع) باید تا ۳ روز آینده ارسال شود.",
      dueDate: daysFromNow(3),
      relatedType: "PAYMENT",
      relatedId: null,
    },
    {
      projectId: project1.id,
      type: "DEDUCTION",
      severity: "INFO",
      title: "کسر کسورات قانونی در صورت‌وضعیت دوره ۲",
      message:
        "کسورات قانونی (بیمه ۲٪، مالیات ۵٪، تضمین ۵٪) در صورت‌وضعیت دوره ۲ اعمال شد.",
      dueDate: daysAgo(2),
      relatedType: "PAYMENT",
      relatedId: null,
    },
    {
      projectId: project3.id,
      type: "CALC",
      severity: "WARNING",
      title: "عدم تطابق جمع برگه مالی با مبالغ فصول",
      message:
        "جمع مبالغ فصول پروژه تونل ۲ با جمع کل برگه مالی ۱۲٬۴۵۰٬۰۰۰ ریال اختلاف دارد.",
      dueDate: daysFromNow(1),
      relatedType: "FINANCIAL_SHEET",
      relatedId: null,
    },
    {
      projectId: project2.id,
      type: "WORKFLOW",
      severity: "INFO",
      title: "صورت‌وضعیت در انتظار تأیید",
      message:
        "صورت‌وضعیت دوره ۲ پروژه پل روگذار توسط احمد میرزایی ارسال شد — در انتظار تأیید مشاور.",
      dueDate: daysAgo(1),
      relatedType: "PAYMENT",
      relatedId: null,
    },
    {
      projectId: project1.id,
      type: "GUARANTEE",
      severity: "INFO",
      title: "پایان دوره رفع نواقص",
      message:
        "پایان دوره رفـع نواقص پروژه مترو خط ۷ نزدیک است. مابقی تضمین حسن انجام کار قابل آزادسازی خواهد بود.",
      dueDate: daysFromNow(45),
      relatedType: "PROJECT",
      relatedId: project1.id,
    },
    {
      projectId: project3.id,
      type: "CALC",
      severity: "WARNING",
      title: "کدهای ستاره‌دار خالی",
      message: "۳ کد ستاره‌دار در برگه مالی پروژه تونل ۲ بدون قیمت واحد مانده‌اند.",
      dueDate: daysFromNow(5),
      relatedType: "FINANCIAL_SHEET",
      relatedId: null,
    },
  ];
  for (const a of alerts) {
    await db.alert.create({
      data: {
        tenantId: tenant.id,
        ...a,
        isRead: false,
        isResolved: false,
      } as any,
    });
  }

  // ── مکالمه چت بین میرجعفری و میرزایی ──
  const chatThread = await db.chatThread.create({
    data: {
      tenantId: tenant.id,
      participants: JSON.stringify(["user-admin", "user-estimator"]),
      lastMessageAt: daysAgo(0.1),
    },
  });
  const chatMessages = [
    {
      senderId: "user-estimator",
      content:
        "سلام آقای میرجعفری، ریزمتره پروژه پل صدر رو کامل کردم. لطفاً بررسی کنید.",
      time: daysAgo(2),
    },
    {
      senderId: "user-admin",
      content:
        "سلام احمد خان، ممنون. الان دارم نگاه می‌کنم. یه نگاهی به کد ۰۲-۱۰۱-۰۱۰۱ بنداز، به نظر میرسه مقدارش زیاده.",
      time: daysAgo(1.9),
    },
    {
      senderId: "user-estimator",
      content: "چشم، الان بررسی می‌کنم و نتیجه رو اعلام می‌کنم.",
      time: daysAgo(1.5),
    },
    {
      senderId: "user-estimator",
      content:
        "بررسی کردم، مقدار درست هست. این مقدار به‌خاطر تغییرات ابعاد دهانه پل هست.",
      time: daysAgo(0.5),
    },
    {
      senderId: "user-admin",
      content: "خیلی خوب، پس صورت‌وضعیت دوره ۲ رو ارسال کنید.",
      time: daysAgo(0.1),
    },
  ];
  for (const m of chatMessages) {
    await db.chatMessage.create({
      data: {
        threadId: chatThread.id,
        senderId: m.senderId,
        content: m.content,
        readBy: JSON.stringify([m.senderId]),
        createdAt: m.time,
      },
    });
  }

  // ── کامنت‌های محتوایی روی ردیف‌های ریزمتره ──
  const sampleDetailBoq = await db.detailBoq.findFirst({
    where: { projectId: project1.id },
  });
  if (sampleDetailBoq) {
    await db.comment.create({
      data: {
        tenantId: tenant.id,
        projectId: project1.id,
        userId: "user-admin",
        userName: "سید علی میرجعفری",
        entityType: "DETAIL_BOQ",
        entityId: sampleDetailBoq.id,
        entityLabel: `ردیف کد ${sampleDetailBoq.code}`,
        content:
          "این ردیف نیاز به بازنگری دارد. مقدار را با نقشه‌های اجرایی تطبیق دهید.",
        mentions: JSON.stringify(["user-estimator"]),
      },
    });
    await db.comment.create({
      data: {
        tenantId: tenant.id,
        projectId: project1.id,
        userId: "user-estimator",
        userName: "احمد میرزایی",
        entityType: "DETAIL_BOQ",
        entityId: sampleDetailBoq.id,
        entityLabel: `ردیف کد ${sampleDetailBoq.code}`,
        content:
          "بررسی شد. مقدار با نقشه‌های تطبیق داده شد. تفاوت به‌خاطر ابعاد جدید دهانه است.",
        mentions: JSON.stringify([]),
      },
    });
  }

  // ── مصالح پای کار (Materials at Site) ──
  const materialSamples = [
    {
      projectId: project1.id,
      code: "02-101-0101",
      description: "میلگرد آجدار A3 سایز ۲۰",
      unit: "تن",
      purchasedQuantity: 85,
      previousExecuted: 62,
      currentExecuted: 8,
      invoiceNo: "INV-1403-001",
      supplier: "فولاد مبارکه",
      purchaseDate: daysAgo(45),
      unitPrice: 68000000,
    },
    {
      projectId: project1.id,
      code: "02-101-0102",
      description: "سیمان تیپ ۲",
      unit: "تن",
      purchasedQuantity: 320,
      previousExecuted: 280,
      currentExecuted: 15,
      invoiceNo: "INV-1403-002",
      supplier: "سیمان فارس",
      purchaseDate: daysAgo(30),
      unitPrice: 4200000,
    },
    {
      projectId: project1.id,
      code: "02-101-0103",
      description: "میلگرد ساده سایز ۱۶",
      unit: "تن",
      purchasedQuantity: 42,
      previousExecuted: 30,
      currentExecuted: 5,
      invoiceNo: "INV-1403-003",
      supplier: "ذوب آهن اصفهان",
      purchaseDate: daysAgo(20),
      unitPrice: 62000000,
    },
  ];
  for (const m of materialSamples) {
    const remaining = m.purchasedQuantity - m.previousExecuted - m.currentExecuted;
    const totalCost = m.purchasedQuantity * m.unitPrice;
    await db.materialAtSite.create({
      data: {
        ...m,
        remainingQuantity: remaining,
        totalCost,
        purchaseDate: m.purchaseDate,
      } as any,
    });
  }

  // ── دامنه قیمت پیشنهادی برای پروژه ۳ ──
  const fs3 = await db.financialSheetItem.findMany({
    where: { projectId: project3.id },
    select: { totalAmount: true },
  });
  const base3 = fs3.reduce((s, f) => s + f.totalAmount, 0);
  const overhead3 = (base3 * 15) / 100;
  const profit3 = ((base3 + overhead3) * 8) / 100;
  const risk3 = ((base3 + overhead3 + profit3) * 5) / 100;
  const ceiling3 = base3 + overhead3 + profit3 + risk3;
  const floor3 = base3 * 0.92;
  await db.bidRange.create({
    data: {
      projectId: project3.id,
      overheadPct: 15,
      profitPct: 8,
      riskPct: 5,
      baseAmount: base3,
      floorAmount: floor3,
      ceilingAmount: ceiling3,
      suggestedAmount: (ceiling3 + floor3) / 2,
    },
  });

  // ── لاگ‌های ممیزی ──
  const auditLogs = [
    {
      projectId: project1.id,
      userId: "user-admin",
      userName: "سید علی میرجعفری",
      action: "CREATE",
      entityType: "PROJECT",
      entityId: project1.id,
      after: JSON.stringify({ name: project1.name }),
    },
    {
      projectId: project1.id,
      userId: "user-estimator",
      userName: "احمد میرزایی",
      action: "UPDATE",
      entityType: "DETAIL_BOQ",
      entityId: sampleDetailBoq?.id || null,
      after: JSON.stringify({ quantity: 1.0 }),
    },
    {
      projectId: project2.id,
      userId: "user-estimator",
      userName: "احمد میرزایی",
      action: "SUBMIT",
      entityType: "PAYMENT",
      entityId: null,
    },
  ];
  for (const log of auditLogs) {
    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        ...log,
        createdAt: daysAgo(Math.random() * 5),
      } as any,
    });
  }

  // ── ریسک‌های پروژه ──
  const sampleRisks = [
    {
      projectId: project1.id,
      title: "تأخیر در تأمین میلگرد آجدار",
      description: "به دلیل تحریم‌ها، تأمین میلگرد A3 ممکن است با تأخیر مواجه شود",
      category: "FINANCIAL",
      probability: 0.7,
      impact: 0.6,
      riskScore: 0.42,
      severity: "HIGH",
      status: "MITIGATING",
      response: "MITIGATE",
      mitigation: "سفارش زودهنگام و ایجاد ذخیره‌ی ۲۰٪ اضافی",
      contingency: "تأمین از تأمین‌کنندگان داخلی جایگزین",
      owner: "احمد میرزایی",
      dueDate: daysFromNow(30),
      estimatedCost: 150000000,
    },
    {
      projectId: project1.id,
      title: "تغییرات آب و هوایی در فصل زمستان",
      description: "بارش برف ممکن است عملیات بتن‌ریزی را متوقف کند",
      category: "ENVIRONMENTAL",
      probability: 0.5,
      impact: 0.4,
      riskScore: 0.2,
      severity: "MEDIUM",
      status: "MONITORING",
      response: "ACCEPT",
      mitigation: "برنامه‌ریزی عملیات بحرانی در فصول گرم",
      contingency: "استفاده از افزودنی‌های بتن برای دمای پایین",
      owner: "مهندس رضایی",
      dueDate: daysFromNow(90),
      estimatedCost: 80000000,
    },
    {
      projectId: project2.id,
      title: "تغییرات در نقشه‌های اجرایی",
      description: "کارفرما ممکن است درخواست تغییر در ابعاد دهانه پل کند",
      category: "CONTRACTUAL",
      probability: 0.4,
      impact: 0.8,
      riskScore: 0.32,
      severity: "MEDIUM",
      status: "IDENTIFIED",
      response: "TRANSFER",
      mitigation: "مذاکره برای الحاقیه قرارداد",
      contingency: "محاسبه‌ی مجدد ریزمتره",
      owner: "سید علی میرجعفری",
      dueDate: daysFromNow(60),
      estimatedCost: 250000000,
    },
    {
      projectId: project1.id,
      title: "حادثه‌ی ایمنی در عملیات حفاری",
      description: "ریسک ریزش دیواره‌ی حفاری در عمق بیش از ۳ متر",
      category: "SAFETY",
      probability: 0.3,
      impact: 0.9,
      riskScore: 0.27,
      severity: "MEDIUM",
      status: "MITIGATING",
      response: "MITIGATE",
      mitigation: "استفاده از شمع‌بندی و پایش روزانه",
      contingency: "تأمین تجهیزات امدادی",
      owner: "مهندس رضایی",
      dueDate: daysFromNow(15),
      estimatedCost: 50000000,
    },
    {
      projectId: project3.id,
      title: "عدم تطابق کیفیت بتن با مشخصات فنی",
      description: "مقاومت فشاری بتن ممکن است کمتر از M300 باشد",
      category: "TECHNICAL",
      probability: 0.2,
      impact: 0.7,
      riskScore: 0.14,
      severity: "LOW",
      status: "CLOSED",
      response: "MITIGATE",
      mitigation: "آزمایش‌های روزانه‌ی slump و مقاومت",
      contingency: "استفاده از افزودنی‌های فوق‌روان‌کننده",
      owner: "احمد میرزایی",
      dueDate: daysAgo(10),
      estimatedCost: 30000000,
    },
    {
      projectId: project1.id,
      title: "افزایش نرخ مصالح در بازار",
      description: "نوسانات نرخ ارز ممکن است باعث افزایش قیمت مصالح شود",
      category: "FINANCIAL",
      probability: 0.8,
      impact: 0.7,
      riskScore: 0.56,
      severity: "HIGH",
      status: "ANALYZED",
      response: "MITIGATE",
      mitigation: "خرید زودهنگام مصالح استراتژیک",
      contingency: "اعمال بند تعدیل در قرارداد",
      owner: "سید علی میرجعفری",
      dueDate: daysFromNow(45),
      estimatedCost: 400000000,
    },
  ];
  for (const r of sampleRisks) {
    await db.risk.create({
      data: {
        tenantId: tenant.id,
        ...r,
        identifiedAt: daysAgo(Math.random() * 20 + 5),
      } as any,
    });
  }

  // ── تأمین‌کنندگان ──
  const suppliers = [
    { name: "فولاد مبارکه اصفهان", category: "MATERIAL", contactPerson: "مهندس کاظمی", phone: "031-33344455", email: "info@mobarakeh.ir", rating: 4.5, totalOrders: 12, totalValue: 2800000000, onTimeRate: 92, qualityScore: 88 },
    { name: "سیمان فارس نو", category: "MATERIAL", contactPerson: "آقای رحیمی", phone: "071-3223344", email: "sales@farscement.ir", rating: 4.2, totalOrders: 8, totalValue: 1200000000, onTimeRate: 85, qualityScore: 90 },
    { name: "شرکت تأسیسات مکانیکی پارس", category: "EQUIPMENT", contactPerson: "مهندس صادقی", phone: "021-88776655", email: "info@pars-mech.ir", rating: 4.0, totalOrders: 5, totalValue: 950000000, onTimeRate: 80, qualityScore: 82 },
    { name: "پیمانکار نیروی انسانی آریا", category: "LABOR", contactPerson: "آقای نوری", phone: "0912-3456789", rating: 3.8, totalOrders: 15, totalValue: 680000000, onTimeRate: 75, qualityScore: 70 },
    { name: "تأمین‌کننده خدمات نقلی تبریز", category: "SERVICE", contactPerson: "مهندس احمدی", phone: "041-3334455", rating: 4.3, totalOrders: 6, totalValue: 420000000, onTimeRate: 88, qualityScore: 85 },
    { name: "ذوب آهن اصفهان", category: "MATERIAL", contactPerson: "مهندس موسوی", phone: "031-33445566", email: "sales@zobahan.ir", rating: 4.7, totalOrders: 10, totalValue: 1900000000, onTimeRate: 95, qualityScore: 92 },
    { name: "شرکت سیمان تهران", category: "MATERIAL", contactPerson: "آقای جعفری", phone: "021-33221100", rating: 3.5, totalOrders: 4, totalValue: 320000000, onTimeRate: 70, qualityScore: 75 },
  ];
  for (const s of suppliers) {
    await db.supplier.create({
      data: {
        tenantId: tenant.id,
        ...s,
        isActive: true,
      } as any,
    });
  }

  // ── درخواست‌های تغییر ──
  const changeOrders = [
    { projectId: project1.id, changeNo: "CO-001", title: "تغییر ابعاد دهانه ایستگاه", description: "افزایش عرض دهانه از ۱۲ به ۱۴ متر مطابق درخواست کارفرما", type: "DESIGN", priority: "HIGH", costImpact: 350000000, scheduleImpact: 15, status: "APPROVED", requestedBy: "user-estimator", requestedByName: "احمد میرزایی", reviewedByName: "سید علی میرجعفری", reviewNote: "تأیید شد — الحاقیه قرارداد_REQUIRED" },
    { projectId: project1.id, changeNo: "CO-002", title: "تغییر نوع مصالح بتن", description: "استفاده از بتن M350 به جای M300 برای افزایش مقاومت", type: "MATERIAL", priority: "MEDIUM", costImpact: 120000000, scheduleImpact: 0, status: "IMPLEMENTED", requestedBy: "user-admin", requestedByName: "سید علی میرجعفری", reviewedByName: "سید علی میرجعفری", reviewNote: "تأیید و اجرا شد" },
    { projectId: project2.id, changeNo: "CO-001", title: "افزایش ارتفاع پایه‌های پل", description: "تغییر ارتفاع پایه‌ها به دلیل مشکلات ژئوتکنیکی", type: "SCOPE", priority: "URGENT", costImpact: 580000000, scheduleImpact: 30, status: "UNDER_REVIEW", requestedBy: "user-estimator", requestedByName: "احمد میرزایی" },
    { projectId: project1.id, changeNo: "CO-003", title: "تغییر زمان‌بندی تحویل", description: "تأخیر ۲۰ روزه در تحویل موقت", type: "SCHEDULE", priority: "MEDIUM", costImpact: 0, scheduleImpact: 20, status: "SUBMITTED", requestedBy: "user-biller", requestedByName: "مهندس رضایی" },
    { projectId: project3.id, changeNo: "CO-001", title: "حذف آیتم غیرضروری", description: "حذف آیتم‌های تزئینی جهت کاهش هزینه", type: "COST", priority: "LOW", costImpact: -150000000, scheduleImpact: -5, status: "REJECTED", requestedBy: "user-admin", requestedByName: "سید علی میرجعفری", reviewedByName: "سید علی میرجعفری", reviewNote: "رد شد — تأثیر بر زیبایی‌شناسی" },
  ];
  for (const c of changeOrders) {
    await db.changeOrder.create({
      data: {
        tenantId: tenant.id,
        ...c,
        submittedAt: daysAgo(Math.random() * 15 + 1),
        reviewedAt: c.status !== "SUBMITTED" && c.status !== "UNDER_REVIEW" ? daysAgo(Math.random() * 5) : null,
        implementedAt: c.status === "IMPLEMENTED" ? daysAgo(Math.random() * 3) : null,
      } as any,
    });
  }

  // ── قراردادها ──
  const sampleContracts = [
    {
      projectId: project1.id,
      contractNo: "CON-1403-001",
      title: "قرارداد اصلی ساخت ایستگاه مترو",
      type: "MAIN",
      partyName: "شرکت عمران مترو",
      partyRole: "EMPLOYER",
      contractAmount: 2500000000,
      advancePayment: 375000000,
      retentionPct: 5,
      signDate: daysAgo(180),
      startDate: daysAgo(175),
      endDate: daysFromNow(365),
      durationDays: 540,
      status: "ACTIVE",
      notes: "قرارداد اصلی پیمان پروژه",
    },
    {
      projectId: project1.id,
      contractNo: "SUB-1403-002",
      title: "پیمان فرعی تأمین و نصب سیستم تهویه",
      type: "SUBCONTRACT",
      partyName: "شرکت تهویه پارس",
      partyRole: "CONTRACTOR",
      contractAmount: 380000000,
      advancePayment: 57000000,
      retentionPct: 10,
      signDate: daysAgo(120),
      startDate: daysAgo(100),
      endDate: daysFromNow(60),
      durationDays: 160,
      status: "ACTIVE",
    },
    {
      projectId: project2.id,
      contractNo: "CON-1403-003",
      title: "قرارداد ساخت پل روگذار",
      type: "MAIN",
      partyName: "شهرداری منطقه ۴",
      partyRole: "EMPLOYER",
      contractAmount: 1850000000,
      advancePayment: 277500000,
      retentionPct: 5,
      signDate: daysAgo(90),
      startDate: daysAgo(85),
      endDate: daysFromNow(300),
      durationDays: 385,
      status: "ACTIVE",
    },
    {
      projectId: project1.id,
      contractNo: "SUP-1403-004",
      title: "قرارداد تأمین میلگرد و مصالح",
      type: "SUPPLY",
      partyName: "فولاد مبارکه اصفهان",
      partyRole: "SUPPLIER",
      contractAmount: 580000000,
      advancePayment: 0,
      retentionPct: 5,
      signDate: daysAgo(150),
      startDate: daysAgo(145),
      endDate: daysFromNow(200),
      durationDays: 345,
      status: "ACTIVE",
    },
  ];
  for (const c of sampleContracts) {
    await db.contract.create({
      data: {
        tenantId: tenant.id,
        ...c,
      } as any,
    });
  }

  // ── milestone‌های قرارداد ──
  const allContracts = await db.contract.findMany();
  const milestoneTemplates = [
    { title: "تحویل موقت", amount: 0.5, dueOffset: 60 },
    { title: "رفع نواقص", amount: 0.3, dueOffset: 120 },
    { title: "تحویل قطعی", amount: 0.2, dueOffset: 180 },
  ];
  for (const contract of allContracts) {
    for (let i = 0; i < milestoneTemplates.length; i++) {
      const t = milestoneTemplates[i];
      const isCompleted = i === 0 && contract.status === "ACTIVE" && contract.startDate && (new Date().getTime() - contract.startDate.getTime()) > 60 * 86400000;
      await db.contractMilestone.create({
        data: {
          contractId: contract.id,
          title: t.title,
          dueDate: daysFromNow(t.dueOffset),
          completedDate: isCompleted ? daysAgo(5) : null,
          amount: contract.contractAmount * t.amount,
          status: isCompleted ? "COMPLETED" : "PENDING",
          order: i + 1,
        },
      });
    }
  }

  // ── رویدادهای تقویم ──
  const calendarEvents = [
    { projectId: project1.id, title: "بازرسی فصل ۲ — عملیات اسکلت", type: "INSPECTION", startDate: daysFromNow(3), location: "محل پروژه مترو", color: "cyan", attendees: ["میرجعفری", "میرزایی", "رضایی"] },
    { projectId: project1.id, title: "جلسه هماهنگی با کارفرما", type: "MEETING", startDate: daysFromNow(5), location: "دفتر کارفرما", color: "amber", attendees: ["میرجعفری", "نماینده کارفرما"] },
    { projectId: project2.id, title: "موعد ارسال صورت‌وضعیت دوره ۳", type: "DEADLINE", startDate: daysFromNow(7), color: "rose", attendees: [] },
    { projectId: project1.id, title: "تحویل مصالح فصل ۳", type: "DELIVERY", startDate: daysFromNow(10), location: "پای کار مترو", color: "emerald", attendees: ["میرزایی"] },
    { projectId: project2.id, title: "پرداخت پیش‌پرداخت پیمان فرعی", type: "PAYMENT", startDate: daysFromNow(14), color: "orange", attendees: [] },
    { projectId: project1.id, title: "Milestone: تکمیل بتن‌ریزی سقف", type: "MILESTONE", startDate: daysFromNow(21), color: "purple", attendees: [] },
    { projectId: project3.id, title: "بازرسی ایمنی کارگاه", type: "INSPECTION", startDate: daysFromNow(2), location: "تونل ۲", color: "cyan", attendees: ["رضایی"] },
    { projectId: project1.id, title: "جلسه کمیته فنی", type: "MEETING", startDate: daysFromNow(1), location: "دفتر مشاور", color: "amber", attendees: ["میرجعفری", "میرزایی"] },
    { projectId: project2.id, title: "موعد تحویل نقشه‌های اجرایی", type: "DEADLINE", startDate: daysFromNow(0), color: "rose", attendees: [] },
    { projectId: project1.id, title: "پایان دوره رفع نواقص", type: "MILESTONE", startDate: daysFromNow(45), color: "purple", attendees: [] },
  ];
  for (const e of calendarEvents) {
    await db.calendarEvent.create({
      data: {
        tenantId: tenant.id,
        ...e,
        endDate: null,
        allDay: true,
        attendees: JSON.stringify(e.attendees || []),
        status: "SCHEDULED",
      } as any,
    });
  }

  // ── مستندات نمونه (برای آرشیو) ──
  const sampleDocuments = [
    { projectId: project1.id, entityType: "DETAIL_BOQ", entityId: "doc-1", originalName: "عکس کارگاه excavation.jpg", storedName: "TM7-S25_SW2_010101_1404-04-15_خاکبرداری.jpg", mimeType: "image/jpeg", sizeBytes: 2456000, projectCode: "TM7-S25", paymentPeriod: 2, itemCode: "010101", uploadDate: "1404-04-15", description: "خاکبرداری", category: "SITE_PHOTO", uploadedByName: "احمد میرزایی" },
    { projectId: project1.id, entityType: "PAYMENT", entityId: "doc-2", originalName: "صورت‌جلسه بازرسی فصل ۲.pdf", storedName: "TM7-S25_SW1_NOCODE_1404-04-10_بازرسی.pdf", mimeType: "application/pdf", sizeBytes: 890000, projectCode: "TM7-S25", paymentPeriod: 1, itemCode: null, uploadDate: "1404-04-10", description: "بازرسی_فصل_۲", category: "MEETING_MINUTES", uploadedByName: "سید علی میرجعفری" },
    { projectId: project2.id, entityType: "PROJECT", entityId: "doc-3", originalName: "نقشه اجرایی پل.dwg", storedName: "PL-IM-12_SW0_NOCODE_1404-03-20_نقشه.dwg", mimeType: "application/dwg", sizeBytes: 5200000, projectCode: "PL-IM-12", paymentPeriod: null, itemCode: null, uploadDate: "1404-03-20", description: "نقشه_اجرایی", category: "DRAWING", uploadedByName: "احمد میرزایی" },
    { projectId: project1.id, entityType: "FINANCIAL_SHEET", entityId: "doc-4", originalName: "فاکتور سیمان.pdf", storedName: "TM7-S25_SW2_020101_1404-04-18_فاکتور.pdf", mimeType: "application/pdf", sizeBytes: 320000, projectCode: "TM7-S25", paymentPeriod: 2, itemCode: "020101", uploadDate: "1404-04-18", description: "فاکتور_سیمان", category: "INVOICE", uploadedByName: "احمد میرزایی" },
    { projectId: project2.id, entityType: "PROJECT", entityId: "doc-5", originalName: "قرارداد اصلی.pdf", storedName: "PL-IM-12_SW0_NOCODE_1404-01-15_قرارداد.pdf", mimeType: "application/pdf", sizeBytes: 1850000, projectCode: "PL-IM-12", paymentPeriod: null, itemCode: null, uploadDate: "1404-01-15", description: "قرارداد_اصلی", category: "CONTRACT", uploadedByName: "سید علی میرجعفری" },
    { projectId: project1.id, entityType: "DETAIL_BOQ", entityId: "doc-6", originalName: "عکس بتن‌ریزی.jpg", storedName: "TM7-S25_SW2_020201_1404-04-22_بتن‌ریزی.jpg", mimeType: "image/jpeg", sizeBytes: 3100000, projectCode: "TM7-S25", paymentPeriod: 2, itemCode: "020201", uploadDate: "1404-04-22", description: "بتن‌ریزی_سقف", category: "SITE_PHOTO", uploadedByName: "مهندس رضایی" },
    { projectId: project3.id, entityType: "PROJECT", entityId: "doc-7", originalName: "گزارش زمین‌شناسی.pdf", storedName: "TN-IA-08_SW0_NOCODE_1404-02-10_زمین‌شناسی.pdf", mimeType: "application/pdf", sizeBytes: 2400000, projectCode: "TN-IA-08", paymentPeriod: null, itemCode: null, uploadDate: "1404-02-10", description: "گزارش_ژئوتکنیک", category: "OTHER", uploadedByName: "احمد میرزایی" },
  ];
  for (const d of sampleDocuments) {
    await db.documentFile.create({
      data: {
        tenantId: tenant.id,
        ...d,
      } as any,
    });
  }

  console.log("✅ seed کامل شد.");
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - پروژه‌ها: ۳`);
  console.log(`   - فهرست بها: ۴ رشته`);
  console.log(`   - آیتم‌های فهرست: ${priceItems.length}`);
  console.log(`   - شاخص‌ها: ${indices.length}`);
  console.log(`   - مسافت‌ها: ${distances.length * 2}`);
  console.log(`   - نرخ مصالح: ${materials.length}`);
  console.log(`   - هشدارها: ${alerts.length}`);
  console.log(`   - کامنت‌ها: ۲`);
  console.log(`   - مصالح پای کار: ${materialSamples.length}`);
  console.log(`   - لاگ‌های ممیزی: ${auditLogs.length}`);
  console.log(`   - ریسک‌ها: ${sampleRisks.length}`);
  console.log(`   - تأمین‌کنندگان: ${suppliers.length}`);
  console.log(`   - درخواست‌های تغییر: ${changeOrders.length}`);
  console.log(`   - قراردادها: ${sampleContracts.length}`);
  console.log(`   - رویدادهای تقویم: ${calendarEvents.length}`);
  console.log(`   - مستندات آرشیو: ${sampleDocuments.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
