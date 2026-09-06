import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "단국대 OPIc AI 학습 트레이너",
  description: "단국대학교 재학생을 위한 OPIc 개인 맞춤 학습 · 모의고사 서비스",
};

/**
 * 이 선언이 없으면 모바일 브라우저가 980px 폭으로 렌더링한 뒤 축소해 버린다.
 * 학생 대부분이 휴대폰으로 쓰므로 반드시 필요하다.
 * 시험 중 실수로 확대되지 않도록 초기 배율만 고정하고, 확대 자체는 막지 않는다.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4098",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/*
          Pretendard — 한글 화면에서 가장 안정적인 본문 서체.
          자체 호스팅이 아니라 CDN 을 쓰는 이유는 정적 배포라 빌드 산출물을
          가볍게 유지해야 하고, 폰트가 늦게 와도 시스템 서체로 먼저 보이기 때문이다.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
