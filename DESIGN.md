# سند طراحی معماری — پلتفرم SaaS متره و برآورد (جایگزین وب نرم‌افزار دسکتاپی «تکسا»)

> **نسخه:** 1.0
> **تاریخ:** ۱۴۰۴
> **محدوده:** معماری کامل یک اپلیکیشن وب چندمستاجره (Multi-Tenant SaaS) به زبان فارسی (RTL) برای متره و برآورد، صورت‌وضعیت‌نویسی و تعدیل پروژه‌های عمرانی.

---

## ۰. چکیده اجرایی

این سند معماری یک سیستم SaaS مدرن را توصیف می‌کند که جایگزین وب نرم‌افزار دسکتاپی «تکسا» می‌شود. سیستم روی **موتور محاسبات زنجیره‌ای** (Chained Computation Engine) بنا شده است؛ یعنی هر تغییر در یک مرحله از ورک‌فلو (مثلاً ریزمتره)، به‌صورت خودکار و سازگار در تمام مراحل بعدی (خلاصه‌متره، برگه مالی، فصول، صورت‌وضعیت و تعدیل) بازتاب داده می‌شود. چالش محوری، تضمین **یکپارچگی داده‌ها** (Consistency) در کنار **عملکرد بالا** (Performance) در فرم‌های سنگین مالی است.

---

## ۱. تکنولوژی استک (Tech Stack)

### ۱-۱. اصول راهبردی انتخاب
| اصل | توضیح |
|---|---|
| **محاسبات سنگین سمت سرور** | فرمول‌های بخشنامه ۴۹۵۱، آهن و سیمان، و آنالیز بها روی سرور اجرا می‌شوند تا از لگ فرانت‌اند جلوگیری شود. |
| **فرانت‌اند واکنشی و دسکتاپ‌گونه** | رابط کاربری با حس نرم‌افزار دسکتاپ (پنل‌های قابل تغییر اندازه، جدول‌های ویرایش‌پذیر سریع). |
| **یکپارچگی تراکنشی** | آپدیت‌های زنجیره‌ای در یک Transaction انجام می‌شوند تا از حالت‌های ناقص جلوگیری شود. |
| **RTL-First** | طراحی از پایه برای فارسی، نه ترجمه‌ی LTR. |

### ۱-۲. بک‌اند (Backend)
- **Next.js 16 (App Router)** — Server Actions و API Routes (Route Handlers).
- **TypeScript 5** — تایپ‌های End-to-End با Zod برای اعتبارسنجی ورودی‌ها.
- **Prisma ORM + SQLite** (در این پیش‌نمایش) — قابل ارتقا به PostgreSQL برای تولید. Prisma برای مدل‌سازی رابطه‌ای پیچیده‌ی پروژه ← ریزمتره ← برگه مالی ← صورت‌وضعیت ایده‌آل است.
- **موتور محاسبه (Calc Engine)** — یک لایه‌ی مستقل `src/lib/calc/` شامل توابع خالص (Pure Functions) برای: ضرایب، نزولی بها، آهن/سیمان، آنالیز، تعدیل. این لایه **قابل تست واحد** و **قابل استفاده مجدد** در APIها و Jobهای پس‌زمینه است.

### ۱-۳. فرانت‌اند (Frontend)
- **React 19 + Next.js 16** — App Router با Server Components برای بارگذاری اولیه و Client Components برای تعامل.
- **Tailwind CSS 4 + shadcn/ui (New York)** — سیستم کامپوننت یکپارچه و قابل سفارشی‌سازی.
- **TanStack Query v5** — مدیریت State سرور (Cache، Invalidation، Optimistic Update).
- **Zustand** — State محلی فرم‌های پیچیده (برگه مالی، ویزارد پروژه) برای جلوگیری از re-render سراسری.
- **TanStack Table v8** — جدول‌های ویرایش‌پذیر با امکان Virtualization برای هزاران ردیف ریزمتره.
- **Recharts** — نمودارهای پیشرفت و هزینه.
- **react-hook-form + Zod** — فرم‌های ویزاردی با اعتبارسنجی.
- **next-themes** — پشتیبانی از حالت روشن/تیره.
- **Framer Motion** — انیمیشن‌های ظریف.

### ۱-۴. زیرساخت موازی و زمان‌بندی
- **WebSocket (Socket.io)** در یک mini-service جداگانه — برای قفل‌گذاری رکوردها (Record Locking) و پخش تغییرات هم‌زمان بین کاربران.
- **Cron Jobs** — برای محاسبه‌ی مجدد پس‌زمینه‌ی پروژه‌های بزرگ و گزارش‌های زمان‌بندی‌شده.

---

## ۲. طراحی دیتابیس (ERD / Schema)

### ۲-۱. مدل چندمستاجرتی (Multi-Tenancy)
استراتژی: **Shared Database, Shared Schema with `tenantId`** — هر ردیف دارای `tenantId` است و در هر کوئری فیلتر می‌شود. این استراتژی برای SaaS با تعداد مستاجر متوسط بهینه است.

### ۲-۲. جداول کلیدی (به صورت متن)

