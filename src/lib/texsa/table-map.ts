/**
 * table-map.ts — نگاشت معنایی جدول‌های تکسا (.svzt / NewDataSet) به مفاهیم محصول Civilic
 *
 * مبنا: تحلیل فایل واقعی `Important project.svzt` (نسخه‌ی تکسا 14.0.5)
 *   - ۴۵ جدول، ۷۸٬۹۸۸ ردیف  → جزئیات کامل در src/lib/texsa/generated-schema.json
 *   - تحلیل خوانای انسانی در docs/texsa-real-file-analysis.md
 *
 * این فایل فقط «نگاشت» است؛ هیچ داده‌ی خام تکسا حذف نمی‌شود. هدف:
 *   1. دسته‌بندی جدول‌ها (متره، مالی، تعدیل، حمل، …) برای import/normalize.
 *   2. نگاشت نام XML جدول → نام مدل Prisma (mirror).
 *   3. نگاشت ستون‌های کلیدی هر جدول به فیلدهای معنایی محصول.
 *
 * قاعده‌ی نام‌گذاری mirror در schema.prisma: نام مدل با حرف بزرگ + فیلدها با پیشوند `tx_`.
 */

// ─────────────────────────────────────────────────────────────
//  دسته‌بندی دامنه‌ای جدول‌ها
// ─────────────────────────────────────────────────────────────
export type TexsaDomain =
  | "PROJECT" // مشخصات پیمان و پروژه
  | "PARTY" // طرفین/اشخاص
  | "PRICE_LIST" // فهرست‌بها
  | "METERING" // ریزمتره/خلاصه‌متره/صورت‌جلسه
  | "FINANCIAL" // برگه مالی و فصول
  | "PAYMENT" // صورت‌وضعیت
  | "ADJUSTMENT" // تعدیل و شاخص
  | "DEDUCTION" // کسورات
  | "TRANSPORT" // حمل و مسافت
  | "MATERIAL" // مصالح و منابع
  | "SCHEDULE" // فعالیت‌ها/زمان‌بندی
  | "LOOKUP" // جدول‌های مرجع/پایه
  | "OTHER";

export interface TexsaTableInfo {
  /** نام عنصر جدول در XML (root NewDataSet) */
  xmlName: string;
  /** نام مدل Prisma (mirror) */
  prismaModel: string;
  /** دسته‌ی دامنه‌ای */
  domain: TexsaDomain;
  /** توضیح فارسی کوتاه */
  label: string;
  /** آیا در normalize محصول استفاده می‌شود */
  normalized: boolean;
  /** تعداد ردیف در فایل نمونه‌ی واقعی (برای مرجع) */
  sampleRowCount: number;
}

/**
 * فهرست کامل ۴۵ جدول تکسا با دسته و نام مدل Prisma.
 * sampleRowCount از فایل واقعی Important project.svzt گرفته شده است.
 */
