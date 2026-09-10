"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { ADMIN_ID, ADMIN_PASSWORD, currentAccount, login } from "@/lib/account";

/**
 * 첫 화면 = 로그인 화면.
 *
 * 소개 화면을 따로 두지 않는다. 사내 학습 도구라 링크를 여는 사람은
 * 서비스를 소개받으러 오는 것이 아니라 학습하러 오기 때문이다.
 *
 * 왼쪽 사진에는 문구가 이미 박혀 있다(브랜드마다 다른 사진).
 * 좁은 화면에서는 사진을 접고 로그인 칸만 남긴다. 사진 속 글씨는 줄바꿈이
 * 안 되므로 억지로 넣으면 읽을 수 없게 된다.
 */
export function LoginScreen() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // 이미 로그인한 사람을 로그인 화면에 다시 세우지 않는다
  useEffect(() => {
    if (currentAccount()) { router.replace("/dashboard"); return; }
    setChecked(true);
  }, [router]);

  async function submit(user = id, pass = pw) {
    setBusy(true);
    setError(null);
    const res = await login(user, pass);
    if (!res.ok) { setBusy(false); setError(res.error); return; }
    // 설정 화면을 거치지 않고 바로 학습 화면으로 (lib/account 가 기본값을 채운다)
    router.replace("/dashboard");
  }

  if (!checked) return <div className="min-h-screen bg-white" />;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,694px)]">
      {/* ── 왼쪽 사진 ─────────────────────────────────── */}
      <div className="relative hidden bg-slate-900 lg:block">
        {/* 정적 배포라 next/image 최적화를 쓰지 않는다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.loginImage}
          alt={`${BRAND.org} ${BRAND.product}`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {/* ── 오른쪽 로그인 ─────────────────────────────── */}
      <div className="flex flex-col bg-slate-50/70">
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[536px]">
            <div className="flex justify-center">
              <BrandLogo size="lg" />
            </div>
            <p className="mt-2.5 text-center text-sm font-bold tracking-[0.18em] text-slate-400">
              {BRAND.productTag}
            </p>

            <h1 className="hero-headline mt-6 text-center text-[34px] text-slate-900 sm:text-[42px]">
              {BRAND.loginTitle}
              <span className="text-dku-600">.</span>
            </h1>
            <p className="mt-2 text-center font-semibold text-slate-500">{BRAND.loginSub}</p>

            <form
              className="mt-9"
              onSubmit={(e) => { e.preventDefault(); void submit(); }}
            >
              <label htmlFor="login-id" className="block text-sm font-bold text-slate-800">
                이메일 또는 아이디
              </label>
              <input
                id="login-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="이메일 또는 아이디를 입력하세요."
                autoComplete="username"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-dku-500"
              />

              <label htmlFor="login-pw" className="mt-5 block text-sm font-bold text-slate-800">
                비밀번호
              </label>
              <div className="relative mt-2">
                <input
                  id="login-pw"
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요."
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 outline-none transition placeholder:text-slate-400 focus:border-dku-500"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "비밀번호 감추기" : "비밀번호 보기"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-600"
                >
                  <EyeIcon off={show} />
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!id.trim() || !pw || busy}
                className="mt-7 w-full rounded-xl bg-dku-600 px-6 py-4 text-lg font-extrabold text-white shadow-md shadow-dku-600/25 transition hover:bg-dku-700 disabled:bg-slate-300 disabled:shadow-none"
              >
                {busy ? "확인 중…" : "로그인  →"}
              </button>

              <p className="mt-5 text-center text-sm text-slate-500">
                아직 계정이 없으신가요?{" "}
                <Link href="/register" className="font-bold text-slate-800 underline underline-offset-2">
                  등록하기
                </Link>
              </p>

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setId(ADMIN_ID);
                    setPw(ADMIN_PASSWORD);
                    void submit(ADMIN_ID, ADMIN_PASSWORD);
                  }}
                  className="text-sm font-bold text-slate-600 underline underline-offset-4 transition hover:text-slate-900 disabled:text-slate-300"
                >
                  관리자 로그인 <span aria-hidden>↗</span>
                </button>
              </div>

              <div className="mt-6 flex items-start justify-center gap-2.5 text-xs leading-relaxed text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" className="mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6" strokeLinecap="round" />
                  <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
                </svg>
                <span>
                  현재 기기에 등록된 계정으로 로그인합니다.
                  <br />
                  다른 기기에서는 계정을 다시 등록해 주세요.
                </span>
              </div>
            </form>
          </div>
        </div>

        {BRAND.footnote && (
          <p className="px-6 pb-6 text-center text-[11px] text-slate-400">{BRAND.footnote}</p>
        )}
      </div>
    </main>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 20L20 4" strokeLinecap="round" />}
    </svg>
  );
}
