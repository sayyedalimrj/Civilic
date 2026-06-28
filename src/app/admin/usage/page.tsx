import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Gauge } from "lucide-react";

export default function AdminUsagePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="مصرف و محدودیت‌ها" subtitle="مصرف پروژه/کاربر/فضا/ورود تکسا بر اساس پلن هر مشتری" />
      <EmptyState icon={Gauge} title="گزارش مصرف در حال توسعه است"
        description="سنجه‌های مصرف (UsageMetric) برای هر دوره ثبت می‌شوند. داشبورد مصرف و اعمال محدودیت پلن به‌زودی اضافه می‌شود." />
    </div>
  );
}
