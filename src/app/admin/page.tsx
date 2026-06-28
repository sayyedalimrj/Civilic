"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, FolderKanban, Users, CreditCard, Receipt, AlertTriangle, HardDrive, UploadCloud, Plus, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { faNum, faMoney, toFa } from "@/lib/fa";

interface Overview {
  tenants: number; activeTenants: number; projects: number; users: number;
  platformUsers: number; activeSubscriptions: number; invoices: number;
  overdueInvoices: number; revenue: number; storageUsedMb: number; texsaImports: number;
}
interface TenantRow { id: string; name: string; plan: string | null; isActive: boolean; projects: number; users: number }
interface InvoiceRow { id: string; number: string; amount: number; status: string; tenant: string | null }

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Overview>({
    queryKey: ["admin-overview"],
    queryFn: async () => { const r = await fetch("/api/admin/overview"); if (!r.ok) throw new Error(); return r.json(); },
  });
  const { data: tenantsData } = useQuery<{ tenants: TenantRow[] }>({
    queryKey: ["admin-tenants"], queryFn: async () => (await fetch("/api/admin/tenants")).json(),
  });
  const { data: invoicesData } = useQuery<{ invoices: InvoiceRow[] }>({
    queryKey: ["admin-invoices"], queryFn: async () => (await fetch("/api/admin/invoices")).json(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت سامانه Civilic" subtitle="نمای کلی مشتری‌ها، اشتراک‌ها، مصرف و درآمد پلتفرم" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="مشتری‌ها" value={toFa(data?.tenants ?? 0)} icon={Building2} loading={isLoading} hint={`${toFa(data?.activeTenants ?? 0)} فعال`} />
        <MetricCard label="پروژه‌های فعال" value={toFa(data?.projects ?? 0)} icon={FolderKanban} tone="info" loading={isLoading} />
        <MetricCard label="کاربران" value={toFa(data?.users ?? 0)} icon={Users} loading={isLoading} />
        <MetricCard label="اشتراک‌های فعال" value={toFa(data?.activeSubscriptions ?? 0)} icon={CreditCard} tone="info" loading={isLoading} />
        <MetricCard label="درآمد پرداخت‌شده" value={faMoney(data?.revenue ?? 0)} icon={Receipt} tone="success" loading={isLoading} />
        <MetricCard label="صورتحساب معوق" value={toFa(data?.overdueInvoices ?? 0)} icon={AlertTriangle} tone="danger" loading={isLoading} />
        <MetricCard label="فضای مصرفی" value={`${faNum(data?.storageUsedMb ?? 0)} MB`} icon={HardDrive} loading={isLoading} />
        <MetricCard label="ورود تکسا" value={toFa(data?.texsaImports ?? 0)} icon={UploadCloud} tone="warning" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="مشتری‌های اخیر" icon={<Building2 className="size-4" />} bodyClassName="p-0"
            action={<Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Link href="/admin/tenants">همه <ArrowLeft className="size-3" /></Link></Button>}>
            {!tenantsData ? (
              <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : tenantsData.tenants.length === 0 ? (
              <div className="p-4"><EmptyState icon={Building2} title="هنوز مشتری‌ای ثبت نشده است" /></div>
            ) : (
              <ul className="divide-y">
                {tenantsData.tenants.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{toFa(t.projects)} پروژه • {toFa(t.users)} کاربر • {t.plan ?? "بدون پلن"}</div>
                    </div>
                    <StatusBadge label={t.isActive ? "فعال" : "غیرفعال"} tone={t.isActive ? "success" : "neutral"} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="صورتحساب‌های اخیر" icon={<Receipt className="size-4" />} bodyClassName="p-0"
            action={<Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Link href="/admin/invoices">همه <ArrowLeft className="size-3" /></Link></Button>}>
            {!invoicesData ? (
              <div className="space-y-2 p-4">{[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : invoicesData.invoices.length === 0 ? (
              <div className="p-4"><EmptyState icon={Receipt} title="صورتحسابی ثبت نشده است" /></div>
            ) : (
              <ul className="divide-y">
                {invoicesData.invoices.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="font-mono text-xs" dir="ltr">{i.number}</div>
                      <div className="text-[11px] text-muted-foreground">{i.tenant ?? "—"} • {faMoney(i.amount)}</div>
                    </div>
                    <StatusBadge status={i.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard title="اقدامات سریع" className="self-start">
          <div className="grid grid-cols-1 gap-2">
            <Button asChild variant="outline" className="justify-start gap-2"><Link href="/admin/tenants"><Plus className="size-4" /> ایجاد مشتری جدید</Link></Button>
            <Button asChild variant="outline" className="justify-start gap-2"><Link href="/admin/users"><Plus className="size-4" /> ایجاد کاربر</Link></Button>
            <Button asChild variant="outline" className="justify-start gap-2"><Link href="/admin/plans"><Plus className="size-4" /> مدیریت پلن‌ها</Link></Button>
            <Button asChild variant="outline" className="justify-start gap-2"><Link href="/admin/invoices"><Receipt className="size-4" /> ثبت صورتحساب/پرداخت</Link></Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
