import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText } from "lucide-react";

export default function AdminLogsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="لاگ و پشتیبانی" subtitle="ممیزی اقدامات مدیر سامانه و دسترسی پشتیبانی" />
      <EmptyState icon={ScrollText} title="نمایش لاگ ممیزی در حال توسعه است"
        description="همه‌ی اقدامات مدیریتی در PlatformAuditLog ثبت می‌شوند. نمایش لاگ و اعطای دسترسی پشتیبانی/impersonation به‌زودی اضافه می‌شود." />
    </div>
  );
}
