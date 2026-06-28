# پرامپت بازطراحی کامل نسخه آنلاین تکسا

تو یک Senior Full-Stack Engineer و Product Architect هستی. باید پروژه دمو Next.js موجود را به یک نسخه آنلاین، فارسی، RTL، زیبا و کاملاً سازگار با خروجی نرم‌افزار تکسا/Texsa تبدیل کنی.

## اصل کلیدی

این پروژه دمو است و محدودیتی برای تغییر دیتابیس، مدل‌ها، seed، APIها و ساختار صفحات وجود ندارد. بنابراین حق نداری مدل فعلی را به‌زور حفظ کنی. دیتابیس را بر اساس ساختار واقعی تکسا بازطراحی کن.

هدف این نیست که فقط چند جدول تکسا را بخوانیم؛ هدف این است که سایت تمام بخش‌های تکسا را پشتیبانی کند و فایل `.svzt` را دقیقاً با همان فرم XML بخواند، ذخیره کند، نمایش دهد، و در آینده بتواند خروجی سازگار تولید کند.

## فایل‌های مرجع همراه این پرامپت

- `texsa_blank_template.svzt`: قالب خالی XML تکسا با root `NewDataSet` و تمام table/columnهای مشاهده‌شده.
- `texsa_schema_summary.json`: نقشه کامل جدول‌ها، ستون‌ها، تعداد رکورد فایل نمونه و نوع inferred برای UI.
- `texsa_table_map.md`: توضیح انسانی جدول‌ها و ستون‌ها.

فایل `.svzt` در واقع XML است، نه ZIP. فرمت کلی آن این است:

```xml
<?xml version="1.0" standalone="yes"?>
<NewDataSet>
  <brv_contract>
    <ctc_id>...</ctc_id>
    <ctc_nmpj>...</ctc_nmpj>
  </brv_contract>
  <brv_rzmt>
    <rmt_link_proj>...</rmt_link_proj>
    <rmt_nusv>...</rmt_nusv>
    <rmt_type>...</rmt_type>
  </brv_rzmt>
</NewDataSet>
```

هر child مستقیم زیر `NewDataSet` یک ردیف از یک جدول تکسا است. نام تگ همان نام جدول است و فرزندهای آن ستون‌های همان جدول هستند.

---

# فاز ۱ — بازطراحی دیتابیس حول تکسا

## تصمیم معماری اجباری

دیتابیس باید «Texsa-first» باشد، نه مدل ساده فعلی.

سه لایه بساز:

### ۱. لایه Mirror/Native تکسا

برای هر جدول موجود در `texsa_schema_summary.json` یک جدول دیتابیس بساز. نام واقعی جدول باید با تکسا قابل ردیابی باشد.

قانون بسیار مهم:
تمام ستون‌های XML را در دیتابیس به صورت `String?` یا `Text?` ذخیره کن، حتی اگر عدد یا بولین هستند. دلیل: خروجی تکسا باید دقیقاً قابل round-trip باشد و فرمت‌هایی مثل `0.0000`، تاریخ شمسی، کدهای صفر اول، و رشته‌های خاص از بین نرود.

برای هر table mirror این ستون‌های سیستمی را اضافه کن:

- `id` شناسه داخلی
- `importId`
- `rowOrder` ترتیب ردیف در فایل XML
- `createdAt`
- `updatedAt`
- `rawJson` برای حفظ کامل فیلدهای ناشناخته یا اضافه‌شده در نسخه‌های دیگر تکسا

ولی هنگام export به XML، ستون‌های سیستمی نباید خروجی داده شوند.

مثال الگو:

```prisma
model BrvContract {
  id        String   @id @default(cuid())
  importId String
  rowOrder Int

  ctc_id   String?
  ctc_nmpj String?
  ctc_yrfh String?
  // ... تمام ستون‌های brv_contract از schema summary

  rawJson   String @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("brv_contract")
  @@index([importId])
}
```

