"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { saveProfile } from "@/lib/store";
import { currentAccount, toProfile, touchActivity } from "@/lib/account";
import { fetchMe } from "@/lib/sync";
import type { UserProfile } from "@/lib/types";

/**
 * 로그인이 필요한 화면의 공통 껍데기.
 *
 * 정적 배포에는 서버가 없으므로 이 기기의 계정(lib/account)이 정본이다.
 * 로그인 상태는 브라우저를 닫았다 열어도 유지되고, 계정이 없을 때만
 * 첫 화면으로 보낸다. 서버(DB)가 있는 배포에서는 서버 세션을 우선한다.
 */
export function AppShell({ children }: { children: (p: UserProfile) => React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const me = await fetchMe();
      if (cancelled) return;

      // 서버가 없으면 이 기기의 계정이 정본이다
      if (!me || me.dbEnabled === false) {
        const account = currentAccount();
        if (!account) { router.replace("/"); return; }

        const p = toProfile(account);
        // 등록은 했지만 목표 등급·시험 일정을 아직 안 정한 사람
        if (!p) { router.replace("/setup"); return; }

        saveProfile(p);
        touchActivity();
        setProfile(p);
        setReady(true);
        return;
      }

      // DB 가 있으면 서버 세션이 정본
      if (!me.user) {
        router.replace("/");
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
      <main className="mx-auto max-w-7xl px-5 py-6">{children(profile)}</main>
    </div>
  );
}
