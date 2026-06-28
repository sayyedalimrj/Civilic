# Civilic Completion — Requirements

## مقدمه
تکمیل Civilic به یک سامانه‌ی واقعی، فارسی/RTL، گردش‌کار صورت‌وضعیت پروژه‌های عمرانی ایران با سازگاری import/export تکسا.

## نیازمندی‌ها (EARS)

### R1 — سازمان‌ها و طرفین
- WHEN یک پروژه ساخته یا import می‌شود، THE system SHALL سه طرف `EMPLOYER`/`CONSULTANT`/`CONTRACTOR` را به‌صورت `ProjectParty` متصل به `Organization` نگه دارد.
- THE system SHALL هر `User` را به یک `Organization` و در هر پروژه از طریق `ProjectMember` با `role` و `canSign`/`canApprove` متصل کند.

### R2 — نقش و دسترسی
- THE system SHALL یک permission matrix مرکزی داشته باشد و هر اقدام مهم را **سمت سرور** بررسی کند.
- IF کاربر مجوز لازم را نداشته باشد، THE system SHALL با خطای فارسی ۴۰۳ پاسخ دهد.

### R3 — احراز هویت
- THE system SHALL ورود/خروج واقعی، session، و کاربر فعلی از session داشته باشد؛ بدون کاربر hardcoded.

### R4 — گردش‌کار صورت‌وضعیت (۱۳ حالت)
- THE system SHALL ماشین حالت `DRAFT → SUBMITTED_BY_CONTRACTOR → UNDER_CONSULTANT_REVIEW → RETURNED_BY_CONSULTANT → RESUBMITTED_BY_CONTRACTOR → APPROVED_BY_CONSULTANT → SUBMITTED_TO_EMPLOYER → UNDER_EMPLOYER_REVIEW → RETURNED_BY_EMPLOYER → RESUBMITTED_TO_EMPLOYER → APPROVED_BY_EMPLOYER → PAYMENT_REGISTERED → LOCKED` را پیاده کند.
- WHEN انتقالی رخ می‌دهد، THE system SHALL مجوز را چک کند، `WorkflowAction`/audit ثبت کند، notification بسازد، پیام سیستمی در کانال مرتبط ارسال کند، و نسخه را حفظ کند.
- IF اقدام «برگشت» باشد، THE system SHALL یادداشت/دلیل را الزامی کند.
- THE system SHALL سند `LOCKED` را جز با override اداری قابل ویرایش نکند.

### R5 — تعدیل
- THE system SHALL تعدیل را با حالت‌های `DRAFT/SUBMITTED/UNDER_CONSULTANT_REVIEW/RETURNED/APPROVED_BY_CONSULTANT/SUBMITTED_TO_EMPLOYER/APPROVED_BY_EMPLOYER/LOCKED` و لینک به صورت‌وضعیت تأییدشده پیاده کند.

### R6 — چت گروهی
- THE system SHALL برای هر پروژه کانال‌های پیش‌فرض و برای هر صورت‌وضعیت کانال خودکار «صورت‌وضعیت شماره X» بسازد، با read receipt/mention/پیوست/پیام سیستمی و visibility بر اساس طرف.

### R7 — مکاتبات و اسناد
- THE system SHALL نامه با شماره/موضوع/فرستنده/گیرنده(ها)/وضعیت/پیوست و اتصال به entity، و اسناد با نسخه‌گذاری و دسته‌بندی فارسی نگه دارد.

### R8 — متره و صورتجلسات
- THE system SHALL متره/ریزمتره/خلاصه‌متره/صورتجلسه/دستورکار را با برچسب‌های فارسی (بدون نام جدول تکسا) نمایش دهد.

### R9 — سازگاری تکسا (بدون‌تلفات)
- THE system SHALL داده‌ی خام را ردیف‌محور حفظ کند، normalize به موجودیت محصول انجام دهد، export سازگار `NewDataSet` بسازد، و **گزارش round-trip** با درصد سازگاری تولید کند.

### R10 — UI/UX
- THE system SHALL فقط ۶ آیتم ناوبری اصلی و ۷ تب پروژه داشته باشد؛ داده خام تکسا فقط زیر «تنظیمات → پیشرفته».
- THE system SHALL کاملاً فارسی/RTL با تاریخ شمسی و اعداد فارسی در UI باشد.

### R11 — Vercel/Build
- THE system SHALL بدون `ignoreBuildErrors` بیلد شود؛ `typecheck`/`lint`/`prisma generate` سبز؛ PostgreSQL برای production؛ فایل ۷۰MB در build/route معمولی parse نشود.

### R12 — Seed واقعی
- THE system SHALL داده‌ی نمونه‌ی واقعی پروژه‌ی خاتم با سه طرف و کاربران نقش‌دار و نمونه‌های گردش‌کار بسازد تا preview بدون آپلود فایل مفید باشد.
