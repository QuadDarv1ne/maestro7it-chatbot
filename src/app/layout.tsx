import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://maestro7it-chatbot.space-z.ai";
// Примечание: на prod без env metadataBase будет fallback.
// sitemap.ts и robots.ts определяют URL динамически из request headers.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Maestro7IT — Курсы программирования",
    template: "%s · Maestro7IT",
  },
  description:
    "Школа программирования Maestro7IT — 23 курса по программированию, DevOps, базам данных, AI и мультимедиа на платформе Stepik. Справочная информация и запись на обучение.",
  keywords: [
    "Maestro7IT",
    "курсы программирования",
    "Stepik",
    "DevOps",
    "Docker",
    "Python",
    "JavaScript",
    "SQL",
    "Linux",
    "обучение программированию",
    "чат-бот MAX",
    "школа программирования",
  ],
  authors: [{ name: "Дуплей Максим Игоревич", url: "https://science-maestro-maestro7it.amvera.io" }],
  creator: "Дуплей Максим Игоревич",
  publisher: "Maestro7IT",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Maestro7IT",
    title: "Maestro7IT — Курсы программирования",
    description:
      "23 курса по программированию, DevOps, базам данных, AI и мультимедиа. Справочная информация и запись на обучение.",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Maestro7IT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maestro7IT — Курсы программирования",
    description:
      "23 курса по программированию, DevOps, базам данных, AI и мультимедиа на платформе Stepik.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/logo.svg",
  },
  manifest: "/manifest.webmanifest",
  category: "education",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
