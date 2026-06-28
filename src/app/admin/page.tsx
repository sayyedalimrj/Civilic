"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FolderKanban, Users, CreditCard, Receipt, AlertTriangle, HardDrive, UploadCloud } from "lucide-react";
import { faNum, faMoney, toFa } from "@/lib/fa";

interface Overview {
  tenants: number; activeTenants: number; projects: number; users: number;
  platformUsers: number; activeSubscriptions: number; invoices: number;
  overdueInvoices: number; revenue: number; storageUsedMb: number; texsaImports: number;
}

const CARDS: { key: keyof Overview; label: string; icon: typeof Building2; fmt?: (n: number) => string; tone: string }[] = [
  { key: "tenants", label: "مستاجرها", icon: Building2, tone: "text-sky-600" },
  { key: "projects", label: "پروژه‌های فعال", icon: FolderKanban, tone: "text-emerald-600" },
  { key: "users", label: "کاربران", icon: Users, tone: "text-violet-600" },
  { key: "activeSubscriptions", label: "اشتراک‌های فعال", icon: CreditCard, tone: "text-amber-600" },
  { key: "revenue", label: "درآمد پرداخت‌شده", icon: Receipt, fmt: faMoney, tone: "text-emerald-700" },
  { key: "overdueInvoices", label: "صورتحساب معوق", icon: AlertTriangle, tone: "text-rose-600" },
  { key: "storageUsedMb", label: "فضای مصرفی (MB)", icon: HardDrive, tone: "text-slate-600" },
  { key: "texsaImports", label: "ورود تکسا", icon: UploadCloud, tone: "text-orange-600" },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Overview>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const r = await fetch("/api/admin/overview");
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">داشبورد مدیریت سامانه</h1>
        <p className="text-sm text-muted-foreground">نمای کلی مشتری‌ها، پروژه‌ها، اشتراک‌ها و درآمد پلتفرم Civilic</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const val = data?.[c.key] ?? 0;
          return (
            <Card key={c.key}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted ${c.tone}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">{c.label}</div>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-5 w-16" />
                  ) : (
                    <div className="truncate text-lg font-bold">{c.fmt ? c.fmt(val) : faNum(val)}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-64" />
          ) : (
            <span>
              {toFa(data?.activeTenants ?? 0)} مستاجر فعال از {toFa(data?.tenants ?? 0)} • {toFa(data?.platformUsers ?? 0)} کاربر پلتفرم • {toFa(data?.invoices ?? 0)} صورتحساب
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
