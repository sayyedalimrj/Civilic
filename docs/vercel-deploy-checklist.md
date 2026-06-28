# چک‌لیست استقرار و ورود روی Vercel (Civilic)

این سند مشکل «ورود ناموفق روی Vercel» را حل می‌کند. علت معمول: دیتابیس Vercel **migrate/seed نشده** است، پس کاربری برای ورود وجود ندارد.

## ۱. متغیرهای محیطی الزامی (Vercel → Project → Settings → Environment Variables)

| متغیر | نمونه | توضیح |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/civilic?schema=public` | PostgreSQL (Prisma Postgres/Supabase/Neon). برای Supabase از connection string «pooler» استفاده کنید. |
| `NEXTAUTH_SECRET` | خروجی `openssl rand -base64 32` | راز امضای JWT. **باید** ست شود. |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` | آدرس دقیق deploy (production و preview). بدون این، ورود/کوکی ممکن است خراب شود. |

اختیاری برای bootstrap دمو:

| متغیر | مقدار | توضیح |
|---|---|---|
| `ENABLE_DEMO_BOOTSTRAP` | `true` | فعال‌کردن endpoint بوت‌استرپ (فقط preview/دمو). |
| `BOOTSTRAP_SECRET` | رشته‌ی تصادفی قوی | راز فراخوانی endpoint. |

## ۲. آماده‌سازی دیتابیس

### روش A — اجرای migration و seed قبل از deploy (توصیه‌شده)
```bash
# با DATABASE_URL همان دیتابیس production/preview:
bun run db:deploy   # prisma migrate deploy
bun run db:seed     # ساخت کاربران/پلن‌ها/پروژه‌ی دمو (reset=true)
```
> اگر هنوز migration ندارید: `bunx prisma migrate dev --name init` (محلی روی همان provider) سپس `db:deploy`.

### روش B — bootstrap از راه دور روی Vercel (بدون دسترسی محلی به DB)
۱. `DATABASE_URL` را ست کنید و schema را با یکی از این‌ها بسازید:
   - `prisma migrate deploy` در build، یا
   - یک‌بار `prisma db push` روی همان دیتابیس.
۲. `ENABLE_DEMO_BOOTSTRAP=true` و `BOOTSTRAP_SECRET=...` را ست کنید و دوباره deploy کنید.
۳. endpoint را فراخوانی کنید:
```bash
curl -X POST https://<your-domain>/api/bootstrap/demo-seed \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: <BOOTSTRAP_SECRET>" \
  -d '{}'
```
> پیش‌فرض **idempotent** است (داده حذف نمی‌شود). برای بازسازی کامل در preview: `-d '{"reset":true}'` (در production نادیده گرفته می‌شود).
۴. پس از موفقیت، `ENABLE_DEMO_BOOTSTRAP` را به `false` برگردانید.

## ۳. بررسی سلامت
```bash
curl https://<your-domain>/api/health
```
خروجی باید `database: "ok"` و `hasPlatformOwner: true` و `hasDemoUser: true` نشان دهد. اگر `database: "error"` بود، `DATABASE_URL` اشتباه است.

## ۴. ورود نمونه
- مدیر سامانه: `owner@civilic.ir` / `civilic` → هدایت به `/admin`
- کاربر پروژه: `preparer@sivantadbir.ir` / `civilic` → اپ کاربری `/`
- ورود به `callbackUrl` معتبر احترام گذاشته می‌شود (مثلاً `/login?callbackUrl=/admin`).

## ۵. مشکل Deployment Protection (مهم)
اگر پیش از رسیدن به صفحه‌ی ورود Civilic با صفحه‌ی احراز هویت **Vercel** مواجه می‌شوید، این محافظت استقرار Vercel است (نه Civilic). یکی از این‌ها را انجام دهید:
- Vercel → Project → Settings → **Deployment Protection** → برای Preview، **Vercel Authentication** را غیرفعال کنید، یا
- از **Shareable Link** (Protection Bypass) استفاده کنید، یا
- با همان حساب Vercel که به پروژه دسترسی دارد لاگین بمانید و سپس preview را باز کنید.

## ۶. نکات
- فایل ۷۰MB `Important project.svzt` **هرگز** در build یا route معمولی parse نمی‌شود؛ preview از داده‌ی seed استفاده می‌کند.
- `postinstall` به‌صورت خودکار `prisma generate` را اجرا می‌کند.
- اگر Supabase: حتماً پارامتر `?pgbouncer=true&connection_limit=1` یا رشته‌ی pooler را برای محیط serverless در نظر بگیرید.
