import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOMS - 광주소프트웨어마이스터고 외출제 통합 관리 시스템",
  description:
    "외출제를 QR로 간편하게. 광주소프트웨어마이스터고 외출제 통합 관리 시스템 GOMS 개발팀 HARIBO입니다.",
  openGraph: {
    title: "GOMS - 외출제를 QR로 간편하게",
    description: "광주소프트웨어마이스터고 외출제 통합 관리 시스템",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
