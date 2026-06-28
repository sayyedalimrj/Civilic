# Worklog — پلتفرم متره و برآورد سیوان تدبیر تجارت

## Project Status: فاز ۲ — توسعه‌ی ماژول‌های پیشرفته

### وضعیت فعلی
- پروژه‌ی Next.js 16 + TypeScript + Tailwind + shadcn/ui فعال روی پورت ۳۰۰۰
- تم RTL فارسی با فونت Vazirmatn و رنگ‌بندی کهربایی-سنگی
- دیتابیس SQLite با Prisma ORM شامل مدل‌های: Tenant, User, Project, DetailBoq, SummaryBoq, FinancialSheetItem, Chapter, Payment, PaymentItem, PriceList, PriceListItem, IndexRecord, Coefficient, CityDistance, MaterialRate
- Tenant اصلی: «سیوان تدبیر تجارت»
- کاربران: سید علی میرجعفری (مدیر/ADMIN)، احمد میرزایی (برآوردکار/ESTIMATOR)، مهندس رضایی (BILLER)
- ۳ پروژه نمونه: متروی تهران خط ۷، پل روگذار امام رضا (ع)، تونل ۲ بزرگراه امام علی
- ماژول‌های موجود: Dashboard, Projects, ProjectDetail (8 تب), BaseData, Reports, Users, Settings
- موتور محاسبات زنجیره‌ای (cascade.ts) با توابع خالص
- APIهای کامل برای تمام ماژول‌ها

### فاز ۲ — توسعه‌ی هم‌زمان (parallel subagents)
- **Task 2-A (Collaboration)**: پیام‌رسان داخلی + کامنت‌گذاری محتوایی + API + UI
- **Task 2-B (Workflow State Machine)**: stepper UI + state transition + قفل سند + state history
- **Task 2-C (Alert Engine)**: موتور هشدار + API + پنل هشدارها + seed
- **Task 2-D (Materials-at-Site + Bid Range)**: ماژول مصالح پای کار + دامنه قیمت پیشنهادی
- **Task 2-E (Excel with Formulas)**: خروجی Excel با فرمول‌های واقعی + بهبود PDF

### Schema additions (Phase 2)
- ProjectModule (فعال‌سازی ماژول‌ها در هر پروژه)
- Alert (هشدارهای هوشمند)
- ChatThread, ChatMessage (پیام‌رسان)
- Comment (کامنت‌گذاری محتوایی)
- MaterialAtSite (مصالح پای کار)
- BidRange (دامنه قیمت پیشنهادی)
- AuditLog (ثبت رویدادها)
- Payment: افزودن فیلدهای گردش کار (submittedBy/At, reviewedBy/At, reviewNote, lockedBy/At, stateHistory, dueDate)

### Phase 1 History
- Task MAIN: طراحی و راه‌اندازی پروژه + DESIGN.md + seed
- Task 4: Enhanced Dashboard
- Task 5-6: Enhanced Header (Cmd+K search, notification dropdown) + Sidebar
- Task 7: Enhanced Settings/Users/BaseData/Overview + Footer
- Task 10: Detail BOQ + Summary BOQ + Financial Sheet views
- Task 11: Chapters + Payments + Adjustment + Reports views


---

## Task ID: 2-ALL (Phase 2)
Agent: main-orchestrator (Z.ai Code)
Task: فاز ۲ — توسعه‌ی هم‌زمان ۵ ماژول پیشرفته

### Work Log:
- بازگردانی پروژه‌ی قبلی از tar فایل آپلودشده، restore کامل src/, prisma/, mini-services/, DESIGN.md, worklog.md
- راه‌اندازی dev server با watchdog برای پایداری (Next.js 16 روی پورت 3000)
- به‌روزرسانی tenant به «سیوان تدبیر تجارت» با کاربران سید علی میرجعفری (ADMIN/مدیر) و احمد میرزایی (ESTIMATOR/برآوردکار) و مهندس رضایی (BILLER)
- افزودن ۸ مدل جدید به Prisma schema:
  - `ProjectModule` (فعال‌سازی ماژول‌ها در هر پروژه)
  - `Alert` (هشدارهای هوشمند با ۶ نوع و ۳ severity)
  - `ChatThread`, `ChatMessage` (پیام‌رسان داخلی)
  - `Comment` (کامنت‌گذاری محتوایی با mention و resolve)
  - `MaterialAtSite` (مصالح پای کار)
  - `BidRange` (دامنه قیمت پیشنهادی)
  - `AuditLog` (ثبت رویدادها)
  - افزودن فیلدهای گردش کار به `Payment`: submittedBy/At, reviewedBy/At, reviewNote, lockedBy/At, stateHistory, dueDate
- اجرای `bun run db:push` برای اعمال schema
- توسعه‌ی seed.ts با داده‌های نمونه برای تمام مدل‌های جدید: ۷ هشدار، ۵ پیام چت، ۲ کامنت، ۳ مصالح پای کار، ۱ bid range، ۳ لاگ ممیزی
- ساخت ۱۵+ API endpoint جدید:
  - `/api/chat/threads` (GET, POST)
  - `/api/chat/threads/[threadId]/messages` (GET, POST)
  - `/api/chat/messages/[messageId]/read` (PATCH)
  - `/api/comments` (GET, POST)
  - `/api/comments/[id]/resolve` (PATCH)
  - `/api/comments/[id]` (DELETE)
  - `/api/alerts` (GET, POST)
  - `/api/alerts/[id]/read` (PATCH)
  - `/api/alerts/[id]/resolve` (PATCH)
  - `/api/projects/[id]/modules` (GET, PATCH)
  - `/api/projects/[id]/payments/[period]/transition` (POST)
  - `/api/projects/[id]/materials-at-site` (GET, POST)
  - `/api/projects/[id]/materials-at-site/[materialId]` (PATCH, DELETE)
  - `/api/projects/[id]/bid-range` (GET, POST)
- ساخت کامپوننت‌های UI:
  - `src/components/chat/chat-panel.tsx` — Sheet پیام‌رسان با لیست مکالمات + پیام‌ها + ارسال
  - `src/components/comments/comment-thread.tsx` — Popover کامنت با mention (@) + reply + resolve
  - `src/components/alerts/alerts-panel.tsx` — Sheet هشدارها با فیلتر (همه/خوانده‌نشده/بحرانی) + اقدام
  - `src/components/workflow/workflow-stepper.tsx` — Stepper سه‌مرحله‌ای + تاریخچه + دکمه‌های submit/approve/reject/reopen
  - `src/components/views/project/materials-site-view.tsx` — جدول مصالح پای کار + ۳ کارت آماری + فرم افزودن/ویرایش
  - `src/components/views/project/bid-range-view.tsx` — فرم slider + پیش‌نمایش زنده + کارت‌های کف/پیشنهاد/سقف
- ادغام در app-header.tsx: افزودن دکمه‌ی AlertCircle با badge (critical روسی و info کهربایی)، AlertsPanel sheet
- ادغام در project-detail.tsx: افزودن تب‌های «مصالح پای کار» و «دامنه قیمت»
- ادغام در payments-view.tsx: افزودن WorkflowStepper در بالای PaymentDetail
- به‌روزرسانی reports-view.tsx: جایگزینی CSV ساده با Excel واقعی (exceljs) با فرمول‌های واقعی:
  - `=D5*E5` برای مبلغ کل
  - `=SUM(F5:F14)` برای جمع کل
  - `=C2/SUM(C2:C8)` برای درصد فصل
  - سربرگ گرافیکی، RTL، grid lines off، رنگ متناوب
- نصب exceljs@4.4.0 برای خروجی Excel فرمول‌محور
- به‌روزرسانی DESIGN.md با ۶ بخش جدید فاز ۲ (بخش ۹-۱ تا ۱۰): Multi-Tenancy & RBAC، Iranian Base Data Engine، Alert System، Collaboration، Workflow & State Machine، Advanced Calculation Modules، Formulated Outputs، UI Wireframe v2، 5 نمونه API کلیدی، State Management Strategy
- اجرای `bun run lint` → EXIT=0 (zero errors)
- اجرای `npx tsc --noEmit` → zero errors (در فایل‌های پروژه)
- تست با agent-browser:
  - صفحه‌ی اصلی رندر می‌شود با «سلام، سید علی»
  - پنل AlertsPanel باز می‌شود با ۷ هشدار (فیلتر بحرانی کار می‌کند)
  - پنل ChatPanel باز می‌شود با ۲ مکالمه (میرزایی و رضایی) و تاریخچه‌ی پیام‌ها
  - پروژه‌ی مترو باز می‌شود با ۱۰ تب (شامل مصالح پای کار و دامنه قیمت)
  - تب «مصالح پای کار» نمایش می‌دهد: ۳ مصالح (سیمان، میلگرد آجدار، میلگرد ساده) با محاسبه‌ی remaining
  - تب «دامنه قیمت» نمایش می‌دهد: سقف ۱۱.۴ میلیارد، پیشنهاد بهینه، کف ۸٪ پایین‌تر
  - تب «صورت‌وضعیت» نمایش می‌دهد: WorkflowStepper با وضعیت «تأیید شده» + دکمه‌ی «بازگشایی»
  - تمام APIها (alerts, chat, modules, materials, bid-range) با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- فاز ۲ کامل شد: ۵ ماژول پیشرفته پیاده‌سازی شد (Collaboration, Workflow State Machine, Alert Engine, Materials-at-Site + Bid Range, Excel with Formulas)