```
┌─────────────────────────────────────────────────────────────┐
│ TENANT (سازمان/کارفرما)                                       │
│ id, name, logoUrl, letterheadUrl, createdAt                  │
│ signatures: JSON (ناظر/مدیر/پیمانکار)                         │
└─────────────────────────────────────────────────────────────┘
         │ 1
         │
         │ N
┌────────┴────────────────────────────────────────────────────┐
│ USER (کاربر)                                                  │
│ id, tenantId, email, name, role(ADMIN|ESTIMATOR|BILLER)      │
│ passwordHash, isActive, createdAt                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROJECT (پروژه)                                               │
│ id, tenantId, name, code, year, priceListId (→PriceList)     │
│ contractAmount (مبلغ اولیه پیمان), contractDate              │
│ status (DRAFT|ACTIVE|CLOSED)                                 │
│ assignedUserIds: JSON                                         │
└─────────────────────────────────────────────────────────────┘
         │ 1
         │
         │ 1 (پیمان و ضرایب به‌صورت JSON روی پروژه ذخیره می‌شوند)
┌────────┴────────────────────────────────────────────────────┐
│ PROJECT_COEFFICIENTS (ضرایب پروژه — JSON روی Project)         │
│ general (ضریب عمومی), regional (منطقه‌ای)                     │
│ altitude (ارتفاع), floors (طبقات), tunnelHardship (سختی تونل)│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DETAIL_BOQ (ریزمتره)                                          │
│ id, projectId, priceListItemId (→PriceList), code            │
│ description, unit, quantity (Decimal)                        │
│ lockedBy (userId — قفل هم‌زمانی), lockedAt                    │
└─────────────────────────────────────────────────────────────┘
         │ N
         │ (تجمیع بر اساس priceListItemId)
         │ 1
┌────────┴────────────────────────────────────────────────────┐
│ SUMMARY_BOQ (خلاصه متره — Materialized View/Computed)         │
│ id, projectId, priceListItemId, totalQuantity (مجموع ریز)    │
│ (این جدول به‌صورت واکنشی از DETAIL_BOQ محاسبه می‌شود)         │
└─────────────────────────────────────────────────────────────┘
         │ 1
         │
         │ 1
┌────────┴────────────────────────────────────────────────────┐
│ FINANCIAL_SHEET (برگه مالی)                                   │
│ id, projectId, summaryBoqId, unitPrice (Decimal)             │
│ isStarred (آیتم ستاره‌دار/قیمت جدید), relatedCode             │
│ totalAmount (محاسبه‌شده), reference (NET|STATS|DAILY)         │
│ analysis: JSON (نیرو/ماشین/مصالح/حمل)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CHAPTER (فصل) — توزیع مبالغ                                    │
│ id, projectId, chapterNo, title, amount, isWorkshopSetup     │
│ (تجهیز کارگاه با حالت‌های متنوع)                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PAYMENT (صورت‌وضعیت)                                           │
│ id, projectId, periodNo, status, createdAt                   │
│ totalExecutedAmount, guarantee, insurance, tax, netPayable   │
└─────────────────────────────────────────────────────────────┘
         │ 1
         │ N
┌────────┴────────────────────────────────────────────────────┐
│ PAYMENT_ITEM (ردیف صورت‌وضعیت)                                 │
│ id, paymentId, financialSheetId                              │
│ executedQuantity, executedPercent, executedAmount            │
│ adjustedAmount (بعد از اعمال شاخص تعدیل)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ داده‌های پایه مرجع (Reference Data)                            │
│                                                               │
│ PRICE_LIST (فهرست بها): id, year, discipline(ابنیه|راه|...)  │
│ PRICE_LIST_ITEM: id, priceListId, code, title, unit, price   │
│                                                               │
│ INDEX (شاخص): id, year, season, discipline, value            │
│                                                               │
│ COEFFICIENT (ضرایب منطقه‌ای/پایه): id, year, discipline, type  │
│                                                               │
│ DISTANCE (مسافت): id, fromCity, toCity, km                   │
│                                                               │
│ MATERIAL_RATE (نرخ مصالح): id, materialId, source(NET|...)    │
│                           year, rate, wasteFactor (ضریب پرت) │
└─────────────────────────────────────────────────────────────┘
```

### ۲-۳. نحوه‌ی ذخیره‌سازی ضرایب (نکته‌ی کلیدی)
ضرایب به دو دسته تقسیم می‌شوند:
1. **ضرایب پروژه (Project-level):** روی رکورد پروژه به‌صورت JSON ذخیره می‌شوند (عمومی، منطقه‌ای، ارتفاع، طبقات، سختی تونل). این ضرایب **immutable** در طول عمر پروژه‌اند مگر با بازنگری رسمی.
2. **ضرایب مرجع (Reference-level):** در جداول جداگانه با `(year, discipline)` به‌عنوان کلید ترکیبی یکتا — مانند ضرایب پرت مصالح (۱.۰۶ سیمان) و کسورات قانونی (تضمین ۵٪، بیمه ۲٪، مالیات ۵٪).

---

## ۳. معماری API و State Management

### ۳-۱. ۵ نمونه API کلیدی ورک‌فلو (REST)

| # | متد | مسیر | توضیح | پاسخ زنجیره‌ای |
|---|---|---|---|---|
| **۱** | `POST` | `/api/projects` | ایجاد پروژه با ضرایب اولیه | — |
| **۲** | `PUT` | `/api/projects/{id}/detail-boq/{itemId}` | ویرایش ریزمتره (با قفل) | محاسبه‌ی مجدد خلاصه‌متره، برگه مالی، فصول و صورت‌وضعیت |
| **۳** | `PUT` | `/api/financial-sheet/{id}` | ویرایش قیمت/آنالیز برگه مالی | بازمحاسبه فصول و مبلغ صورت‌وضعیت آینده |
| **۴** | `POST` | `/api/projects/{id}/payments/{period}/items` | ثبت درصد اجرا برای صورت‌وضعیت | محاسبه‌ی مبلغ، کسر کسورات، و مبلغ قابل پرداخت |
| **۵** | `POST` | `/api/projects/{id}/adjustment` | اعمال شاخص تعدیل روی زیرفصل‌ها | به‌روزرسانی `adjustedAmount` ردیف‌های صورت‌وضعیت |

