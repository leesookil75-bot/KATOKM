import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import LayoutWrapper from "@/components/LayoutWrapper";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: "AI-PASS",
  description: "스마트한 학원 출결 관리 및 수강료 알림 서비스",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "AI-PASS (아이패스)",
    description: "스마트한 학원/공부방 출결 및 관리 매니저",
    images: [
      {
        url: "/icon.png?v=3",
        width: 512,
        height: 512,
        alt: "AI-PASS App Icon",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ff9800",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className={notoSansKr.className}>
        <InstallPrompt />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