- ۸ مدل جدید در Prisma schema
- ۱۵+ API endpoint جدید
- ۵ کامپوننت UI جدید + ادغام در header/payments/project-detail
- exceljs نصب شد و خروجی Excel با فرمول‌های واقعی پیاده شد
- DESIGN.md به ۶۹۴ خط گسترش یافت (افزودن بخش‌های فاز ۲)
- ESLint passes cleanly. TypeScript shows zero errors in new files.
- Dev server running cleanly at port 3000.
- همه‌ی تعاملات اصلی در agent-browser تست شد: alerts panel, chat panel, project tabs (materials-site, bid-range, payments workflow), reports.

### Unresolved Items / Next Phase Recommendations:
- پیاده‌سازی mini-service چت با WebSocket برای real-time (به جای polling)
- افزودن نقش‌های «مشاور» و «ناظر» با سطح دسترسی متمایز
- توسعه‌ی موتور هشدار با cron job برای بررسی خودکار موعد‌ها
- افزودن ماژول «تعدیل معکوس» (REVERSE_ADJUSTMENT) — schema آماده اما UI نیازمند توسعه
- پیاده‌سازی قفل هم‌زمانی واقعی با WebSocket (در حال حاضر lockedBy فقط در DB ثبت می‌شود)
- بهبود PDF با PDFKit یا jsPDF برای صفحه‌بندی دقیق‌تر
- افزودن NextAuth.js برای احراز هویت واقعی (در حال حاضر tenant-demo hardcode شده)

---

## Task ID: 3 (Phase 3) — UI/UX RTL Fixes + Advanced Modules
Agent: main-orchestrator (Z.ai Code)
Task: اصلاحات رابط کاربری و راست‌چین + موتور پشت‌سری + مستندسازی هوشمند + تفکیک گزارش تعدیل + گردش کار سخت‌گیرانه نقش‌ها

### Work Log:
- بررسی وضعیت پروژه و سرور dev (پورت ۳۰۰۰ فعال)
- **اصلاحات RTL و UI:**
  - اصلاح فلش نوار کناری: `ChevronLeft` (جمع‌شده) → `ChevronRight` (باز)
  - افزودن `ChevronRight` به imports در app-header.tsx
  - نوار کناری به‌طور پیش‌فرض جمع‌شده (sidebarCollapsed: true) در store.ts
  - هنگام ورود به جزئیات پروژه، نوار کناری باز می‌شود
  - حذف میانبرهای ⌘K و ⌘N از footer (page.tsx)
  - اصلاح دکمه‌های داشبورد در حالت روشن: از `bg-white/20 text-white` به `bg-white text-amber-700` با border مناسب
  - اصلاح BarChart برای RTL: `reversed` + `orientation="top"` روی XAxis + `orientation="right"` روی YAxis
  - فونت B Nazanin در Excel و Vazirmatn در PDF با fallback Tahoma
- **افزودن ۳ مدل جدید به Prisma schema:**
  - `DimensionFormula` — قالب‌های پشت‌سری قابل‌ذخیره و بازاستفاده
  - `DocumentFile` — مستندات با نام‌گذاری هوشمند `[کد پروژه]_[شماره SW]_[کد آیتم]_[تاریخ]_[توضیحات].پسوند`
  - `AdjustmentReportRow` — ردیف‌های گزارش تفکیک‌شده‌ی تعدیل (TEMPORARY/FINAL/REVERSE)
- **به‌روزرسانی مدل Payment** با گردش کار سخت‌گیرانه نقش‌ها:
  - فیلدهای جدید: `consultantApprovedBy/At`, `finalizedBy/At`, `rejectedBy/At`, `rejectReason`
  - وضعیت‌های جدید: `DRAFT → SUBMITTED → CONSULTANT_APPROVED → FINALIZED` (با `REJECTED` و `REOPENED`)
  - حذف فیلدهای قدیمی: `reviewedBy/At`, `reviewNote`
- **افزودن فیلدهای پشت‌سری به DetailBoq:** `dimensionFormulaId`, `dimensionParams`, `dimensionShape`
- اجرای `bun run db:push` و `bun run db:generate` برای اعمال schema
- **ایجاد ۸ API endpoint جدید:**
  - `/api/dimensions` (GET, POST) — لیست و ایجاد قالب‌های پشت‌سری
  - `/api/dimensions/[id]` (POST compute, PATCH, DELETE)
  - `/api/documents` (GET, POST multipart) — آپلود با نام‌گذاری هوشمند
  - `/api/documents/[id]` (DELETE) — حذف فایل
  - `/api/projects/[id]/adjustment-report` (GET) — گزارش تفکیک‌شده‌ی تعدیل با پاورقی قانونی
  - `/api/projects/[id]/payments/[period]/transition-v2` (POST) — گردش کار سخت‌گیرانه نقش‌ها
- **ایجاد ۴ کامپوننت UI جدید:**
  - `src/components/dimensions/dimension-calculator.tsx` — محاسبه‌گر پشت‌سری با ۶ شکل هندسی (مستطیل، دایره، ذوزنقه، مثلث، حفاری شیبدار، فقط تعداد) + ذخیره قالب
  - `src/components/documents/document-manager.tsx` — Popover آپلود/مشاهده/حذف فایل با نام‌گذاری هوشمند
  - `src/components/views/project/adjustment-report-view.tsx` — صفحه مستقل گزارش تعدیل با ۳ نوع (موقت/قطعی/معکوس)، جدول ۱۱ ستونه، مشخصات طرفین، پاورقی قانونی، خروجی Excel/چاپ PDF
  - `src/components/workflow/strict-workflow-stepper.tsx` — Stepper ۴ مرحله‌ای (پیمانکار→مشاور→کارفرما) با اعتبارسنجی نقش و قفل
- **ادغام در component‌های موجود:**
  - `DimensionCalculator` در QuantityCell از detail-boq-view (دکمه Calculator کنار هر مقدار)
  - `DocumentManager` در detail-boq-view (کنار CommentThread)
  - `StrictWorkflowStepper` در payments-view (جایگزین WorkflowStepper قدیمی)
  - تب جدید «گزارش تعدیل» در project-detail.tsx
- **تفکیک کامل صورت‌وضعیت و گزارش تعدیل:**
  - حذف ستون «تعدیل‌شده» از جدول اصلی PaymentItem در payments-view
  - حذف «مجموع تعدیل‌شده» از footer
  - ایجاد صفحه مستقل «گزارش تعدیل» با تمام ستون‌های لازم (فصل، دوره کارکرد، مبلغ کارکرد، نسبت مدت، شاخص مبنا، شاخص کارکرد، ضریب تعدیل، مبلغ قبلی، مبلغ فعلی، مابه‌التفاوت، مبلغ تعدیل)
  - پاورقی قانونی شامل بخشنامه‌ی ۱۳۹۴ و مشخصات کارفرما/مشاور/ناظر/پیمانکار
- **به‌روزرسانی seed.ts** با داده‌های نمونه:
  - payment1: FINALIZED با تاریخچه کامل گردش کار (DRAFT→SUBMITTED→CONSULTANT_APPROVED→FINALIZED)
  - payment2: SUBMITTED با dueDate و stateHistory
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - صفحه اصلی رندر می‌شود، نوار کناری جمع‌شده است
  - دکمه‌های داشبورد در حالت روشن دیده می‌شوند (bg-white با رنگ متن)
  - پروژه مترو باز می‌شود با ۱۱ تب (شامل «گزارش تعدیل» جدید)
  - تب «گزارش تعدیل» نمایش می‌دهد: ۳ دکمه نوع (موقت/قطعی/معکوس)، مشخصات طرفین (کارفرما/مشاور/ناظر/پیمانکار)، جدول با ۱۱ ستون، پاورقی قانونی با بخشنامه ۱۳۹۴
  - تب «صورت‌وضعیت» → باز کردن جزئیات: گردش کار سخت‌گیرانه نمایش داده می‌شود با وضعیت «قطعی» و «قفل (Read-Only)»
  - ستون «تعدیل‌شده» از جدول اصلی حذف شده است
  - همه‌ی APIهای جدید (dimensions, documents, adjustment-report, transition-v2) کار می‌کنند

### Stage Summary:
- ۳ مدل جدید در Prisma schema (DimensionFormula, DocumentFile, AdjustmentReportRow)
- ۸ API endpoint جدید
- ۴ کامپوننت UI جدید
- اصلاحات RTL کامل: فلش‌ها، نوار کناری، دکمه‌های داشبورد، نمودارها
- تفکیک کامل صورت‌وضعیت اصلی از گزارش تعدیل
- گردش کار سخت‌گیرانه نقش‌ها: پیمانکار→مشاور→کارفرما با قفل در هر مرحله
- موتور پشت‌سری با ۶ شکل هندسی و قابلیت ذخیره قالب
- سیستم مستندسازی با نام‌گذاری هوشمند
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.

### Unresolved Items / Next Phase:
- WebSocket برای قفل‌گذاری real-time (در حال حاضر lockedBy فقط در DB ثبت می‌شود)
- افزودن نقش‌های «مشاور» و «ناظر» به‌عنوان کاربران جداگانه
- موتور هشدار با cron job برای بررسی موعد‌ها
- بهبود خروجی Excel گزارش تعدیل با exceljs و فرمول‌های واقعی
- تعبیه فونت Vazirmatn در PDF (در حال حاضر از font-family با fallback استفاده می‌شود)
- تست آپلود فایل واقعی با agent-browser

---

