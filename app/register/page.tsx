"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { register } from "@/lib/account";

/**
 * 회원가입.
 *
 * 받은 시안 그대로 — 가운데 세로 선으로 나뉜 두 칸.
 * 왼쪽은 이 서비스가 무엇을 해 주는지, 오른쪽은 입력.
 * 등록을 마치면 초기 설정으로 넘어간다.
 *
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
    if (!name.trim()) { setError("이름을 입력해 주세요."); return; }
    if (!email.trim()) { setError("이메일을 입력해 주세요."); return; }
    if (pw.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (pw !== pw2) { setError("비밀번호가 서로 다릅니다."); return; }
    setBusy(true);
    const res = await register({ name, email, password: pw });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    router.push("/setup");
  }

  return (
    <main className="min-h-screen bg-white">
      {/* ── 머리줄 ───────────────────────────────────── */}
      <header className="border-b border-slate-100">
        <div className="flex h-[72px] items-center gap-4 px-6 sm:px-14">
          <BrandLogo />
          <span className="h-5 w-px bg-slate-200" />
          <span className="text-[17px] font-bold text-slate-700">{BRAND.productTag2}</span>
        </div>
      </header>

      {/* ── 본문 — 가운데 세로 선으로 나뉜 두 칸 ─────── */}
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-0 lg:py-24">
        {/* 왼쪽 — 이 서비스가 하는 일 */}
        <section className="flex flex-col justify-center lg:pr-16">
          <p className="text-sm font-bold text-dku-500">
            {BRAND.orgShort} {BRAND.productTag2}
          </p>

          <h1 className="hero-headline mt-5 break-keep text-[34px] leading-[1.42] text-slate-900">
            말할수록{" "}
            <mark className="rounded-[3px] bg-dku-100/80 px-1.5 py-0.5 text-slate-900">
              나를 이해하는 AI
            </mark>,
            <br />더 정교해지는 맞춤 학습
          </h1>

          <p className="mt-6 break-keep text-[17px] leading-relaxed text-slate-400">
            나의 답변을 바탕으로 강점과 보완점을 찾아,
            <br />
            다음 연습의 방향을 맞춰갑니다.
          </p>

          <TalkMark className="mt-12" />
        </section>

        {/* 오른쪽 — 입력 */}
        <section className="lg:border-l lg:border-slate-100 lg:pl-16">
          <h2 className="hero-headline text-[34px] text-slate-900">회원가입</h2>
          <p className="mt-2 text-[17px] text-slate-400">계정을 만들고 맞춤 학습을 시작하세요.</p>

          <form
            className="mt-9 space-y-5"
            onSubmit={(e) => { e.preventDefault(); void submit(); }}
          >
            <Field label="이름">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                autoComplete="name"
                className={INPUT}
              />
            </Field>

            <Field label="이메일">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                className={INPUT}
              />
            </Field>

            <PasswordField
              label="비밀번호"
              placeholder="6자 이상 입력하세요"
              value={pw}
              onChange={setPw}
              autoComplete="new-password"
            />
            <PasswordField
              label="비밀번호 확인"
              placeholder="비밀번호를 다시 입력하세요"
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
              disabled={busy}
              className="w-full rounded-xl bg-dku-600 px-6 py-4 text-[17px] font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {busy ? "등록 중…" : "계정 만들기"}
            </button>
          </form>

          <p className="mt-8 border-t border-slate-100 pt-7 text-center text-[15px] text-slate-400">
            이미 계정이 있나요?{" "}
            <Link href="/" className="font-bold text-dku-600 underline underline-offset-2">
              로그인
            </Link>
          </p>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-300">
            비밀번호는 본인 기기에 SHA-256 해시로만 저장됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

const INPUT =
  "w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[16px] outline-none transition placeholder:text-slate-300 focus:border-dku-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-bold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({
  label, placeholder, value, onChange, autoComplete,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-bold text-slate-800">{label}</span>
      <span className="relative block">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${INPUT} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-300 transition hover:text-slate-500"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
            {show && <path d="M4 20L20 4" strokeLinecap="round" />}
          </svg>
        </button>
      </span>
    </label>
  );
}

/**
 * 왼쪽 아래 그림 — 말풍선 둘.
 *
 * 하나는 내가 말한 것(파형), 하나는 AI 가 답하는 것(점 셋).
 * 사진을 쓰지 않는다. 이 화면에서 설명해야 하는 것은 장소가 아니라
 * "말하면 그것을 읽고 답이 돌아온다" 는 동작이기 때문이다.
 */
function TalkMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="190"
      height="96"
      viewBox="0 0 190 96"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      {/* 내가 말하는 쪽 */}
      <g className="text-dku-300">
        <path
          d="M8 22a10 10 0 0110-10h58a10 10 0 0110 10v26a10 10 0 01-10 10H40l-16 14V58h-6a10 10 0 01-10-10z"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <g className="text-dku-500" strokeWidth="3.4" strokeLinecap="round">
          <path d="M32 29v14M44 24v24M56 30v12M68 34v4" />
        </g>
      </g>

      {/* AI 가 답하는 쪽 */}
      <g className="text-dku-200">
        <path
          d="M96 14a10 10 0 0110-10h60a10 10 0 0110 10v24a10 10 0 01-10 10h-28l-14 12V48h-18a10 10 0 01-10-10z"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
      <g className="text-dku-400" fill="currentColor" stroke="none">
        <circle cx="118" cy="26" r="4" />
        <circle cx="136" cy="26" r="4" />
        <circle cx="154" cy="26" r="4" />
      </g>

      {/* 오른쪽 위 점 */}
      <circle cx="184" cy="6" r="6" className="text-dku-200" fill="currentColor" stroke="none" />
    </svg>
  );
}
