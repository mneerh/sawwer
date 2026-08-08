import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LanguageProvider } from "@/lib/i18n/context";

import "./globals.css";

export const metadata: Metadata = {
  title: "صوِّر · Sawwer",
  description: "ارفع صور سفرتك ودع الذكاء الاصطناعي يحولها إلى رحلة تفاعلية تجمع صورك، الأماكن التي زرتها، وقصصها الموثقة.",
  applicationName: "Sawwer",
};

export const viewport: Viewport = {
  themeColor: "#FAF8F3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
