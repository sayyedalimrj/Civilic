---
inclusion: always
---

# Civilic — جهت فنی (Tech Steering)

## پشته
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 + shadcn/ui · Prisma 6 · TanStack Query · Zustand · NextAuth (Auth.js).

## دیتابیس
- **Production = PostgreSQL** (`provider = "postgresql"`, `url = env("DATABASE_URL")`).
- SQLite فقط در صورت نیاز برای dev، با env جدا؛ deployment اصلی Postgres.
- migration واقعی؛ `prisma migrate deploy` برای prod؛ `postinstall: prisma generate`.

## کیفیت build
- **`typescript.ignoreBuildErrors` ممنوع.** هیچ suppression پنهان.
- `next.config.ts` نباید خطای واقعی را مخفی کند.
- اسکریپت‌ها: `dev, build, start, lint, typecheck, db:generate, db:migrate, db:deploy, db:seed, texsa:analyze, texsa:import:local, texsa:export:test`.

## امنیت و دسترسی
- permission مرکزی در `src/lib/auth/permissions.ts`.
- هر API/server action مهم: `requireProjectPermission()` سمت سرور.
- tenant/project isolation؛ خطای فارسی؛ audit log برای اقدامات مهم؛ validation با zod.

## تکسا
- parser فایل بزرگ باید **streaming/امن** باشد؛ هرگز memory-heavy برای ۷۰MB.
- ساختار: `src/lib/texsa/import/*`, `normalize/*`, `export/*`.
- حفظ ترتیب جدول، ترتیب ردیف، ترتیب ستون، مقادیر رشته‌ای، دقت اعشار، صفرها و خالی‌ها، متن و تاریخ فارسی.
- export strategy صریح: `ROUND_TRIP_RAW | UPDATE_TEXSA_ROW | CREATE_TEXSA_ROW | CIVILIC_ONLY | NOT_EXPORTABLE`.

## Vercel
- بدون parse فایل ۷۰MB در build یا route معمولی.
- local: خواندن از workspace؛ preview: داده‌ی seed نرمال‌شده؛ production: آپلود مستقیم به storage (Vercel Blob/S3/R2) + job پردازش.
- env: `DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, UPLOAD_PROVIDER, BLOB_READ_WRITE_TOKEN, TEXSA_IMPORT_MODE, NODE_ENV`.

## قاعده‌ی تغییرات schema
افزایشی (additive) تا route/کامپوننت‌های موجود نشکنند؛ مدل‌های تزئینی حفظ ولی از ناوبری خارج.