**مثال payload برای API #۲:**
```json
{
  "quantity": 1250.5,
  "description": "挖掘 پی با عمق تا ۱.۵ متر"
}
```
**پاسخ (با `X-Cascade-Update` header):**
```json
{
  "detail": { "id": "...", "quantity": 1250.5 },
  "cascade": {
    "summaryBoqUpdated": true,
    "financialSheetTotal": 458932500,
    "chaptersUpdated": 3,
    "paymentImpact": { "period": 2, "deltaAmount": 12500 }
  }
}
```

### ۳-۲. استراتژی State Management در فرانت‌اند

برای جلوگیری از **لگ در فرم‌های پیچیده برگه مالی** (که ممکن است هزاران ردیف داشته باشد):

```
┌──────────────────────────────────────────────────────────┐
│ لایه ۱: Server State (TanStack Query)                    │
│  - کش داده‌ی برگه مالی، invalidation هوشمند               │
│  - optimistic update برای ویرایش سریع                     │
│  - staleTime: 0 برای ردیف‌های در حال ویرایش               │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│ لایه ۲: Local Form State (Zustand)                       │
│  - ویرایش محلی ردیف بدون fetch فوری (debounce ۸۰۰ms)      │
│  - snapshot قبل از ویرایش برای undo                       │
│  - فقط ردیف ویرایش‌شده re-render می‌شود (selectors دقیق)  │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────┐
│ لایه ۳: Computed Cache (Ref-based)                       │
│  - محاسبه‌ی محلی جمع‌ها و ضرایب با useMemo انتخابی         │
│  - نمایش پیش‌نمایش فوری قبل از تایید سرور                 │
└──────────────────────────────────────────────────────────┘
```

**نکته‌ی کلیدی:** ویرایش ردیف به‌صورت **debounced** به سرور ارسال می‌شود؛ در فاصله‌ی بین هر درخواست، کاربر خروجی موقت محلی را می‌بیند (Optimistic UI). پس از پاسخ سرور، داده‌ی نهایی (که شامل نتایج زنجیره‌ای است) جایگزین می‌شود.

---

## ۴. استراتژی محاسبات زنجیره‌ای (Chained Computation)

این بزرگترین چالش نرم‌افزار است. راهکار چندلایه‌ی زیر تضمین می‌کند که تغییر در «ریزمتره» به‌درستی و بدون افت سرعت در «برگه مالی»، «فصول» و «صورت‌وضعیت» بازتاب یابد.

### ۴-۱. مدل آپدیت سه‌حالته

| حالت | زمان استفاده | مکانیزم |
|---|---|---|
| **A. هم‌زمان (Synchronous)** | ویرایش تک‌ردیف در فرم تعاملی | Transaction سرور، بازگشت نتایج زنجیره‌ای در همان پاسخ |
| **B. ناهم‌زمان (Async Job)** | ایمپورت اکسل با هزاران ردیف | Job در صف، نمایش پیشرفت با WebSocket، بازمحاسبه در پس‌زمینه |
| **C. عندالدرخواست (Lazy)** | گزارش‌های تحلیلی سنگین | محاسبه هنگام درخواست، کش نتیجه با TTL |

### ۴-۲. معماری موتور محاسبه

```
┌─────────────────────────────────────────────────────────┐
│               Cascade Engine (src/lib/calc/)             │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐   ┌──────────────┐ │
│  │ recompute   │───▶│ recompute    │──▶│ recompute    │ │
│  │ SummaryBOQ  │    │ FinancialSheet│   │ Chapters     │ │
│  │ (aggregation)│   │ (price × qty)│   │ (distribution)│ │
│  └─────────────┘    └──────────────┘   └──────────────┘ │
│                                                   │      │
│                                                   ▼      │
│                                          ┌──────────────┐│
│                                          │ recompute    ││
│                                          │ Payments     ││
│                                          │ (executed%)  ││
│                                          └──────────────┘│
└─────────────────────────────────────────────────────────┘
```

هر مرحله یک **Pure Function** است که ورودی‌اش رکوردهای مرحله‌ی قبل و خروجی‌اش رکوردهای به‌روزرسانی‌شده‌ی همان مرحله است. این طراحی امکان:
- **تست واحد** هر مرحله مستقل
- **اجرای انتخابی** (فقط مراحل بعد از نقطه‌ی تغییر)
- **موازی‌سازی** مراحل مستقل

### ۴-۳. تضمین عملکرد (Performance)

1. **Selective Recomputation:** فقط پروژه‌ای که تغییر کرده بازمحاسبه می‌شود، نه کل دیتابیس.
2. **Transaction Batch:** تمام آپدیت‌های یک زنجیره در یک Transaction یکپارچه — کاهش round-trips دیتابیس.
3. **Indexed Lookups:** `tenantId + projectId` روی تمام جداول برای کوئری‌های سریع.
4. **Debounced UI:** ویرایش‌های سریع کاربر قبل از ارسال تجمیع می‌شوند.
5. **WebSocket Broadcast:** تغییرات به سایر کاربران هم‌زمان روی همان پروژه پخش می‌شود (با قفل رکورد).
6. **Precomputed Aggregates:** مبالغ کل پروژه در فیلد `cachedTotal` ذخیره و به‌روزرسانی می‌شوند (نه محاسبه در هر درخواست).

