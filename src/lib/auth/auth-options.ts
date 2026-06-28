/**
 * auth-options.ts — پیکربندی NextAuth (Credentials + Prisma)
 * استراتژی JWT (بدون نیاز به جدول Session). کاربر فعلی از session خوانده می‌شود.
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "civilic-dev-secret-change-me",
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "ایمیل", type: "text" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        try {
          const user = await db.user.findUnique({ where: { email } });
          if (!user) {
            console.warn(`[auth] login failed: user not found (${email})`);
            return null;
          }
          if (!user.isActive) {
            console.warn(`[auth] login failed: inactive user (${email})`);
            return null;
          }
          if (!user.passwordHash) {
            console.warn(`[auth] login failed: missing password hash (${email})`);
            return null;
          }
          if (!verifyPassword(credentials.password, user.passwordHash)) {
            console.warn(`[auth] login failed: invalid password (${email})`);
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId ?? null,
            tenantId: user.tenantId,
            role: user.role,
            isPlatformAdmin: user.isPlatformAdmin,
          } as never;
        } catch (e) {
          console.error(`[auth] login failed: database connection error (${email}):`, e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          organizationId: string | null;
          tenantId: string;
          role: string;
          isPlatformAdmin?: boolean;
        };
        token.userId = u.id;
        token.organizationId = u.organizationId;
        token.tenantId = u.tenantId;
        token.role = u.role;
        token.isPlatformAdmin = Boolean(u.isPlatformAdmin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).organizationId = token.organizationId;
        (session.user as Record<string, unknown>).tenantId = token.tenantId;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).isPlatformAdmin = token.isPlatformAdmin;
      }
      return session;
    },
  },
};
