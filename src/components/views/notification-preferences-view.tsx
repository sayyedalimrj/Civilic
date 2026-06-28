"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Bell, MessageSquare, FileText, Clock, Shield, Mail,
  Save, Settings, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NotificationPrefs {
  enablePaymentAlerts: boolean;
  enableBOQAlerts: boolean;
  enableWorkflowAlerts: boolean;
  enableScheduleAlerts: boolean;
  enableRiskAlerts: boolean;
  enableChatNotifications: boolean;
  enableCommentMentions: boolean;
  criticalOnly: boolean;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyDigest: boolean;
  digestTime: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enablePaymentAlerts: true,
  enableBOQAlerts: true,
  enableWorkflowAlerts: true,
  enableScheduleAlerts: true,
  enableRiskAlerts: true,
  enableChatNotifications: true,
  enableCommentMentions: true,
  criticalOnly: false,
  inAppNotifications: true,
  emailNotifications: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  dailyDigest: true,
  digestTime: "08:00",
};

export function NotificationPreferences() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const { isLoading } = useQuery({
    queryKey: ["notif-prefs"],
    queryFn: async () => {
      const r = await fetch("/api/user/notifications");
      const data = await r.json();
      if (data.preferences) setPrefs(data.preferences);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: NotificationPrefs) => {
      const r = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "تنظیمات ذخیره شد" });
      qc.invalidateQueries({ queryKey: ["notif-prefs"] });
    },
  });

  const update = (key: keyof NotificationPrefs, value: any) => {
    setPrefs({ ...prefs, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="size-6 text-amber-600" />
            تنظیمات اعلان‌ها
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            مدیریت نوع و کانال دریافت اعلان‌ها
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate(prefs)}
        >
          <Save className="size-4" />
          {saveMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </div>

      {/* Notification Types */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="size-4 text-amber-600" />
            انواع اعلان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PrefRow
            icon={FileText}
            label="اعلان‌های صورت‌وضعیت"
            description="یادآوری موعد ارسال، تأیید، رد و قطعی شدن"
            checked={prefs.enablePaymentAlerts}
            onChange={(v) => update("enablePaymentAlerts", v)}
          />
          <Separator />
          <PrefRow
            icon={FileText}
            label="اعلان‌های ریزمتره و برگه مالی"
            description="تغییرات ردیف‌ها، کدهای ستاره‌دار، عدم تطابق"
            checked={prefs.enableBOQAlerts}
            onChange={(v) => update("enableBOQAlerts", v)}
          />
          <Separator />
          <PrefRow
            icon={CheckCircle2}
            label="اعلان‌های گردش کار"
            description="ارسال، تأیید و رد اسناد توسط سایر نقش‌ها"
            checked={prefs.enableWorkflowAlerts}
            onChange={(v) => update("enableWorkflowAlerts", v)}
          />
          <Separator />
          <PrefRow
            icon={Clock}
            label="اعلان‌های زمان‌بندی"
            description="موعد نهایی، تأخیر، بازرسی‌های پیش‌رو"
            checked={prefs.enableScheduleAlerts}
            onChange={(v) => update("enableScheduleAlerts", v)}
          />
          <Separator />
          <PrefRow
            icon={Shield}
            label="اعلان‌های ریسک"
            description="ریسک‌های جدید، بحرانی، تأخیر در رسیدگی"
            checked={prefs.enableRiskAlerts}
            onChange={(v) => update("enableRiskAlerts", v)}
          />
          <Separator />
          <PrefRow
            icon={MessageSquare}
            label="اعلان‌های چت"
            description="پیام‌های جدید در مکالمات"
            checked={prefs.enableChatNotifications}
            onChange={(v) => update("enableChatNotifications", v)}
          />
          <Separator />
          <PrefRow
            icon={AlertCircle}
            label="اشاره (Mention) در کامنت"
            description="وقتی کسی شما را در کامنت mention می‌کند"
            checked={prefs.enableCommentMentions}
            onChange={(v) => update("enableCommentMentions", v)}
          />
        </CardContent>
      </Card>

      {/* Severity Filter */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-600" />
            فیلتر شدت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-md bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-600" />
              <div>
                <div className="text-xs font-medium">فقط هشدارهای بحرانی</div>
                <div className="text-[10px] text-muted-foreground">
                  فقط اعلان‌های با شدت CRITICAL نمایش داده شود
                </div>
              </div>
            </div>
            <Switch
              checked={prefs.criticalOnly}
              onCheckedChange={(v) => update("criticalOnly", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Channels */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="size-4 text-amber-600" />
            کانال‌های دریافت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <Bell className="size-4 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-medium">اعلان درون‌برنامه‌ای</div>
                <div className="text-[10px] text-muted-foreground">نمایش در پنل هشدارهای هوشمند</div>
              </div>
            </div>
            <Switch
              checked={prefs.inAppNotifications}
              onCheckedChange={(v) => update("inAppNotifications", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <Mail className="size-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-medium">اعلان ایمیلی</div>
                <div className="text-[10px] text-muted-foreground">ارسال اعلان‌ها به ایمیل</div>
              </div>
            </div>
            <Switch
              checked={prefs.emailNotifications}
              onCheckedChange={(v) => update("emailNotifications", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-purple-600" />
              ساعات آرامش (Quiet Hours)
            </span>
            <Switch
              checked={prefs.quietHoursEnabled}
              onCheckedChange={(v) => update("quietHoursEnabled", v)}
            />
          </CardTitle>
        </CardHeader>
        {prefs.quietHoursEnabled && (
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">شروع</Label>
                <Input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) => update("quietHoursStart", e.target.value)}
                  className="h-9 text-xs"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">پایان</Label>
                <Input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) => update("quietHoursEnd", e.target.value)}
                  className="h-9 text-xs"
                  dir="ltr"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              در این ساعات، اعلان‌ها نمایش داده نمی‌شوند (فقط بحرانی‌ها)
            </p>
          </CardContent>
        )}
      </Card>

      {/* Daily Digest */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-emerald-600" />
              خلاصه‌ی روزانه (Digest)
            </span>
            <Switch
              checked={prefs.dailyDigest}
              onCheckedChange={(v) => update("dailyDigest", v)}
            />
          </CardTitle>
        </CardHeader>
        {prefs.dailyDigest && (
          <CardContent>
            <div className="space-y-1.5 max-w-[200px]">
              <Label className="text-xs">ساعت ارسال خلاصه</Label>
              <Input
                type="time"
                value={prefs.digestTime}
                onChange={(e) => update("digestTime", e.target.value)}
                className="h-9 text-xs"
                dir="ltr"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              خلاصه‌ای از اعلان‌های روز قبل هر روز در این ساعت ارسال می‌شود
            </p>
          </CardContent>
        )}
      </Card>

      {/* Save button at bottom */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate(prefs)}
        >
          <Save className="size-4" />
          {saveMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </div>
    </div>
  );
}

function PrefRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-muted/40 flex items-center justify-center">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-xs font-medium">{label}</div>
          <div className="text-[10px] text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