اگر Prisma schema بیش از حد بزرگ شد، می‌توانی مدل‌های mirror را با script از `texsa_schema_summary.json` تولید کنی. اما خروجی نهایی باید واقعاً تمام جدول‌ها و ستون‌ها را پشتیبانی کند، نه فقط جدول‌های محبوب.

### ۲. لایه Import/Export Metadata

مدل‌های زیر را اضافه کن:

```prisma
model TexsaImport {
  id               String   @id @default(cuid())
  originalFileName String
  fileSizeBytes    Int
  texsaVersion     String?
  projectCode      String?
  projectName      String?
  status           String   @default("PENDING") // PENDING | PARSING | READY | FAILED
  tableCountsJson  String   @default("{}")
  warningsJson     String   @default("[]")
  errorsJson       String   @default("[]")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model TexsaImportIssue {
  id        String   @id @default(cuid())
  importId  String
  severity  String   // INFO | WARNING | ERROR
  tableName String?
  rowOrder  Int?
  fieldName String?
  message   String
  rawJson   String   @default("{}")
  createdAt DateTime @default(now())

  @@index([importId])
  @@index([tableName])
}
```

### ۳. لایه UI Projection / View Model

برای UI لازم نیست همه چیز را جداگانه duplicate کنی. ViewModelها را با query/service از روی mirror tables بساز.

مثلاً:

- ProjectHeaderView از `brv_contract`
- PaymentView از `brv_type_situ`, `brv_situ`, `brv_bgml`, `brv_kosorat`
- DetailBoqView از `brv_rzmt`, `brv_fhbh`, `brv_mogs`, `brv_grop`
- AdjustmentView از `brv_ahta`, `brv_intp`, `brv_Tadilkosorat`
- TransportView از `brv_hmpy`, `brv_hmbs`, `brv_dstb`, `brv_dstn_*`

مبالغ محاسبه‌شده تکسا را در نسخه اول source of truth بگیر. موتور محاسبات جدید بعداً باید با تکسا validate شود، نه اینکه در همین مرحله فرمول‌ها را بازنویسی کند و اختلاف بسازد.

---

# فاز ۲ — Parser واقعی فایل .svzt

API بساز:

- `POST /api/texsa/import/preview`
- `POST /api/texsa/import/commit`
- `GET /api/texsa/imports`
- `GET /api/texsa/imports/[id]`
- `GET /api/texsa/imports/[id]/tables`
- `GET /api/texsa/imports/[id]/tables/[tableName]`
- `GET /api/texsa/imports/[id]/raw-row/[rowId]`

قواعد parser:

1. runtime باید `nodejs` باشد، نه edge.
2. فایل `.svzt` را XML بدان.
3. root باید `NewDataSet` باشد.
4. هر element مستقیم زیر root یک row است.
5. نام element همان `tableName` است.
6. تمام child elementها ستون هستند.
7. rowOrder را بر اساس ترتیب واقعی فایل ذخیره کن.
8. برای جدول‌های بزرگ batch insert انجام بده.
9. فایل‌های حداقل ۲۰۰MB را با streaming parser مدیریت کن.
10. هر ستون ناشناخته نسبت به schema summary باید هم در rawJson ذخیره شود هم در issue با severity INFO ثبت شود.
11. اگر table ناشناخته بود، باز هم حذف نکن؛ در generic raw table یا rawJson نگه دار.
12. خطای یک row نباید کل import را نابود کند مگر XML کلاً invalid باشد.

پکیج پیشنهادی برای Node:

- `saxes` یا `fast-xml-parser` با احتیاط حافظه
- برای فایل‌های بزرگ، `saxes` streaming ترجیح دارد.

---

# فاز ۳ — UI ایمپورت تکسا

یک صفحه بسیار حرفه‌ای بساز:

`/texsa/import`

ویژگی‌ها:

1. Drag & Drop شیک برای فایل `.svzt`
2. تشخیص سریع اینکه فایل XML تکساست
3. Progress چندمرحله‌ای:
   - انتخاب فایل
   - خواندن ساختار
   - اعتبارسنجی root
   - شمارش جدول‌ها
   - ذخیره mirror tables
   - آماده‌سازی UI views
