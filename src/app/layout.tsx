import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-pretendard">{children}</body>
    </html>
  );
}
