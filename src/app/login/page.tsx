"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";

const DEMO_USERS = [
  { label: "پیمانکار — تهیه‌کننده صورت‌وضعیت", email: "preparer@sivantadbir.ir" },
  { label: "مشاور — رسیدگی صورت‌وضعیت", email: "review@sharestan.ir" },
  { label: "کارفرما — مقام تأیید", email: "approver@khatam.ac.ir" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("ایمیل یا رمز عبور نادرست است.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-lg">
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
              <Input
                id="email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
                onClick={() => {
                  setEmail(u.email);
                  setPassword("civilic");
                }}
                className="block w-full rounded-md border px-3 py-1.5 text-start text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {u.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
