"use client";

import { LoginScreen } from "@/components/LoginScreen";

/**
 * 첫 화면.
 *
 * 소개 화면(랜딩)을 두지 않고 바로 로그인 화면을 띄운다.
 * 로그인한 사람은 LoginScreen 안에서 학습 화면으로 넘어간다.
 */
export default function Home() {
  return <LoginScreen />;
}