### ۴-۴. قفل‌گذاری رکوردها (Record Locking)

برای کار همزمان چند کاربر روی یک پروژه:
- وقتی کاربر شروع به ویرایش یک ردیف می‌کند، `lockedBy = userId` و `lockedAt = now()` ثبت می‌شود.
- سایر کاربران ردیف را به‌صورت **read-only با نشانگر قفل** می‌بینند.
- TTL قفل: ۵ دقیقه (در صورت عدم فعالیت، خودکار آزاد می‌شود).
- آزادسازی با `PATCH /api/detail-boq/{id}/unlock`.

---

## ۵. نمای کلی رابط کاربری (UI Wireframe — متنی)

```
╔══════════════════════════════════════════════════════════════════════════╗
║ [آرم]  پلتفرم متره و برآورد          [تهران]  [آرش محمدی]  [🔔]  [⚙️]   ║  ← Header سازمانی
╠══════════════╦═══════════════════════════════════════════════════════════╣
║              ║  مسیر: پروژه‌ها / متروی خط ۷ / برگه مالی                  ║  ← Breadcrumb
║  درخت پروژه  ╠═══════════════════════════════════════════════════════════╣
║              ║ ┌──────────────────────────────────────────────────────┐ ║
║  ▼ سازمان     ║ │  [داشبورد] [پیمان] [ریزمتره] [برگه مالی] [فصول]   │ ║  ← Tab Bar
║    ▼ پروژه‌ها  ║ │  [صورت‌وضعیت] [تعدیل] [گزارشات]                     │ ║
║      ▸ مترو ۷ ║ ├──────────────────────────────────────────────────────┤ ║
║      ▸ پل امام║ │                                                       │ ║
║      ▸ تونل ۲ ║ │   ┌─ نمودار پیشرفت ──┐  ┌─ جمع مالی ──────────┐    │ ║  ← Dashboard
║              ║ │   │  ████░░░░ ۴۲٪     │  │ مبلغ پیمان: ۲.۵ میلیارد│    │ ║
║  ▼ داده‌های پایه║ │   └───────────────────┘  │ اجرا شده: ۱.۱ میلیارد │    │ ║
║    ▸ فهرست بهل║ │                            │ باقی‌مانده: ۱.۴ میلیارد │    │ ║
║    ▸ شاخص‌ها   ║ │   ┌─ توزیع هزینه بر فصل ─────────────────────┐   │ ║
║    ▸ نرخ مصالح║ │   │  فصل ۱: ████ ۳۲٪                          │   │ ║
║              ║ │   │  فصل ۲: ███ ۲۸٪                            │   │ ║
║  ▸ تنظیمات    ║ │   │  فصل ۳: ██ ۱۸٪                             │   │ ║
║  ▸ کاربران    ║ │   └────────────────────────────────────────────┘   │ ║
║              ║ │                                                       │ ║
║              ║ │   ┌─ آخرین فعالیت‌ها ───────────────────────────┐  │ ║
║              ║ │   │ • صورت‌وضعیت دوره ۳ ثبت شد — ۲ ساعت پیش      │  │ ║
║              ║ │   │ • ردیف ۱۲۴ برگه مالی ویرایش شد — آرش         │  │ ║
║              ║ │   └──────────────────────────────────────────────┘  │ ║
║              ║ └──────────────────────────────────────────────────────┘ ║
╠══════════════╩═══════════════════════════════════════════════════════════╣
║  © ۱۴۰۴ پلتفرم متره و برآورد | نسخه ۱.۰ | اتصال: ● آنلاین                ║  ← Sticky Footer
╚══════════════════════════════════════════════════════════════════════════╝
```

### ویژگی‌های کلیدی UI:
- **نوار کناری درختی** (راست‌چین): سازمان ← پروژه‌ها ← ماژول‌ها. قابل جمع‌شدن برای حالت تمام‌صفحه.
- **Tab Bar ماژول‌ها:** هر تب یک مرحله از ورک‌فلو است. نشانگر پیشرفت روی هر تب.
- **پنل‌های قابل تغییر اندازه** (react-resizable-panels): برای جدول‌های بزرگ.
- **ویزارد برای ایجاد پروژه:** ۴ مرحله (مشخصات ← پیمان ← ضرایب ← تأیید).
- **جدول ویرایش‌پذیر سریع:** کلیک روی سلول = ویرایش inline، Enter = ردیف بعدی، Tab = ستون بعدی.
- **نمودارهای زنده:** به‌محض تغییر داده، نمودارها به‌روز می‌شوند (با انیمیشن).
- **حالت تیره:** پشتیبانی کامل از تم تیره.
- **نشانگر قفل رکورد:** آیکون 🔒 کنار ردیف‌های در حال ویرایش توسط کاربر دیگر.

---

## ۶. امنیت و چندمستاجرگی

