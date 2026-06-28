// ─────────────────────────────────────────────────────────────
//  Civilic seed (CLI) — منطق واقعی در src/lib/seed/demo-seed.ts است.
//  اجرا: `bun prisma/seed.ts` (نیازمند DATABASE_URL به یک PostgreSQL)
//  این مسیر با reset=true داده را پاک و کامل بازسازی می‌کند.
// ─────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { runDemoSeed } from "../src/lib/seed/demo-seed";

const db = new PrismaClient();

async function main() {
  console.log("🚀 شروع seed (reset) — پلتفرم Civilic + داده‌ی دمو...");
  const summary = await runDemoSeed(db, { reset: true });
  console.log(`✅ seed کامل شد: ${summary.tenants} مستاجر، ${summary.organizations} سازمان، ${summary.plans} پلن، پروژه: ${summary.project?.code}`);
  console.log("🔑 ورود مدیر سامانه: owner@civilic.ir | کاربر دمو: preparer@sivantadbir.ir — رمز همه: civilic");
}

main()
  .catch((e) => {
    console.error("❌ خطا در seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