export const TEXSA_TABLES: Record<string, TexsaTableInfo> = {
  // ── مرجع / پایه ──
  BaseSituNoe: { xmlName: "BaseSituNoe", prismaModel: "BaseSituNoe", domain: "LOOKUP", label: "انواع وضعیت (موقت/ماقبل قطعی/قطعی)", normalized: true, sampleRowCount: 3 },
  base_PersonalityTyp: { xmlName: "base_PersonalityTyp", prismaModel: "Base_PersonalityTyp", domain: "PARTY", label: "انواع شخصیت (پیمانکار/ناظر/مشاور/کارفرما/…)", normalized: true, sampleRowCount: 7 },
  BaseBarcode: { xmlName: "BaseBarcode", prismaModel: "BaseBarcode", domain: "LOOKUP", label: "بارکد/کدینگ", normalized: false, sampleRowCount: 1000 },
  base_TajhzType: { xmlName: "base_TajhzType", prismaModel: "Base_TajhzType", domain: "LOOKUP", label: "انواع تجهیز کارگاه", normalized: false, sampleRowCount: 4 },
  Base_Months: { xmlName: "Base_Months", prismaModel: "Base_Months", domain: "LOOKUP", label: "ماه‌ها", normalized: false, sampleRowCount: 13 },
  base_ShakhesType: { xmlName: "base_ShakhesType", prismaModel: "Base_ShakhesType", domain: "ADJUSTMENT", label: "انواع شاخص", normalized: false, sampleRowCount: 2 },
  Base_ItemType: { xmlName: "Base_ItemType", prismaModel: "Base_ItemType", domain: "LOOKUP", label: "انواع آیتم", normalized: false, sampleRowCount: 6 },
  base_unit: { xmlName: "base_unit", prismaModel: "Base_unit", domain: "LOOKUP", label: "واحدها", normalized: true, sampleRowCount: 1802 },
  base_tyun: { xmlName: "base_tyun", prismaModel: "Base_tyun", domain: "LOOKUP", label: "نوع واحد", normalized: false, sampleRowCount: 8 },
  base_zrtj: { xmlName: "base_zrtj", prismaModel: "Base_zrtj", domain: "LOOKUP", label: "ضرایب تجهیز", normalized: false, sampleRowCount: 18 },
  base_IntpVaziat: { xmlName: "base_IntpVaziat", prismaModel: "Base_IntpVaziat", domain: "ADJUSTMENT", label: "وضعیت تعدیل", normalized: false, sampleRowCount: 3 },
  brv_color: { xmlName: "brv_color", prismaModel: "Brv_color", domain: "LOOKUP", label: "رنگ‌ها", normalized: false, sampleRowCount: 16 },
  base_acts_unit: { xmlName: "base_acts_unit", prismaModel: "Base_acts_unit", domain: "SCHEDULE", label: "واحد فعالیت", normalized: false, sampleRowCount: 203 },

  // ── پروژه / پیمان ──
  brv_contract: { xmlName: "brv_contract", prismaModel: "Brv_contract", domain: "PROJECT", label: "مشخصات پیمان و پروژه", normalized: true, sampleRowCount: 1 },
  brv_elhagh: { xmlName: "brv_elhagh", prismaModel: "Brv_elhagh", domain: "PROJECT", label: "الحاقیه‌ها", normalized: false, sampleRowCount: 1 },
  brv_type: { xmlName: "brv_type", prismaModel: "Brv_type", domain: "PARTY", label: "طرفین پروژه (نسخه‌ها: پیمانکار/مشاور/…)", normalized: true, sampleRowCount: 3 },

  // ── صورت‌وضعیت ──
  brv_situ: { xmlName: "brv_situ", prismaModel: "Brv_situ", domain: "PAYMENT", label: "صورت‌وضعیت‌ها (لینک به نوع وضعیت)", normalized: true, sampleRowCount: 21 },
  brv_type_situ: { xmlName: "brv_type_situ", prismaModel: "Brv_type_situ", domain: "PAYMENT", label: "دوره‌های صورت‌وضعیت (تاریخ/مبلغ/قفل/پیش‌پرداخت)", normalized: true, sampleRowCount: 33 },

  // ── تعدیل / شاخص ──
  brv_intp: { xmlName: "brv_intp", prismaModel: "Brv_intp", domain: "ADJUSTMENT", label: "دوره‌های تعدیل/شاخص", normalized: true, sampleRowCount: 7 },
  brv_ahta: { xmlName: "brv_ahta", prismaModel: "Brv_ahta", domain: "ADJUSTMENT", label: "تعدیل به تفکیک فصل/فهرست (شاخص مبنا/دوره)", normalized: true, sampleRowCount: 781 },

  // ── کسورات ──
  brv_kosorat: { xmlName: "brv_kosorat", prismaModel: "Brv_kosorat", domain: "DEDUCTION", label: "کسورات صورت‌وضعیت (بیمه/مالیات/…)", normalized: true, sampleRowCount: 360 },
  brv_Jobrankosoorat: { xmlName: "brv_Jobrankosoorat", prismaModel: "Brv_Jobrankosoorat", domain: "DEDUCTION", label: "کسورات جبرانی", normalized: false, sampleRowCount: 186 },
  brv_Arzkosoorat: { xmlName: "brv_Arzkosoorat", prismaModel: "Brv_Arzkosoorat", domain: "DEDUCTION", label: "کسورات ارزی", normalized: false, sampleRowCount: 186 },
  brv_Tadilkosorat: { xmlName: "brv_Tadilkosorat", prismaModel: "Brv_Tadilkosorat", domain: "DEDUCTION", label: "کسورات تعدیل", normalized: true, sampleRowCount: 192 },

  // ── فهرست‌بها / گروه‌بندی ──
  brv_fhbh: { xmlName: "brv_fhbh", prismaModel: "Brv_fhbh", domain: "PRICE_LIST", label: "فهرست‌بها (کد/شرح/واحد/قیمت)", normalized: true, sampleRowCount: 5116 },
  brv_grop: { xmlName: "brv_grop", prismaModel: "Brv_grop", domain: "METERING", label: "گروه‌بندی حمل/فصل", normalized: false, sampleRowCount: 1830 },
  brv_mogs: { xmlName: "brv_mogs", prismaModel: "Brv_mogs", domain: "METERING", label: "گروه‌های صورت‌جلسه/مقطع", normalized: true, sampleRowCount: 954 },

  // ── متره ──
  brv_rzmt: { xmlName: "brv_rzmt", prismaModel: "Brv_rzmt", domain: "METERING", label: "ریزمتره", normalized: true, sampleRowCount: 8551 },
  brv_khmt: { xmlName: "brv_khmt", prismaModel: "Brv_khmt", domain: "METERING", label: "خلاصه‌متره", normalized: true, sampleRowCount: 7726 },
  brv_ader: { xmlName: "brv_ader", prismaModel: "Brv_ader", domain: "METERING", label: "ادرس/ارجاع ردیف", normalized: false, sampleRowCount: 4411 },

  // ── برگه مالی / فصول ──
  brv_bgml: { xmlName: "brv_bgml", prismaModel: "Brv_bgml", domain: "FINANCIAL", label: "برگه مالی (مقدار/مبلغ)", normalized: true, sampleRowCount: 2122 },
  brv_mult: { xmlName: "brv_mult", prismaModel: "Brv_mult", domain: "FINANCIAL", label: "برگه مالی با ضرایب/درصد فصل", normalized: true, sampleRowCount: 6705 },
  brv_fhpy: { xmlName: "brv_fhpy", prismaModel: "Brv_fhpy", domain: "FINANCIAL", label: "جمع‌بندی فصول/فهرست", normalized: true, sampleRowCount: 183 },

  // ── حمل / مسافت ──
  brv_hmpy: { xmlName: "brv_hmpy", prismaModel: "Brv_hmpy", domain: "TRANSPORT", label: "حمل پروژه", normalized: false, sampleRowCount: 711 },
  brv_hmpy_rzmt: { xmlName: "brv_hmpy_rzmt", prismaModel: "Brv_hmpy_rzmt", domain: "TRANSPORT", label: "حمل ریزمتره", normalized: false, sampleRowCount: 3382 },
  brv_hmbs: { xmlName: "brv_hmbs", prismaModel: "Brv_hmbs", domain: "TRANSPORT", label: "حمل بر اساس صورت‌وضعیت", normalized: false, sampleRowCount: 757 },
  brv_dstb: { xmlName: "brv_dstb", prismaModel: "Brv_dstb", domain: "TRANSPORT", label: "ضرایب مسافت حمل", normalized: false, sampleRowCount: 1297 },
  brv_dstn_main: { xmlName: "brv_dstn_main", prismaModel: "Brv_dstn_main", domain: "TRANSPORT", label: "مسافت اصلی", normalized: false, sampleRowCount: 960 },
  brv_dstn_fromto: { xmlName: "brv_dstn_fromto", prismaModel: "Brv_dstn_fromto", domain: "TRANSPORT", label: "مسافت مبدا/مقصد", normalized: false, sampleRowCount: 122 },
  brv_dstn_main_rzmt: { xmlName: "brv_dstn_main_rzmt", prismaModel: "Brv_dstn_main_rzmt", domain: "TRANSPORT", label: "مسافت اصلی ریزمتره", normalized: false, sampleRowCount: 28652 },
  brv_dstn_fromto_rzmt: { xmlName: "brv_dstn_fromto_rzmt", prismaModel: "Brv_dstn_fromto_rzmt", domain: "TRANSPORT", label: "مسافت مبدا/مقصد ریزمتره", normalized: false, sampleRowCount: 66 },

  // ── مصالح / منابع ──
  brv_sorc_all: { xmlName: "brv_sorc_all", prismaModel: "Brv_sorc_all", domain: "MATERIAL", label: "فهرست منابع/مصالح", normalized: false, sampleRowCount: 155 },
  brv_sorc: { xmlName: "brv_sorc", prismaModel: "Brv_sorc", domain: "MATERIAL", label: "منابع مصالح پروژه", normalized: false, sampleRowCount: 155 },
  brv_nmmhb: { xmlName: "brv_nmmhb", prismaModel: "Brv_nmmhb", domain: "MATERIAL", label: "نمونه مصالح/مقادیر", normalized: false, sampleRowCount: 155 },

  // ── زمان‌بندی ──
  brv_acts: { xmlName: "brv_acts", prismaModel: "Brv_acts", domain: "SCHEDULE", label: "فعالیت‌ها (WBS/زمان‌بندی)", normalized: false, sampleRowCount: 122 },
};

