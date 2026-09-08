"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Callout } from "@/components/Callout";
import { GRADE_ORDER } from "@/lib/grades";
import {
  currentAccount,
  hashPassword,
  logout,
  removeAccount,
  updateAccount,
  type Account,
} from "@/lib/account";
import { clearProfile, daysUntil, saveProfile } from "@/lib/store";
import type { TargetGrade } from "@/lib/types";

/** 목표로 고를 수 있는 등급 (초기 설정과 같은 범위) */
const TARGETS: TargetGrade[] = ["IL", "IM1", "IM2", "IM3", "IH", "AL"];

export default function MyPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => { setAccount(currentAccount()); }, []);

  return (
    <AppShell>
      {(profile) => {
        if (!account) return <p className="text-sm text-slate-400">불러오는 중…</p>;

        function reload() {
          const a = currentAccount();
          setAccount(a);
          if (a?.targetGrade && a.examDate) {
            saveProfile({
              name: a.name, email: a.email, targetGrade: a.targetGrade,
              examDate: a.examDate, createdAt: a.createdAt,
            });
          }
        }

        return (
          <div className="mx-auto max-w-3xl">
            <nav className="text-xs font-semibold text-slate-400">
              <Link href="/dashboard" className="hover:text-slate-600">홈</Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-600">마이페이지</span>
            </nav>

            <h1 className="hero-headline mt-3 text-3xl text-slate-900">마이페이지</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              계정과 학습 설정을 여기서 바꿉니다.
            </p>

            <Profile account={account} profile={profile} />
            <NameSection account={account} onDone={reload} />
            <GoalSection account={account} onDone={reload} />
            <PasswordSection account={account} />
            <DangerSection
              account={account}
              onGone={() => { clearProfile(); router.replace("/"); }}
            />
          </div>
        );
      }}
    </AppShell>
  );
}

// ── 요약 ────────────────────────────────────────────────────
function Profile({ account, profile }: { account: Account; profile: { targetGrade: string } }) {
  const dday = daysUntil(account.examDate ?? "");
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-dku-100 text-dku-700">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-xl font-extrabold text-slate-900">{account.name}님</p>
          <p className="truncate text-sm text-slate-500">{account.email}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
        {[
          ["목표 등급", profile.targetGrade],
          ["시험 일정", account.examDate ? `${account.examDate} (D-${dday})` : "미설정"],
          ["등록일", account.createdAt.slice(0, 10)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-bold text-slate-400">{k}</dt>
            <dd className="mt-1 font-bold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── 이름 ────────────────────────────────────────────────────
function NameSection({ account, onDone }: { account: Account; onDone: () => void }) {
  const [name, setName] = useState(account.name);
  const [saved, setSaved] = useState(false);

  return (
    <Panel title="이름" desc="화면에 표시되는 이름입니다.">
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500"
        />
        <button
          type="button"
          disabled={!name.trim() || name === account.name}
          onClick={() => { updateAccount(account.email, { name: name.trim() }); setSaved(true); onDone(); }}
          className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
        >
          저장
        </button>
      </div>
      {saved && <p className="mt-2.5 text-sm font-semibold text-emerald-600">저장했습니다.</p>}
    </Panel>
  );
}

// ── 목표 등급 · 시험 일정 ───────────────────────────────────
function GoalSection({ account, onDone }: { account: Account; onDone: () => void }) {
  const [grade, setGrade] = useState<TargetGrade>(account.targetGrade ?? "IM2");
  const [date, setDate] = useState(account.examDate ?? "");
  const [saved, setSaved] = useState(false);
  const changed = grade !== account.targetGrade || date !== account.examDate;

  return (
    <Panel title="목표 등급 · 시험 일정" desc="문항 난이도와 모범답안 수준이 목표 등급에 맞춰집니다.">
      <div className="flex flex-wrap gap-1.5">
        {TARGETS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => { setGrade(g); setSaved(false); }}
            className={`rounded-lg px-4 py-2 text-sm font-extrabold transition ${
              grade === g ? "bg-dku-700 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-dku-300"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        낮은 등급부터: {GRADE_ORDER.join(" · ")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setSaved(false); }}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500"
        />
        <button
          type="button"
          disabled={!changed || date.length !== 10}
          onClick={() => {
            updateAccount(account.email, { targetGrade: grade, examDate: date });
            setSaved(true);
            onDone();
          }}
          className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
        >
          저장
        </button>
      </div>
      {saved && <p className="mt-2.5 text-sm font-semibold text-emerald-600">저장했습니다.</p>}
    </Panel>
  );
}

// ── 비밀번호 ────────────────────────────────────────────────
function PasswordSection({ account }: { account: Account }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    if ((await hashPassword(cur)) !== account.passwordHash) {
      setMsg({ ok: false, text: "현재 비밀번호가 맞지 않습니다." });
      return;
    }
    if (next.length < 6) {
      setMsg({ ok: false, text: "새 비밀번호는 6자 이상이어야 합니다." });
      return;
    }
    if (next !== again) {
      setMsg({ ok: false, text: "새 비밀번호가 서로 다릅니다." });
      return;
    }
    updateAccount(account.email, { passwordHash: await hashPassword(next) });
    setCur(""); setNext(""); setAgain("");
    setMsg({ ok: true, text: "비밀번호를 바꿨습니다." });
  }

  return (
    <Panel title="비밀번호 변경" desc="이 기기에 SHA-256 해시로만 저장됩니다.">
      <form className="space-y-2.5" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        {[
          ["현재 비밀번호", cur, setCur, "current-password"],
          ["새 비밀번호 (6자 이상)", next, setNext, "new-password"],
          ["새 비밀번호 확인", again, setAgain, "new-password"],
        ].map(([label, value, set, ac]) => (
          <label key={label as string} className="block">
            <span className="text-xs font-bold text-slate-500">{label as string}</span>
            <input
              type="password"
              autoComplete={ac as string}
              value={value as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={!cur || !next || !again}
          className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
        >
          비밀번호 바꾸기
        </button>
      </form>
      {msg && (
        <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </Panel>
  );
}

// ── 로그아웃 · 계정 삭제 ────────────────────────────────────
function DangerSection({ account, onGone }: { account: Account; onGone: () => void }) {
  return (
    <Panel title="계정" desc="이 기기에 저장된 계정입니다.">
      <Callout label="알아두세요" tone="slate">
        계정과 학습 기록은 이 브라우저에만 저장됩니다. 계정을 지우면 이 기기에서
        되살릴 수 없고, 다른 기기에서는 원래 따로 등록해야 합니다.
      </Callout>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { logout(); onGone(); }}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          로그아웃
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm(`${account.email} 계정을 이 기기에서 지웁니다. 계속할까요?`)) return;
            removeAccount(account.email);
            onGone();
          }}
          className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          계정 삭제
        </button>
      </div>
    </Panel>
  );
}

function Panel({
  title, desc, children,
}: {
  title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
