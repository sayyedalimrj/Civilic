import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyRound } from "lucide-react";

export default function AdminRolesPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="نقش‌ها و دسترسی‌ها" subtitle="قالب‌های نقش پروژه‌ای و پلتفرمی (DB-driven)" />
      <EmptyState icon={KeyRound} title="ویرایشگر نقش‌ها در حال توسعه است"
        description="نقش‌ها به‌صورت RoleTemplate در پایگاه داده تعریف شده‌اند و کلیدهای مجوز در کد canonical هستند. رابط ویرایش/کلون نقش‌ها به‌زودی اضافه می‌شود." />
    </div>
  );
}
