import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lebanon-monitor.railway.app";

export const metadata: Metadata = {
  title: {
    default: "Lebanon Monitor — Real-time OSINT Dashboard",
    template: "%s | Lebanon Monitor",
  },
  description:
    "Real-time intelligence dashboard for Lebanon. Events, maps, indicators, CCTV, and trending topics. Lumière & Ombre classification.",
  keywords: ["Lebanon", "OSINT", "dashboard", "events", "monitoring", "intelligence"],
  authors: [{ name: "Lebanon Monitor" }],
  openGraph: {
    type: "website",
    url: baseUrl,
    title: "Lebanon Monitor — Real-time OSINT Dashboard",
    description: "Events, maps, indicators, and live feeds for Lebanon.",
    siteName: "Lebanon Monitor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lebanon Monitor",
    description: "Real-time intelligence dashboard for Lebanon.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
