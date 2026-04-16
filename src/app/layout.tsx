import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://team-haribo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GOMS - 광주소프트웨어마이스터고 외출제 통합 관리 시스템",
    template: "%s | GOMS",
  },
  description:
    "외출제를 QR로 간편하게. 광주소프트웨어마이스터고등학교 외출제 통합 관리 시스템 GOMS. Team HARIBO가 만든 오픈소스 프로젝트입니다.",
  keywords: [
    "GOMS",
    "광주소프트웨어마이스터고",
    "광주소프트웨어마이스터고등학교",
    "GSM",
    "외출제",
    "외출 관리",
    "QR 외출",
    "Team HARIBO",
    "team haribo",
    "학교 외출 시스템",
  ],
  authors: [{ name: "Team HARIBO", url: "https://github.com/team-haribo" }],
  creator: "Team HARIBO",
  publisher: "Team HARIBO",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "GOMS - 외출제를 QR로 간편하게",
    description:
      "광주소프트웨어마이스터고등학교 외출제 통합 관리 시스템. Team HARIBO가 만들어가는 오픈소스 프로젝트입니다.",
    url: SITE_URL,
    siteName: "GOMS",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "GOMS - 외출제를 QR로 간편하게",
    description: "광주소프트웨어마이스터고등학교 외출제 통합 관리 시스템",
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-pretendard">
        {/* 새로고침 시 깜빡임 없이 마지막 스크롤 위치로 즉시 복원 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if ('scrollRestoration' in history) {
                    history.scrollRestoration = 'manual';
                  }
                  var y = sessionStorage.getItem('goms:scrollY');
                  if (y && window.location.pathname === '/') {
                    document.documentElement.style.scrollBehavior = 'auto';
                    var scrollNow = function() {
                      window.scrollTo(0, parseInt(y, 10));
                      requestAnimationFrame(function() {
                        document.documentElement.style.scrollBehavior = '';
                      });
                    };
                    if (document.readyState === 'loading') {
                      document.addEventListener('DOMContentLoaded', scrollNow);
                    } else {
                      scrollNow();
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
