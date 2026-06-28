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
        const user = await db.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });
        if (!user || !user.isActive) return null;
        if (!verifyPassword(credentials.password, user.passwordHash)) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId ?? null,
          tenantId: user.tenantId,
          role: user.role,
        } as never;
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
        };
        token.userId = u.id;
        token.organizationId = u.organizationId;
        token.tenantId = u.tenantId;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).organizationId = token.organizationId;
        (session.user as Record<string, unknown>).tenantId = token.tenantId;
        (session.user as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
};
