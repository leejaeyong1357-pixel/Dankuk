"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { SiteFooter } from "./SiteFooter";
import { saveProfile } from "@/lib/store";
import { bootstrap, currentAccount, toProfile, touchActivity } from "@/lib/account";
import { fetchMe } from "@/lib/sync";
import type { UserProfile } from "@/lib/types";

/**
 * 로그인이 필요한 화면의 공통 껍데기.
 *
 * 열릴 때 먼저 서버(D1)에 물어 이 브라우저를 서버 값으로 맞춘다 — 다른
 * 기기에서 공부한 것이 여기에도 보이게 하는 자리다. 서버가 없거나 로그인
 * 쿠키가 없으면 아무 일도 일어나지 않고, 이 기기의 계정(lib/account)이 정본이 된다.
 *
 * 로그인 상태는 브라우저를 닫았다 열어도 유지되고, 계정이 없을 때만 첫 화면으로 보낸다.
 */
export function AppShell({ children }: { children: (p: UserProfile) => React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 서버가 기억하는 기록으로 이 브라우저를 맞춘다 (서버가 없으면 그냥 지나간다)
      await bootstrap();
      if (cancelled) return;

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
    // overflow-x-clip: 화면 끝까지 꽉 차는 띠(글로벌 윗머리)가 스크롤바 폭만큼
    // 넘쳐 가로 스크롤이 생기지 않게 잘라 둔다
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6">{children(profile)}</main>
      <SiteFooter />
    </div>
  );
}
