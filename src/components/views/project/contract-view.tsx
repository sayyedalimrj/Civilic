"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toFa, faMoney, toJalali } from "@/lib/fa";
import { combinedCoefficient, type Coefficients } from "@/lib/calc/cascade";

export function ContractView() {
  const { selectedProjectId } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data } = useQuery<{ project: any }>({
    queryKey: ["project", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const project = data?.project;
  const [form, setForm] = useState<any>(null);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (project && project.id !== lastProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastProjectId(project.id);
      const coeffs = JSON.parse(project.coefficients || "{}");
      setForm({
        name: project.name,
        code: project.code,
        documentCode: project.documentCode || "",
        year: String(project.year),
        contractAmount: String(project.contractAmount),
        contractDate: project.contractDate?.split("T")[0] || "",
        location: project.location || "",
        description: project.description || "",
        status: project.status,
        priceListId: project.priceListId || "",
        coefficients: {
          general: coeffs.general ?? 1.0,
          regional: coeffs.regional ?? 1.0,
          altitude: coeffs.altitude ?? 1.0,
          floors: coeffs.floors ?? 1.0,
          tunnelHardship: coeffs.tunnelHardship ?? 1.0,
        },
      });
    }
  }, [project, lastProjectId]);

  const { data: priceListsData } = useQuery({
    queryKey: ["price-lists"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/price-lists");
      return r.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const r = await fetch(`/api/projects/${selectedProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("خطا در ذخیره");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", selectedProjectId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "ذخیره شد", description: "اطلاعات پروژه و ضرایب به‌روزرسانی شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "ذخیره ناموفق بود", variant: "destructive" });
    },
  });

  if (!form) {
    return <div className="p-6"><div className="h-40 animate-pulse rounded-xl bg-muted" /></div>;
  }

  const coeffs: Coefficients = form.coefficients;
  const combined = combinedCoefficient(coeffs);

  const handleSave = () => {
    mutation.mutate({
      name: form.name,
      code: form.code,
      documentCode: form.documentCode,
      year: Number(form.year),
      contractAmount: Number(form.contractAmount),
      contractDate: form.contractDate || null,
      location: form.location,
      description: form.description,
      status: form.status,
      priceListId: form.priceListId || null,
      coefficients: form.coefficients,
    });
  };

  const setCoeff = (key: keyof Coefficients, value: number) => {
    setForm({ ...form, coefficients: { ...form.coefficients, [key]: value } });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">پیمان و ضرایب پروژه</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ضرایب روی تمام محاسبات زنجیره‌ای اعمال می‌شوند
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RotateCcw className="ml-1.5 size-3.5" />
            انصراف
          </Button>
          <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
            <Save className="ml-1.5 size-3.5" />
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <Info className="size-4 text-amber-600" />
        <AlertDescription className="text-sm">
          تغییر ضرایب پس از ذخیره، تمام محاسبات برگه مالی، فصول و صورت‌وضعیت را به‌صورت خودکار بازمحاسبه می‌کند.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* مشخصات اصلی */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">مشخصات پروژه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نام پروژه">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="کد پروژه">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </Field>
              <Field label="کد مدرک">
                <Input value={form.documentCode} onChange={(e) => setForm({ ...form, documentCode: e.target.value })} />
              </Field>
              <Field label="سال">
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
              <Field label="مبلغ اولیه پیمان (ریال)">
                <Input
                  type="number"
                  value={form.contractAmount}
                  onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{faMoney(Number(form.contractAmount))}</p>
              </Field>
              <Field label="تاریخ پیمان">
                <Input
                  type="date"
                  value={form.contractDate}
                  onChange={(e) => setForm({ ...form, contractDate: e.target.value })}
                />
                {form.contractDate && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{toJalali(form.contractDate)}</p>
                )}
              </Field>
              <Field label="موقعیت (شهر/منطقه)">
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              <Field label="فهرست بها">
                <Select value={form.priceListId} onValueChange={(v) => setForm({ ...form, priceListId: v })}>
                  <SelectTrigger><SelectValue placeholder="انتخاب فهرست بها" /></SelectTrigger>
                  <SelectContent>
                    {(priceListsData?.lists || []).map((pl: any) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.title} — {toFa(pl.year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="شرح پروژه">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>

        {/* ضرایب */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ضرایب پروژه</CardTitle>
            <CardDescription>روی تمام محاسبات اعمال می‌شود</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CoeffInput label="ضریب عمومی" value={coeffs.general} onChange={(v) => setCoeff("general", v)} />
            <CoeffInput label="ضریب منطقه‌ای" value={coeffs.regional} onChange={(v) => setCoeff("regional", v)} hint="مثلاً ۱.۱۲ برای تهران" />
            <CoeffInput label="ضریب ارتفاع" value={coeffs.altitude} onChange={(v) => setCoeff("altitude", v)} hint="برای شهرهای مرتفع" />
            <CoeffInput label="ضریب طبقات" value={coeffs.floors} onChange={(v) => setCoeff("floors", v)} />
            <CoeffInput label="سختی تونل" value={coeffs.tunnelHardship} onChange={(v) => setCoeff("tunnelHardship", v)} hint="فقط برای پروژه‌های تونلی > ۱" />
            <div className="rounded-lg bg-gradient-to-l from-amber-500 to-orange-600 p-4 text-primary-foreground">
              <div className="text-xs opacity-90">ضریب ترکیبی</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{toFa(combined.toFixed(4))}</div>
              <div className="mt-1 text-[10px] opacity-80">عمومی × منطقه‌ای × ارتفاع × طبقات × سختی تونل</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function CoeffInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-semibold tabular-nums text-amber-600">{toFa(value.toFixed(2))}</span>
      </div>
      <Input
        type="number"
        step="0.01"
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="h-9"
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
