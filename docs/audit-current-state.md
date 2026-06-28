# ممیزی وضعیت فعلی Civilic (Audit — Current State)

> هدف این سند هدایت پیاده‌سازی است، نه مستندسازی کامل. بر پایه‌ی خواندن واقعی فایل‌های ریپو و اجرای ابزارها (نصب وابستگی‌ها، `prisma generate`، `tsc --noEmit`).

## ۱. پشته‌ی فنی فعلی (Tech Stack)

| لایه | فناوری | نسخه |
|---|---|---|
| فریم‌ورک | Next.js (App Router) | ^16.1.1 |
| UI | React | ^19 |
| استایل | Tailwind CSS v4 + shadcn/ui (Radix) | ^4 |
| ORM | Prisma | ^6.11 (client v6.19) |
| دیتابیس | **SQLite** (provider) | — |
| State | Zustand | ^5 |
| Data fetching | TanStack Query + Table | ^5 |
| احراز هویت | **next-auth ^4.24 نصب شده ولی استفاده نشده** | — |
| XML | fast-xml-parser | ^5.9 |
| نمودار | recharts | ^2.15 |
| اکسل | exceljs | ^4.4 |
| فونت | Vazirmatn (next/font/google) | — |
| Package manager | Bun (bun.lock) | — |

نتیجه‌ی اجرای ابزارها:
- `bun install` ✅ موفق
- `prisma generate` ✅ موفق (provider مستقل از client)
- `tsc --noEmit` ⚠️ فقط **۲ خطا**، هر دو در `examples/websocket/*` (نبود `socket.io`). **کد اصلی اپ type-clean است.**

## ۲. معماری فعلی اپ

- اپ یک **SPA سمت کلاینت** است: `src/app/page.tsx` با Zustand بین viewها سوییچ می‌کند. **هیچ routing واقعی و هیچ auth وجود ندارد.**
- `src/lib/store.ts` کاربر فعلی را **hardcode** کرده (`CONSULTANT/RESIDENT_ENGINEER`) با `setCurrentUser`.
- `layout.tsx` از قبل `lang="fa" dir="rtl"` + فونت Vazirmatn + ThemeProvider + QueryProvider دارد. عنوان «متره‌یار» است (نیاز به rebrand «Civilic»).
- ناوبری sidebar از قبل دقیقاً ۶ آیتم هدف را دارد: کارتابل من / پروژه‌ها / پیام‌ها / اسناد و مکاتبات / گزارش‌ها و خروجی / تنظیمات.
- `workbench-view.tsx` از قبل عنوان «کارتابل من» دارد و از `/api/dashboard` داده می‌گیرد (اما طراحی نیازمند بازطراحی است).

## ۳. مشکلات schema

1. `provider = "sqlite"` — برای production باید **PostgreSQL** باشد.
2. `User.role` رشته با پیش‌فرض `ESTIMATOR` و `enum UserRole { ADMIN, ESTIMATOR, BILLER }` — **مدل نقش واقعی نیست**؛ باید نقش‌های واقعی سه‌طرف جایگزین شوند (در سطح `ProjectMember.role`).
3. مدل‌های Texsa compat ناقص‌اند: فقط `TexsaImport` + `TexsaImportIssue` هست. **نبودِ** `TexsaTableSchema`, `TexsaColumnSchema`, `TexsaRawRow`, `TexsaMappingRule`, `TexsaExportJob`, `TexsaRoundTripReport`.
4. نبودِ **منبع رکورد** روی موجودیت‌های نرمال‌شده (source = TEXSA | CIVILIC و اشاره به raw row).
5. `Message` فاقد: `systemType`, `mentions`, `deletedAt` (soft delete)، و اتصال به entity.
6. `Letter` فقط یک گیرنده (`toPartyId`) دارد؛ نیاز به **چند گیرنده** (`CorrespondenceRecipient`).
7. مدل‌های تزئینی زیاد: `Risk`, `Supplier`, `SupplierOrder`, `ChangeOrder`, `CalendarEvent`, `Contract`, `ContractMilestone`, `DimensionFormula`, `DocumentFile`, `BidRange`, `MaterialAtSite`. → نگه می‌داریم (حذف باعث شکستن ~۶۰ route و typecheck می‌شود) اما **از ناوبری اصلی خارج**.

## ۴. مشکلات نقش/دسترسی