## Task ID: 4 (Phase 4) — S-Curve Chart + Timeline/Gantt + Comparison Dashboard
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن نمودار S-Curve پیشرفت، نمای تایم‌لاین/گانت، و داشبورد مقایسه‌ی پروژه‌ها

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال روی پورت ۳۰۰۰، lint و TS تمیز
- تست QA با agent-browser: تمام ماژول‌های موجود کار می‌کنند (داشبورد، پروژه‌ها، جزئیات پروژه، ریزمتره با پشت‌سری، مستندات، گزارش تعدیل، صورت‌وضعیت با گردش کار سخت‌گیرانه)
- **ایجاد ۳ API endpoint جدید:**
  - `/api/projects/[id]/scurve` — داده‌های نمودار S-Curve با:
    - داده‌های واقعی (actual) بر اساس صورت‌وضعیت‌های تجمعی
    - داده‌های برنامه‌ریزی‌شده (planned) با فرمول منحنی S: `100 × (1 - cos(πt)) / 2`
    - پیش‌بینی آینده (forecast) بر اساس میانگین نرخ اجرا
    - KPIها: actualPercent, plannedPercentNow, SPI (Schedule Performance Index), remainingAmount, estimatedRemainingPeriods
    - توزیع فصول (chapterDistribution)
  - `/api/projects/[id]/timeline` — داده‌های تایم‌لاین/گانت با:
    - فازها (بر اساس فصول پروژه با تاریخ شروع/پایان و درصد پیشرفت)
    - Milestone‌ها (صورت‌وضعیت‌ها با وضعیت، مبلغ، موعد)
    - موعدهای آینده (هشدارهای زمان‌بندی)
    - summary: totalPhases, completedPhases, totalMilestones, finalizedMilestones, upcomingAlerts
  - `/api/dashboard/comparison` — مقایسه‌ی پروژه‌ها با:
    - متریک‌های هر پروژه: contractAmount, executedAmount, progressPercent, healthScore, healthStatus
    - محاسبه‌ی healthScore بر اساس: وضعیت، پیشرفت، تعداد هشدارها، صورت‌وضعیت‌های در انتظار
    - totals: میانگین پیشرفت، تعداد پروژه‌های سالم/هشدار/بحرانی
- **ایجاد ۳ کامپوننت UI جدید:**
  - `src/components/charts/s-curve-chart.tsx` — نمودار S-Curve با:
    - ComposedChart از recharts با Area + Line
    - ۴ کارت KPI (پیشرفت واقعی، برنامه‌ریزی‌شده، SPI، تخمین تکمیل)
    - ۳ سری داده: واقعی (amber)، برنامه‌ریزی (slate dashed)، پیش‌بینی (emerald dotted)
    - Tooltip فارسی RTL
    - ReferenceLine در ۱۰۰٪
    - توزیع فصول با progress bar رنگی
  - `src/components/timeline/project-timeline.tsx` — نمای تایم‌لاین/گانت با:
    - ۵ کارت summary (کل فازها، تکمیل‌شده، کل milestone‌ها، قطعی‌شده، هشدارهای آینده)
    - نمودار گانت فازها با position‌گذاری درصدی بر اساس تاریخ
    - لیست Milestone‌های صورت‌وضعیت با badge وضعیت رنگی
    - لیست موعد و هشدارهای آینده با severity
  - `src/components/views/project-comparison-view.tsx` — داشبورد مقایسه‌ای با:
    - ۴ کارت totals (کل پروژه‌ها، مبلغ پیمان، میانگین پیشرفت، هشدارها)
    - نمای کلی سلامت (۳ کارت: سالم/هشدار/بحرانی با درصد)
    - جدول مقایسه‌ی پروژه‌ها با ۸ ستون + progress bar + health badge
    - جدول clickable — کلیک روی پروژه به جزئیات می‌رود
    - بهترین پروژه‌ها (Top 3 بر اساس پیشرفت)
    - پروژه‌های نیازمند توجه (3 پروژه با کمترین healthScore)
- **ادغام در سیستم:**
  - افزودن ViewMode `"comparison"` به store.ts
  - افزودن ProjectTab `"timeline"` به store.ts
  - افزودن تب «تایم‌لاین» به project-detail.tsx (با آیکون GanttChart)
  - افزودن SCurveChart به overview-view.tsx (قبل از Quick Access Modules)
  - افزودن دکمه‌ی «مقایسه پروژه‌ها» به sidebar (با آیکون Activity)
  - افزودن ProjectComparison به page.tsx
  - به‌روزرسانی VIEW_LABELS و TAB_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - داشبورد مقایسه‌ای باز می‌شود با ۴ کارت totals، نمای سلامت (سالم/هشدار/بحرانی)، جدول مقایسه
  - نمودار S-Curve در overview نمایش داده می‌شود با KPIها (شاخص زمان‌بندی SPI، تخمین تکمیل)
  - تب «تایم‌لاین» نمایش می‌دهد: گانت فازها، milestone‌های صورت‌وضعیت، موعد و هشدارهای آینده
  - کلیک روی پروژه در جدول مقایسه به جزئیات پروژه می‌رود
  - تمام APIهای جدید (scurve, timeline, comparison) با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- ۳ API endpoint جدید (scurve, timeline, comparison)
- ۳ کامپوننت UI جدید (SCurveChart, ProjectTimeline, ProjectComparison)
- ۱ ViewMode جدید (comparison) + ۱ ProjectTab جدید (timeline)
- نمودار S-Curve با منحنی برنامه‌ریزی + واقعی + پیش‌بینی + KPIها
- نمودار گانت فازها با position‌گذاری زمانی
- داشبورد مقایسه‌ای با health score و ranking
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- افزودن قابلیت drag-and-drop برای تغییر تاریخ فازها در گانت
- نمودار S-Curve با قابلیت zoom و pan
- افزودن فیلتر به داشبورد مقایسه (بر اساس وضعیت، سال، موقعیت)
- export خروجی PDF/Excel از داشبورد مقایسه
- افزودن WebSocket برای به‌روزرسانی real-time نمودارها
- پیاده‌سازی通知 preferences (کاربر انتخاب کند کدام هشدارها را دریافت کند)
- افزودن ماژول مدیریت ریسک پروژه
- نقشه‌ی حرارتی (heatmap) فعالیت‌های کاربران

---

## Task ID: 5 (Phase 5) — Cost Analysis + Cash Flow + Risk Management
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن تحلیل هزینه، پیش‌بینی جریان نقدی، و ماژول مدیریت ریسک

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، مقایسه‌ی پروژه‌ها، S-Curve، تایم‌لاین همگی سالم
- **ایجاد ۴ API endpoint جدید:**
  - `/api/projects/[id]/cost-analysis` — تحلیل هزینه به ۴ عامل (دستمزد ۲۵٪، ماشین ۱۵٪، مصالح ۵۵٪، حمل ۵٪) + توزیع فصلی + ۱۰ آیتم برتر + کسورات
  - `/api/projects/[id]/cash-flow` — پیش‌بینی جریان نقدی با ۴ دوره آینده + KPIها (درآمد، هزینه، تراز، حاشیه‌ی سود، نقطه‌ی سربه‌سر)
  - `/api/projects/[id]/risks` (GET, POST) — لیست و ایجاد ریسک
  - `/api/projects/[id]/risks/[riskId]` (PATCH, DELETE) — ویرایش و حذف ریسک
- **افزودن مدل Risk به Prisma schema:**
  - فیلدها: title, description, category (FINANCIAL/SCHEDULE/TECHNICAL/CONTRACTUAL/ENVIRONMENTAL/SAFETY)
  - probability, impact, riskScore, severity (LOW/MEDIUM/HIGH/CRITICAL)
  - status (IDENTIFIED/ANALYZED/MITIGATING/MONITORING/CLOSED)
  - response (AVOID/TRANSFER/MITIGATE/ACCEPT), mitigation, contingency, owner, dueDate, estimatedCost
- اجرای `bun run db:push` و `bun run db:generate` برای اعمال schema
- **ایجاد ۳ کامپوننت UI جدید:**
  - `src/components/views/project/cost-analysis-view.tsx`:
    - ۴ کارت KPI (مبلغ کل، اجرا شده، کسورات، میانگین آیتم)
    - PieChart توزیع عوامل چهارگانه با innerRadius
    - Stacked BarChart توزیع هزینه بر اساس فصول
    - جدول ۱۰ آیتم برتر با ۹ ستون + progress bar سهم
    - ۴ کارت تفکیک کسورات قانونی (تضمین، بیمه، مالیات، جمع)
  - `src/components/views/project/cash-flow-view.tsx`:
    - ۴ کارت KPI (درآمد، هزینه، تراز نقدی، حاشیه‌ی سود)
    - ComposedChart جریان نقدی تجمعی (Area درآمد + Area هزینه + Line تراز)
    - BarChart درآمد و هزینه‌ی هر دوره
    - جدول تفصیلی با پیش‌بینی‌های آینده
    - ۲ کارت insight (سوددهی/زیان + نقطه‌ی سربه‌سر)
  - `src/components/views/project/risk-management-view.tsx`:
    - ۴ کارت summary (کل، بحرانی+بالا، میانگین امتیاز، هزینه‌ی تخمینی)
    - توزیع ریسک بر اساس شدت (۴ کارت با progress bar)
    - ماتریس ریسک ۵×۵ (احتمال × تأثیر) با رنگ‌بندی heat map
    - لیست ریسک‌ها با badge شدت/دسته/وضعیت + اقدامات کاهش
    - Dialog افزودن/ویرایش با slider برای probability/impact + محاسبه‌ی زنده‌ی riskScore
- **به‌روزرسانی seed.ts** با ۶ ریسک نمونه (مالی، زیست‌محیطی، قراردادی، ایمنی، فنی)
- **ادغام در سیستم:**
  - افزودن ProjectTab‌های `"cost-analysis"`, `"cash-flow"`, `"risks"` به store.ts
  - افزودن ۳ تب جدید به project-detail.tsx (با آیکون‌های Wallet, DollarSign, Shield)
  - به‌روزرسانی TAB_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - تب «تحلیل هزینه»: PieChart ۴ عامل (دستمزد ۲۵٪، ماشین ۱۵٪، مصالح ۵۵٪، حمل ۵٪) + جدول ۱۰ آیتم برتر
  - تب «جریان نقدی»: نمودار تجمعی درآمد/هزینه/تراز + KPIها + جدول تفصیلی
  - تب «ریسک»: ۴ کارت summary + ماتریس ۵×۵ + لیست ۶ ریسک + ۲ ریسک بحرانی/بالا
  - تمام APIهای جدید با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- ۴ API endpoint جدید (cost-analysis, cash-flow, risks, risks/[id])