// ─────────────────────────────────────────────────────────────
//  نگاشت ستون‌های کلیدی → فیلدهای معنایی محصول
//  (فقط جدول‌هایی که normalize می‌شوند)
// ─────────────────────────────────────────────────────────────

/** پروژه/پیمان: brv_contract → Project + ProjectParty */
export const CONTRACT_FIELD_MAP = {
  projectName: "ctc_nmpj", // نام پروژه
  employerName: "ctc_nmci", // کارفرما (دانشگاه خاتم)
  consultantShort: "ctc_nmcs", // مشاور (کوتاه: شارستان)
  supervisorName: "ctc_neza", // دستگاه نظارت (مهندسین مشاور شارستان)
  contractorName: "ctc_nmct", // پیمانکار (سیوان تدبیر تجارت)
  priceListYear: "ctc_yrfh", // سال فهرست‌بها (1403)
  contractNo: "ctc_numb", // شماره پیمان (C-KH-03-052)
  contractAmount: "ctc_pric_prim", // مبلغ اولیه پیمان
  mobilizationAmount: "ctc_pctj", // تجهیز کارگاه
  location: "ctc_plpj", // محل اجرا
  startDate: "ctc_dtct", // تاریخ شروع (شمسی)
  handoverDate: "ctc_dtst", // تاریخ تحویل
  endDate: "ctc_dend", // تاریخ خاتمه
  baseIndexYear: "ctc_ShEb_Yr", // سال شاخص مبنا
  texsaVersion: "Version", // نسخه تکسا
  projectCode: "ctc_code", // کد پروژه
} as const;

