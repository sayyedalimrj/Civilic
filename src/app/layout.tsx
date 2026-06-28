import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { AuthSessionProvider } from "@/components/auth-session-provider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Civilic | سامانه مدیریت پروژه و صورت‌وضعیت عمرانی",
  description:
    "پلتفرم SaaS مدرن برای متره و برآورد، صورت‌وضعیت‌نویسی و تعدیل پروژه‌های عمرانی — جایگزین وب نرم‌افزار تکسا",
  keywords: [
    "متره",
    "برآورد",
    "صورت وضعیت",
    "تعدیل",
    "فهرست بها",
    "پروژه عمرانی",
    "تکسا",
  ],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthSessionProvider>
              {children}
            </AuthSessionProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
