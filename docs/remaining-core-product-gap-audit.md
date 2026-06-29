# Civilic — Remaining Core Product Gap Audit
> فاز: Remaining Core Product Completion. مبنا: وضعیت پس از PR #4 (زیرساخت آپلود/پیوست امن).
> هر بخش: وضعیت (DONE / PARTIAL / MISSING) + فایل‌های فعلی + کار باقی‌مانده + اولویت.

## خلاصه‌ی مدیریتی
مدل داده تقریباً کامل است (Organization, ProjectParty, ProjectMember, TenantMember, OrganizationMember, Role/RoleTemplate, Payment/Adjustment/Measurement review tables, TexsaImport + TexsaRawRow + RoundTripReport, CalculationNode, Attachment). کتابخانه‌های تکسا (parse/analyze/preserve-raw/normalize/export/roundtrip) کامل‌اند. شکاف اصلی در سه جا متمرکز است:
1. **API/route‌های واسط** که کتابخانه‌های موجود را به UI وصل کنند (به‌ویژه ایمپورت تکسا server-file/normalize/progress/roundtrip و مدیریت سازمان/طرف/عضو).
2. **اتصال پیوست‌ها** فراتر از صورت‌وضعیت.
3. **بازطراحی UX** workspace پروژه و ویزاردها (بزرگ‌ترین کار باقی‌مانده، چندفازه).

---

## ۱) سیستم کاربر / احراز هویت — DONE
- فایل‌ها: `src/lib/auth/{auth-options,session,password,permissions}.ts`, `src/app/login/page.tsx`, `AuthSessionProvider`.
- NextAuth + bcrypt + session واقعی. `getCurrentUser`, `getProjectAccess`, `getPlatformAccess` موجود.
- باقی‌مانده: فلگ کاربر غیرفعال در همه‌ی مسیرها (تا حد زیادی از طریق `isActive` عضو پروژه پوشش داده شده).

## ۲) سازمان‌ها (Organization) — PARTIAL
- مدل: `Organization`, `OrganizationMember` موجود. ساخت سازمان فقط داخل `POST /api/projects` (هنگام ساخت طرف) یا seed.
- MISSING: endpoint مستقل `GET/POST /api/organizations` و UI فهرست/ساخت/ویرایش سازمان.
- اولویت: بالا. **(در این فاز افزوده شد)**

## ۳) عضویت Tenant — DONE (مدل) / PARTIAL (UI)
- مدل `TenantMember` + `getPlatformAccess`. مدیریت از طریق admin pages.

## ۴) ساخت پروژه — PARTIAL
- فایل: `src/app/api/projects/route.ts` (POST واقعی: project + parties + default channels)، `src/components/views/project/project-wizard.tsx` (UI).
- باقی‌مانده: انواع طرف فقط EMPLOYER/CONSULTANT/CONTRACTOR/OTHER بود (نه LAB/SUPPLIER/OPERATOR)؛ سازنده به‌عنوان عضو افزوده نمی‌شد؛ بدون audit. **(در این فاز: انواع طرف کامل شد، سازنده به‌عنوان عضو ORG_OWNER اضافه می‌شود، audit اضافه شد.)**
- باقی‌مانده‌ی UX کامل ویزارد ۶-مرحله‌ای: فاز بعد.

## ۵) طرف‌های پروژه (ProjectParty) — PARTIAL → DONE(API)
- MISSING بود: endpoint افزودن طرف به پروژه‌ی موجود.
- **(در این فاز افزوده شد:** `POST /api/projects/[id]/parties` با مجوز `members.edit` + audit.)**

## ۶) اعضای پروژه (ProjectMember) — MISSING → DONE(API)
- MISSING بود: endpoint افزودن/ویرایش/غیرفعال‌سازی عضو با نقش پروژه‌ای.
- **(در این فاز افزوده شد:** `GET/POST /api/projects/[id]/members` + `PATCH/DELETE /api/projects/[id]/members/[memberId]` با `members.invite/edit/disable` + audit. حذف/غیرفعال‌سازی → از دست رفتن فوری دسترسی.)**

## ۷) نقش‌ها و مجوزها — DONE
- `permissions.ts`: `ROLE_PERMISSIONS`, `permissionsForRole`, `requireProjectPermission`, `requirePlatformPermission`. نقش پروژه‌ای است (هر عضو role خود را دارد).

## ۸) آپلود امن — DONE (PR #4)
- `src/lib/auth/upload-security.ts`, `src/lib/storage/*`, `/api/uploads*`, `Attachment` model.

## ۹) اتصال پیوست‌ها — PARTIAL
- فقط در جزئیات صورت‌وضعیت (`payments-view`).
- **(در این فاز:** اتصال به تعدیل، متره و اسناد افزوده شد.)** باقی‌مانده: مکاتبات/صورتجلسه/چت — فاز بعد (همان `AttachmentsPanel`).

