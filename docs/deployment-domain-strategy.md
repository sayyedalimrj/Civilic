# استراتژی دامنه و استقرار Civilic (Deployment / Domain Strategy)

Civilic دو سطح محصول مجزا دارد که از نظر دامنه، مسیر و دسترسی جدا هستند.

## دامنه‌ها

| دامنه | سطح | محتوا |
|---|---|---|
| `app.civilic.ir` | اپ کاربری (Customer App) | کارتابل، پروژه‌ها، صورت‌وضعیت، چت، اسناد، مکاتبات، گزارش |
| `admin.civilic.ir` یا `console.civilic.ir` | پنل مدیر سامانه (Platform Admin) | مستاجرها، کاربران، پروژه‌ها، پلن‌ها، صورتحساب، مصرف، ممیزی |
| `*.civilic.ir` (آینده) | زیردامنه‌ی مستاجر | `tenant-slug.civilic.ir` برای جداسازی برند هر مشتری |

## وضعیت فعلی (MVP)
- مسیر اپ کاربری: `/` و زیرمسیرها.
- مسیر پنل مدیریت: `/admin` (route group جدا با gate سطح پلتفرم در `src/app/admin/layout.tsx`).
- میدل‌ور (`src/middleware.ts`):
  - اگر host با `admin.` یا `console.` شروع شود، ریشه (`/`) به `/admin` rewrite می‌شود.
  - همه‌ی مسیرها (به‌جز `/login`, `/api/auth`, استاتیک) نیازمند session هستند؛ در غیر این صورت به `/login` هدایت می‌شوند.
- انتخاب tenant در MVP بر اساس عضویت/Session است (نه زیردامنه)، اما معماری از `Tenant.slug` برای زیردامنه‌ی آینده پشتیبانی می‌کند.

## استقرار روی Vercel
- **بدون** parse فایل ۷۰MB در زمان build یا در route معمولی.
- preview از داده‌ی seed نرمال‌شده استفاده می‌کند (`TEXSA_IMPORT_MODE=preview`).
- می‌توان دو دامنه را به **یک** Vercel project متصل کرد (host detection در میدل‌ور) یا در آینده دو project جدا.
- import production: آپلود مستقیم client → object storage (Vercel Blob/S3/R2) سپس job پردازش با Node runtime؛ نه multipart از طریق API معمولی.

### متغیرهای محیطی (نمونه در `.env.example`)
`DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `UPLOAD_PROVIDER`, `BLOB_READ_WRITE_TOKEN`, `TEXSA_IMPORT_MODE`, `NODE_ENV`.

### مراحل استقرار
1. `bun install` (postinstall اجرای `prisma generate`).
2. `bun run db:deploy` (اجرای migrationها روی Postgres production).
3. `bun run db:seed` (اختیاری برای داده‌ی دمو/پلتفرم).
4. `bun run build` → `next build`.
5. تنظیم دامنه‌ها در Vercel: `app.civilic.ir` و `admin.civilic.ir` به همان deployment.

## جداسازی دسترسی
- پنل مدیریت فقط برای کاربران `isPlatformAdmin` با `platformRole` معتبر است (gate سمت سرور در layout + `requirePlatformPermission` در همه‌ی APIهای `/api/admin/*`).
- کاربران عادی پروژه هرگز ویژگی‌های مدیر سامانه را نمی‌بینند و در صورت تلاش برای ورود به `/admin` به اپ کاربری هدایت می‌شوند.
- هر کوئری داده باید tenant-scoped باشد (نه فقط مخفی‌سازی UI).
