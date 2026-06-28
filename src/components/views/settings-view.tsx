"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings, Building2, Image as ImageIcon, FileSignature, Palette,
  Database, Save, Sun, Moon, Monitor, Upload, Trash2, AlertTriangle,
  Shield, Check, X, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { toFa, toJalali } from "@/lib/fa";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Signature {
  role: string;
  name: string;
  signUrl?: string;
}

export function SettingsView() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const r = await fetch("/api/tenant");
      return r.json();
    },
  });

  const tenant = data?.tenant;

  // Form state — initialize from query data
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formLetterheadUrl, setFormLetterheadUrl] = useState("");
  const [formSignatures, setFormSignatures] = useState<Signature[]>([]);
  const [signatureDragOver, setSignatureDragOver] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Sync form once when data first loads
  if (tenant && !initialized) {
    setFormName(tenant.name || "");
    setFormDescription(tenant.description || "");
    setFormLogoUrl(tenant.logoUrl || "");
    setFormLetterheadUrl(tenant.letterheadUrl || "");
    try {
      setFormSignatures(tenant.signatures ? JSON.parse(tenant.signatures) : []);
    } catch {
      setFormSignatures([]);
    }
    setInitialized(true);
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          logoUrl: formLogoUrl,
          letterheadUrl: formLetterheadUrl,
          signatures: formSignatures,
        }),
      });
      if (!r.ok) throw new Error("خطا در ذخیره");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast({ title: "ذخیره شد", description: "تنظیمات سازمان با موفقیت به‌روزرسانی شد" });
      setErrors({});
    },
    onError: () => {
      toast({ title: "خطا", description: "ذخیره تنظیمات با مشکل مواجه شد", variant: "destructive" });
    },
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.name = "نام سازمان الزامی است";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate();
  };

  // Signature management
  const addSignature = () => {
    setFormSignatures([...formSignatures, { role: "", name: "" }]);
  };

  const updateSignature = (index: number, field: keyof Signature, value: string) => {
    const updated = [...formSignatures];
    updated[index] = { ...updated[index], [field]: value };
    setFormSignatures(updated);
  };

  const removeSignature = (index: number) => {
    setFormSignatures(formSignatures.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const themeOptions = [
    { value: "light", label: "روشن", icon: Sun },
    { value: "dark", label: "تاریک", icon: Moon },
    { value: "system", label: "سیستم", icon: Monitor },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="size-6 text-amber-600" />
          تنظیمات سازمان
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          آرم، سربرگ، امضاها، تم و پیکربندی سازمان
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* مشخصات سازمان */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-gradient-to-br from-card via-card to-amber-50/30 dark:to-amber-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-amber-600" />
              مشخصات سازمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  نام سازمان <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={errors.name ? "border-rose-400 focus-visible:ring-rose-400" : ""}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-500">
                    <AlertTriangle className="size-3" /> {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">شناسه سازمان</Label>
                <Input value={tenant?.id || ""} disabled className="bg-muted/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">توضیحات سازمان</Label>
              <Textarea
                rows={2}
                placeholder="توضیحات سازمان..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <Separator />

            {/* آرم و سربرگ */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <ImageIcon className="size-3.5" /> آرم سازمان
                </Label>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-inner">
                    <Building2 className="size-7" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Button variant="outline" size="sm" className="w-full h-8">
                      <Upload className="ml-1 size-3.5" />
                      آپلود آرم
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground">
                      PNG, SVG — حداکثر ۵۰۰KB
                    </p>
                  </div>
                </div>
                {formLogoUrl && (
                  <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                    <Check className="size-3" /> آرم بارگذاری شده
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <FileSignature className="size-3.5" /> سربرگ رسمی
                </Label>
                <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/30 p-4 text-center dark:border-amber-700 dark:bg-amber-950/10">
                  <Upload className="mx-auto size-8 text-amber-400" />
                  <p className="mt-2 text-xs font-medium">فایل سربرگ (PNG/PDF)</p>
                  <p className="text-[10px] text-muted-foreground">ابعاد: ۲۱۰×۲۹۷ میلیمتر (A4)</p>
                  <Button variant="ghost" size="sm" className="mt-2 h-8">
                    آپلود سربرگ
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme & License */}
        <div className="space-y-4">
          {/* Theme */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card via-card to-slate-50/50 dark:to-slate-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="size-4 text-amber-600" />
                تم نمایش
              </CardTitle>
              <CardDescription>انتخاب حالت نمایش برنامه</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((opt) => {
                  const isActive = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        isActive
                          ? "border-amber-400 bg-amber-50 shadow-sm dark:bg-amber-950/30"
                          : "border-border hover:border-amber-200"
                      }`}
                    >
                      <opt.icon className={`size-5 ${isActive ? "text-amber-600" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${isActive ? "text-amber-700 dark:text-amber-300" : ""}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* License */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card via-card to-emerald-50/30 dark:to-emerald-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4 text-emerald-600" />
                اطلاعات لایسنس
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">وضعیت لایسنس</span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    فعال
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">نوع اشتراک</span>
                  <span className="font-medium">حرفه‌ای</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاریخ انقضا</span>
                  <span className="font-medium">{toFa(1405)}/۱۲/۲۹</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تعداد کاربران</span>
                  <span className="font-medium">{toFa(tenant?.users?.length || 0)} / {toFa(10)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">پروژه‌های فعال</span>
                  <span className="font-medium">نامحدود</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* امضاهای مجاز */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card via-card to-orange-50/30 dark:to-orange-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSignature className="size-4 text-amber-600" />
            امضاهای مجاز
          </CardTitle>
          <CardDescription>امضاهای رسمی برای خروجی‌های سازمان</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formSignatures.map((sig, i) => (
              <div
                key={i}
                className={`rounded-xl border-2 p-4 transition-all ${
                  signatureDragOver === `sig-${i}`
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                    : "border-border"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="سمت (مثلاً ناظر)"
                      value={sig.role}
                      onChange={(e) => updateSignature(i, "role", e.target.value)}
                      className="h-8 text-xs font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 size-7 text-rose-400 hover:text-rose-600"
                      onClick={() => removeSignature(i)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <Input
                    placeholder="نام و نام خانوادگی"
                    value={sig.name}
                    onChange={(e) => updateSignature(i, "name", e.target.value)}
                    className="h-8 text-xs"
                  />
                  {/* Drag-and-drop signature area */}
                  <div
                    className={`flex h-20 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                      signatureDragOver === `sig-${i}`
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                        : "border-border bg-muted/20"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setSignatureDragOver(`sig-${i}`);
                    }}
                    onDragLeave={() => setSignatureDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSignatureDragOver(null);
                      // Placeholder: would handle file upload
                      updateSignature(i, "signUrl", "uploaded");
                      toast({ title: "فایل امضا دریافت شد", description: "پردازش تصویر امضا..." });
                    }}
                  >
                    {sig.signUrl ? (
                      <div className="text-center">
                        <Check className="mx-auto size-5 text-emerald-500" />
                        <p className="mt-1 text-[10px] text-emerald-600">تصویر امضا بارگذاری شده</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="size-5 text-muted-foreground" />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          تصویر امضا را اینجا رها کنید
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addSignature}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-4 transition-all hover:border-amber-400 hover:bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/10"
            >
              <Upload className="size-5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">افزودن امضا</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* پیش‌نمایش سربرگ */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">پیش‌نمایش سربرگ</CardTitle>
          <CardDescription>نمایش سربرگ روی خروجی‌های رسمی — ابعاد A4 با حاشیه استاندارد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto max-w-2xl rounded-xl border bg-white p-0 shadow-lg dark:bg-card">
            {/* A4 preview with margins */}
            <div className="relative" style={{ aspectRatio: "210/297" }}>
              {/* Margin indicators */}
              <div className="absolute inset-3 border border-amber-200/50 dark:border-amber-800/30">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-amber-600 pb-3 pr-4 pl-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 text-white">
                      <Building2 className="size-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{formName || "نام سازمان"}</div>
                      <div className="text-[10px] text-muted-foreground">سیوان تدبیر تجارت</div>
                    </div>
                  </div>
                  <div className="text-left text-[9px] text-muted-foreground">
                    <div>کد سازمان: {tenant?.id?.slice(-8)}</div>
                    <div>تاریخ: {toJalali(new Date())}</div>
                    <div>شماره: ————</div>
                  </div>
                </div>
                {/* Body placeholder */}
                <div className="p-4">
                  <div className="text-center text-xs font-medium">برگه مالی پروژه</div>
                  <div className="mt-1 text-center text-[10px] text-muted-foreground">
                    نمونه خروجی رسمی
                  </div>
                  <div className="mt-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-3 rounded bg-muted/30" style={{ width: `${70 + i * 5}%` }} />
                    ))}
                  </div>
                </div>
                {/* Signatures */}
                <div className="absolute bottom-4 right-4 left-4 grid grid-cols-3 gap-3 border-t pt-3">
                  {formSignatures.filter((s) => s.role).slice(0, 3).map((sig, i) => (
                    <div key={i} className="text-center">
                      <div className="h-6 border-b border-dashed" />
                      <div className="mt-1 text-[8px] font-medium">{sig.role}</div>
                      <div className="text-[8px] text-muted-foreground">{sig.name || "——"}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Dimension labels */}
              <div className="absolute -top-1 right-1/2 -translate-x-1/2 text-[8px] text-amber-500">۲۱۰mm</div>
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 rotate-90 text-[8px] text-amber-500">۲۹۷mm</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span>حاشیه: بالا ۲۵mm</span>
            <span>•</span>
            <span>پایین ۲۰mm</span>
            <span>•</span>
            <span>چپ و راست ۲۰mm</span>
          </div>
        </CardContent>
      </Card>

      {/* پیکربندی سیستم */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card via-card to-slate-50/30 dark:to-slate-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-amber-600" />
            پیکربندی سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ConfigItem label="نسخه دیتابیس" value="۱.۰.۰" />
            <ConfigItem label="آخرین به‌روزرسانی فهرست" value="۱۴۰۴/۰۱/۰۱" />
            <ConfigItem label="تعداد آیتم‌های پایه" value="۱۴ آیتم" />
            <ConfigItem label="کش سرور (TTL)" value="۳۰ ثانیه" />
            <ConfigItem label="حالت قفل رکورد" value="فعال" active />
            <ConfigItem label="زمان‌بندی بازمحاسبه" value="هر ۱۵ دقیقه" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-rose-200 dark:border-rose-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-rose-600">
            <AlertTriangle className="size-4" />
            منطقه خطر
          </CardTitle>
          <CardDescription>عملیات‌های غیرقابل بازگشت</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">حذف سازمان</p>
              <p className="text-xs text-muted-foreground">
                تمام پروژه‌ها، کاربران و داده‌های سازمان حذف خواهند شد. این عمل قابل بازگشت نیست.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  <Trash2 className="ml-1.5 size-4" />
                  حذف سازمان
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل تمام داده‌های سازمان شامل پروژه‌ها، ریزمتره‌ها، صورت‌وضعیت‌ها و کاربران را
                    به‌طور کامل حذف می‌کند. این عمل غیرقابل بازگشت است.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction className="bg-rose-600 hover:bg-rose-700">
                    بله، حذف کن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          آخرین ذخیره: {toJalali(tenant?.updatedAt || new Date())}
        </p>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="min-w-32">
          {saveMutation.isPending ? (
            <Loader2 className="ml-1.5 size-4 animate-spin" />
          ) : (
            <Save className="ml-1.5 size-4" />
          )}
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}

function ConfigItem({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="rounded-lg border p-3 transition-colors hover:bg-muted/30">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-medium ${active ? "text-emerald-600" : ""}`}>{value}</div>
    </div>
  );
}
