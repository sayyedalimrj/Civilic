import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * میدل‌ور Civilic:
 *  1) محافظت از همه‌ی مسیرها (به‌جز ورود/استاتیک) — کاربر بدون session به /login می‌رود.
 *  2) تشخیص میزبان (host) برای استراتژی زیردامنه:
 *     - admin.civilic.ir / console.civilic.ir → پنل مدیریت سامانه (/admin)
 *     - app.civilic.ir و سایر → اپ کاربری
 *  (راهبرد کامل در docs/deployment-domain-strategy.md)
 */
export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isAdminHost = host.startsWith("admin.") || host.startsWith("console.");

  // زیردامنه‌ی admin: ریشه را به /admin هدایت کن
  if (isAdminHost && req.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", req.url));
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? "civilic-dev-secret-change-me",
  });
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)",
  ],
};
