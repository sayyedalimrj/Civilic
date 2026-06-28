# تحلیل فایل واقعی تکسا — `Important project.svzt`

> این سند نتیجه‌ی تحلیلِ **امن و streaming** فایل واقعی تکسا است. فایل ~۷۱ مگابایت، یک XML با ریشه‌ی `NewDataSet` (نه zip) است. تحلیل با `xml.etree.ElementTree.iterparse` و پاک‌سازی عناصر (`elem.clear()`) انجام شد تا مصرف حافظه پایین بماند؛ هیچ روش memory-heavy استفاده نشد. اسکریپت: `.zscripts/analyze_svzt.py`. خروجی ماشینی: `src/lib/texsa/generated-schema.json`. نگاشت معنایی: `src/lib/texsa/table-map.ts`.

## خلاصه

| مورد | مقدار |
|---|---|
| اندازه فایل | ~۷۱ MB (74,032,215 بایت) |
| ریشه XML | `NewDataSet` |
| نسخه تکسا | `14.0.5` |
| تعداد جدول | **۴۵** |
| تعداد کل ردیف | **۷۸٬۹۸۸** |

## مشخصات پروژه واقعی (از `brv_contract`)

| فیلد | مقدار |
|---|---|
| نام پروژه (`ctc_nmpj`) | اجرای سازه ساختمان پارکینگ شرقی پروژه مجموعه آموزشی و فناوری خاتم |
| کارفرما (`ctc_nmci`) | دانشگاه خاتم |
| مشاور (`ctc_nmcs` / `ctc_neza`) | شارستان / مهندسین مشاور شارستان |
| پیمانکار (`ctc_nmct`) | شرکت سیوان تدبیر تجارت |
| شماره پیمان (`ctc_numb`) | C-KH-03-052 |
| مبلغ اولیه پیمان (`ctc_pric_prim`) | ۳٬۳۰۹٬۴۴۳٬۹۸۹٬۱۶۶ ﷼ |
| تجهیز کارگاه (`ctc_pctj`) | ۱۲۷٬۲۸۶٬۳۰۷٬۲۷۶ ﷼ |
| محل اجرا (`ctc_plpj`) | پردیس- دانشگاه خاتم |
| سال فهرست‌بها (`ctc_yrfh`) | ۱۴۰۳ |
| سال شاخص مبنا (`ctc_ShEb_Yr`) | ۱۳۸۶ |
| تاریخ شروع/تحویل (`ctc_dtct`/`ctc_dtst`) | ۱۴۰۳/۰۴/۰۱ — ۱۴۰۳/۰۴/۳۰ |
| تاریخ خاتمه (`ctc_dend`) | ۱۴۰۴/۰۹/۳۰ |

> نکته: فیلد `ctc_pic_arm` یک تصویر آرم به‌صورت base64 (JPEG) دارد؛ در normalize نادیده گرفته می‌شود اما در mirror/rawJson حفظ می‌ماند.

## انواع شخصیت طرفین (از `base_PersonalityTyp`)

| pty_id | نام | نگاشت نوع سازمان محصول |
|---|---|---|
| 0 | پیمانکار | CONTRACTOR |
| 1 | ناظر | CONSULTANT |
| 2 | مشاور | CONSULTANT |
| 3 | مدیرطرح | EMPLOYER |
| 4 | کارفرما | EMPLOYER |
| 5 | پیمان رسیدگی | CONSULTANT |
| 6 | بهره بردار | INTERNAL |

## تمام جدول‌ها به ترتیب تعداد ردیف

