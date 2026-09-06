"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { register } from "@/lib/account";

/**
 * 계정 등록.
 *
 * 서버가 없으므로 계정은 이 브라우저 안에만 만들어진다.
 * 비밀번호는 원문을 저장하지 않고 SHA-256 해시만 남긴다.
 */
export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim() && email.trim() && pw.length >= 6 && pw === pw2;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await register({ name, email, password: pw });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    router.push("/setup");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-dku-50/50">
      <div className="mx-auto max-w-md px-5 py-10">
        <Link href="/" className="text-sm font-semibold text-slate-400 transition hover:text-slate-600">
          ← 홈으로
        </Link>

        <div className="mt-8 flex justify-center">
          <DkuLogo />
        </div>
        <h1 className="mt-7 text-center text-3xl font-black tracking-tight text-slate-900">
          DKU OPIc
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          처음이신가요? 등록하고 시작해보세요
        </p>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <Field label="이름">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className={INPUT}
            />
          </Field>

          <Field label="이메일" className="mt-5">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              className={INPUT}
            />
          </Field>

          <Field label="비밀번호" hint="(6자 이상)" className="mt-5">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              className={INPUT}
            />
          </Field>

          <Field label="비밀번호 확인" className="mt-5">
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="다시 한 번 입력"
              autoComplete="new-password"
              className={INPUT}
            />
          </Field>
          {pw2 && pw !== pw2 && (
            <p className="mt-1.5 text-xs font-semibold text-red-600">비밀번호가 일치하지 않습니다.</p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={!ready || busy}
            className="mt-7 w-full rounded-xl bg-dku-800 px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-dku-900 disabled:bg-slate-300"
          >
            {busy ? "등록 중…" : "등록 완료 →"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            이미 등록했다면{" "}
            <Link href="/login" className="font-bold text-slate-700 underline">
              로그인
            </Link>
          </p>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs leading-relaxed text-slate-400">
            비밀번호는 본인 기기에 SHA-256 해시로만 저장됩니다.
            <br />
            서버나 관리자에게 전송되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

const INPUT =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500";

function Field({
  label, hint, className = "", children,
}: {
  label: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-slate-700">
        {label}
        {hint && <span className="ml-1 font-medium text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
