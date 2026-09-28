import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { getCopy } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getCopy();
  return {
    title: t.siteName,
    description: t.siteDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getCopy();
  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full text-ink">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
