"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { faMoney, faNum, toFa } from "@/lib/fa";

interface PlanRow {
  id: string; key: string; name: string; monthlyPrice: number; yearlyPrice: number;
  maxProjects: number; maxUsers: number; maxStorageMb: number;
  maxTexsaImportsPerMonth: number; maxExportsPerMonth: number; isActive: boolean; subscriptions: number;
}

export default function AdminPlansPage() {
  const { data, isLoading } = useQuery<{ plans: PlanRow[] }>({
    queryKey: ["admin-plans"],
    queryFn: async () => (await fetch("/api/admin/plans")).json(),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">پلن‌های اشتراک</h1>
        <p className="text-sm text-muted-foreground">پلن‌ها و محدودیت‌های هر سطح</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(data?.plans ?? []).map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{p.name}</h3>
                  <Badge variant="outline">{toFa(p.subscriptions)} اشتراک</Badge>
                </div>
                <div className="text-lg font-bold text-emerald-700">{p.monthlyPrice ? faMoney(p.monthlyPrice) : "رایگان"}<span className="text-xs text-muted-foreground"> / ماه</span></div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>پروژه: {faNum(p.maxProjects)}</li>
                  <li>کاربر: {faNum(p.maxUsers)}</li>
                  <li>فضا: {faNum(p.maxStorageMb)} MB</li>
                  <li>ورود تکسا/ماه: {faNum(p.maxTexsaImportsPerMonth)}</li>
                  <li>خروجی/ماه: {faNum(p.maxExportsPerMonth)}</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
