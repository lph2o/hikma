import type { Metadata, Viewport } from "next";
import { Amiri, Geist_Mono, Poppins } from "next/font/google";
import { CookieNotice } from "@/components/app/cookie-notice";
import "./globals.css";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hikma — Apprends le Coran mot par mot",
    template: "%s · Hikma",
  },
  description:
    "Hikma (حكمة) — apprends le sens des mots du Coran, mot par mot, avec des leçons guidées et des révisions espacées.",
  applicationName: "Hikma",
  keywords: ["Coran", "arabe", "apprendre", "vocabulaire coranique", "Hikma"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Hikma",
    title: "Hikma — Apprends le Coran mot par mot",
    description:
      "Apprends le sens des mots du Coran, mot par mot, avec des leçons guidées et des révisions espacées.",
    images: [{ url: "/logo/logo_hikma.png", alt: "Hikma" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hikma — Apprends le Coran mot par mot",
    description: "Apprends le sens des mots du Coran, mot par mot.",
    images: ["/logo/logo_hikma.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b5552",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={cn(
        "h-full antialiased font-sans",
        poppins.variable,
        geistMono.variable,
        amiri.variable
      )}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* Notice informative premium — aucun traceur, localStorage versionné uniquement (89H-I). */}
        <CookieNotice />
      </body>
    </html>
  );
}
