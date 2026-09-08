"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { Waveform } from "@/components/AppPreview";
import { register } from "@/lib/account";

/**
 * 회원가입.
 *
 * 왼쪽은 캠퍼스, 오른쪽은 입력. 등록을 마치면 초기 설정으로 넘어간다.
 * 계정은 서버가 아니라 이 기기에 남고, 비밀번호는 해시만 저장한다.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (pw !== pw2) { setError("비밀번호가 서로 다릅니다."); return; }
    setBusy(true);
    const res = await register({ name, email, password: pw });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    router.push("/setup");
  }

  const ready = name.trim() && email.trim() && pw.length >= 6 && pw2.length >= 6;

  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        <DkuLogo />
        <span className="font-brand text-lg text-slate-900">DKU OPIc</span>
      </header>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 sm:px-8 lg:grid-cols-2 lg:gap-16">
        {/* 왼쪽 — 캠퍼스 */}
        <section className="relative hidden overflow-hidden rounded-3xl lg:block">
          <CampusBackdrop />
          <div className="relative px-9 py-16">
            <h1 className="hero-headline text-4xl text-slate-900">
              영어 말하기의 자신감,
              <br />
              <span className="text-dku-600">여기서 시작하세요.</span>
            </h1>
            <p className="mt-5 text-slate-500">단국대학교와 함께하는 AI OPIc 학습</p>

            <Waveform className="mt-12 h-14 w-72 text-dku-200" />
            <p className="mt-6 text-[11px] font-bold tracking-[0.22em] text-slate-400">
              YOUR VOICE
              <br />A BRIGHTER TOMORROW
            </p>
            <div className="mt-4 h-px w-10 bg-slate-300" />
          </div>
        </section>

        {/* 오른쪽 — 입력 */}
        <section className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 sm:p-10">
          <Link href="/" className="text-sm font-semibold text-slate-400 transition hover:text-slate-600">
            ← 홈으로
          </Link>

          <h2 className="hero-headline mt-6 text-3xl text-slate-900">회원가입</h2>
          <p className="mt-2 text-slate-500">계정을 만들고 맞춤 학습을 시작하세요.</p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(e) => { e.preventDefault(); void submit(); }}
          >
            <Field label="이름">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition placeholder:text-slate-300 focus:border-dku-500"
              />
            </Field>

            <Field label="이메일">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition placeholder:text-slate-300 focus:border-dku-500"
              />
            </Field>

            <PasswordField
              label="비밀번호"
              hint="(6자 이상)"
              value={pw}
              onChange={setPw}
              autoComplete="new-password"
            />
            <PasswordField
              label="비밀번호 확인"
              value={pw2}
              onChange={setPw2}
              autoComplete="new-password"
            />

            {error && (
              <p className="rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!ready || busy}
              className="w-full rounded-xl bg-dku-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-300"
            >
              {busy ? "등록 중…" : "등록 완료 →"}
            </button>
          </form>

          <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-bold text-dku-700 underline">
              로그인
            </Link>
          </p>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
            비밀번호는 본인 기기에 SHA-256 해시로만 저장됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({
  label, hint, value, onChange, autoComplete,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-800">
        {label}
        {hint && <span className="ml-1 font-semibold text-slate-400">{hint}</span>}
      </span>
      <span className="relative block">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 pr-12 outline-none transition focus:border-dku-500"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-600"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
            {!show && <path d="M4 20L20 4" strokeLinecap="round" />}
          </svg>
        </button>
      </span>
    </label>
  );
}

/**
 * 왼쪽에 깔리는 캠퍼스 배경.
 *
 * 대시보드 배너와 같은 사진을 흐리게 깔아 두 화면이 한 서비스로 보이게 한다.
 * 사진이 없으면 대신 그린 배경이 나오므로 파일이 빠져도 화면이 무너지지 않는다.
 */
function CampusBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-dku-50" />
      {/* 정적 배포라 next/image 최적화를 쓰지 않는다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/campus.jpg"
        alt=""
        className="absolute inset-x-0 bottom-0 h-[62%] w-full object-cover object-bottom"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/75 to-white" />
    </>
  );
}
