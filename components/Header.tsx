"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DkuLogo } from "./DkuLogo";
import { logout } from "@/lib/sync";
import { clearProfile } from "@/lib/store";
import type { UserProfile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "대시보드", short: "홈" },
  { href: "/study", label: "문제별 연습", short: "연습" },
  { href: "/mock", label: "모의고사", short: "모의고사" },
  { href: "/vocab", label: "단어장", short: "단어장" },
];

export function Header({
  profile,
  minimal = false,
}: {
  profile: UserProfile | null;
  /** 시험 중에는 학습 메뉴를 숨긴다 */
  minimal?: boolean;
}) {
  const pathname = usePathname();

  async function signOut() {
    await logout();
    clearProfile();
    window.location.href = "/onboarding";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* 상단 줄 — 로고와 계정 */}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-5">
        <Link href="/dashboard" className="shrink-0">
          <DkuLogo />
        </Link>
        <span className="hidden h-5 w-px bg-slate-200 md:block" />
        <span className="hidden shrink-0 text-sm font-bold text-dku-700 md:block">
          OPIc Trainer
        </span>

        {/* 좁은 화면에서는 메뉴를 아래 줄로 내린다 */}
        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          {(minimal ? [] : NAV).map((n) => (
            <NavLink key={n.href} {...n} pathname={pathname} />
          ))}
        </nav>

        <span className={`flex items-center gap-1.5 ${minimal ? "ml-auto" : "sm:ml-3 ml-auto"}`}>
          {minimal && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-600">
              시험 중
            </span>
          )}
          {profile && !minimal && (
            <>
              <span className="rounded-full border border-dku-200 bg-dku-50 px-2.5 py-1 text-[11px] font-bold text-dku-700">
                목표 {profile.targetGrade}
              </span>
              <button
                type="button"
                title={profile.email}
                onClick={() => void signOut()}
                className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                로그아웃
              </button>
            </>
          )}
        </span>
      </div>

      {/* 좁은 화면 전용 메뉴 줄 */}
      {!minimal && (
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 sm:hidden">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} pathname={pathname} compact />
          ))}
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href, label, short, pathname, compact = false,
}: {
  href: string; label: string; short: string; pathname: string; compact?: boolean;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition sm:py-2 sm:text-sm ${
        active ? "bg-dku-50 text-dku-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {compact ? short : label}
    </Link>
  );
}
