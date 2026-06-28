"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, AlertTriangle, CheckCircle2, Database } from "lucide-react";

const DEMO_USERS = [
  { label: "پیمانکار — تهیه‌کننده صورت‌وضعیت", email: "preparer@sivantadbir.ir" },
  { label: "مشاور — رسیدگی صورت‌وضعیت", email: "review@sharestan.ir" },
  { label: "کارفرما — مقام تأیید", email: "approver@khatam.ac.ir" },
  { label: "مدیر سامانه", email: "owner@civilic.ir" },
];

interface HealthResult {
  app?: string;
  database?: string;
  counts?: { users: number; tenants: number; projects: number };
  seeded?: { hasPlatformOwner: boolean; hasDemoUser: boolean };
  bootstrapEnabled?: boolean;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // بررسی سلامت دیتابیس هنگام بارگذاری صفحه
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth({ database: "error", message: "دسترسی به /api/health ناموفق" }))
      .finally(() => setHealthLoading(false));
  }, [seedResult]);

  const dbOk = health?.database === "ok";
  const hasUsers = (health?.counts?.users ?? 0) > 0;
  const hasDemoUsers = health?.seeded?.hasDemoUser;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setLoading(false);
      if (!dbOk) {
        setError("اتصال به دیتابیس برقرار نیست. ابتدا دیتابیس را آماده کنید.");
      } else if (!hasUsers) {
        setError("دیتابیس خالی است. ابتدا seed را اجرا کنید.");
      } else {
        setError("ایمیل یا رمز عبور نادرست است.");
      }
      return;
    }
    const cb = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("callbackUrl") : null;
    const safeCb = cb && cb.startsWith("/") && !cb.startsWith("//") ? cb : null;
    const session = await getSession();
    const isAdmin = Boolean((session?.user as Record<string, unknown> | undefined)?.isPlatformAdmin);
    const target = safeCb ?? (isAdmin ? "/admin" : "/");
    setLoading(false);
    router.push(target);
    router.refresh();
  }

  async function runBootstrap() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const secret = prompt("BOOTSTRAP_SECRET را وارد کنید:");
      if (!secret) { setSeeding(false); return; }
      const r = await fetch("/api/bootstrap/demo-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bootstrap-secret": secret },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (r.ok) {
        setSeedResult(`✅ seed موفق: ${d.tenants ?? "?"} مستاجر، ${d.users?.length ?? "?"} کاربر ساخته شد`);
      } else {
        setSeedResult(`❌ ${d.error || "خطا"}`);
      }
    } catch (e) {
      setSeedResult(`❌ ${String(e)}`);
    }
    setSeeding(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* وضعیت دیتابیس */}
        {!healthLoading && (!dbOk || !hasDemoUsers) && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                {!dbOk ? <AlertTriangle className="size-4 text-rose-600" /> : <Database className="size-4" />}
                {!dbOk ? "اتصال به دیتابیس برقرار نیست" : "دیتابیس خالی است — کاربری وجود ندارد"}
              </div>
              {!dbOk && (
                <p className="text-xs text-muted-foreground">
                  متغیر <code dir="ltr">DATABASE_URL</code> را بررسی کنید و مطمئن شوید جداول ساخته شده‌اند
                  (<code dir="ltr">prisma migrate deploy</code> یا <code dir="ltr">prisma db push</code>).
                </p>
              )}
              {dbOk && !hasUsers && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    جداول وجود دارند اما کاربری ساخته نشده. باید seed اجرا شود:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <code dir="ltr">bun run db:seed</code> — یا اگر دسترسی CLI ندارید، از bootstrap استفاده کنید:
                  </p>
                  {health?.bootstrapEnabled ? (
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={runBootstrap} disabled={seeding}>
                      {seeding ? <Loader2 className="size-3.5 animate-spin" /> : <Database className="size-3.5" />}
                      اجرای seed از طریق bootstrap
                    </Button>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      برای استفاده از bootstrap، متغیر <code dir="ltr">ENABLE_DEMO_BOOTSTRAP=true</code> و <code dir="ltr">BOOTSTRAP_SECRET</code> را ست کنید و redeploy کنید.
                    </p>
                  )}
                </div>
              )}
              {dbOk && hasUsers && !hasDemoUsers && (
                <p className="text-xs text-muted-foreground">
                  کاربرانی هستند اما کاربر دموی نمونه (<code dir="ltr">preparer@sivantadbir.ir</code>) یافت نشد.
                  ممکن است seed دیگری اجرا شده باشد.
                </p>
              )}
              {seedResult && <p className="text-xs font-medium">{seedResult}</p>}
            </CardContent>
          </Card>
        )}

        {/* Health OK badge */}
        {!healthLoading && dbOk && hasDemoUsers && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="size-3.5" /> دیتابیس متصل — آماده‌ی ورود
          </div>
        )}

        {/* فرم ورود */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <CardTitle className="text-xl">ورود به Civilic</CardTitle>
            <p className="text-sm text-muted-foreground">سامانه مدیریت پروژه و صورت‌وضعیت عمرانی</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">رمز عبور</Label>
                <Input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                ورود
              </Button>
            </form>

            <div className="mt-6 space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">کاربران نمونه (رمز همه: <code dir="ltr">civilic</code>):</p>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword("civilic"); }}
                  className="block w-full rounded-md border px-3 py-1.5 text-start text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