## ۱۰) آپلود/ایمپورت تکسا — PARTIAL → بهبود
- کتابخانه‌ها کامل: `src/lib/texsa/import/{parse-svzt,analyze-schema,preserve-raw,import-local}.ts`, `normalize/*`, `export/*` (شامل `generateRoundTripReport`).
- route‌های موجود: `texsa/import/preview`, `texsa/import/commit` (مسیر mirror-table)، `texsa/imports`, `imports/[id]`, `imports/[id]/tables`, `imports/[id]/export`.
- MISSING بود: `from-server-file`, `[id]/normalize`, `[id]/progress`, `[id]/roundtrip-report`.
- **(در این فاز افزوده شد** این چهار route با اتصال به کتابخانه‌های موجود + مجوز `texsa.import/export`.)**

## ۱۱) ایمپورت از فایل سرور — MISSING → DONE(API)
- **(در این فاز:** `POST /api/texsa/imports/from-server-file` فقط از داخل `TEXSA_UPLOAD_DIR` (بدون path traversal) با `importLocalSvzt`.)**

## ۱۲) جریان normalize/apply — PARTIAL
- `normalizeImport(importId, tenantId)` موجود. **(در این فاز:** route `normalize` افزوده شد که پروژه را می‌سازد/به‌روزرسانی می‌کند و `projectId` را روی import ذخیره می‌کند.)**

## ۱۳) workspace پروژه — PARTIAL
- `src/components/views/project/project-detail.tsx` + viewهای فراوان.
- باقی‌مانده: rail توالی محاسبات + side panel «اقدام بعدی/هشدارها/سازگاری تکسا» به‌صورت یکپارچه؛ کاهش تب‌ها. فاز UX بعد.

## ۱۴) UI متره / ریزمتره / خلاصه متره / برگه مالی — PARTIAL
- viewها: `detail-boq-view`, `summary-boq-view`, `financial-sheet-view`, `measurement-review-view`. redline برای متره موجود.
- باقی‌مانده: انتشار stale پایین‌دستی در همه‌ی نقاط ویرایش.

## ۱۵) UI صورت‌وضعیت — PARTIAL (نزدیک DONE)
- `payments-view` + `payment-review-view` + redline + پیوست. فیلترهای ردیف و bulk تا حدی موجود.

## ۱۶) UI تعدیل — PARTIAL
- `adjustment-view`, `adjustment-review-view`. **(پیوست در این فاز اضافه شد.)**

## ۱۷) UI رسیدگی Redline — DONE(هسته)
- `src/components/review/*`: `review-value-cell`, `strike-through-value`, `redline-review-panel`, `party-review-badge`, `provenance-badges`, `payment-review-view`, `adjustment-review-view`, `measurement-review-view`. لایه مشاور قرمز / کارفرما سبز + strikethrough.

## ۱۸) موتور وابستگی / stale — PARTIAL
- `CalculationNode` model + `src/lib/calculation/*`. باقی‌مانده: اتصال کامل به همه‌ی action‌های ویرایش/رسیدگی.

## ۱۹) گزارش round-trip — PARTIAL
- lib `generateRoundTripReport` + کامپوننت `texsa-compat-report.tsx`. **(در این فاز:** route `roundtrip-report` افزوده شد تا UI واقعی بتواند بخواند.)**

## ۲۰) بررسی‌های امنیتی — DONE(هسته)
- همه‌ی routeهای جدید: `getCurrentUser` + `getProjectAccess`/`getPlatformAccess` + مجوز + مرز tenant + audit.

## ۲۱) seed/داده‌ی دمو — DONE(پایه)
- `prisma/seed.ts` → `src/lib/seed/demo-seed.ts` (۲۵KB): owner پلتفرم، tenant، سازمان‌ها، کاربران، پروژه، طرف‌ها، اعضا، صورت‌وضعیت‌ها. خاتم فقط دمو.
- باقی‌مانده: نمونه‌ی stale پایین‌دستی صریح + نمونه‌ی پیوست + نمونه‌ی round-trip (فاز بعد).

---

## اولویت پیاده‌سازی این فاز (انجام‌شده در همین PR)
1. این سند ممیزی.
2. APIهای سازمان/طرف/عضو پروژه (با مجوز + audit).
3. route‌های ویزارد ایمپورت تکسا (from-server-file/normalize/progress/roundtrip-report).
4. اتصال پیوست به تعدیل/متره/اسناد.
5. به‌روزرسانی worklog + راستی‌آزمایی build/typecheck/lint.

## باقی‌مانده برای فازهای بعدی (شفاف)
- بازطراحی کامل UX workspace پروژه (rail توالی + side panel یکپارچه + کاهش تب).
- ویزارد ۶-مرحله‌ای ساخت پروژه و ویزارد UI ایمپورت تکسا به‌صورت گام‌به‌گام.
- اتصال پیوست به مکاتبات/صورتجلسه/چت.
- انتشار کامل stale در تمام نقاط ویرایش + اکشن‌های «بروزرسانی…».
- توسعه‌ی seed برای نمونه‌های redline/stale/attachment/round-trip.