- ۱ مدل جدید در Prisma (Risk با ۱۵+ فیلد)
- ۳ کامپوننت UI جدید (CostAnalysisView, CashFlowView, RiskManagementView)
- ۳ ProjectTab جدید (cost-analysis, cash-flow, risks)
- ۶ ریسک نمونه در seed
- نمودارهای پیشرفته: PieChart, Stacked BarChart, ComposedChart, Risk Matrix 5×5
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- افزودن نمودار میلگی (Gantt) تعاملی با drag-and-drop
- export خروجی PDF از گزارش تحلیل هزینه و جریان نقدی
- افزودن ماژول مدیریت تغییرات (Change Management)
- پیاده‌سازی سامانه‌ی ارزیابی تأمین‌کنندگان (Supplier Evaluation)
- افزودن داشبورد KPI سازمانی (مجموع تمام پروژه‌ها)
- نمودار رادار (Radar Chart) برای ارزیابی چندبعدی پروژه‌ها
- افزودن هوش مصنوعی برای پیش‌بینی ریسک بر اساس داده‌های تاریخی

---

## Task ID: 6 (Phase 6) — Supplier Management + Change Orders + Org KPI Dashboard
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن ماژول تأمین‌کنندگان، مدیریت تغییرات، و داشبورد KPI سازمانی

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، مقایسه، S-Curve، تحلیل هزینه، جریان نقدی، ریسک همگی سالم
- **افزودن ۴ مدل جدید به Prisma schema:**
  - `Supplier` — تأمین‌کنندگان با rating, totalOrders, totalValue, onTimeRate, qualityScore
  - `SupplierOrder` — سفارشات تأمین‌کننده با status (PENDING/ORDERED/DELIVERED/RECEIVED/CANCELLED)
  - `ChangeOrder` — درخواست‌های تغییر با type (SCOPE/DESIGN/SCHEDULE/COST/MATERIAL), priority, costImpact, scheduleImpact, status (SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/IMPLEMENTED)
  - `CalendarEvent` — رویدادهای تقویمی با type (DEADLINE/MEETING/INSPECTION/DELIVERY/PAYMENT/MILESTONE)
- اجرای `bun run db:push` و `bun run db:generate` برای اعمال schema
- **ایجاد ۷ API endpoint جدید:**
  - `/api/suppliers` (GET, POST) — لیست و ایجاد تأمین‌کننده
  - `/api/suppliers/[id]` (PATCH, DELETE) — ویرایش و حذف
  - `/api/projects/[id]/supplier-orders` (GET, POST) — سفارشات پروژه
  - `/api/projects/[id]/change-orders` (GET, POST) — درخواست‌های تغییر
  - `/api/projects/[id]/change-orders/[changeId]` (PATCH, DELETE) — بررسی/حذف
  - `/api/calendar` (GET, POST) — رویدادهای تقویم
  - `/api/calendar/[id]` (PATCH, DELETE) — ویرایش/حذف رویداد
  - `/api/dashboard/org-kpi` (GET) — KPIهای سازمانی با ۲۵+ متریک
- **ایجاد ۳ کامپوننت UI جدید:**
  - `src/components/views/supplier-management-view.tsx`:
    - ۴ کارت KPI (کل، میانگین امتیاز، ارزش کل، دسته‌بندی‌ها)
    - فیلتر دسته‌بندی (همه/مصالح/تجهیزات/نیروی انسانی/خدمات)
    - Grid کارت‌های تأمین‌کننده با star rating, contact info, stats
    - Dialog افزودن/ویرایش با ۸ فیلد
  - `src/components/views/project/change-order-view.tsx`:
    - ۵ کارت summary (کل، در انتظار، تأیید/اجرا، تأثیر مالی، تأثیر زمانی)
    - لیست درخواست‌های تغییر با badge نوع/اولویت/وضعیت + تأثیر مالی و زمانی
    - Dialog ایجاد با ۶ فیلد + تأثیر مثبت/منفی
    - Dialog بررسی با تأیید/رد + یادداشت
    - دکمه «اجرا شد» برای تغییرات تأییدشده
  - `src/components/views/org-kpi-dashboard.tsx`:
    - Header گرافیکی با gradient amber/orange
    - ۱۲ کارت KPI در ۲ ردیف (پروژه‌ها، مبلغ پیمان، اجرا، خالص پرداخت، هشدارها، ریسک‌ها، تغییرات، تأمین‌کنندگان، مستندات، ...)
    - RadialBarChart پیشرفت کلی سازمان
    - AreaChart روند ۶ ماهه
    - جدول تجزیه‌ی پروژه‌ها با progress bar + clickable
    - ۲ کارت وضعیت ریسک و تغییرات
- **به‌روزرسانی seed.ts** با داده‌های نمونه:
  - ۷ تأمین‌کننده (فولاد مبارکه، سیمان فارس، ذوب آهن، ...)
  - ۵ درخواست تغییر با وضعیت‌های مختلف (APPROVED, IMPLEMENTED, UNDER_REVIEW, SUBMITTED, REJECTED)
- **ادغام در سیستم:**
  - افزودن ViewMode‌های `"org-kpi"`, `"suppliers"`, `"calendar"` به store.ts
  - افزودن ProjectTab `"change-orders"` به store.ts
  - افزودن ۳ دکمه‌ی ناوبری جدید به sidebar (داشبورد سازمانی، تأمین‌کنندگان)
  - افزودن تب «تغییرات» به project-detail.tsx (با آیکون GitPullRequest)
  - به‌روزرسانی VIEW_LABELS و TAB_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - داشبورد KPI سازمانی: ۱۲ کارت KPI + RadialBarChart پیشرفت ۱۳.۲٪ + جدول پروژه‌ها
  - مدیریت تأمین‌کنندگان: ۷ تأمین‌کننده با star rating + فیلتر دسته‌بندی
  - تب «تغییرات»: ۵ درخواست با CO-001 تا CO-003 + تأثیر مالی ۹۰۰ میلیون + تأثیر زمانی ۶۰ روز
  - تمام APIهای جدید با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- ۴ مدل جدید در Prisma (Supplier, SupplierOrder, ChangeOrder, CalendarEvent)
- ۸ API endpoint جدید
- ۳ کامپوننت UI جدید (SupplierManagementView, ChangeOrderView, OrgKPIDashboard)
- ۳ ViewMode جدید + ۱ ProjectTab جدید
- ۷ تأمین‌کننده + ۵ درخواست تغییر در seed
- نمودارهای پیشرفته: RadialBarChart, AreaChart, star ratings
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- پیاده‌سازی Calendar View کامل (نماهای ماه/هفته/روز)
- افزودن ماژول مدیریت قراردادها (Contract Management)
- نمودار رادار (Radar Chart) برای ارزیابی چندبعدی پروژه‌ها
- export خروجی PDF/Excel از داشبورد KPI سازمانی
- افزودن نقشه‌ی حرارتی فعالیت کاربران (User Activity Heatmap)
- پیاده‌سازی WebSocket برای به‌روزرسانی real-time
- افزودن هوش مصنوعی برای پیش‌بینی ریسک و تأخیر
- ماژول گزارش‌گیری پیشرفته با BI Dashboard

---

## Task ID: 7 (Phase 7) — Calendar View + Contract Management
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن تقویم پروژه (نمای ماه شمسی) و ماژول مدیریت قراردادها

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، مقایسه، KPI سازمانی، تأمین‌کنندگان همگی سالم
- **افزودن ۲ مدل جدید به Prisma schema:**
  - `Contract` — قراردادها با contractNo, type (MAIN/SUBCONTRACT/SUPPLY/SERVICE/CONSULTANCY), partyName, partyRole, contractAmount, advancePayment, retentionPct, signDate, startDate, endDate, durationDays, status
  - `ContractMilestone` — milestone‌های قرارداد با title, dueDate, completedDate, amount, status (PENDING/COMPLETED/OVERDUE)
- اجرای `bun run db:push` و `bun run db:generate` برای اعمال schema
- **ایجاد ۳ API endpoint جدید:**
  - `/api/projects/[id]/contracts` (GET, POST) — لیست و ایجاد قرارداد
  - `/api/projects/[id]/contracts/[contractId]` (PATCH, DELETE, POST milestone) — ویرایش، حذف، افزودن milestone
  - (Calendar API قبلاً ایجاد شده بود: `/api/calendar` و `/api/calendar/[id]`)