| ردیف | ستون | جدول | دامنه |
|---:|---:|---|---|
| 28,652 | 11 | brv_dstn_main_rzmt | حمل/مسافت |
| 8,551 | 37 | brv_rzmt | **ریزمتره** |
| 7,726 | 22 | brv_khmt | **خلاصه‌متره** |
| 6,705 | 198 | brv_mult | **برگه مالی (ضرایب/فصل)** |
| 5,116 | 29 | brv_fhbh | **فهرست‌بها** |
| 4,411 | 12 | brv_ader | ادرس/ارجاع ردیف |
| 3,382 | 12 | brv_hmpy_rzmt | حمل ریزمتره |
| 2,122 | 32 | brv_bgml | **برگه مالی** |
| 1,830 | 10 | brv_grop | گروه‌بندی حمل/فصل |
| 1,802 | 3 | base_unit | واحدها |
| 1,297 | 16 | brv_dstb | ضرایب مسافت |
| 1,000 | 5 | BaseBarcode | بارکد |
| 960 | 10 | brv_dstn_main | مسافت اصلی |
| 954 | 14 | brv_mogs | **گروه‌های صورت‌جلسه** |
| 781 | 46 | brv_ahta | **تعدیل به تفکیک فصل** |
| 757 | 18 | brv_hmbs | حمل بر اساس صورت‌وضعیت |
| 711 | 11 | brv_hmpy | حمل پروژه |
| 360 | 10 | brv_kosorat | **کسورات** |
| 203 | 3 | base_acts_unit | واحد فعالیت |
| 192 | 9 | brv_Tadilkosorat | **کسورات تعدیل** |
| 186 | 9 | brv_Jobrankosoorat | کسورات جبرانی |
| 186 | 9 | brv_Arzkosoorat | کسورات ارزی |
| 183 | 286 | brv_fhpy | **جمع‌بندی فصول** |
| 155 | 12 | brv_sorc_all | منابع مصالح |
| 155 | 9 | brv_sorc | منابع مصالح پروژه |
| 155 | 15 | brv_nmmhb | نمونه مصالح |
| 122 | 30 | brv_acts | فعالیت‌ها (WBS) |
| 122 | 16 | brv_dstn_fromto | مسافت مبدا/مقصد |
| 66 | 17 | brv_dstn_fromto_rzmt | مسافت ریزمتره |
| 33 | 41 | brv_type_situ | **دوره‌های صورت‌وضعیت** |
| 21 | 6 | brv_situ | **صورت‌وضعیت‌ها** |
| 18 | 3 | base_zrtj | ضرایب تجهیز |
| 16 | 6 | brv_color | رنگ‌ها |
| 13 | 2 | Base_Months | ماه‌ها |
| 8 | 3 | base_tyun | نوع واحد |
| 7 | 5 | base_PersonalityTyp | **انواع شخصیت** |
| 7 | 24 | brv_intp | **دوره‌های تعدیل/شاخص** |
| 6 | 5 | Base_ItemType | انواع آیتم |
| 4 | 2 | base_TajhzType | انواع تجهیز |
| 3 | 3 | BaseSituNoe | **انواع وضعیت (موقت/قطعی)** |
| 3 | 2 | base_IntpVaziat | وضعیت تعدیل |
| 3 | 11 | brv_type | **طرفین پروژه** |
| 2 | 2 | base_ShakhesType | انواع شاخص |
| 1 | 161 | brv_contract | **مشخصات پیمان** |
| 1 | 5 | brv_elhagh | الحاقیه |

## جدول‌های کلیدی و نگاشت محصول

| جدول تکسا | مفهوم محصول | مدل/ViewModel هدف |
|---|---|---|
| `brv_contract` | مشخصات پیمان و پروژه | `Project` + `ProjectParty` |
| `brv_type` + `base_PersonalityTyp` | طرفین و نقش‌ها | `ProjectParty` / `Organization` |
| `brv_fhbh` | فهرست‌بها | `PriceList` + `PriceListItem` |
| `brv_rzmt` | ریزمتره | `DetailBoq` |
| `brv_khmt` | خلاصه‌متره | `SummaryBoq` |
| `brv_mogs` | گروه‌های صورت‌جلسه/مقطع | گروه‌بندی متره |
| `brv_bgml` / `brv_mult` / `brv_fhpy` | برگه مالی و فصول | `FinancialSheetItem` + `Chapter` |
| `brv_type_situ` / `brv_situ` / `BaseSituNoe` | صورت‌وضعیت‌ها | `Payment` |
| `brv_kosorat` / `brv_Tadilkosorat` | کسورات | پارامتر کسورات روی `Payment` |
| `brv_ahta` / `brv_intp` | تعدیل و شاخص | `AdjustmentReportRow` |
| `brv_*haml*` / `brv_dstn*` | حمل و مسافت | داخل برگه مالی (پیشرفته) |
| `brv_sorc*` / `brv_nmmhb` | مصالح | مصالح پای‌کار (پیشرفته) |
| `brv_acts` | زمان‌بندی | (اختیاری/آینده) |

نگاشت دقیق ستون‌ها در `src/lib/texsa/table-map.ts` تعریف شده است.

## قواعد import/normalize

1. **حفظ خام:** تمام ۴۵ جدول در mirror tables با پیشوند `tx_` + `rawJson` ذخیره می‌شوند (round-trip).
2. **Normalize:** جدول‌های علامت‌خورده با `normalized:true` در `table-map.ts` به ViewModel محصول تبدیل می‌شوند.
3. **پنهان‌سازی:** نام جدول‌های `brv_*` در UI اصلی نمایش داده نمی‌شود؛ فقط در `تنظیمات > پیشرفته > داده خام تکسا`.
4. **حجم بالا:** به‌دلیل وجود جدول‌های بزرگ (۲۸ هزار ردیف مسافت، ۸.۵ هزار ریزمتره)، import باید batch و ترجیحاً streaming باشد؛ برای محیط production (Vercel) آپلود مستقیم فایل ۷۱MB در function ممکن است محدودیت داشته باشد و باید از storage + پردازش پس‌زمینه استفاده شود.

## نحوه‌ی بازتولید این تحلیل

```bash
python3 .zscripts/analyze_svzt.py "Important project.svzt" "src/lib/texsa/generated-schema.json"
```
