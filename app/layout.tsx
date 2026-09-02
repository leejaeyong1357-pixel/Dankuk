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
      <body>{children}</body>
    </html>
  );
}