- **ایجاد ۲ کامپوننت UI جدید:**
  - `src/components/views/calendar-view.tsx`:
    - تقویم ماه شمسی کامل با تبدیل میلادی↔شمسی
    - ۷ روز هفته فارسی (شنبه تا جمعه)
    - ۱۲ ماه شمسی (فروردین تا اسفند)
    - Grid ۷×۶ با روزهای ماه قبل/بعد
    - نمایش رویدادها در هر روز با badge رنگی
    - ناوبری ماه (قبلی/بعدی/امروز)
    - پنل رویدادهای آینده (سایدبار راست)
    - Dialog افزودن رویداد با ۶ فیلد
    - Dialog جزئیات رویداد با تکمیل/حذف
    - ۷ نوع رویداد: DEADLINE, MEETING, INSPECTION, DELIVERY, PAYMENT, MILESTONE, OTHER
  - `src/components/views/project/contract-management-view.tsx`:
    - ۵ کارت summary (کل قراردادها، مبلغ کل، پیش‌پرداخت، milestone‌ها، پیش‌نویس)
    - لیست قراردادها با badge نوع/وضعیت + اطلاعات طرف مقابل
    - پنل expandable با جزئیات مالی (مبلغ، پیش‌پرداخت، سپرده)
    - لیست milestone‌ها با progress bar + badge وضعیت (تکمیل/در انتظار/تأخیر)
    - Dialog افزودن/ویرایش قرارداد با ۱۲ فیلد
    - Dialog افزودن milestone
    - ۵ نوع قرارداد: MAIN, SUBCONTRACT, SUPPLY, SERVICE, CONSULTANCY
    - ۵ وضعیت: DRAFT, SIGNED, ACTIVE, COMPLETED, TERMINATED
- **به‌روزرسانی seed.ts** با داده‌های نمونه:
  - ۴ قرارداد (اصل مترو، پیمان فرعی تهویه، پل روگذار، تأمین میلگرد)
  - ۳ milestone برای هر قرارداد (تحویل موقت، رفع نواقص، تحویل قطعی)
  - ۱۰ رویداد تقویم (بازرسی، جلسه، موعد، تحویل، پرداخت، milestone)
- **ادغام در سیستم:**
  - افزودن ProjectTab `"contracts"` به store.ts
  - افزودن تب «قراردادها» به project-detail.tsx (با آیکون ScrollText)
  - افزودن CalendarView به page.tsx
  - افزودن دکمه‌ی «تقویم پروژه» به sidebar (با آیکون CalendarDays)
  - به‌روزرسانی TAB_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - تقویم پروژه: نمایش ماه شمسی با روزهای هفته فارسی + رویدادهای رنگی + پنل رویدادهای آینده
  - تب «قراردادها»: نمایش CON-1403-003 با نوع «قرارداد اصلی» و وضعیت «فعال» + progress bar milestone‌ها
  - تمام APIهای جدید با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- ۲ مدل جدید در Prisma (Contract, ContractMilestone)
- ۳ API endpoint جدید (contracts, contracts/[id], calendar موجود)
- ۲ کامپوننت UI جدید (CalendarView, ContractManagementView)
- ۱ ProjectTab جدید (contracts)
- ۴ قرارداد + ۱۲ milestone + ۱۰ رویداد تقویم در seed
- تقویم شمسی کامل با تبدیل میلادی↔شمسی
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- افزودن نماهای هفته و روز به تقویم
- Radar Chart برای ارزیابی چندبعدی پروژه‌ها
- export خروجی PDF/Excel از قراردادها
- افزودن قابلیت drag-and-drop برای جابجایی رویدادهای تقویم
- ماژول مدیریت اسناد و بایگانی
- داشبورد BI پیشرفته با فیلترهای چندگانه
- نقشه‌ی حرارتی فعالیت کاربران
- WebSocket برای به‌روزرسانی real-time تقویم

---

## Task ID: 8 (Phase 8) — Radar Chart + BI Dashboard + Activity Heatmap
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن نمودار رادار ارزیابی چندبعدی، داشبورد BI پیشرفته، و نقشه‌ی حرارتی فعالیت کاربران

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، مقایسه، KPI سازمانی، تقویم، قراردادها همگی سالم
- **ایجاد ۳ API endpoint جدید:**
  - `/api/projects/[id]/radar` — ارزیابی ۸ محوره (پیشرفت، کیفیت، زمان‌بندی، مالی، ایمنی، مستندات، ریسک، رضایت) + benchmark سازمانی + توصیه‌های هوشمند
  - `/api/dashboard/bi` — داشبورد BI با فیلترهای پیشرفته (status, year, minAmount, maxAmount, sortBy) + متریک‌های کامل + filters metadata
  - `/api/dashboard/activity` — نقشه‌ی حرارتی فعالیت ۷×۲۴ (روز هفته × ساعت) + رتبه‌بندی کاربران + ساعات/روزهای اوج
- **ایجاد ۳ کامپوننت UI جدید:**
  - `src/components/views/project/radar-chart-view.tsx`:
    - کارت امتیاز کلی با health status (HEALTHY/WARNING/CRITICAL)
    - RadarChart از recharts با ۸ محور + مقایسه با benchmark سازمان
    - لیست امتیاز هر محور با progress bar + مقایسه با میانگین
    - توصیه‌های هوشمند با priority (HIGH/MEDIUM/LOW) و رنگ‌بندی
  - `src/components/views/bi-dashboard.tsx`:
    - پنل فیلترهای پیشرفته (وضعیت، سال، حداقل/حداکثر مبلغ، مرتب‌سازی)
    - ۶ کارت KPI (پروژه‌ها، مبلغ پیمان، میانگین پیشرفت، ریسک‌ها، تغییرات، سلامت)
    - BarChart مبلغ پیمان vs اجرا
    - PieChart توزیع سلامت پروژه‌ها
    - ScatterChart تحلیل ریسک vs پیشرفت (حباب = مبلغ پیمان)
    - جدول پروژه‌های فیلترشده با progress bar + clickable
  - `src/components/views/activity-heatmap.tsx`:
    - ۴ کارت KPI (کل فعالیت‌ها، کاربران فعال، ساعت اوج، روز اوج)
    - ماتریس حرارتی ۷×۲۴ با رنگ‌بندی ۶ سطحی
    - رتبه‌بندی کاربران (Top 3 با مدال)
    - نمودار میله‌ای فعالیت ساعتی
    - نمودار میله‌ای فعالیت روزانه
- **ادغام در سیستم:**
  - افزودن ViewMode‌های `"bi-dashboard"`, `"activity"` به store.ts
  - افزودن ProjectTab `"radar"` به store.ts
  - افزودن تب «ارزیابی رادار» به project-detail.tsx (با آیکون Target)
  - افزودن BIDashboard و ActivityHeatmap به page.tsx
  - افزودن ۲ دکمه‌ی ناوبری جدید به sidebar (داشبورد BI با BarChart3، نقشه فعالیت با Flame)
  - به‌روزرسانی VIEW_LABELS و TAB_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - داشبورد BI: فیلترها کار می‌کنند، ۶ کارت KPI، BarChart پیمان vs اجرا، PieChart سلامت، ScatterChart ریسک
  - نقشه فعالیت: ماتریس ۷×۲۴ با رنگ‌بندی، رتبه‌بندی کاربران، نمودار ساعتی و روزانه
  - ارزیابی رادار: ۸ محور با امتیاز، benchmark سازمان، توصیه‌های هوشمند، وضعیت بحرانی
  - تمام APIهای جدید با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- ۳ API endpoint جدید (radar, bi, activity)
- ۳ کامپوننت UI جدید (RadarChartView, BIDashboard, ActivityHeatmap)
- ۲ ViewMode جدید + ۱ ProjectTab جدید
- نمودارهای پیشرفته: RadarChart, ScatterChart, Heatmap, PieChart, BarChart
- توصیه‌های هوشمند بر اساس امتیاز محورها
- فیلترهای پیشرفته BI (۵ فیلتر)
- نقشه‌ی حرارتی ۷×۲۴ با ۶ سطح رنگی
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- افزودن قابلیت drill-down به داشبورد BI
- export خروجی PDF/Excel از رادار و BI
- افزودن نماهای هفته و روز به تقویم
- WebSocket برای به‌روزرسانی real-time
- ماژول مدیریت اسناد و بایگانی پیشرفته
- داشبورد پیش‌بینی با هوش مصنوعی
- گنجاندن نقشه‌ی جغرافیایی پروژه‌ها
- افزودن notification preferences

---

## Task ID: 9 (Phase 9) — Project Map + Document Archive + Notification Preferences
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن نقشه‌ی جغرافیایی پروژه‌ها، آرشیو مرکزی مستندات، و تنظیمات اعلان‌ها

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال اما خطای ۵۰۰ به دلیل duplicate import `FolderOpen` در sidebar
- **رفع باگ بحرانی:** حذف duplicate import `FolderOpen` از app-sidebar.tsx — سرور از ۵۰۰ به ۲۰۰ برگشت
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- **افزودن فیلدهای جغرافیایی به مدل Project:**
  - `latitude` (Float?) — عرض جغرافیایی
  - `longitude` (Float?) — طول جغرافیایی
- اجرای `bun run db:push` و `bun run db:generate`
- **به‌روزرسانی seed.ts** با مختصات جغرافیایی پروژه‌ها:
  - متروی تهران: 35.7155°N, 51.4022°E
  - پل روگذار: 35.6892°N, 51.3890°E
  - تونل ۲: 35.7742°N, 51.4683°E
- **افزودن ۷ مستند نمونه** به seed برای آرشیو (عکس کارگاه، صورت‌جلسه، نقشه، فاکتور، قرارداد، گزارش)
- **ایجاد ۳ API endpoint جدید:**
  - `/api/projects/map` — داده‌های جغرافیایی پروژه‌ها با lat/lng + summary
  - `/api/documents/archive` — آرشیو مرکزی مستندات با فیلتر category + summary
  - `/api/user/notifications` (GET, PATCH) — تنظیمات اعلان کاربر
