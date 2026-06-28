"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderPlus,
  FileText,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toFa, faMoney } from "@/lib/fa";
import { combinedCoefficient, type Coefficients } from "@/lib/calc/cascade";

const STEPS = [
  { id: 0, title: "مشخصات پروژه", icon: FolderPlus },
  { id: 1, title: "پیمان", icon: FileText },
  { id: 2, title: "ضرایب", icon: Sliders },
  { id: 3, title: "تأیید", icon: CheckCircle2 },
];

export function ProjectWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { selectProject } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    code: "",
    documentCode: "",
    year: "1404",
    contractAmount: "0",
    contractDate: "",
    location: "",
    description: "",
    priceListId: "",
    coefficients: {
      general: 1.0,
      regional: 1.12,
      altitude: 1.0,
      floors: 1.0,
      tunnelHardship: 1.0,
    } as Coefficients,
  });

  const { data: priceListsData } = useQuery({
    queryKey: ["price-lists"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/price-lists");
      return r.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("خطا در ایجاد پروژه");
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "پروژه ایجاد شد", description: "پروژه جدید با موفقیت ساخته شد" });
      onOpenChange(false);
      selectProject(data.project.id);
      // ریست فرم
      setStep(0);
      setForm({
        name: "", code: "", documentCode: "", year: "1404", contractAmount: "0",
        contractDate: "", location: "", description: "", priceListId: "",
        coefficients: { general: 1.0, regional: 1.12, altitude: 1.0, floors: 1.0, tunnelHardship: 1.0 },
      });
    },
    onError: () => {
      toast({ title: "خطا", description: "ایجاد پروژه ناموفق بود", variant: "destructive" });
    },
  });

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.code.trim();
    if (step === 1) return true;
    if (step === 2) return true;
    return true;
  };

  const handleCreate = () => {
    mutation.mutate({
      name: form.name,
      code: form.code,
      documentCode: form.documentCode,
      year: Number(form.year),
      contractAmount: Number(form.contractAmount),
      contractDate: form.contractDate || null,
      location: form.location,
      description: form.description,
      priceListId: form.priceListId || null,
      coefficients: form.coefficients,
    });
  };

  const coeffs = form.coefficients;
  const combined = combinedCoefficient(coeffs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">ایجاد پروژه جدید</DialogTitle>
          <DialogDescription>
            با ایجاد پروژه، ورک‌فلو زنجیره‌ای متره، برگه مالی، فصول و صورت‌وضعیت در دسترس قرار می‌گیرد
          </DialogDescription>
        </DialogHeader>

        {/* استپر */}
        <div className="flex items-center justify-between gap-2 py-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                    i < step
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : i === step
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="size-5" /> : <s.icon className="size-5" />}
                </div>
                <span className={`text-[11px] font-medium ${i === step ? "text-amber-600" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-emerald-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-dashed">
          <CardContent className="min-h-[300px] p-6">
            {/* مرحله ۰: مشخصات */}
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">مشخصات اصلی پروژه</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="نام پروژه *">
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="مثلاً: متروی تهران خط ۷"
                    />
                  </Field>
                  <Field label="کد پروژه *">
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="مثلاً: TM7-S25"
                    />
                  </Field>
                  <Field label="کد مدرک">
                    <Input
                      value={form.documentCode}
                      onChange={(e) => setForm({ ...form, documentCode: e.target.value })}
                      placeholder="DOC-..."
                    />
                  </Field>
                  <Field label="سال">
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </Field>
                  <Field label="موقعیت (شهر)">
                    <Input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="تهران"
                    />
                  </Field>
                  <Field label="فهرست بها">
                    <Select value={form.priceListId} onValueChange={(v) => setForm({ ...form, priceListId: v })}>
                      <SelectTrigger><SelectValue placeholder="انتخاب فهرست" /></SelectTrigger>
                      <SelectContent>
                        {(priceListsData?.lists || []).map((pl: any) => (
                          <SelectItem key={pl.id} value={pl.id}>
                            {pl.title}
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
                    rows={2}
                    placeholder="توضیحات مختصر پروژه..."
                  />
                </Field>
              </div>
            )}

            {/* مرحله ۱: پیمان */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">مشخصات پیمان</h3>
                <div className="grid gap-4 sm:grid-cols-2">
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
                  </Field>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="font-medium text-amber-800 dark:text-amber-200">اطلاعات پیمان</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    مبلغ اولیه پیمان مبنای محاسبات صورت‌وضعیت قرار می‌گیرد. این مقدار بعداً قابل ویرایش است.
                  </p>
                </div>
              </div>
            )}

            {/* مرحله ۲: ضرایب */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">ضرایب پروژه</h3>
                <p className="text-sm text-muted-foreground">
                  این ضرایب روی تمام محاسبات زنجیره‌ای (برگه مالی، فصول، صورت‌وضعیت) اعمال می‌شوند.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CoeffField label="ضریب عمومی" value={coeffs.general} onChange={(v) => setForm({ ...form, coefficients: { ...coeffs, general: v } })} />
                  <CoeffField label="ضریب منطقه‌ای" value={coeffs.regional} onChange={(v) => setForm({ ...form, coefficients: { ...coeffs, regional: v } })} />
                  <CoeffField label="ضریب ارتفاع" value={coeffs.altitude} onChange={(v) => setForm({ ...form, coefficients: { ...coeffs, altitude: v } })} />
                  <CoeffField label="ضریب طبقات" value={coeffs.floors} onChange={(v) => setForm({ ...form, coefficients: { ...coeffs, floors: v } })} />
                  <CoeffField label="سختی تونل" value={coeffs.tunnelHardship} onChange={(v) => setForm({ ...form, coefficients: { ...coeffs, tunnelHardship: v } })} />
                </div>
                <div className="rounded-lg bg-gradient-to-l from-amber-500 to-orange-600 p-4 text-primary-foreground">
                  <div className="text-xs opacity-90">ضریب ترکیبی محاسبه‌شده</div>
                  <div className="mt-1 text-3xl font-bold tabular-nums">{toFa(combined.toFixed(4))}</div>
                </div>
              </div>
            )}

            {/* مرحله ۳: تأیید */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">تأیید و ایجاد پروژه</h3>
                <div className="rounded-lg border p-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <SummaryRow label="نام" value={form.name} />
                    <SummaryRow label="کد" value={form.code} />
                    <SummaryRow label="سال" value={toFa(form.year)} />
                    <SummaryRow label="موقعیت" value={form.location || "—"} />
                    <SummaryRow label="مبلغ پیمان" value={faMoney(Number(form.contractAmount))} />
                    <SummaryRow label="ضریب ترکیبی" value={toFa(combined.toFixed(4))} />
                  </dl>
                </div>
                <p className="text-xs text-muted-foreground">
                  پس از ایجاد، می‌توانید از تب «ریزمتره» شروع به ورود احجام کنید.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* دکمه‌های ناوبری */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>
            <ArrowRight className="ml-1.5 size-4" />
            {step === 0 ? "انصراف" : "مرحله قبل"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              مرحله بعد
              <ArrowLeft className="mr-1.5 size-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={mutation.isPending}>
              {mutation.isPending ? "در حال ایجاد..." : "ایجاد پروژه"}
              <Check className="mr-1.5 size-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

function CoeffField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-semibold text-amber-600">{toFa(value.toFixed(2))}</span>
      </div>
      <Input type="number" step="0.01" min="1" value={value} onChange={(e) => onChange(Number(e.target.value) || 1)} className="h-9" />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
