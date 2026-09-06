"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { currentAccount } from "@/lib/account";

/**
 * 예전 온보딩 경로.
 *
 * 등록·로그인·초기 설정으로 나뉘었다. 북마크나 예전 링크로 들어온 사람을
 * 지금 상태에 맞는 자리로 보낸다.
 */
export default function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => {
    const a = currentAccount();
    if (!a) router.replace("/register");
    else if (!a.targetGrade || !a.examDate) router.replace("/setup");
    else router.replace("/dashboard");
  }, [router]);
  return <div className="min-h-screen bg-slate-50" />;
}