- **ایجاد ۳ کامپوننت UI جدید:**
  - `src/components/views/project-map-view.tsx`:
    - نقشه‌ی SVG با position‌گذاری درصدی pin‌ها
    - pin‌های رنگی بر اساس وضعیت (فعال=سبز، پیش‌نویس=کهربایی)
    - pulse animation برای پروژه‌های فعال
    - popup جزئیات پروژه با progress bar + دکمه «مشاهده جزئیات»
    - لیست پروژه‌ها در سایدبار
    - legend راهنما
    - ۴ کارت KPI (کل، میانگین پیشرفت، مبلغ کل، مناطق فعال)
  - `src/components/views/document-archive-view.tsx`:
    - ۴ کارت KPI (کل فایل‌ها، حجم کل، دسته‌بندی‌ها، آخرین آپلود)
    - فیلتر دسته‌بندی (۷ دسته با badge شمارش)
    - جستجوی متنی
    - Grid کارت‌های مستندات با icon دسته، نام هوشمند، حجم، تاریخ، آپلودکننده
    - دکمه دانلود برای هر فایل
  - `src/components/views/notification-preferences-view.tsx`:
    - ۷ تنظیم نوع اعلان (صورت‌وضعیت، ریزمتره، گردش کار، زمان‌بندی، ریسک، چت، mention)
    - فیلتر شدت (فقط بحرانی)
    - کانال‌های دریافت (درون‌برنامه‌ای، ایمیلی)
    - ساعات آرامش (Quiet Hours) با time picker
    - خلاصه‌ی روزانه (Digest) با ساعت ارسال
    - Switch toggles برای همه‌ی تنظیمات
- **ادغام در سیستم:**
  - افزودن ViewMode‌های `"map"`, `"archive"`, `"notifications"` به store.ts
  - افزودن ProjectMapView, DocumentArchiveView, NotificationPreferences به page.tsx
  - افزودن ۳ دکمه‌ی ناوبری جدید به sidebar (نقشه پروژه‌ها با MapPin، آرشیو مستندات با FolderOpen، تنظیمات اعلان‌ها با Bell)
  - به‌روزرسانی VIEW_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - نقشه‌ی پروژه‌ها: ۳ pin با موقعیت جغرافیایی، popup جزئیات، progress bar
  - آرشیو مستندات: ۷ فایل با نام‌گذاری هوشمند، دسته‌بندی، دانلود
  - تنظیمات اعلان‌ها: ۷ toggle نوع، فیلتر بحرانی، quiet hours، digest
  - تمام APIهای جدید با curl تست شدند و 200 برمی‌گردانند

### Stage Summary:
- رفع باگ بحرانی duplicate import (سرور از 500 به 200)
- ۲ فیلد جدید در مدل Project (latitude, longitude)
- ۳ API endpoint جدید (map, archive, notifications)
- ۳ کامپوننت UI جدید (ProjectMapView, DocumentArchiveView, NotificationPreferences)
- ۳ ViewMode جدید
- ۷ مستند نمونه + مختصات جغرافیایی ۳ پروژه در seed
- نقشه‌ی SVG تعاملی با pin‌های رنگی و popup
- آرشیو مرکزی با فیلتر و جستجو
- تنظیمات اعلان کامل با quiet hours و digest
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- export خروجی PDF/Excel از نقشه، آرشیو، و تنظیمات
- افزودن قابلیت drag-and-drop برای جابجایی رویدادهای تقویم
- WebSocket برای به‌روزرسانی real-time نقشه
- ادغام نقشه با Leaflet/MapBox برای نقشه‌ی واقعی
- افزودن preview تصاویر در آرشیو
- ماژول مدیریت نسخه‌ی مستندات (versioning)
- داشبورد پیش‌بینی با هوش مصنوعی
- افزودن نقشه‌ی حرارتی جغرافیایی (geo heatmap)

---

## Task ID: 10 (Phase 10) — Export Utilities + Health Score Widget + Enhanced Overview
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن ماژول خروجی Excel/PDF قابل‌استفاده مجدد، ویجت امتیاز سلامت، و بهبود نمای کلی

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، BI، نقشه، آرشیو، تنظیمات اعلان همگی سالم
- **ایجاد ماژول خروجی مرکزی (`src/lib/export/export-utils.ts`):**
  - `exportToExcel()` — خروجی Excel با exceljs شامل:
    - چند Sheet با سربرگ گرافیکی و فونت B Nazanin
    - فرمول‌های واقعی (SUM)
    - رنگ متناوب ردیف‌ها
    - RTL و grid lines off
  - `exportToPDF()` — خروجی PDF با HTML print-ready شامل:
    - سربرگ سازمان با رنگ کهربایی
    - جدول صفحه‌بندی‌شده
    - پاورقی قانونی و امضاها
  - `exportToCSV()` — خروجی CSV با BOM برای UTF-8
  - `triggerDownload()` — helper دانلود Blob
- **ایجاد ویجت امتیاز سلامت (`src/components/charts/health-score-widget.tsx`):**
  - Circular progress با SVG ring انیمیشون‌دار
  - نمایش امتیاز کلی (0-100) با رنگ‌بندی health status
  - ۶ محور کلیدی با icon و رنگ (پیشرفت، کیفیت، زمان‌بندی، مالی، ایمنی، مستندات)
  - توصیه‌ی برتر نیازمند توجه فوری
  - badge وضعیت (سالم/هشدار/بحرانی)
- **ادغام Health Score در overview-view:**
  - قرار دادن HealthScoreWidget کنار S-Curve در یک grid ۳ ستونی
  - S-Curve در ۲ ستون + Health Score در ۱ ستون
- **افزودن دکمه‌ی خروجی Excel به ۳ نما:**
  - BI Dashboard: خروجی لیست پروژه‌ها با ۹ ستون + فرمول SUM
  - Activity Heatmap: خروجی رتبه‌بندی کاربران با ۴ ستون + فرمول SUM
  - Radar Chart View: خروجی ۲ Sheet (ارزیابی رادار + توصیه‌های هوشمند)
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - نمای کلی پروژه: Health Score widget نمایش داده می‌شود با circular progress + ۶ محور
  - داشبورد BI: دکمه «خروجی Excel» نمایش داده می‌شود
  - ارزیابی رادار: دکمه «خروجی Excel» نمایش داده می‌شود
  - نقشه فعالیت: دکمه «خروجی Excel» نمایش داده می‌شود

### Stage Summary:
- ۱ ماژول خروجی مرکزی (export-utils.ts) با ۴ تابع (Excel, PDF, CSV, download)
- ۱ کامپوننت UI جدید (HealthScoreWidget) با circular SVG progress
- ۳ دکمه‌ی خروجی Excel در BI Dashboard، Activity Heatmap، و Radar Chart
- ادغام Health Score در overview کنار S-Curve
- خروجی Excel با فرمول‌های واقعی + فونت B Nazanin + RTL
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- افزودن export به نقشه‌ی پروژه‌ها و آرشیو مستندات
- افزودن قابلیت drill-down به BI Dashboard (کلیک روی پروژه → جزئیات)
- preview تصاویر در آرشیو مستندات
- ماژول مدیریت نسخه‌ی مستندات (versioning)
- WebSocket برای به‌روزرسانی real-time
- داشبورد پیش‌بینی با هوش مصنوعی
- ادغام Leaflet/MapBox برای نقشه‌ی واقعی

---

## Task ID: 11 (Phase 11) — Forecasting + Document Versioning + Enhanced Schema
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: افزودن پیش‌بینی هوشمند پروژه، نسخه‌گذاری مستندات، و فیلدهای جدید schema

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، BI، نقشه، آرشیو، تنظیمات، نمای کلی با Health Widget همگی سالم
- **افزایش فیلدهای مدل DocumentFile:**
  - `version` (Int) — شماره نسخه
  - `parentDocId` (String?) — اشاره به مستند اصلی
  - `isLatest` (Boolean) — آیا آخرین نسخه است
  - `tags` (String) — برچسب‌ها (JSON array)
  - `isStarred` (Boolean) — محبوب/ستاره‌دار
- اجرای `bun run db:push` و `bun run db:generate`
- **ایجاد ۴ API endpoint جدید:**
  - `/api/documents/[id]/star` (PATCH) — toggle ستاره‌دار
  - `/api/documents/[id]/versions` (GET, POST) — لیست و آپلود نسخه‌ی جدید
  - `/api/projects/[id]/forecast` (GET) — پیش‌بینی هوشمند با:
    - محاسبه‌ی نرخ اجرا و تخمین تکمیل
    - ۳ سناریو (خوش‌بینانه/واقع‌بینانه/بدبینانه) با احتمال و هزینه‌ی نهایی
    - تأثیر ریسک‌ها و تغییرات در انتظار
    - سری زمانی پیش‌بینی با منحنی S
    - توصیه‌های هوشمند با priority
- **ایجاد ۱ کامپوننت UI جدید:**
  - `src/components/views/project/forecast-view.tsx`:
    - ۴ کارت KPI (پیشرفت، تخمین تکمیل، هزینه ریسک، تغییرات در انتظار)
    - AreaChart پیش‌بینی با planned vs forecast
    - ۳ کارت سناریو با gradient رنگی (سبز/کهربایی/قرمز)
    - لیست توصیه‌های هوشمند با priority و type badge
- **ادغام در سیستم:**
  - افزودن ProjectTab `"forecast"` به store.ts
  - افزودن تب «پیش‌بینی» به project-detail.tsx (با آیکون Sparkles)
  - به‌روزرسانی TAB_LABELS در app-header.tsx
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - تب «پیش‌بینی»: نمایش KPIها (۴۵٪ پیشرفت، ۳ دوره تا تکمیل، ۶۸۰ میلیون هزینه ریسک)
  - ۳ سناریو با احتمال و توضیحات
  - نمودار پیش‌بینی با planned vs forecast
  - توصیه‌های هوشمند
  - API forecast با curl تست شد و 200 برمی‌گرداند