- **Row-Level Isolation:** تمام کوئری‌ها با `where: { tenantId }` فیلتر می‌شوند. یک middleware مرکزی `tenantId` را از session استخراج کرده و به context تزریق می‌کند.
- **RBAC:** سه نقش — `ADMIN` (مدیر سازمان)، `ESTIMATOR` (برآوردکار)، `BILLER` (مسئول صورت‌وضعیت). مجوزها در سطح ماژول و پروژه.
- **اعتبارسنجی ورودی:** Zod schema برای هر API — جلوگیری از تزریق و داده‌ی نامعتبر.
- **Rate Limiting:** روی APIهای محاسباتی سنگین برای جلوگیری از سوءاستفاده.

---

## ۷. خروجی‌ها و گزارشات

| خروجی | فرمت | کاربرد |
|---|---|---|
| برگه مالی استاندارد | PDF (با سربرگ و آرم) | ارائه به کارفرما |
| صورت‌وضعیت رسمی | PDF/Word | ارسال به دستگاه نظارت |
| گزارش متره | Excel | بررسی دقیق ردیف‌ها |
| ساختار شکست کار (WBS) | XML | ایمپورت در MS Project |
| گزارش تعدیل | PDF | مستندسازی تعدیل |

سربرگ، آرم و امضاهای سازمان (ناظر/مدیر/پیمانکار) از تنظیمات Tenant خوانده و روی تمام خروجی‌ها اعمال می‌شوند.

---

## ۸. نقشه راه توسعه (Roadmap)

| فاز | مدت | محتوا |
|---|---|---|
| **۰. MVP** | ۲ هفته | احراز هویت، چندمستاجرتی، درخت پروژه، داشبورد، ریزمتره + برگه مالی پایه |
| **۱. موتور محاسبه** | ۳ هفته | ضرایب، نزولی بها، آهن/سیمان، آنالیز، فصول |
| **۲. صورت‌وضعیت** | ۲ هفته | ثبت اجرا، کسورات، گزارش دوره‌ای |
| **۳. تعدیل** | ۲ هفته | شاخص‌ها، تعدیل زیرفصل، گزارش‌ها |
| **۴. هم‌زمانی** | ۱ هفته | WebSocket، قفل رکورد، پخش تغییرات |
| **۵. خروجی‌ها** | ۲ هفته | PDF/Word/Excel/XML با سربرگ |
| **۶. ایمپورت اکسل** | ۱ هفته | ایمپورت ریزمتره با اعتبارسنجی |

---

## ۹. جمع‌بندی

این معماری با تمرکز بر سه محور طراحی شده است:
1. **یکپارچگی زنجیره‌ای** — موتور محاسبه‌ی خالص و قابل تست، با آپدیت سه‌حالته.
2. **عملکرد فرانت‌اند** — State Management سه‌لایه برای جلوگیری از لگ در فرم‌های سنگین.
3. **تجربه‌ی کاربری دسکتاپ‌گونه** — رابط RTL مدرن با پنل‌های قابل تنظیم و ویرایش سریع.

این سند پایه‌ی پیاده‌سازی است و در طول توسعه به‌روز می‌شود.

---

## ۹. فاز ۲ — ماژول‌های پیشرفته (Advanced Modules v2)

> **نسخه:** 2.0 — اضافه‌شده در فاز توسعه‌ی دوم
> **تاریخ:** ۱۴۰۴

### ۹-۱. معماری دسترسی چندمستاجره (Multi-Tenancy & RBAC)

#### ساختار کاربری
| نقش | سطح دسترسی | توضیح |
|---|---|---|
| **ADMIN (کارفرما)** | کامل | لایسنس را تهیه کرده و یوزرهای زیرمجموعه را تعریف می‌کند. کنترل کامل روی همه‌ی پروژه‌ها و تنظیمات tenant. |
| **ESTIMATOR (برآوردکار)** | پروژه‌های اختصاص‌یافته | ورود و ویرایش ریزمتره، برگه مالی، آنالیز. ارسال صورت‌وضعیت برای تأیید. |
| **BILLER (مسئول صورت‌وضعیت)** | صورت‌وضعیت‌ها | ثبت اجرا، محاسبه‌ی کسورات، تولید خروجی. |
| **مشاور/ناظر** (آینده) | بررسی و تأیید | دریافت صورت‌وضعیت برای بررسی. |

#### ماژولار بودن (Modular Activation)
مدیر می‌تواند هنگام ایجاد پروژه، ماژول‌ها را فعال/غیرفعال کند:
```typescript
// API: GET /api/projects/[id]/modules
interface ProjectModule {
  moduleKey: string;  // BID_PRICE | REVERSE_ADJUST | MATERIAL_SITE | ...
  isEnabled: boolean;
}
```
ماژول‌های غیرفعال در UI نمایش داده نمی‌شوند تا از شلوغی جلوگیری شود. ماژول‌های اصلی (DETAIL_BOQ, FINANCIAL_SHEET, CHAPTERS, PAYMENTS, ADJUSTMENT) به‌صورت پیش‌فرض فعال هستند؛ ماژول‌های اختیاری (REVERSE_ADJUSTMENT, BID_PRICE, MATERIAL_SITE) غیرفعال.

#### قفل‌گذاری رکورد (Row-Level Locking)
- فیلد `lockedBy` و `lockedAt` در `DetailBoq` و `Payment`.
- هنگام ارسال صورت‌وضعیت (`SUBMITTED`)، سند برای فرستنده قفل (Read-Only) می‌شود.
- در صورت رد (`REJECTED`)، قفل باز می‌شود و قابل ویرایش مجدد است.
- در صورت تأیید (`APPROVED`)، قفل دائمی می‌شود.