4. Preview قبل از commit:
   - نام پروژه از `ctc_nmpj`
   - کارفرما از `ctc_nmci`
   - پیمانکار از `ctc_nmct`
   - مشاور/ناظر از `ctc_nmcs` یا `ctc_neza`
   - سال فهرست‌بها از `ctc_yrfh`
   - مبلغ اولیه پیمان از `ctc_pric_prim`
   - نسخه از `Version`
   - تعداد جدول‌ها
   - تعداد کل رکوردها
   - تعداد رکوردهای مهم: ریزمتره، خلاصه متره، برگه مالی، آیتم فهرست‌بها، صورت‌وضعیت، تعدیل، حمل، مصالح
5. جدول شمارش رکوردها با search و sort
6. کارت هشدارها
7. دکمه `ورود کامل اطلاعات تکسا`
8. بعد از import، انتقال به داشبورد همان پروژه.

---

# فاز ۴ — ساختار UI پروژه دقیقاً بر اساس بخش‌های تکسا

داشبورد پروژه باید modern enterprise باشد، اما منطق آن باید دقیقاً حول تکسا باشد.

## منوی اصلی پیشنهادی پروژه

1. نمای کلی پیمان
2. طرفین و مشخصات قرارداد
3. فهرست‌بها و آیتم‌ها
4. فصول و ضرایب
5. ریزمتره
6. خلاصه متره
7. برگه مالی
8. صورت‌وضعیت‌ها
9. تعدیل
10. کسورات
11. حمل و مسافت
12. منابع و مصالح
13. فعالیت‌ها / برنامه زمانی
14. اسناد و پیوست‌ها
15. گزارش‌ها و چاپ
16. داده خام تکسا
17. اعتبارسنجی و مغایرت‌ها

### نمای کلی پیمان

منبع: `brv_contract`

نمایش:
- نام پروژه
- کد پروژه
- سال فهرست‌بها
- کارفرما
- پیمانکار
- مشاور/ناظر
- محل پروژه
- مبلغ اولیه پیمان
- تاریخ‌ها و مدت پیمان
- وضعیت قفل
- تنظیمات گردکردن و نمایش اعداد
- تنظیمات محاسباتی که در ctc_* آمده‌اند

### فهرست‌بها و آیتم‌ها

منبع: `brv_fhpy`, `brv_fhbh`, `base_unit`, `Base_ItemType`

نمایش:
- رشته‌ها
- فصول
- کد آیتم `fbh_cofh`
- شرح کامل `fbh_desc`
- شرح کوتاه `fbh_abst`
- واحد `fbh_unit`
- قیمت واحد `fbh_pcun`
- آیتم ستاره‌دار/فاکتوری/آنالیز شده
- جستجوی سریع بر اساس کد و شرح

### فصول و ضرایب

منبع: `brv_mult`, `brv_fhpy`, `brv_grop`

نمایش:
- ساختار فصل‌ها
- ضرایب منطقه‌ای، ارتفاع، طبقات، صعوبت، بالاسری، تجهیز کارگاه، ۷۰٪، سایر ضرایب
- snapshot ضرایب در هر `nusv/type`
- مبلغ قبل/بعد ضریب اگر در تکسا موجود است

### ریزمتره

منبع: `brv_rzmt`, `brv_fhbh`, `brv_mogs`, `brv_grop`

نمایش:
- انتخاب `nusv/type`
- گروه‌بندی بر اساس رشته، فصل، کد آیتم، موقعیت/عامل، گروه
- ستون‌های اصلی:
  - ردیف
  - کد آیتم
  - شرح آیتم
  - شرح ریزمتره/موقعیت
  - تعداد `rmt_numo`
  - طول `rmt_tool`
  - عرض `rmt_arz`
  - ارتفاع `rmt_heit`
  - وزن `rmt_weit`
  - جمع جزء `rmt_sumj`
  - جمع کل/مقدار نهایی `rmt_sumt` و `rmt_summ`
  - فرمول‌ها `*_fmul`
