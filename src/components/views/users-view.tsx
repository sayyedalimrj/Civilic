"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, UserPlus, Shield, HardHat, Receipt, Mail, MoreVertical,
  Search, Pencil, Trash2, Check, X, Loader2, UserCheck, UserX, UserCog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { toFa, toJalali, initials } from "@/lib/fa";

const roleMap: Record<string, { label: string; icon: typeof Shield; color: string; gradient: string }> = {
  ADMIN: {
    label: "مدیر سازمان",
    icon: Shield,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-600",
  },
  ESTIMATOR: {
    label: "برآوردکار",
    icon: HardHat,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    gradient: "from-emerald-500 to-teal-600",
  },
  BILLER: {
    label: "مسئول صورت‌وضعیت",
    icon: Receipt,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    gradient: "from-orange-500 to-rose-600",
  },
};

const accessMatrix = [
  { mod: "ایجاد و ویرایش پروژه", admin: true, est: false, biller: false },
  { mod: "ورود ریزمتره", admin: true, est: true, biller: false },
  { mod: "ویرایش برگه مالی", admin: true, est: true, biller: false },
  { mod: "ثبت صورت‌وضعیت", admin: true, est: false, biller: true },
  { mod: "اعمال تعدیل", admin: true, est: true, biller: true },
  { mod: "گزارشات و خروجی", admin: true, est: true, biller: true },
  { mod: "مدیریت کاربران", admin: true, est: false, biller: false },
  { mod: "تنظیمات سازمان", admin: true, est: false, biller: false },
];

