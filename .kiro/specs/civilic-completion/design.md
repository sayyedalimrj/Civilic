# Civilic Completion — Design

## معماری کلان
- **Next.js App Router** + API routes؛ تدریجاً به سمت server actions با permission گارد.
- **Prisma + PostgreSQL** (prod). داده‌ی خام تکسا در mirror models + `TexsaRawRow`؛ موجودیت‌های محصول با `recordSource` + `texsaImportId` + `texsaSourceRowId`.
- **Zustand** برای nav سمت کلاینت؛ **NextAuth (credentials + Prisma)** برای session؛ کاربر فعلی از session.

## ماژول‌ها
```
src/lib/auth/permissions.ts        — ماتریس مجوز + requireProjectPermission
src/lib/auth/session.ts            — getCurrentUser/getProjectContext (سمت سرور)
src/lib/workflows/payment-certificate.ts  — ماشین ۱۳ حالته + transition rules
src/lib/workflows/adjustment.ts    — ماشین تعدیل
src/lib/texsa/import/parse-svzt.ts        — parse streaming
src/lib/texsa/import/analyze-schema.ts    — استخراج schema جدول/ستون
src/lib/texsa/import/preserve-raw.ts      — ذخیره raw row با ترتیب
src/lib/texsa/import/import-local.ts      — import فایل workspace (dev)
src/lib/texsa/normalize/*.ts              — contract/parties/price-list/measurements/payment/adjustments/deductions/transport/resources
src/lib/texsa/export/build-newdataset.ts  — بازسازی ساختار NewDataSet
src/lib/texsa/export/serialize-xml.ts     — سریال‌سازی XML
src/lib/texsa/export/roundtrip-report.ts  — گزارش سازگاری
src/lib/texsa/table-map.ts                — نگاشت معنایی (موجود)
```

## مدل داده (افزایشی)
- نقش/سازمان/طرف/عضو: موجود (`Organization`, `ProjectParty`, `ProjectMember`).
- تکسا compat جدید: `TexsaTableSchema`, `TexsaColumnSchema`, `TexsaRawRow`, `TexsaMappingRule`, `TexsaMappingIssue`, `TexsaExportJob`, `TexsaRoundTripReport`.
- source tracking: `recordSource`, `texsaImportId`, `texsaSourceRowId` روی `Payment`, `DetailBoq`, `SummaryBoq`, `FinancialSheetItem`, `AdjustmentReportRow`.
- توسعه‌ی `Message`: `systemType`, `mentionsJson`, `deletedAt`, `entityType`, `entityId`.
- `CorrespondenceRecipient` برای چند گیرنده‌ی نامه.

> مدل‌های تزئینی (Risk/Supplier/...) حفظ می‌شوند ولی از ناوبری خارج‌اند تا route/کامپوننت‌های موجود نشکنند و typecheck سبز بماند.

## ماشین حالت صورت‌وضعیت
نگاشت به `Payment.status` (String). جدول transition در `payment-certificate.ts`: برای هر `(from, action)` → `to`, `permission`, `requiredPartyType`, `requiresNote`, `nextResponsibleParty`. هر transition: ثبت `WorkflowAction` + `AuditLog` + `Alert`(notification) + پیام سیستمی در کانال صورت‌وضعیت.

## دسترسی
`permissions.ts`: تعریف `Permission` union، `ROLE_PERMISSIONS: Record<ProjectRole, Permission[]>`، `hasPermission(member, perm)`، و helper سرور `requireProjectPermission(projectId, userId, perm)` که عضویت را از DB می‌خواند.

## تکسا round-trip
1. parse (streaming، حفظ ترتیب) → `TexsaImport` + `TexsaTableSchema/ColumnSchema` + `TexsaRawRow`.
2. normalize طبق `table-map.ts` (فقط جدول‌های `normalized:true`).
3. ویرایش در Civilic → علامت `recordSource=CIVILIC` یا تغییر raw.
4. export: ترکیب raw حفظ‌شده + تغییرات Civilic طبق export strategy → `NewDataSet`.
5. roundtrip-report: شمار جدول/ردیف import، موجودیت‌های نرمال‌شده، رکوردهای ویرایش‌شده، قابل‌export، Civilic-only، raw نامفهومِ حفظ‌شده، warning/error، درصد سازگاری.

## Vercel
- local/dev: `texsa:import:local` فایل workspace را می‌خواند.
- preview: فقط seed نرمال‌شده.
- production: آپلود مستقیم client → storage، سپس `TexsaImport` + job پردازش با Node runtime.