### ۹-۲. موتور داده‌های پایه ایرانیزه (Iranian Base Data Engine)

سیستم به داده‌های مرجع سازمان برنامه و بودجه متصل است:

| نوع داده | مدل | نمونه‌ی داده |
|---|---|---|
| **فهرست‌های بها** | `PriceList` + `PriceListItem` | ابنیه ۱۴۰۳-۱۴۰۴، راه و باند، نفت و گاز |
| **شاخص‌ها** | `IndexRecord` | شاخص‌های فصلی از ۱۳۷۶ (مبنا) — دستمزد، مصالح، ماشین‌آلات |
| **ضرایب منطقه‌ای** | `Coefficient` | ۶ نوع ضریب (REGIONAL, BASE, ALTITUDE, FLOOR, TUNNEL) |
| **دیتابیس مسافت** | `CityDistance` | ۱۱۰۰+ نقطه، ۶۲۰٬۰۰۰ مسافت بین شهرهای ایران |
| **نرخ مصالح** | `MaterialRate` | ۳ مرجع: NET (سازمان مدیریت)، STATS (مرکز آمار)، DAILY (قیمت روز) + `wasteFactor` (ضریب پرت) |

### ۹-۳. سیستم هشدارهای هوشمند (Advanced Alert System)

مدل `Alert` با ۶ نوع هشدار:
```prisma
model Alert {
  type       String   // GUARANTEE | DEDUCTION | SCHEDULE | CALC | WORKFLOW | SYSTEM
  severity   String   // INFO | WARNING | CRITICAL
  dueDate    DateTime?
  relatedId  String?
  relatedType String? // PAYMENT | FINANCIAL_SHEET | DETAIL_BOQ | PROJECT
  isRead     Boolean
  isResolved Boolean
}
```

#### انواع هشدار
- **GUARANTEE**: یادآوری آزادسازی تضامین (۵۰٪ پس از تحویل موقت، مابقی پس از رفع نواقص).
- **DEDUCTION**: هشدار اعمال کسورات قانونی (بیمه ۲٪، مالیات ۵٪، تضمین ۵٪).
- **SCHEDULE**: اخطار نزدیک شدن به موعد ارسال صورت‌وضعیت.
- **CALC**: عدم تطابق جمع برگه مالی با فصول، کدهای ستاره‌دار خالی.
- **WORKFLOW**: پیام ارسال/رد/تأیید اسناد توسط سایر نقش‌ها.
- **SYSTEM**: هشدارهای سیستمی.

#### UI AlertsPanel
پنل کشویی از سمت راست با:
- فیلتر: همه / خوانده‌نشده / بحرانی
- نشانگر رنگی برای هر نوع (GUARANTEE=rose, SCHEDULE=orange, CALC=yellow, WORKFLOW=emerald)
- تاریخ نسبی + تعداد روز تا موعد (`daysUntil`)
- دکمه‌های «خواندن» و «رفع» برای هر هشدار
- شمارش بحرانی در فوتر

### ۹-۴. سیستم ارتباط داخلی و کامنت‌گذاری (Collaboration)

#### پیام‌رسان داخلی (Chat)
- مدل `ChatThread` + `ChatMessage` با `participants` (JSON array).
- API: `GET /api/chat/threads`, `POST /api/chat/threads`, `GET /api/chat/threads/[id]/messages`, `POST .../messages`, `PATCH .../read`.
- UI: `ChatPanel` (Sheet از سمت راست) با لیست مکالمات + نمایش پیام‌ها + ارسال (Enter/Shift+Enter).
- Polling هر ۴ ثانیه برای پیام‌های جدید.

#### کامنت‌گذاری محتوایی (Contextual Comments)
- مدل `Comment` با `entityType` (DETAIL_BOQ | FINANCIAL_SHEET | PAYMENT | CHAPTER | PROJECT) و `entityId`.
- پشتیبانی از Reply (parentCommentId)، Mention (@user) و Resolve.
- کامپوننت `CommentThread` قابل‌استفاده روی هر ردیف (Popover با لیست کامنت‌ها + فرم افزودن).
- ادغام شده در: DetailBoqView, FinancialSheetView, PaymentsView.
- Mention کاربران با @ trigger و dropdown پیشنهادها.
- ساخت هشدار WORKFLOW برای کاربران mention‌شده.

### ۹-۵. گردش کار و State Machine (Workflow)

#### مدل State Machine برای Payment
```
DRAFT --submit--> SUBMITTED --approve--> APPROVED
                   │                       │
                   └──reject--> REJECTED   └──reopen--> DRAFT
                       │
                       └──submit--> SUBMITTED
```

#### فیلدهای گردش کار در Payment
```prisma
submittedBy  String?
submittedAt  DateTime?
reviewedBy   String?
reviewedAt   DateTime?
reviewNote   String?
lockedBy     String?     // قفل هم‌زمانی
lockedAt     DateTime?
stateHistory String      // JSON: [{from, to, action, userId, note, at}]
dueDate      DateTime?
```

#### API Transition
```
POST /api/projects/[id]/payments/[period]/transition
body: { action: "submit" | "approve" | "reject" | "reopen", userId, userName, note? }
```
- اعتبارسنجی انتقال مجاز (مثلاً submit فقط از DRAFT یا REJECTED).
- ثبت در `stateHistory`.
- قفل/باز کردن قفل سند.
- ساخت Alert برای طرف مقابل.