/** طرفین: brv_type → ProjectParty (با base_PersonalityTyp برای نوع) */
export const PARTY_FIELD_MAP = {
  partyName: "typ_name", // نام نمایشی نقش (پیمانکار/مشاور/…)
  personalityTypeId: "typ_PertypId", // ارجاع به base_PersonalityTyp.pty_id
  abbreviation: "typ_absName", // مخفف
  printSignature: "typ_PrintSignature",
} as const;

/** نوع شخصیت: base_PersonalityTyp.pty_id → نوع سازمان محصول */
export const PERSONALITY_TYPE_MAP: Record<string, { fa: string; orgType: "CONTRACTOR" | "CONSULTANT" | "EMPLOYER" | "INTERNAL" }> = {
  "0": { fa: "پیمانکار", orgType: "CONTRACTOR" },
  "1": { fa: "ناظر", orgType: "CONSULTANT" },
  "2": { fa: "مشاور", orgType: "CONSULTANT" },
  "3": { fa: "مدیرطرح", orgType: "EMPLOYER" },
  "4": { fa: "کارفرما", orgType: "EMPLOYER" },
  "5": { fa: "پیمان رسیدگی", orgType: "CONSULTANT" },
  "6": { fa: "بهره بردار", orgType: "INTERNAL" },
};

/** صورت‌وضعیت: brv_type_situ → Payment */
export const PAYMENT_FIELD_MAP = {
  periodNo: "tst_nusv", // شماره دوره
  statementType: "tst_type", // نوع (0 معمولاً موقت)
  date: "tst_date", // تاریخ صورت‌وضعیت (شمسی)
  amount: "tst_mbsv", // مبلغ صورت‌وضعیت
  prepayment: "tst_PishPardakht", // پیش‌پرداخت
  prepaymentRemain: "tst_PishPardakhtMande",
  isLocked: "tst_is_locked", // قفل
  hasTatbigh: "tst_hastatbigh", // تطبیق
  previousPeriodNo: "tst_nusv_previous",
} as const;