- جدول باید virtualized/paginated باشد.
- ادیت inline فقط با حفظ raw field انجام شود.

### خلاصه متره

منبع: `brv_khmt`

نمایش:
- تجمیع ریزمتره برای هر آیتم
- مقایسه با جمع واقعی ریزمتره
- نشان دادن مغایرت‌ها
- اتصال به `brv_rzmt` برای drill-down

### برگه مالی

منبع: `brv_bgml`, `brv_fhbh`, `brv_khmt`

نمایش:
- کد آیتم
- شرح
- واحد
- مقدار برآورد/اجرا `bgm_quan`, `bgm_qust`, `bgm_qufz`, `bgm_qukh`
- قیمت واحد/مبلغ `bgm_pcal`, `bgm_pcst`, `bgm_pcfz`, `bgm_pckh`
- آیتم آنالیزشده/ستاره‌دار
- مبلغ کل همانطور که تکسا داده

### صورت‌وضعیت‌ها

منبع: `brv_type_situ`, `brv_situ`, `BaseSituNoe`, `brv_bgml`, `brv_kosorat`

نمایش:
- لیست صورت‌وضعیت‌ها بر اساس `tst_nusv`, `tst_type`
- نوع: موقت/ماقبل قطعی/قطعی
- تاریخ جاری و قبلی
- وضعیت قفل
- مبلغ صورت‌وضعیت
- مبلغ قبلی
- جمع ناخالص
- کسورات
- خالص پرداختی
- امکان ورود به جزئیات ردیف‌های مالی همان دوره

### تعدیل

منبع: `brv_intp`, `brv_ahta`, `brv_Tadilkosorat`

نمایش:
- دوره تعدیل
- شاخص مبنا و کارکرد
- رشته/فصل
- مبلغ مشمول/غیرمشمول
- مبلغ بدون بالاسری/با بالاسری
- تعدیل مثبت/منفی
- کسورات تعدیل
- مقایسه دوره‌ها

### حمل و مسافت

منبع: `brv_hmpy`, `brv_hmpy_rzmt`, `brv_hmbs`, `brv_dstn_main`, `brv_dstn_main_rzmt`, `brv_dstb`, `brv_dstn_fromto`, `brv_dstn_fromto_rzmt`

نمایش:
- آیتم‌های حمل
- مسافت اصلی
- از/تا
- بازه‌های کیلومتری
- فرمول `dsf_Formul` اگر وجود دارد
- ارتباط با ریزمتره و آیتم فهرست‌بها

### منابع و مصالح

منبع: `brv_sorc_all`, `brv_sorc`, `brv_nmmhb`

نمایش:
- فهرست منابع/مصالح
- واحد
- نرخ نت/آمار/روز
- اتصال مصالح به آیتم‌ها
- مقدار، ضریب و نرخ

### فعالیت‌ها / برنامه زمانی

منبع: `brv_acts`, `base_acts_unit`

نمایش:
- ساختار درختی WBS با parent/level
- نام فعالیت
- واحد
- وزن
- مقدار برنامه/واقعی
- تاریخ شروع/پایان اگر موجود است
- گانت یا تایم‌لاین زیبا

### داده خام تکسا

این بخش اجباری است.

قابلیت‌ها:
- انتخاب tableName
- جستجو در همه ستون‌ها
- فیلتر بر اساس فیلدهای عمومی: `link_proj`, `nusv`, `type`, `nufh`, `nuse`, `cofh`, `rad`
- نمایش rawJson
- نمایش rowOrder
- export جدول به Excel/CSV
- کپی XML row

### اعتبارسنجی و مغایرت‌ها

بساز:
- تعداد ردیف‌های هر جدول نسبت به import
- ردیف‌های بدون کلید
- ردیف‌های با کد آیتم بدون شرح در `brv_fhbh`
- ریزمتره‌هایی که در خلاصه متره نیامده‌اند
- خلاصه متره‌هایی که در برگه مالی نیامده‌اند
- صورت‌وضعیت‌های بدون ردیف مالی
- تعدیل‌های بدون دوره شاخص
- رکوردهای حمل بدون آیتم مرتبط