#### UI WorkflowStepper
- Stepper سه‌مرحله‌ای: پیش‌نویس → در انتظار تأیید → تأیید شده.
- نمایش قفل (Read-Only / قابل ویرایش).
- دکمه‌های context-aware: ارسال، تأیید، رد (با یادداشت)، بازگشایی.
- تاریخچه‌ی گردش کار قابل باز/بسته شدن.
- یادداشت بازبین در صورت رد/تأیید.

### ۹-۶. ماژول‌های محاسباتی پیشرفته

#### مصالح پای کار (Materials-at-Site)
- مدل `MaterialAtSite` با: purchasedQuantity, previousExecuted, currentExecuted, remainingQuantity, invoiceNo, supplier, purchaseDate, unitPrice, totalCost.
- فرمول: `remaining = purchased - previousExecuted - currentExecuted`
- UI با جدول + ۳ کارت آماری + فرم افزودن/ویرایش با پیش‌نمایش محاسبه.
- حیاتی برای تعدیل: کسر مصالح پای کار از صورت‌وضعیت قبلی.

#### دامنه قیمت پیشنهادی (Bid Price Range)
- مدل `BidRange` با: overheadPct, profitPct, riskPct, baseAmount, floorAmount, ceilingAmount, suggestedAmount.
- فرمول:
  ```
  base = Σ financialSheet.totalAmount
  overhead = base × overheadPct / 100
  profit = (base + overhead) × profitPct / 100
  risk = (base + overhead + profit) × riskPct / 100
  ceiling = base + overhead + profit + risk
  floor = base × 0.92  (کف قانونی ۸٪ پایین‌تر)
  suggested = (ceiling + floor) / 2
  ```
- UI با فرم ورودی (slider + input) + پیش‌نمایش زنده + کارت‌های کف/پیشنهاد/سقف.

#### ماژول‌های دیگر (موجود از فاز ۱)
- **ریزمتره و خلاصه متره**: ورود دستی + اکسل، تجمیع احجام.
- **برگه مالی و ستاره‌دارها**: قیمت پیشنهادی، بخشنامه ۴۹۵۱ (نزولی بها).
- **فرم حمل و آهن/سیمان**: مسافت‌های ایران + ضرایب پرت + کسورات.
- **آنالیز بها**: ۴ عامل (دستمزد، ماشین، مصالح، حمل).
- **صورت‌وضعیت**: مقطعی و انباشتی با کسورات قانونی.
- **تعدیل و تعدیل معکوس**: شاخص‌های فصلی.
- **فصول و تجهیز کارگاه**: بخشنامه ۷۶۵۷۴ و ۴۹۵۱.

### ۹-۷. خروجی‌های فرمول‌محور (Formulated Outputs)

#### Excel با فرمول‌های واقعی (exceljs)
خروجی اکسل **Value-only نیست**. سلول‌ها دارای فرمول هستند:
- مبلغ کل: `=D5*E5` (مقدار × قیمت واحد)
- جمع کل: `=SUM(F5:F14)` 
- درصد فصل: `=C2/SUM(C2:C8)`
- سربرگ گرافیکی با رنگ کهربایی + RTL + grid lines off
- دو Sheet: «برگه مالی» + «خلاصه فصول»
- B Nazanin font + colored headers + alternating rows

#### PDF با صفحه‌بندی استاندارد
- سربرگ «سیوان تدبیر تجارت» + لوگو
- فوتر با شماره صفحه
- جدول‌بندی حرفه‌ای مطابق فرمت‌های سازمان برنامه
- امضاهای ناظر / مدیر / پیمانکار

#### WBS (XML)
- فایل XML سازگار با MS Project
- ساختار درختی Tasks با UID, OutlineNumber, Cost

### ۹-۸. نمای کلی رابط کاربری (UI Wireframe v2)

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] متره‌یار | breadcrumb | 🔍 ⌘K | 🌙 | 💬(۲) | 🔔(۷) | 👤 │
├──────────┬─────────────────────────────────────────────────────┤
│ Sidebar  │  Project Header                                     │
│          │ ┌──────────────────────────────────────────────────┐│
│ ▸ پروژه‌ها│ │ Tabs: [نمای کلی][پیمان][ریزمتره][برگه مالی]     ││
│ • مترو   │ │       [فصول][صورت‌وضعیت][تعدیل]                  ││
│ • پل     │ │       [مصالح پای کار][دامنه قیمت][گزارشات]      ││
│ • تونل   │ └──────────────────────────────────────────────────┘│
│          │                                                     │
│ ▸ داده‌ها │  Content Area:                                     │
│ ▸ گزارشات│  ┌──────────────────────────────────────────────┐  │
│ ▸ کاربران│  │ Workflow Stepper (در صورت‌وضعیت)             │  │
│ ▸ تنظیمات│  │ [پیش‌نویس]──[در انتظار]──[تأییدشده]          │  │
│          │  │       [ارسال] [تأیید] [رد] [بازگشایی]         │  │
│ ────────│  └──────────────────────────────────────────────┘  │
│ stats    │                                                     │
│ ۳ پروژه  │  ┌──── Table: برگه مالی ───────────────────────┐  │
│ ۲ پرداخت │  │ کد | شرح | مقدار | قیمت | مبلغ | 💬 | ⚙️    │  │
│ ۷ هشدار  │  │ 01 | خاکبرداری | 120 | 50K | 6M | 💬3 | ⚙️  │  │
│          │  │ ... (click 💬 for contextual comments)       │  │
│          │  └──────────────────────────────────────────────┘  │
├──────────┴─────────────────────────────────────────────────────┤
│ footer: © ۱۴۰۴ — سیوان تدبیر تجارت | کاربر: سید علی میرجعفری  │
└────────────────────────────────────────────────────────────────┘