/** انواع وضعیت: BaseSituNoe.StnCode → وضعیت محصول */
export const SITU_NOE_MAP: Record<string, string> = {
  "1": "موقت",
  "2": "ماقبل قطعی",
  "3": "قطعی",
};

/** تعدیل: brv_ahta → AdjustmentReportRow */
export const ADJUSTMENT_FIELD_MAP = {
  chapterName: "ata_nufh_name", // نام فهرست/فصل (ابنیه)
  year: "ata_year", // سال
  indexQuarter: "ata_prod_shkh", // سه‌ماهه شاخص
  baseIndex: "ata_shbs", // شاخص مبنا
  periodIndex: "ata_shnw", // شاخص دوره
  newAmount: "ata_pcnw", // مبلغ نو
  oldAmount: "ata_pcoz", // مبلغ قدیم
  partyVersion: "ata_type", // 0=پیمانکار 1=مشاور
} as const;

/** کسورات: brv_kosorat → Deduction */
export const DEDUCTION_FIELD_MAP = {
  periodNo: "ksr_nusv",
  name: "ksr_name", // بیمه/مالیات/…
  percent: "ksr_prcn",
  amount: "ksr_price",
  sign: "ksr_PlusOrMinec", // + یا -
} as const;

/** فهرست‌بها: brv_fhbh → PriceListItem */
export const PRICE_ITEM_FIELD_MAP = {
  code: "fbh_cofh", // کد فهرست‌بها
  description: "fbh_desc", // شرح
  unit: "fbh_unit", // واحد
  unitPrice: "fbh_pcun", // قیمت واحد
  isStarred: "fbh_astr", // ستاره‌دار
  chapterNo: "fbh_nufh", // فهرست
  subChapterNo: "fbh_nuse", // فصل
} as const;

/** ریزمتره: brv_rzmt → DetailBoq */
export const DETAIL_BOQ_FIELD_MAP = {
  code: "rmt_cofh",
  groupLink: "rmt_link_mog", // لینک به brv_mogs
  quantityTotal: "rmt_summ",
  count: "rmt_numo",
  length: "rmt_tool",
  width: "rmt_arz",
  height: "rmt_heit",
  chapterNo: "rmt_nufh",
  subChapterNo: "rmt_nuse",
} as const;

/** خلاصه‌متره: brv_khmt → SummaryBoq */
export const SUMMARY_BOQ_FIELD_MAP = {
  code: "kmt_cofh",
  quantityTotal: "kmt_sumt",
  detailRef: "kmt_nagl_rzmt",
} as const;

/** برگه مالی: brv_bgml → FinancialSheetItem */
export const FINANCIAL_FIELD_MAP = {
  code: "bgm_cofh",
  quantity: "bgm_qust", // مقدار صورت‌وضعیت
  totalAmount: "bgm_pcst", // مبلغ کل
  chapterCode: "bgm_coac",
} as const;

// ─────────────────────────────────────────────────────────────
//  کمک‌تابع‌ها
// ─────────────────────────────────────────────────────────────

/** فهرست جدول‌هایی که باید normalize شوند */
export function normalizedTables(): TexsaTableInfo[] {
  return Object.values(TEXSA_TABLES).filter((t) => t.normalized);
}

/** جدول‌های یک دامنه */
export function tablesByDomain(domain: TexsaDomain): TexsaTableInfo[] {
  return Object.values(TEXSA_TABLES).filter((t) => t.domain === domain);
}

/** نام XML → اطلاعات جدول */
export function tableInfo(xmlName: string): TexsaTableInfo | undefined {
  return TEXSA_TABLES[xmlName];
}

/** افزودن پیشوند tx_ به نام ستون XML برای دسترسی به فیلد mirror در Prisma */
export function toMirrorField(xmlColumn: string): string {
  return `tx_${xmlColumn}`;
}

export const TEXSA_FILE_FACTS = {
  root: "NewDataSet",
  totalTables: 45,
  totalRows: 78988,
  texsaVersion: "14.0.5",
  project: {
    name: "اجرای سازه ساختمان پارکینگ شرقی پروژه مجموعه آموزشی و فناوری خاتم",
    employer: "دانشگاه خاتم",
    consultant: "مهندسین مشاور شارستان",
    contractor: "شرکت سیوان تدبیر تجارت",
    contractNo: "C-KH-03-052",
    contractAmount: 3309443989166,
    priceListYear: 1403,
  },
} as const;