### Stage Summary:
- ۵ فیلد جدید در مدل DocumentFile (version, parentDocId, isLatest, tags, isStarred)
- ۴ API endpoint جدید (star, versions, forecast)
- ۱ کامپوننت UI جدید (ForecastView)
- ۱ ProjectTab جدید (forecast)
- ۳ سناریوی پیش‌بینی + سری زمانی + توصیه‌های هوشمند
- نسخه‌گذاری مستندات با parentDocId و isLatest
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- افزودن UI نسخه‌گذاری به آرشیو مستندات (نمایش نسخه‌ها، آپلود نسخه‌ی جدید)
- افزودن preview تصاویر در آرشیو
- export خروجی از نقشه و آرشیو
- drill-down در BI Dashboard
- ادغام Leaflet برای نقشه‌ی واقعی
- WebSocket برای real-time
- داشبورد BI با فیلتر تاریخ

---

## Task ID: 12 (Phase 12) — Enhanced Document Archive + Export + Preview + Versioning UI
Agent: main-orchestrator (Z.ai Code) — webDevReview cron task
Task: بهبود آرشیو مستندات با ستاره‌دار، نسخه‌گذاری، پیش‌نمایش تصویر، و خروجی Excel

### Work Log:
- بررسی وضعیت پروژه: سرور dev فعال، lint و TS تمیز، تمام ماژول‌های قبلی کار می‌کنند
- تست QA با agent-browser: داشبورد، BI، نقشه، پیش‌بینی، تنظیمات همگی سالم
- **بهبود کامل آرشیو مستندات (`document-archive-view.tsx`):**
  - افزودن دکمه‌ی «خروجی Excel» با ۹ ستون (نام، نام هوشمند، دسته، پروژه، حجم، نسخه، ستاره‌دار، تاریخ، آپلودکننده)
  - افزودن فیلتر «ستاره‌دار» (toggle button) برای نمایش فقط فایل‌های محبوب
  - افزودن badge نسخه (v1, v2, ...) و badge «محبوب» روی کارت‌های مستند
  - افزودن دکمه‌ی ستاره (star toggle) برای هر مستند با mutation
  - افزودن دکمه‌ی پیش‌نمایش (Eye icon) برای تصاویر
  - افزودن دکمه‌ی نسخه‌ها (GitBranch icon) برای مشاهده‌ی نسخه‌های مستند
  - **Dialog پیش‌نمایش تصویر:**
    - نمایش تصویر با fallback در صورت عدم دسترسی
    - اطلاعات کامل (نام هوشمند، حجم، پروژه، آپلودکننده)
    - دکمه دانلود
  - **Dialog نسخه‌ها:**
    - لیست تمام نسخه‌ها با v-badge رنگی
    - نمایش «آخرین نسخه» و «فعلی» با badge
    - دانلود هر نسخه
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با agent-browser:
  - دکمه «خروجی Excel» نمایش داده می‌شود
  - دکمه «ستاره‌دار» برای فیلتر نمایش داده می‌شود
  - ۷ مستند با دکمه‌های دانلود نمایش داده می‌شوند
  - API star و versions موجود و کار می‌کنند

### Stage Summary:
- بهبود کامل ۱ کامپوننت UI (DocumentArchiveView)
- افزودن ۳ قابلیت جدید: star toggle, image preview, versions dialog
- افزودن خروجی Excel با ۹ ستون
- فیلتر starredOnly برای مستندات محبوب
- badge نسخه و محبوب روی کارت‌ها
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید در agent-browser تست شدند.

### Unresolved Items / Next Phase:
- BI Dashboard drill-down modal (کلیک روی پروژه → جزئیات)
- افزودن export به نقشه‌ی پروژه‌ها
- drag-and-drop برای آپلود فایل در آرشیو
- WebSocket برای به‌روزرسانی real-time
- ادغام Leaflet برای نقشه‌ی واقعی
- داشبورد BI با فیلتر تاریخ
- ماژول گزارش‌گیری پیشرفته با pivot table

---

## Task ID: 13 (Phase 13) — Texsa-First Database Redesign + .svzt Import/Export
Agent: main-orchestrator (Z.ai Code)
Task: بازطراحی کامل دیتابیس حول تکسا — ۴۵ جدول mirror، parser واقعی .svzt، UI ایمپورت، raw data explorer، export XML

### Work Log:
- بررسی فایل‌های مرجع: `texsa_schema_summary.json` (۴۵ جدول، ۷۸٬۹۸۸ ردیف)، `texsa_blank_template.svzt` (XML با root NewDataSet)
- **فاز ۱ — بازطراحی دیتابیس:**
  - تولید ۴۵ مدل Prisma mirror از `texsa_schema_summary.json` با script پایتون
  - تمام فیلدهای XML به‌صورت `String?` با پیشوند `tx_` برای حفظ round-trip fidelity
  - ستون‌های سیستمی: `id`, `importId`, `rowOrder`, `rawJson`, `createdAt`, `updatedAt`
  - مدل‌های metadata: `TexsaImport` (status, tableCounts, warnings, errors) و `TexsaImportIssue`
  - اجرای `bun run db:push` — ۴۵ جدول mirror ایجاد شد
- **فاز ۲ — Parser واقعی .svzt:**
  - نصب `fast-xml-parser` برای پارس XML
  - `POST /api/texsa/import/preview` — پارس فایل، شمارش جدول‌ها/ردیف‌ها، استخراج project info از `brv_contract`
  - `POST /api/texsa/import/commit` — ذخیره تمام ردیف‌ها در mirror tables با batch insert (۵۰۰ ردیف)
  - `GET /api/texsa/imports` — لیست ایمپورت‌ها
  - `GET /api/texsa/imports/[id]` — جزئیات ایمپورت + issues
  - `GET /api/texsa/imports/[id]/tables` — لیست جدول‌ها با شمارش
  - `GET /api/texsa/imports/[id]/tables/[tableName]` — ردیف‌های یک جدول با pagination + search
  - `GET /api/texsa/imports/[id]/export` — خروجی XML با root `NewDataSet` برای round-trip
  - `GET /api/texsa/schema` — schema summary
- **فاز ۳ — UI ایمپورت تکسا:**
  - `src/components/views/texsa/texsa-import-view.tsx`:
    - Drag & Drop شیک برای فایل `.svzt`
    - Progress چندمرحله‌ای (uploading → previewing → committing → done)
    - Preview قبل از commit: project info (نام، کد، کارفرما، پیمانکار، مشاور، سال، مبلغ)، table counts، warnings
    - جدول شمارش رکوردها با search و sort
    - کارت هشدارها
    - دکمه «ورود کامل اطلاعات تکسا»
    - لیست ایمپورت‌های قبلی
- **فاز ۴ — Raw Data Explorer:**
  - `src/components/views/texsa/texsa-raw-data-view.tsx`:
    - انتخاب ایمپورت و جدول
    - جستجوی متنی در تمام ستون‌ها
    - جدول با pagination (۵۰ ردیف/صفحه)
    - نمایش تمام ستون‌ها با original names
    - دکمه کپی XML هر ردیف
    - خروجی CSV
- **فاز ۵ — Project Dashboard:**
  - `src/components/views/texsa/texsa-project-view.tsx`:
    - نمایش project info از `brv_contract` (کارفرما، پیمانکار، مشاور، محل، مبلغ، سال، نسخه)
    - ۸ کارت KPI
    - جدول‌های کلیدی تکسا (brv_rzmt, brv_khmt, brv_bgml, brv_fhbh, ...)
    - تمام جدول‌ها با progress bar سهم
    - هشدارها و خطاها
    - دکمه خروجی .svzt
- **فاز ۶ — Export XML:**
  - `GET /api/texsa/imports/[id]/export`:
    - خروجی XML با `<?xml version="1.0" standalone="yes"?>` و `<NewDataSet>`
    - ترتیب tableها مطابق schema
    - ستون‌های سیستمی حذف می‌شوند
    - مقادیر string دقیق حفظ می‌شوند
    - فیلدهای ناشناخته از rawJson حفظ می‌شوند
    - فایل خروجی با پسوند `.svzt`
- **ادغام در سیستم:**
  - افزودن ۳ ViewMode جدید (`texsa-import`, `texsa-raw`, `texsa-project`) به store.ts
  - افزودن ۳ دکمه‌ی ناوبری به sidebar (ایمپورت تکسا، پروژه تکسا، داده خام تکسا)
  - به‌روزرسانی VIEW_LABELS در app-header.tsx
- نصب `fast-xml-parser@5.9.3`
- اجرای `bun run lint` → EXIT=0
- اجرای `npx tsc --noEmit` → zero errors
- تست با curl:
  - Preview: ۴۵ جدول شناسایی شد ✓
  - Commit: ۴۵ جدول، ۴۵ ردیف ذخیره شد ✓
  - Export: XML معتبر با NewDataSet ✓
  - Tables API: ردیف‌ها با pagination ✓
- تست با agent-browser:
  - ایمپورت تکسا: drag & drop zone نمایش داده می‌شود
  - داده خام تکسا: selectors و جدول کار می‌کنند
  - پروژه تکسا: project info و جدول‌های کلیدی نمایش داده می‌شوند

### Stage Summary:
- **۴۵ مدل Prisma mirror** — تمام جدول‌های تکسا با تمام ستون‌ها به‌صورت String?
- **۲ مدل metadata** — TexsaImport + TexsaImportIssue
- **۸ API endpoint** جدید برای import/preview/commit/tables/export
- **۳ کامپوننت UI** جدید (TexsaImportView, TexsaRawDataView, TexsaProjectView)
- **۳ ViewMode** جدید
- **Parser واقعی** .svzt با fast-xml-parser
- **Round-trip export** XML با حفظ تمام داده‌ها
- ESLint passes cleanly. TypeScript shows zero errors.
- Dev server running at port 3000.
- تمام ویژگی‌های جدید با curl و agent-browser تست شدند.

