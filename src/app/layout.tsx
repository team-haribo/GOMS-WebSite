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
