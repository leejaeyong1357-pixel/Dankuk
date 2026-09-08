"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { ADMIN_ID, ADMIN_PASSWORD, login } from "@/lib/account";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(id = email, pass = pw) {
    setBusy(true);
    setError(null);
    const res = await login(id, pass);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    router.push(res.account.targetGrade && res.account.examDate ? "/dashboard" : "/setup");
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
        <h1 className="font-brand mt-7 text-center text-3xl text-slate-900">DKU OPIc</h1>
        <p className="mt-1.5 text-center text-sm text-slate-400">등록한 계정으로 로그인하세요</p>

        <form
          className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
        >
          <label className="block text-sm font-bold text-slate-700">이메일 또는 아이디</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500"
          />

          <label className="mt-5 block text-sm font-bold text-slate-700">비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500"
          />

          {error && (
            <p className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !pw || busy}
            className="mt-7 w-full rounded-xl bg-dku-800 px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-dku-900 disabled:bg-slate-300"
          >
            {busy ? "확인 중…" : "로그인 →"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => { setEmail(ADMIN_ID); setPw(ADMIN_PASSWORD); void submit(ADMIN_ID, ADMIN_PASSWORD); }}
            className="mt-3 w-full rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:text-slate-300"
          >
            관리자 로그인
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            아직 등록 전이라면{" "}
            <Link href="/register" className="font-bold text-slate-700 underline">
              등록하기
            </Link>
          </p>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs leading-relaxed text-slate-400">
            계정은 이 기기에만 저장됩니다.
            <br />
            다른 기기에서는 다시 등록해야 합니다.
          </p>
        </form>
      </div>
    </div>
  );
}