export function UsersView() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const r = await fetch("/api/users");
      return r.json();
    },
  });

  const users = data?.users || [];

  // Filter users
  const filtered = users.filter((u: any) => {
    const matchSearch =
      u.name.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Add user mutation
  const addMutation = useMutation({
    mutationFn: async (formData: { name: string; email: string; role: string; password: string }) => {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "خطا در ایجاد کاربر");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setAddOpen(false);
      toast({ title: "کاربر اضافه شد", description: "کاربر جدید با موفقیت ایجاد شد" });
    },
    onError: (err: any) => {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    },
  });

  // Edit user mutation
  const editMutation = useMutation({
    mutationFn: async (formData: { id: string; name: string; email: string; role: string }) => {
      const r = await fetch(`/api/users/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, role: formData.role }),
      });
      if (!r.ok) throw new Error("خطا در ویرایش");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditUser(null);
      toast({ title: "ویرایش شد", description: "اطلاعات کاربر به‌روزرسانی شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "ویرایش کاربر با مشکل مواجه شد", variant: "destructive" });
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const r = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("خطا در حذف");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "حذف شد", description: "کاربر با موفقیت حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "حذف کاربر با مشکل مواجه شد", variant: "destructive" });
    },
  });

  // Count summaries
  const totalActive = users.filter((u: any) => u.isActive).length;
  const totalInactive = users.filter((u: any) => !u.isActive).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="size-6 text-amber-600" />
            کاربران و نقش‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت کاربران سازمان و سطوح دسترسی</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="ml-1.5 size-4" />
              کاربر جدید
            </Button>
          </DialogTrigger>
          <AddUserDialog
            onSubmit={(d) => addMutation.mutate(d)}
            isPending={addMutation.isPending}
          />
        </Dialog>
      </div>

      {/* آمار کاربران */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          icon={Users}
          label="کل کاربران"
          value={users.length}
          gradient="from-slate-500 to-slate-700"
          color="text-slate-700 dark:text-slate-300"
          bg="bg-slate-100 dark:bg-slate-800/40"
        />
        <SummaryCard
          icon={UserCheck}
          label="فعال"
          value={totalActive}
          gradient="from-emerald-500 to-teal-600"
          color="text-emerald-700 dark:text-emerald-300"
          bg="bg-emerald-100 dark:bg-emerald-900/40"
        />
        <SummaryCard
          icon={UserX}
          label="غیرفعال"
          value={totalInactive}
          gradient="from-rose-500 to-pink-600"
          color="text-rose-700 dark:text-rose-300"
          bg="bg-rose-100 dark:bg-rose-900/40"
        />
        {Object.entries(roleMap).map(([key, r]) => {
          const count = users.filter((u: any) => u.role === key).length;
          return (
            <SummaryCard
              key={key}
              icon={r.icon}
              label={r.label}
              value={count}
              gradient={r.gradient}
              color=""
              bg={r.color}
            />
          );
        })}
      </div>

      {/* جستجو و فیلتر */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو با نام یا ایمیل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="فیلتر نقش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه نقش‌ها</SelectItem>
                <SelectItem value="ADMIN">مدیر سازمان</SelectItem>
                <SelectItem value="ESTIMATOR">برآوردکار</SelectItem>
                <SelectItem value="BILLER">صورت‌وضعیت</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {toFa(filtered.length)} نفر
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* جدول کاربران */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">لیست کاربران</CardTitle>
          <CardDescription>تمام کاربران سازمان</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[60vh]">
            <div className="divide-y">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="mx-auto size-10 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">کاربری یافت نشد</p>
                </div>
              ) : (
                filtered.map((u: any) => {
                  const role = roleMap[u.role] || roleMap.ESTIMATOR;
                  const IconComp = role.icon;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30 ${
                        !u.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <div className={`flex size-11 items-center justify-center rounded-full bg-gradient-to-br ${role.gradient} text-sm font-bold text-white shadow-sm`}>
                        {initials(u.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.name}</span>
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${role.color}`}>
                            <IconComp className="size-3" />
                            {role.label}
                          </span>
                          {!u.isActive && (
                            <Badge variant="secondary" className="text-[10px]">غیرفعال</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />{u.email}
                          </span>
                          <span>عضویت: {toJalali(u.createdAt)}</span>
                        </div>
                      </div>
                      {/* Active toggle */}
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] text-muted-foreground">
                          {u.isActive ? "فعال" : "غیرفعال"}
                        </Label>
                        <Switch
                          checked={u.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: u.id, isActive: checked })
                          }
                        />
                      </div>
                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setEditUser(u)}>
                            <Pencil className="ml-2 size-3.5" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-600"
                            onClick={() => deleteMutation.mutate(u.id)}
                          >
                            <Trash2 className="ml-2 size-3.5" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ماتریس دسترسی */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="size-4 text-amber-600" />
            ماتریس دسترسی نقش‌ها
          </CardTitle>
          <CardDescription>سطوح دسترسی هر نقش به ماژول‌های سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <tr>
                  <th className="p-3 text-right font-medium">ماژول</th>
                  <th className="p-3 text-center font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="size-4 text-amber-600" />
                      <span>مدیر سازمان</span>
                    </div>
                  </th>
                  <th className="p-3 text-center font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <HardHat className="size-4 text-emerald-600" />
                      <span>برآوردکار</span>
                    </div>
                  </th>
                  <th className="p-3 text-center font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Receipt className="size-4 text-orange-600" />
                      <span>صورت‌وضعیت</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {accessMatrix.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <td className="p-3 font-medium">{row.mod}</td>
                    <td className="p-3 text-center">
                      {row.admin ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Check className="size-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-300">
                          <X className="size-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.est ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Check className="size-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-300">
                          <X className="size-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.biller ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Check className="size-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-300">
                          <X className="size-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش کاربر</DialogTitle>
            <DialogDescription>تغییر اطلاعات و نقش کاربر</DialogDescription>
          </DialogHeader>
          {editUser && (
            <EditUserForm
              user={editUser}
              onSubmit={(d) => editMutation.mutate(d)}
              isPending={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  gradient,
  color,
  bg,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  gradient: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          <Icon className="size-6" />
        </div>
        <div>
          <div className="text-2xl font-bold">{toFa(value)}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddUserDialog({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: { name: string; email: string; role: string; password: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ESTIMATOR");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "نام الزامی است";
    if (!email.trim()) errs.email = "ایمیل الزامی است";
    if (!email.includes("@")) errs.email = "ایمیل نامعتبر است";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({ name, email, role, password });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>افزودن کاربر جدید</DialogTitle>
        <DialogDescription>ایجاد حساب کاربری برای عضو جدید سازمان</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">نام و نام خانوادگی <span className="text-rose-500">*</span></Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً احمد میرزایی"
            className={errors.name ? "border-rose-400" : ""}
          />
          {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">ایمیل <span className="text-rose-500">*</span></Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@company.ir"
            dir="ltr"
            className={errors.email ? "border-rose-400" : ""}
          />
          {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">نقش</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">مدیر سازمان</SelectItem>
              <SelectItem value="ESTIMATOR">برآوردکار</SelectItem>
              <SelectItem value="BILLER">مسئول صورت‌وضعیت</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">رمز عبور</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="حداقل ۶ کاراکتر"
            dir="ltr"
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending} className="min-w-28">
            {isPending ? <Loader2 className="ml-1.5 size-4 animate-spin" /> : <UserPlus className="ml-1.5 size-4" />}
            ایجاد کاربر
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditUserForm({
  user,
  onSubmit,
  isPending,
}: {
  user: any;
  onSubmit: (data: { id: string; name: string; email: string; role: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role || "ESTIMATOR");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: user.id, name, email, role });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">نام و نام خانوادگی</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">ایمیل</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">نقش</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">مدیر سازمان</SelectItem>
            <SelectItem value="ESTIMATOR">برآوردکار</SelectItem>
            <SelectItem value="BILLER">مسئول صورت‌وضعیت</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending} className="min-w-28">
          {isPending ? <Loader2 className="ml-1.5 size-4 animate-spin" /> : <Check className="ml-1.5 size-4" />}
          ذخیره تغییرات
        </Button>
      </DialogFooter>
    </form>
  );
}
