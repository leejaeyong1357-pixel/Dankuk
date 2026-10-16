"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { logout } from "@/lib/sync";
import { isAdmin, logout as clearSession } from "@/lib/account";
import { clearProfile } from "@/lib/store";
import type { UserProfile } from "@/lib/types";

/*
  상단 메뉴는 시안 그대로 네 칸이다.
  모의고사는 메뉴에서 빠지지만 홈과 OPIc 학습 화면에서 바로 갈 수 있다 —
  메뉴를 여섯 칸으로 늘리면 좁은 화면에서 줄이 넘친다.
*/
const NAV = [
  { href: "/dashboard", label: "홈", short: "홈" },
  { href: "/study", label: "OPIc 학습", short: "OPIc" },
  { href: "/global", label: "오늘의 글로벌", short: "글로벌" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  // 관리자에게만 전환 버튼을 보여 준다 (빌드에 박힌 값이라 브라우저에서 읽는다)
  const [admin, setAdmin] = useState(false);
  useEffect(() => setAdmin(isAdmin()), [profile]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 계정 메뉴는 바깥을 누르거나 Esc 를 누르면 닫힌다
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function signOut() {
    // 정적 배포에는 서버 세션이 없다. 이 기기의 로그인 표시를 지우지 않으면
    // 로그아웃을 눌러도 다음 화면에서 다시 로그인된 것으로 판정된다.
    clearSession();
    clearProfile();
    await logout().catch(() => {});
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:h-[68px] sm:px-5">
        <Link href="/dashboard" className="shrink-0">
          <BrandLogo />
        </Link>
        <span className="hidden h-5 w-px bg-slate-200 md:block" />
        <span className="hidden shrink-0 text-[15px] text-slate-500 md:block">Language Studio</span>

        {/* 가운데 메뉴 */}
        <nav className="ml-auto hidden h-full items-center gap-7 lg:ml-10 lg:flex">
          {(minimal ? [] : NAV).map((n) => (
            <NavLink key={n.href} {...n} pathname={pathname} />
          ))}
          {!minimal && profile && (
            <Link
              href="/setup"
              className="relative flex h-full items-center text-[15px] font-bold text-slate-700 transition hover:text-dku-700"
            >
              목표 {profile.targetGrade}
            </Link>
          )}
        </nav>

        {/* 오른쪽 — 알림과 계정 */}
        <div className={`flex items-center gap-3 ${minimal ? "ml-auto" : "lg:ml-auto ml-auto"}`}>
          {/*
            관리자 전환은 학습 메뉴가 아니라 계정 쪽 기능이다. 가운데 메뉴에
            끼워 두니 "오늘의 글로벌" 과 "단어장" 사이에 끼어 학습 메뉴처럼 보였다.
          */}
          {!minimal && admin && (
            <Link
              href={pathname.startsWith("/admin") ? "/dashboard" : "/admin"}
              className="hidden items-center gap-1.5 rounded-lg border border-dku-200 bg-dku-50 px-2.5 py-1.5 text-[13px] font-bold text-dku-700 transition hover:bg-dku-100 sm:flex"
            >
              <span className="rounded bg-dku-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                관리자
              </span>
              {pathname.startsWith("/admin") ? "학습자 화면" : "관리자 화면"}
            </Link>
          )}
          {minimal ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-600">
              시험 중
            </span>
          ) : (
            profile && (
              <>
                <NotificationBell />
                <span className="hidden h-5 w-px bg-slate-200 sm:block" />

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-dku-100 text-dku-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
                      </svg>
                    </span>
                    <span className="hidden text-sm font-bold text-slate-800 sm:block">
                      {profile.name}님
                    </span>
                    <span className="hidden text-[10px] text-slate-400 sm:block" aria-hidden>▾</span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <p className="truncate px-3 py-2 text-xs text-slate-400">{profile.email}</p>
                      <Link
                        href="/mypage"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        마이페이지 들어가기
                      </Link>
                      <Link
                        href="/setup"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        난이도 설정
                      </Link>
                      <Link
                        href="/vocab"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        내 단어장
                      </Link>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                >
                  로그아웃
                </button>
              </>
            )
          )}
        </div>
      </div>

      {/* 좁은 화면 전용 메뉴 줄 */}
      {!minimal && (
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} pathname={pathname} compact />
          ))}
        </nav>
      )}
    </header>
  );
}

/**
 * 알림 종.
 *
 * 아직 보낼 알림이 없다. 누르면 무슨 알림이 오게 될지 알려 주고,
 * 읽지 않은 것이 있는 척하는 빨간 점은 달지 않는다.
 */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
        className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 sm:block"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-bold text-slate-900">알림</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            새 알림이 없습니다. 시험일이 가까워지면 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href, label, short, pathname, compact = false,
}: {
  href: string; label: string; short: string; pathname: string; compact?: boolean;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  if (compact) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
          active ? "bg-dku-50 text-dku-700" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {short}
      </Link>
    );
  }

  // 넓은 화면에서는 밑줄로 현재 위치를 표시한다 (실제 화면과 같은 방식)
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-full items-center text-[15px] font-bold transition ${
        active ? "text-dku-700" : "text-slate-700 hover:text-dku-700"
      }`}
    >
      {label}
      {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-dku-600" />}
    </Link>
  );
}