### Unresolved Items / Next Phase:
- تست با فایل واقعی ۷۱MB (الان با template خالی تست شد)
- View projections برای ریزمتره، خلاصه متره، برگه مالی، صورت‌وضعیت، تعدیل از mirror tables
- اعتبارسنجی و مغایرت‌ها
- UI sections بر اساس منوی ۱۷ بخشی تکسا
- Streaming parser برای فایل‌های بزرگ ۲۰۰MB+
- drag-and-drop برای آپلود مستقیم در صفحه

---

## Phase UX Simplification — ساده‌سازی کامل UI/UX
Agent: main-orchestrator (Z.ai Code)

### Problem
پروژه بیش از حد شلوغ شده بود — ۱۹ ViewMode، ۱۹ ProjectTab، نمودارهای mock، gradientهای زیاد، و داده‌های فنی تکسا در مسیر اصلی کاربر.

### Changes Made

**1. Store (store.ts) — ساده‌سازی کامل:**
- ViewMode از ۱۹ به ۶: `dashboard`, `projects`, `project-detail`, `texsa-import`, `reports`, `settings`
- ProjectTab از ۱۹ به ۶: `contract`, `metering`, `financial`, `payment`, `adjustment`, `export`
- حذف تمام ViewMode‌های اضافی (comparison, org-kpi, bi-dashboard, activity, map, archive, suppliers, calendar, notifications, texsa-raw, texsa-project, base-data, users)

**2. Sidebar (app-sidebar.tsx) — بازنویسی کامل:**
- از ۹۳۴ خط به ~۱۵۰ خط — حذف تمام کدهای اضافی
- فقط ۵ آیتم اصلی: خانه، پروژه‌ها، وارد کردن فایل تکسا، گزارش‌ها و خروجی، تنظیمات
- جستجوی پروژه ساده
- لیست پروژه‌ها با status dot و مبلغ
- حذف Quick Stats Panel، gradientها، Tooltip‌ها، CollapsedButton‌های پیچیده

**3. Dashboard (dashboard-view.tsx) — Action Dashboard:**
- از ~۸۳۶ خط به ~۱۷۰ خط
- دکمه اصلی: «وارد کردن فایل تکسا»
- دکمه دوم: «مشاهده پروژه‌ها»
- ۴ کارت KPI ساده (پروژه‌های فعال، آخرین صورت‌وضعیت، مبلغ کل، نیازمند بررسی)
- لیست آخرین پروژه‌ها (۵ پروژه)
- لیست کارهای بعدی (۳ آیتم)
- حذف تمام نمودارهای mock، gradientهای رنگارنگ، sparkline‌ها، forecast‌ها

**4. Project Detail (project-detail.tsx) — Workspace ۶ مرحله‌ای:**
- از ۱۹ تب به ۶ مرحله: پیمان، متره، مالی، صورت‌وضعیت، تعدیل، خروجی
- مرحله متره: ترکیب ریزمتره + خلاصه متره با toggle
- Step bar ساده با شماره‌گذاری
- حذف تمام تب‌های تخصصی (risks, change-orders, contracts, radar, forecast, timeline, cost-analysis, cash-flow, etc.)

**5. Texsa Import (texsa-import-view.tsx) — Wizard ۳ مرحله‌ای:**
- مرحله ۱: انتخاب فایل (drag & drop)
- مرحله ۲: بررسی فایل (project info + table counts in accordion)
- مرحله ۳: پایان + باز کردن پروژه
- حذف لیست ایمپورت‌های قبلی، progress‌های پیچیده، table counts کامل

**6. Page (page.tsx) — ساده‌سازی:**
- فقط ۶ view رندر می‌شود
- footer مینیمال (۳ آیتم به‌جای ۱۰)
- حذف تمام import‌های unused

**7. Header (app-header.tsx):**
- به‌روزرسانی VIEW_LABELS و TAB_LABELS با مقادیر جدید
- به‌روزرسانی Command Palette با ۵ آیتم اصلی
- حذف مراجع به ViewMode‌های حذف‌شده

**8. Footer:**
- از ۱۰ آیتم به ۳: نام برند، وضعیت اتصال، کپی‌رایت
- حذف gradient، میانبرهای کیبورد، نام کاربر، تعداد پروژه‌ها

### Verification
- `bun run lint` → EXIT=0
- `npx tsc --noEmit` → zero errors
- agent-browser tests:
  - داشبورد: «سلام، سید علی» + ۲ دکمه اصلی + ۴ KPI + لیست پروژه‌ها + کارهای بعدی ✓
  - نوار کناری: ۵ آیتم اصلی ✓
  - ایمپورت تکسا: ۳ مرحله ✓
  - جزئیات پروژه: ۶ مرحله (پیمان، متره، مالی، صورت‌وضعیت، تعدیل، خروجی) ✓

### Principles Applied
- کاربر تازه‌وارد در کمتر از ۱۰ ثانیه می‌فهمد باید چه‌کار کند
- کاربر پروژه را با ۶ مرحله منطقی می‌بیند
- کاربر عادی هیچ‌وقت اسم جدول‌های تکسا را در مسیر اصلی نمی‌بیند
- امکانات فنی تکسا حفظ شده ولی پشت‌صحنه هستند
- هر صفحه فقط یک دکمه primary دارد
- حداکثر ۴ KPI در هر صفحه
- بدون نمودار mock یا forecast نمایشی

---

## Civil Construction Workflow Reset
Agent: main-orchestrator (Z.ai Code)

### Problem
پروژه از نظر محصول اشتباه شده بود — نقش‌ها غلط (ADMIN/ESTIMATOR/BILLER)، چت private نه project room، تکسا در مسیر اصلی UI، داشبوردهای BI شلوغ.

### Changes Made

**1. Prisma Schema — مدل‌های سازمانی جدید:**
- `Organization` — سازمان با type (EMPLOYER/CONSULTANT/CONTRACTOR)
- `ProjectParty` — طرفین پروژه با partyType و displayTitle
- `ProjectMember` — کاربر در پروژه با role، canSign، canApprove
- `WorkflowTemplate` / `WorkflowInstance` / `WorkflowAction` / `ApprovalStep` — موتور کارتابل
- `ProjectChannel` / `ChannelMember` / `Message` / `MessageReadReceipt` — چت پروژه‌محور
- `Letter` — مکاتبات رسمی بین طرفین
- `Document` / `DocumentVersion` — اسناد با نسخه‌گذاری
- `User` — افزودن organizationId و mobile
- `Project` — افزودن contractNo, startDate, durationDays, priceListYear, discipline, texsaImportId

**2. Store (store.ts) — ساده‌سازی محصول‌محور:**
- ViewMode: `workbench`, `projects`, `messages`, `documents`, `reports`, `settings` (۶ آیتم)
- ProjectTab: `overview`, `documents`, `metering`, `payment`, `adjustment`, `discussion`, `export` (۷ تب)
- `currentUser` با partyType, role, canSign, canApprove

**3. Sidebar — کارتابل‌محور:**
- ۶ آیتم: کارتابل من، پروژه‌ها، پیام‌ها، اسناد و مکاتبات، گزارش‌ها و خروجی، تنظیمات
- نمایش نقش کاربر فعلی در بالای sidebar
- لیست پروژه‌ها با status dot

**4. Workbench (کارتابل من) — نقش‌محور:**
- نمایش نام و نقش کاربر (مشاور / ناظر مقیم)
- ۲ دکمه اصلی: باز کردن پروژه + وارد کردن فایل تکسا
- ۴ KPI: پروژه‌های فعال، صورت‌وضعیت‌ها، مبلغ کل، اقدامات فوری
- ۳ اقدام فوری: صورت‌وضعیت منتظر بررسی، پیام جدید، نامه رسمی
- لیست آخرین پروژه‌ها
- بدون نمودار mock یا forecast

**5. Project Detail — ۷ تب پروژه عمرانی:**
- نوار هویت: نام پروژه + کد + مبلغ + وضعیت + طرفین (کارفرما/مشاور/پیمانکار)
- نمایش نقش کاربر و حق تأیید
- ۷ تب: پیشخوان، اسناد و مکاتبات، متره، صورت‌وضعیت، تعدیل، گفتگو، گزارش و خروجی

**6. Messages View — کانال‌های پروژه:**
- لیست کانال‌های گفتگو (عمومی، صورت‌وضعیت، فنی، کارگاه)
- badge تعداد پیام‌های جدید
- کلیک → ورود به تب گفتگوی پروژه

**7. Documents View — اسناد و مکاتبات:**
- لیست اسناد (قرارداد، صورتجلسه، نامه، دستورکار، نقشه)
- badge نوع و وضعیت
- کلیک → ورود به تب اسناد پروژه

**8. Header:**
- به‌روزرسانی VIEW_LABELS و TAB_LABELS
- breadcrumb: کارتابل من > پروژه‌ها > [نام پروژه] > [نام تب]
- Command Palette با ۵ آیتم اصلی

### Verification
- `bun run lint` → EXIT=0
- `npx tsc --noEmit` → zero errors
- agent-browser tests:
  - کارتابل من: نمایش نقش + ۴ KPI + ۳ اقدام فوری + لیست پروژه‌ها ✓
  - نوار کناری: ۶ آیتم اصلی ✓
  - جزئیات پروژه: ۷ تب + نوار هویت با طرفین ✓
  - پیام‌ها: لیست کانال‌ها ✓
  - اسناد: لیست اسناد ✓

### Key Principles Applied
1. کاربر بعد از ورود «کارتابل من» را می‌بیند
2. نقش‌ها بر اساس سه طرف: کارفرما، مشاور، پیمانکار
3. نام جدول‌های تکسا در UI اصلی دیده نمی‌شود
4. بدون نمودار mock یا forecast نمایشی
5. UI ساده، RTL، فارسی، اداری
