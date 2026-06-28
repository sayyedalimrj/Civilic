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
import { faMoney, toEn } from "@/lib/fa";

interface InvoiceRow {
  id: string; number: string; amount: number; status: string;
  issuedAt: string | null; dueAt: string | null; paidAt: string | null; tenant: string | null;
}
interface TenantOpt { id: string; name: string }

const STATUS_FA: Record<string, string> = { DRAFT: "پیش‌نویس", ISSUED: "صادرشده", PAID: "پرداخت‌شده", OVERDUE: "معوق", VOID: "باطل" };

export default function AdminInvoicesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ invoices: InvoiceRow[] }>({
    queryKey: ["admin-invoices"],
    queryFn: async () => (await fetch("/api/admin/invoices")).json(),
  });
  const { data: tenantsData } = useQuery<{ tenants: TenantOpt[] }>({
    queryKey: ["admin-tenants"],
    queryFn: async () => (await fetch("/api/admin/tenants")).json(),
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, amount: parseInt(toEn(amount).replace(/\D/g, ""), 10) || 0, dueInDays: 7 }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "خطا");
    },
    onSuccess: () => { setShowForm(false); setAmount(""); setError(null); qc.invalidateQueries({ queryKey: ["admin-invoices"] }); },
    onError: (e: Error) => setError(e.message),
  });

  const pay = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/admin/invoices/${id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-invoices"] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">صورتحساب‌ها</h1>
          <p className="text-sm text-muted-foreground">صدور و ثبت پرداخت اشتراک‌های SaaS</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}><Plus className="size-4" /> صورتحساب جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>مستاجر</Label>
                <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="">انتخاب کنید…</option>
                  {(tenantsData?.tenants ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>مبلغ (ریال)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" placeholder="9000000" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={() => create.mutate()} disabled={create.isPending || !tenantId}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />} صدور
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
                  <th className="px-4 py-2.5 text-start">شماره</th>
                  <th className="px-4 py-2.5 text-start">مستاجر</th>
                  <th className="px-4 py-2.5 text-start">مبلغ</th>
                  <th className="px-4 py-2.5 text-center">وضعیت</th>
                  <th className="px-4 py-2.5 text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4"><Skeleton className="h-5 w-full" /></td></tr>
                ) : (data?.invoices ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">صورتحسابی ثبت نشده است</td></tr>
                ) : (
                  data!.invoices.map((i) => (
                    <tr key={i.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs" dir="ltr">{i.number}</td>
                      <td className="px-4 py-2.5">{i.tenant ?? "—"}</td>
                      <td className="px-4 py-2.5">{faMoney(i.amount)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge className={i.status === "PAID" ? "bg-emerald-600" : i.status === "OVERDUE" ? "bg-rose-600" : ""} variant={i.status === "PAID" || i.status === "OVERDUE" ? "default" : "secondary"}>
                          {STATUS_FA[i.status] ?? i.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {i.status !== "PAID" && i.status !== "VOID" && (
                          <Button size="sm" variant="outline" onClick={() => pay.mutate(i.id)} disabled={pay.isPending}>ثبت پرداخت</Button>
                        )}
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
