import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Network } from "lucide-react";

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="سازمان‌ها" subtitle="شرکت‌های کارفرما/مشاور/پیمانکار در سطح پلتفرم" />
      <EmptyState icon={Network} title="مدیریت سازمان‌ها در حال توسعه است"
        description="سازمان‌ها هنگام ساخت پروژه یا از طریق مدیریت مشتری ایجاد می‌شوند. صفحه‌ی اختصاصی مدیریت سازمان‌ها به‌زودی اضافه می‌شود." />
    </div>
  );
}
