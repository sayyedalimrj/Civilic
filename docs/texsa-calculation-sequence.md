# توالی محاسباتی و جریان داده‌ی تکسا (Texsa Calculation Sequence)

> مبنا: تحلیل مجدد فایل واقعی `Important project.svzt` (root `NewDataSet`، ۴۵ جدول، ۷۸٬۹۸۸ ردیف — بدون تغییر نسبت به تحلیل قبلی). این سند «قرارداد سازگاری» محاسباتی است و باید پیش از پیاده‌سازی صورت‌وضعیت/متره/تعدیل/رسیدگی رعایت شود.

## ۰. کلیدهای مشترک و مفهوم «لایه‌ی طرف» (مهم‌ترین کشف)
تقریباً همه‌ی جدول‌های `brv_*` این کلیدها را دارند:

| کلید | معنی |
|---|---|
| `*_link_proj` | ارجاع به پیمان/پروژه (در این فایل = `11`) |
| `*_nusv` | شماره‌ی صورت‌وضعیت/نسخه (period) |
| `*_type` | **لایه‌ی طرف**: `0`=پیمانکار، `1`=ناظر، `2`=مشاور، `4`=کارفرما (مطابق `base_PersonalityTyp`) |
| `*_nusv_previous` / `*_type_previous` | زنجیره به نسخه/لایه‌ی قبلی |
| `*_cofh` | کد فهرست‌بها (مثل `060102`) |
| `*_nufh` | شماره‌ی فهرست | `*_nuse` | شماره‌ی فصل | `*_coac` | کد فعالیت |

**نتیجه‌ی کلیدی:** تکسا خودش رسیدگی ردیفی را با بُعد `_type` ذخیره می‌کند — هر طرف (پیمانکار/مشاور/کارفرما) نسخه‌ی `_type` خودش از همان ردیف را دارد. مثلاً `brv_ahta` هم `ata_type=0` (پیمانکار) و هم `ata_type=1` (مشاور) دارد. پس **لایه‌های redline در Civilic مستقیماً به بُعد `_type` تکسا نگاشت می‌شوند** و `*_nusv_previous`/`*_type_previous` همان `previousReviewId` بومی است. این مبنای حفظ سازگاری در رسیدگی است.

نگاشت Civilic ↔ تکسا:
```
partyType CONTRACTOR  <-> texsa _type = 0
partyType CONSULTANT  <-> texsa _type = 1 یا 2 (ناظر/مشاور)
partyType EMPLOYER    <-> texsa _type = 4
reviewStage/period     <-> _nusv
previousReviewId       <-> (_nusv_previous, _type_previous)
```

## جریان محاسباتی (به ترتیب)

### ۱) پیمان / پروژه — `brv_contract`
ریشه‌ی همه‌چیز (یک ردیف، ۱۶۱ ستون). مبلغ پیمان `ctc_pric_prim`، سال فهرست `ctc_yrfh`، تجهیز `ctc_pctj`، ضرایب پیش‌فرض، نام طرفین (`ctc_nmci`/`ctc_nmcs`/`ctc_neza`/`ctc_nmct`). همه‌ی `*_link_proj` به `ctc_id`/`ctc_rad` (=۱۱) وصل می‌شوند.

### ۲) طرفین / انواع شخصیت — `base_PersonalityTyp` + `brv_type`
`base_PersonalityTyp` انواع را تعریف می‌کند (پیمانکار/ناظر/مشاور/مدیرطرح/کارفرما/پیمان رسیدگی/بهره‌بردار). `brv_type` طرفین این پروژه را با `typ_PertypId` به این نوع‌ها وصل و رنگ/امضا را مشخص می‌کند → مبنای **لایه‌ی طرف** و **رنگ طرف** در UI.

### ۳) فهرست‌بها، فصول و ضرایب — `brv_fhpy`, `brv_mult`, `brv_grop`
- `brv_fhpy` (۱۸۳): جمع‌بندی فصول (`fhp_nufh` = شماره فهرست). جمع ریالی هر فصل/فهرست.
- `brv_mult` (۶٬۷۰۵، ۱۹۸ ستون): تعریف فصل‌ها (`mlt_name` مثل «عملیات تخریب و برچیدن») و **ضرایب** (`mlt_plmu*`: منطقه/طبقات/ارتفاع/سختی...). مبنای ضرایب زنجیره‌ای برگه‌ی مالی.
- `brv_grop` (۱٬۸۳۰): گروه‌بندی اقلام (`grp_grop` مثل «آجر سیمانی»، `grp_nufh`).

### ۴) اقلام فهرست‌بها — `brv_fhbh`
۵٬۱۱۶ ردیف. `fbh_cofh` (کد)، `fbh_desc` (شرح)، `fbh_unit` (واحد)، `fbh_pcun` (بهای واحد)، `fbh_astr` (ستاره‌دار/قیمت جدید). مرجع قیمت همه‌ی محاسبات.

### ۵) ریزمتره — `brv_rzmt`
۸٬۵۵۱ ردیف. هر ردیف: `rmt_cofh`, ابعاد (`rmt_tool`/`rmt_arz`/`rmt_heit`/`rmt_numo`) و **مقدار محاسبه‌شده** `rmt_summ`، فرمول‌ها (`*_fmul`). `rmt_link_mog` → گروه/صورت‌جلسه در `brv_mogs`. کلیدِ لایه: `rmt_nusv`/`rmt_type`.
**جریان:** فرمول/ابعاد → `rmt_summ` (مقدار ردیف).

