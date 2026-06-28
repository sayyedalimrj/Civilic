"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { faMoney, toFa } from "@/lib/fa";

interface ProjectRow {
  id: string; name: string; code: string; status: string; contractAmount: number;
  recordSource: string; tenant: string | null; parties: number; payments: number;
}

export default function AdminProjectsPage() {
  const { data, isLoading } = useQuery<{ projects: ProjectRow[] }>({
    queryKey: ["admin-projects"],
    queryFn: async () => (await fetch("/api/admin/projects")).json(),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">پروژه‌ها</h1>
        <p className="text-sm text-muted-foreground">همه‌ی پروژه‌های مستاجرها در سطح پلتفرم</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-start">پروژه</th>
                  <th className="px-4 py-2.5 text-start">مستاجر</th>
                  <th className="px-4 py-2.5 text-start">مبلغ پیمان</th>
                  <th className="px-4 py-2.5 text-center">طرفین</th>
                  <th className="px-4 py-2.5 text-center">صورت‌وضعیت</th>
                  <th className="px-4 py-2.5 text-center">منبع</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-4"><Skeleton className="h-5 w-full" /></td></tr>
                ) : (data?.projects ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">پروژه‌ای ثبت نشده است</td></tr>
                ) : (
                  data!.projects.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">{p.code}</div>
                      </td>
                      <td className="px-4 py-2.5">{p.tenant ?? "—"}</td>
                      <td className="px-4 py-2.5">{faMoney(p.contractAmount)}</td>
                      <td className="px-4 py-2.5 text-center">{toFa(p.parties)}</td>
                      <td className="px-4 py-2.5 text-center">{toFa(p.payments)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="outline">{p.recordSource === "TEXSA" ? "تکسا" : "Civilic"}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
