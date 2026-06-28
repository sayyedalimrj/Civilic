"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Loader2 } from "lucide-react";
import { toFa } from "@/lib/fa";

interface TenantRow {
  id: string; name: string; slug: string | null; isActive: boolean;
  projects: number; users: number; organizations: number;
  plan: string | null; subscriptionStatus: string | null;
}

export default function TenantsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [planKey, setPlanKey] = useState("trial");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ tenants: TenantRow[] }>({
    queryKey: ["admin-tenants"],
    queryFn: async () => (await fetch("/api/admin/tenants")).json(),
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined, planKey }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => {
      setShowForm(false); setName(""); setSlug(""); setError(null);
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (t: TenantRow) => {
      await fetch(`/api/admin/tenants/${t.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenants"] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">مستاجرها</h1>
          <p className="text-sm text-muted-foreground">مشتری‌ها/فضاهای کاری Civilic</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}><Plus className="size-4" /> مستاجر جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>نام مستاجر</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً شرکت آلفا" />
              </div>
              <div className="space-y-1.5">
                <Label>اسلاگ (اختیاری)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" placeholder="alpha" />
              </div>
              <div className="space-y-1.5">
                <Label>پلن اولیه</Label>
                <select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="trial">آزمایشی</option>
                  <option value="basic">پایه</option>
                  <option value="pro">حرفه‌ای</option>
                  <option value="enterprise">سازمانی</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={() => create.mutate()} disabled={create.isPending || name.length < 2}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />} ایجاد
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>انصراف</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-start">نام</th>
                  <th className="px-4 py-2.5 text-start">پلن</th>
                  <th className="px-4 py-2.5 text-center">پروژه</th>
                  <th className="px-4 py-2.5 text-center">کاربر</th>
                  <th className="px-4 py-2.5 text-center">وضعیت</th>
                  <th className="px-4 py-2.5 text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-4"><Skeleton className="h-5 w-full" /></td></tr>
                ) : (data?.tenants ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">مستاجری ثبت نشده است</td></tr>
                ) : (
                  data!.tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{t.name}{t.slug && <span className="mr-1 text-xs text-muted-foreground" dir="ltr">/{t.slug}</span>}</td>
                      <td className="px-4 py-2.5">{t.plan ?? "—"}</td>
                      <td className="px-4 py-2.5 text-center">{toFa(t.projects)}</td>
                      <td className="px-4 py-2.5 text-center">{toFa(t.users)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant={t.isActive ? "default" : "secondary"} className={t.isActive ? "bg-emerald-600" : ""}>
                          {t.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Button size="sm" variant="outline" onClick={() => toggle.mutate(t)} disabled={toggle.isPending}>
                          {t.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                        </Button>
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
