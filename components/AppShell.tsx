"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { loadProfile } from "@/lib/store";
import type { UserProfile } from "@/lib/types";

/** 프로필이 없으면 온보딩으로 보낸다. 모든 내부 페이지의 공통 껍데기. */
export function AppShell({ children }: { children: (p: UserProfile) => React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setReady(true);
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
