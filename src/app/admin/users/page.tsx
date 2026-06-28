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

interface UserRow {
  id: string; name: string; email: string; isActive: boolean;
  isPlatformAdmin: boolean; platformRole: string | null; tenant: string | null; organization: string | null;
}
interface TenantOpt { id: string; name: string }

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ users: UserRow[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => (await fetch("/api/admin/users")).json(),
  });
  const { data: tenantsData } = useQuery<{ tenants: TenantOpt[] }>({
    queryKey: ["admin-tenants"],
    queryFn: async () => (await fetch("/api/admin/tenants")).json(),
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, tenantId }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => { setShowForm(false); setName(""); setEmail(""); setError(null); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">کاربران</h1>
          <p className="text-sm text-muted-foreground">کاربران همه‌ی مستاجرها (رمز پیش‌فرض دعوت: civilic)</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}><Plus className="size-4" /> کاربر جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5"><Label>نام</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>ایمیل</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></div>
              <div className="space-y-1.5">
                <Label>مستاجر</Label>
                <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="">انتخاب کنید…</option>
                  {(tenantsData?.tenants ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={() => create.mutate()} disabled={create.isPending || !name || !email || !tenantId}>
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
                  <th className="px-4 py-2.5 text-start">ایمیل</th>
                  <th className="px-4 py-2.5 text-start">مستاجر</th>
                  <th className="px-4 py-2.5 text-start">سازمان</th>
                  <th className="px-4 py-2.5 text-center">نقش</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4"><Skeleton className="h-5 w-full" /></td></tr>
                ) : (data?.users ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">کاربری ثبت نشده است</td></tr>
                ) : (
                  data!.users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{u.name}</td>
                      <td className="px-4 py-2.5 text-xs" dir="ltr">{u.email}</td>
                      <td className="px-4 py-2.5">{u.tenant ?? "—"}</td>
                      <td className="px-4 py-2.5">{u.organization ?? "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        {u.isPlatformAdmin ? <Badge className="bg-slate-800">{u.platformRole}</Badge> : <span className="text-xs text-muted-foreground">کاربر پروژه</span>}
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