---

# فاز ۵ — Export سازگار با تکسا

API بساز:

`GET /api/texsa/imports/[id]/export`

قواعد:

1. خروجی XML با declaration زیر باشد:

```xml
<?xml version="1.0" standalone="yes"?>
<NewDataSet>
...
</NewDataSet>
```

2. ترتیب tableها و columnها مطابق `texsa_schema_summary.json` باشد.
3. ستون‌های سیستمی دیتابیس خروجی داده نشوند.
4. مقادیر string دقیق حفظ شوند.
5. اگر کاربر فیلدی را در UI تغییر داده، همان فیلد XML باید تغییر کند.
6. جدول‌های ناشناخته یا فیلدهای ناشناخته از rawJson حفظ شوند.
7. فایل export شده پسوند `.svzt` داشته باشد.

---

# فاز ۶ — کیفیت UI/UX

UI باید واقعاً سطح بالا باشد، نه صرفاً جدول ساده.

الزامات:

- فارسی کامل و RTL
- اعداد با جداکننده هزارگان
- تاریخ شمسی
- جدول‌های بزرگ با pagination/virtualization
- search و filter سریع
- drill-down از خلاصه به جزئیات
- sticky header برای جدول‌ها
- ستون‌های قابل انتخاب/مخفی‌سازی
- export Excel برای هر بخش
- کارت‌های KPI برای مبالغ اصلی
- طراحی شبیه داشبورد مالی/مهندسی حرفه‌ای
- موبایل‌پذیر، ولی تمرکز اصلی desktop/tablet چون نرم‌افزار مهندسی است
- رنگ‌بندی رسمی و تمیز
- حالت compact برای جدول‌ها
- حفظ عملکرد با ۸۰ هزار ردیف و بیشتر

---

# فاز ۷ — حذف وابستگی به مدل دمو قبلی

مدل‌های قبلی مثل Project, DetailBoq, SummaryBoq, Payment و غیره اگر با تکسا ناسازگارند، یا حذفشان کن یا فقط به عنوان ViewModel نگه دار. منبع حقیقت باید mirror tables تکسا باشد.

Seed قبلی را پاک یا جدا کن. داده نمونه جدید باید از همین `texsa_blank_template.svzt` یا فایل واقعی import شود.

---

# معیار پذیرش نهایی

1. فایل واقعی `.svzt` با حجم حدود ۷۱MB بدون خطای حافظه import شود.
2. حداقل ۴۵ جدول شناسایی شود.
3. حدود ۷۸,۹۸۸ ردیف از فایل نمونه ذخیره شود.
4. table countها با `texsa_schema_summary.json` همخوان باشد.
5. اطلاعات پروژه واقعی در داشبورد نشان داده شود.
6. تمام بخش‌های اصلی تکسا در منو وجود داشته باشند.
7. هر بخش داده واقعی خودش را از mirror tableهای تکسا بخواند.
8. بخش «داده خام تکسا» برای همه جدول‌ها کار کند.
9. export XML معتبر با root `NewDataSet` تولید شود.
10. هیچ دیتایی هنگام import/edit/export حذف نشود.
11. TypeScript و build بدون error باشد.
12. `worklog.md` را با توضیح دقیق تغییرات آپدیت کن.

## اولویت اجرا

اگر زمان محدود بود، به ترتیب انجام بده:

1. تولید Prisma mirror schema از `texsa_schema_summary.json`
2. Import streaming فایل `.svzt`
3. Raw data explorer
4. داشبورد پروژه از `brv_contract`
5. ریزمتره
6. خلاصه متره
7. برگه مالی
8. صورت‌وضعیت
9. تعدیل
10. حمل و مصالح
11. Export XML

هیچ بخشی را نمایشی و fake نساز. اگر داده بخشی هنوز normalize/view نشده، همان raw data را با UI خوب نشان بده.