Slide-out Panels (Sheet از راست):
  - 💬 ChatPanel: لیست مکالمات + پیام‌ها + ارسال
  - 🔔 AlertsPanel: فیلتر + لیست هشدارها + اقدام
```

### ۹-۹. معماری API (۵ نمونه‌ی کلیدی فاز ۲)

#### ۱. POST /api/projects/[id]/payments/[period]/transition
```typescript
// State Machine Transition
body: { action: "submit" | "approve" | "reject" | "reopen", userId, userName, note? }

// 1. اعتبارسنجی: state × action مجاز است؟
// 2. به‌روزرسانی Payment (status, submittedBy, reviewedBy, lockedBy, stateHistory)
// 3. ساخت Alert برای طرف مقابل
// 4. بازگشت Payment به‌روزرسانی‌شده
```

#### ۲. POST /api/projects/[id]/bid-range
```typescript
body: { overheadPct, profitPct, riskPct, baseAmount?, notes? }

// محاسبه‌ی کف/سقف/پیشنهاد
// upsert در BidRange
// بازگشت bidRange + computation
```

#### ۳. POST /api/comments
```typescript
body: { projectId, entityType, entityId, entityLabel, userId, userName, content, mentions[] }

// ایجاد کامنت
// ساخت Alert WORKFLOW برای کاربران mention‌شده
// بازگشت comment
```

#### ۴. POST /api/chat/threads/[threadId]/messages
```typescript
body: { senderId, content }

// ایجاد پیام + readBy = [senderId]
// به‌روزرسانی lastMessageAt
// بازگشت message
```

#### ۵. PATCH /api/projects/[id]/modules
```typescript
body: { modules: [{ key, isEnabled }] }

// upsert همه‌ی ماژول‌ها
// بازگشت success
```

### ۹-۱۰. استراتژی مدیریت State در فرانت‌اند

| لایه | ابزار | کاربرد |
|---|---|---|
| **Server State** | TanStack Query v5 | کش داده‌های API، Invalidation، Optimistic Update |
| **URL State** | Next.js App Router | ناوبری، شناسه‌ی پروژه/تب |
| **Local UI State** | useState | فرم‌ها، باز/بسته بودن Dialog/Sheet |
| **Global App State** | Zustand (`useAppStore`) | ناوبری بین viewها، پروژه‌ی انتخاب‌شده |

#### Pattern: Optimistic Update با Cascade
```typescript
const updateMutation = useMutation({
  onMutate: async (payload) => {
    await qc.cancelQueries({ queryKey: ["project", projectId] });
    const prev = qc.getQueryData(["project", projectId]);
    // به‌روزرسانی محلی
    qc.setQueryData(["project", projectId], (old) => applyLocalUpdate(old, payload));
    return { prev };
  },
  onError: (err, _vars, ctx) => {
    qc.setQueryData(["project", projectId], ctx?.prev); // rollback
  },
  onSettled: () => {
    qc.invalidateQueries({ queryKey: ["project", projectId] });
  },
});
```

#### Pattern: Polling برای Real-time
```typescript
// پیام‌های چت
useQuery({
  queryKey: ["chat-messages", threadId],
  refetchInterval: 4000, // هر ۴ ثانیه
});

// هشدارها
useQuery({
  queryKey: ["alerts"],
  refetchInterval: 15000, // هر ۱۵ ثانیه
});
```

---

## ۱۰. خلاصه‌ی فاز ۲

| ماژول | پیاده‌سازی | APIها | UI |
|---|---|---|---|
| چندمستاجره + RBAC | Tenant + User + Role + ProjectModule | /api/projects/[id]/modules | تب‌های ماژولار |
| داده‌های پایه ایرانیزه | PriceList, IndexRecord, Coefficient, CityDistance, MaterialRate | /api/base-data/* | BaseDataView |
| هشدارهای هوشمند | Alert (۶ نوع، ۳ severity) | /api/alerts, /api/alerts/[id]/{read,resolve} | AlertsPanel |
| پیام‌رسان داخلی | ChatThread, ChatMessage | /api/chat/* | ChatPanel |
| کامنت‌گذاری محتوایی | Comment (با mention + resolve) | /api/comments/* | CommentThread |
| گردش کار + State Machine | Payment.status + stateHistory + lockedBy | /api/projects/[id]/payments/[period]/transition | WorkflowStepper |
| مصالح پای کار | MaterialAtSite | /api/projects/[id]/materials-at-site | MaterialsSiteView |
| دامنه قیمت | BidRange | /api/projects/[id]/bid-range | BidRangeView |
| خروجی Excel فرمول‌محور | exceljs با فرمول‌های واقعی | (client-side generation) | ReportsView |
| خروجی PDF با سربرگ | print HTML در پنجره‌ی جدید | (client-side generation) | ReportsView |
| خروجی WBS XML | XML سازگار با MS Project | (client-side generation) | ReportsView |

**مجموع فاز ۲:** ۱۰ ماژول جدید، ۱۵+ API endpoint جدید، ۵ کامپوننت UI جدید، افزودن ۸ مدل به Prisma schema.
