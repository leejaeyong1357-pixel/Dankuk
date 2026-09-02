"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { loadProfile, saveProfile } from "@/lib/store";
import { fetchMe } from "@/lib/sync";
import type { UserProfile } from "@/lib/types";

/**
 * 인증이 필요한 화면의 공통 껍데기.
 *
 * DB 가 켜져 있으면 서버 세션(/api/auth/me)이 정본이다.
 * localStorage 의 프로필은 캐시일 뿐이며, 세션이 없으면 로그인 화면으로 보낸다.
 */
export function AppShell({ children }: { children: (p: UserProfile) => React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = loadProfile();
      const me = await fetchMe();

      if (cancelled) return;

      // DB 가 없는 환경: 로컬 프로필만으로 동작한다
      if (!me || me.dbEnabled === false) {
        if (!cached) { router.replace("/onboarding"); return; }
        setProfile(cached);
        setReady(true);
        return;
      }

      // DB 가 있으면 서버 세션이 정본
      if (!me.user) {
        router.replace("/onboarding");
        return;
      }
      saveProfile(me.user);
      setProfile(me.user);
      setReady(true);
    })();

    return () => { cancelled = true; };
  }, [router]);

  if (!ready || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header profile={profile} />
      <main className="mx-auto max-w-6xl px-5 py-8">{children(profile)}</main>
    </div>
  );
}