### ۶) خلاصه‌متره — `brv_khmt`
۷٬۷۲۶ ردیف. تجمیع ریزمتره بر اساس کد: `kmt_cofh`, `kmt_sumt` (جمع)، و `kmt_nagl_rzmt` (منتقل‌شده از ریزمتره). 
**جریان:** `brv_rzmt.rmt_summ` (group by `cofh`,`nufh`,`nuse`,`nusv`,`type`) → `brv_khmt.kmt_sumt`.

### ۷) برگه‌ی مالی — `brv_bgml` (+ `brv_mult`)
۲٬۱۲۲ ردیف. `bgm_cofh`, `bgm_qust` (مقدار این صورت‌وضعیت)، `bgm_pcst` (مبلغ)، `bgm_qufz`/`bgm_pcfz` (تجمعی/فاز). 
**جریان:** `kmt_sumt × fbh_pcun × ضرایب(brv_mult)` → `bgm_pcst`. نمونه‌ی واقعی: کد ۰۶۰۱۰۲ → مقدار ۱۱۲٫۹۵ × بهای واحد ⇒ `bgm_pcst = 126,504,000`.

### ۸) صورت‌وضعیت — `brv_type_situ` + `brv_situ` + `BaseSituNoe`
- `brv_type_situ` (۳۳): دوره‌ها. `tst_nusv` (شماره دوره)، `tst_type` (لایه)، `tst_mbsv` (مبلغ صورت‌وضعیت)، `tst_PishPardakht`، `tst_nusv_previous` (زنجیره‌ی دوره‌ها)، `tst_is_locked`.
- `brv_situ` (۲۱): `stu_StnId` → `BaseSituNoe` (موقت/ماقبل قطعی/قطعی)، `stu_numb`.
**جریان:** جمع `brv_bgml.bgm_pcst` برای هر `nusv` → `tst_mbsv` (ناخالص صورت‌وضعیت).

### ۹) کسورات — `brv_kosorat` (+ `brv_Tadilkosorat`)
۳۶۰ ردیف. `ksr_nusv`/`ksr_type`، `ksr_name` (بیمه/مالیات/حسن انجام...)، `ksr_prcn` (درصد)، `ksr_price` (مبلغ)، `ksr_PlusOrMinec`. 
**جریان:** روی ناخالص صورت‌وضعیت اعمال → خالص قابل پرداخت.

### ۱۰) تعدیل — `brv_intp` (دوره شاخص) + `brv_ahta` (ردیف تعدیل)
- `brv_intp` (۷): دوره‌های شاخص. `itp_year`/`itp_prod` (سه‌ماهه)، `itp_type` (لایه‌ی طرف).
- `brv_ahta` (۷۸۱): تعدیل به تفکیک فصل. `ata_nufh_name` (فصل/ابنیه)، `ata_shbs` (شاخص مبنا)، `ata_shnw` (شاخص دوره)، `ata_pcoz` (مبلغ مبنا/قدیم)، `ata_pcnw` (مبلغ نو). دارای `ata_type=0` و `ata_type=1` → نسخه‌ی پیمانکار و مشاور.
**جریان:** `مبلغ تعدیل = pcnw × (shnw/shbs − 1) × (۱±ضرایب)`؛ مبنا = مبلغ کارکرد صورت‌وضعیت **تأییدشده**.

### ۱۱) حمل و مصالح — `brv_hmpy`/`brv_hmbs`/`brv_dstb`/`brv_dstn_*`/`brv_sorc*`/`brv_nmmhb`
حمل (بر اساس مسافت `brv_dstn_main`/`brv_dstn_fromto` و ضرایب `brv_dstb`) و مصالح پای‌کار. این‌ها در Civilic فقط حفظ (raw-preserved) و تحت «پیشرفته» نمایش داده می‌شوند.

### ۱۲) فعالیت‌ها — `brv_acts`
زمان‌بندی/WBS (اختیاری).

### ۱۳) خروجی — بازسازی `NewDataSet`
ترکیب ردیف‌های خام حفظ‌شده + تغییرات Civilic طبق export strategy → XML سازگار با حفظ ترتیب جدول/ردیف/ستون.

## نمودار وابستگی (مبنای dependency-engine)
```
CONTRACT
  └─ PRICE_LIST (brv_fhbh) + COEFFICIENTS (brv_mult)
        └─ MEASUREMENT_DETAIL (brv_rzmt)
              └─ MEASUREMENT_SUMMARY (brv_khmt)        [group by cofh]
                    └─ FINANCIAL_SHEET (brv_bgml)      [× pcun × ضرایب]
                          └─ PAYMENT_CERTIFICATE (brv_type_situ)  [Σ bgm_pcst]
                                ├─ DEDUCTION (brv_kosorat)
                                └─ ADJUSTMENT (brv_ahta + brv_intp)  [مبنا: کارکرد تأییدشده]
                                      └─ EXPORT (NewDataSet)
```
قاعده: تغییر هر مرحله، مراحل پایین‌دست را `STALE`/`NEEDS_REVIEW` می‌کند (مگر `LOCKED`). مقدار «مؤثر» هر ردیف از آخرین لایه‌ی معتبر (`_type` بالاترین طرفِ تأییدکننده در مرحله‌ی جاری) گرفته می‌شود.

## نگاشت round-trip (خلاصه)
| تکسا | مرحله‌ی Civilic |
|---|---|
| `brv_rzmt` | MeasurementDetail |
| `brv_khmt` | MeasurementSummary |
| `brv_bgml`/`brv_mult` | FinancialSheet / PaymentCertificateItem |
| `brv_type_situ`/`brv_situ` | PaymentCertificate |
| `brv_kosorat` | Deduction |
| `brv_ahta`/`brv_intp` | Adjustment |
| `_type` dimension | Review layer (CONTRACTOR/CONSULTANT/EMPLOYER) |
