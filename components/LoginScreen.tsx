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
 * 왼쪽 사진에는 글씨를 넣지 않는다. 사진에 박힌 글씨는 화면 비율에 따라
 * 잘리고, 늘어나면 깨진다. 사진은 배경만 맡고 문구는 화면이 그린다.
 *
 * 좁은 화면에서는 사진 칸을 접고 로그인 칸만 남긴다.
 */
export function LoginScreen() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // 이미 로그인한 사람을 로그인 화면에 다시 세우지 않는다
  useEffect(() => {
    if (currentAccount()) { router.replace("/dashboard"); return; }
    setChecked(true);
  }, [router]);

  async function submit(user = id, pass = pw) {
    setNotice(null);
    if (!user.trim() || !pass) {
      setError("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await login(user, pass, remember);
    if (!res.ok) { setBusy(false); setError(res.error); return; }
    // 설정 화면을 거치지 않고 바로 학습 화면으로 (lib/account 가 기본값을 채운다)
    router.replace("/dashboard");
  }

  if (!checked) return <div className="min-h-screen bg-white" />;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,694px)]">
      {/* ── 왼쪽 사진 ─────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-slate-800 lg:block">
        {/* 정적 배포라 next/image 최적화를 쓰지 않는다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.loginImage}
          alt={`${BRAND.org} ${BRAND.product}`}
          className={`absolute inset-0 h-full w-full object-cover ${
            // 문구가 사진 안에 있으면 왼쪽에 붙인다 — 잘리더라도 문구가 남는다
            BRAND.loginTextBaked ? "object-left" : ""
          }`}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        {/* 사진이 문구까지 들고 있으면 화면은 아무것도 덧그리지 않는다 */}
        {!BRAND.loginTextBaked && (
          <>
            {/* 글씨가 앉는 위·아래만 어둡게 해서 사진 위에서도 읽히게 한다 */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 via-black/18 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/75 via-black/45 to-transparent" />

            {/* 위쪽 소제목 */}
            <div className="absolute left-[7%] top-8 flex items-center gap-3">
              <span className="block h-[3px] w-9 rounded-full bg-dku-500" />
              <span className="text-[13px] font-bold tracking-[0.14em] text-white">
                {BRAND.orgEn} <span className="mx-1 text-white/50">/</span> {BRAND.productTag}
              </span>
            </div>

            {/* 아래쪽 문구 */}
            <div className="absolute bottom-[9%] left-[7%] right-[8%]">
              <p className="hero-headline break-keep text-[30px] leading-[1.3] text-white">
                {BRAND.loginHeadline[0]}
                <br />
                <span className="text-dku-500">{BRAND.loginHeadline[1].slice(0, 3)}</span>
                {BRAND.loginHeadline[1].slice(3)}
              </p>
              <div className="mt-5 h-[3px] w-10 rounded-full bg-dku-500" />
              <p className="mt-4 text-[15px] font-bold leading-relaxed text-white/85">
                {BRAND.loginSubline[0]}
                <br />
                {BRAND.loginSubline[1]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── 오른쪽 로그인 ─────────────────────────────── */}
      <div className="flex flex-col bg-slate-50/70">
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[536px]">
            <div className="flex justify-center">
              <BrandLogo size="lg" />
            </div>
            {/* 제품 표기를 좌우 선 사이에 놓는다 */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-slate-300" />
              <span className="text-sm font-bold tracking-[0.18em] text-slate-400">
                {BRAND.productTag}
              </span>
              <span className="h-px w-10 bg-slate-300" />
            </div>

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
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                  <MailIcon />
                </span>
                <input
                  id="login-id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="이메일 또는 아이디를 입력하세요."
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 outline-none transition placeholder:text-slate-400 focus:border-dku-500"
                />
              </div>

              <label htmlFor="login-pw" className="mt-5 block text-sm font-bold text-slate-800">
                비밀번호
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                  <LockIcon />
                </span>
                <input
                  id="login-pw"
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요."
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-12 outline-none transition placeholder:text-slate-400 focus:border-dku-500"
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

              <div className="mt-4 flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-dku-600"
                  />
                  로그인 상태 유지
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setNotice(
                      "비밀번호는 이 기기에만 저장되고 되돌릴 수 없는 형태라 찾아 드릴 수 없습니다. " +
                        "새로 등록해 주세요.",
                    );
                  }}
                  className="text-sm font-semibold text-dku-700 underline underline-offset-2 transition hover:text-dku-800"
                >
                  비밀번호 찾기
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
              {notice && (
                <p className="mt-4 rounded-xl border-l-4 border-slate-400 bg-slate-100 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-600">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-6 w-full rounded-xl bg-dku-700 px-6 py-4 text-lg font-extrabold text-white shadow-md shadow-dku-700/25 transition hover:bg-dku-800 disabled:bg-slate-300 disabled:shadow-none"
              >
                {busy ? "확인 중…" : "로그인  →"}
              </button>

              <p className="mt-5 text-center text-sm text-slate-500">
                아직 계정이 없으신가요?{" "}
                <Link href="/register" className="font-bold text-dku-700 underline underline-offset-2">
                  회원가입
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

              {/*
                계정이 기기 안에만 있다는 것은 알려야 한다. 모르면 다른 기기에서
                로그인이 안 될 때 고장으로 여긴다.
              */}
              <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
                계정은 이 기기에만 저장됩니다. 다른 기기에서는 다시 등록해 주세요.
              </p>
            </form>
          </div>
        </div>

        <div className="px-6 pb-7 text-center">
          <p className="text-[11px] text-slate-400">
            © {BRAND.orgEn}. All rights reserved.
          </p>
          {BRAND.footnote && (
            <p className="mt-1.5 text-[11px] text-slate-400">{BRAND.footnote}</p>
          )}
        </div>
      </div>
    </main>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5l8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 018 0V10" strokeLinecap="round" />
    </svg>
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