1. **هیچ permission matrix مرکزی نیست** (`src/lib/auth/permissions.ts` وجود ندارد).
2. کنترل دسترسی فقط **inline و سمت‌سرور ناقص** است (مثلاً در `payments/[period]/transition-v2` فقط چک نقش رشته‌ای).
3. **هیچ enforcement سمت سرور یکپارچه** (`requireProjectPermission`) وجود ندارد.
4. نقش‌ها در UI به‌صورت پراکنده map شده‌اند (label map در sidebar/workbench).

## ۵. مشکلات UI/UX

1. داشبورد فعلی هنوز نیازمند بازطراحی «کارتابل من» حرفه‌ای است (کارت‌های اقدام، نقش‌محور).
2. ماژول‌های تزئینی (BI, heatmap, radar, forecast, map, supplier, risk) هنوز API و احتمالاً کامپوننت دارند؛ نباید در مسیر اصلی دیده شوند.
3. صفحه‌ی پروژه باید دقیقاً ۷ تب باشد (طبق store از قبل تعریف شده).
4. برند «متره‌یار» باید به «Civilic» تغییر کند.
5. داده‌ی خام تکسا نباید در UI اصلی دیده شود؛ باید زیر «تنظیمات → پیشرفته».

## ۶. وضعیت Import/Export تکسا

- `TexsaImport`/`TexsaImportIssue` + ۴۵ مدل mirror (`Brv_*`/`Base_*` با فیلد `tx_`) وجود دارد.
- API: `texsa/import/preview`, `import/commit`, `imports`, `imports/[id]`, `imports/[id]/export`, `imports/[id]/tables/...`, `schema`.
- **شکاف‌ها:** preserve raw به‌صورت ردیف‌محور (`TexsaRawRow`) نیست؛ normalize به ViewModel محصول کامل نیست؛ export round-trip و **گزارش round-trip** نیست؛ parser برای فایل ۷۱MB باید streaming/امن باشد.
- تحلیل واقعی فایل انجام شده: `docs/texsa-real-file-analysis.md` + `src/lib/texsa/generated-schema.json` + `src/lib/texsa/table-map.ts` (۴۵ جدول، ۷۸٬۹۸۸ ردیف).

## ۷. مشکلات آمادگی Vercel

1. `typescript.ignoreBuildErrors: true` → **باید حذف شود** (ممکن است چون فقط examples خطا دارد).
2. `output: "standalone"` + اسکریپت build سفارشی (کپی static) → برای Vercel لازم نیست؛ باید `next build` ساده.
3. اسکریپت‌های `typecheck`, `db:migrate`, `db:deploy`, `db:seed`, `texsa:*` وجود ندارند.
4. نبودِ `postinstall: prisma generate`.
5. نبودِ `.env.example`.
6. خطر: import فایل ۷۱MB نباید در build یا route معمولی Vercel انجام شود؛ باید آپلود مستقیم به storage + پردازش پس‌زمینه.
7. SQLite برای production مناسب نیست.

## ۸. چه چیزی حذف / مخفی / refactor / حفظ شود

| اقدام | موارد |
|---|---|
| **حفظ** | layout RTL، فونت Vazirmatn، store nav، fa.ts، مدل‌های محصول (Organization/Party/Member/Workflow/Channel/Letter/Document/Payment)، مدل‌های mirror تکسا، تحلیل تکسا |
| **مخفی از ناوبری اصلی** | BI, heatmap, radar, forecast, map, supplier, risk, change-order, calendar، داده خام تکسا |
| **Refactor** | Payment workflow → ماشین ۱۳ حالته؛ auth واقعی؛ permissions مرکزی؛ Message/Letter توسعه؛ seed واقعی؛ provider→postgres؛ next.config؛ scripts؛ rebrand |
| **افزودن** | `permissions.ts`، `workflows/payment-certificate.ts`، Texsa compat models + libs (parse/preserve/normalize/export/roundtrip)، `.env.example` |

## ۹. اصل راهبردی پیاده‌سازی

- **حفظ سبزیِ build:** کد فعلی type-clean است؛ هر تغییر باید همان‌طور بماند. مدل‌های تزئینی حذف نمی‌شوند (وابستگی زیاد) بلکه از ناوبری خارج می‌شوند.
- تغییرات schema **افزایشی** (additive) باشند تا ~۶۰ route نشکنند.
- provider→postgresql برای `prisma generate` بی‌خطر است؛ `migrate/seed` نیازمند یک Postgres واقعی است (در sandbox نداریم → مستند می‌شود).
