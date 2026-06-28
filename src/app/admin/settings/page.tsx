import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings2 } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="تنظیمات سامانه" subtitle="پرچم‌های ویژگی، حالت نگهداری و تنظیمات storage" />
      <EmptyState icon={Settings2} title="تنظیمات سامانه در حال توسعه است"
        description="پرچم‌های ویژگی (FeatureFlag) و تنظیمات پلتفرم به‌زودی از این بخش قابل مدیریت خواهند بود." />
    </div>
  );
}
