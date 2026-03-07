import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
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
  authors: [{ name: "Sami Nakib", url: "mailto:sami.nakib@etu.cyu.fr" }],
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Arabic:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${dmSans.variable} font-sans antialiased`}
        style={{ fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
