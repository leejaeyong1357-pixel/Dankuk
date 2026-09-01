import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "단국대 OPIc AI 학습 트레이너",
  description: "단국대학교 재학생을 위한 OPIc 개인 맞춤 학습 · 모의고사 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
