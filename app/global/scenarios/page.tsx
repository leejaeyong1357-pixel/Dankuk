"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/global/Flag";
import { playPrompt, stopAudio } from "@/lib/audio";
import {
  COUNTRIES,
  KIND_KO,
  groupsOf,
  languageKo,
  scenariosOf,
  type GlobalKind,
  type Scenario,
} from "@/lib/global/content";
import { loadLanguages } from "@/lib/global/lang";
import { localized } from "@/lib/global/translations";
import { createSession, doneToday, loadPref, savePref, type GlobalPref } from "@/lib/global/store";

/**
 * 상황별 연습 — 60가지를 한 자리에.
 *
 * 오늘의 상황과 섞지 않고 따로 둔다. 앞 화면에서 목록이 펼쳐졌다 접혔다 하면
 * 방금 보던 자리가 어디였는지 매번 다시 찾게 된다.
 */
export default function ScenariosPage() {
  return <AppShell>{() => <Body />}</AppShell>;
}

function Body() {
  const router = useRouter();
  const [pref, setPref] = useState<GlobalPref | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    loadLanguages();
    setPref(loadPref());
  }, []);
  useEffect(() => () => stopAudio(), []);

  if (!pref) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

  const country = COUNTRIES.find((c) => c.code === pref.country) ?? COUNTRIES[2];
  const total = scenariosOf(pref.kind).length;
  const needle = q.trim().toLowerCase();

  function change(patch: Partial<GlobalPref>) {
    const next = { ...pref!, ...patch };
    setPref(next);
    savePref(next);
    setOpen(null);
  }

  function start(s: Scenario) {
    const session = createSession({ scenarioId: s.id, pref: pref! });
    router.push(`/global/practice/?s=${session.id}`);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href="/global/" className="text-[13px] font-bold text-dku-600">
            ← 오늘의 글로벌
          </Link>
          <h1 className="hero-headline mt-1.5 text-[28px] text-slate-900">상황별 연습</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            {country.ko} · {languageKo(pref.lang)} · {KIND_KO[pref.kind]} {total}가지
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="상황 찾기 (예: 납기, 호텔)"
          className="w-full max-w-[280px] rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-300 focus:border-dku-500"
        />
      </div>

      {/* 유형 · 국가 */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(["meeting", "trip"] as GlobalKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => change({ kind: k })}
            aria-pressed={pref.kind === k}
            className={`rounded-xl px-5 py-2.5 text-[15px] font-bold transition ${
              pref.kind === k
                ? "bg-dku-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {KIND_KO[k]}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => change({ country: c.code })}
            aria-pressed={c.code === pref.country}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[14px] font-bold transition ${
              c.code === pref.country
                ? "border-dku-500 bg-dku-50 text-dku-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Flag code={c.code} className="h-[13px] w-[19px]" />
            {c.ko}
          </button>
        ))}
      </div>

      {groupsOf(pref.kind).map((g) => {
        const items = g.items.filter(
          (s) =>
            !needle ||
            s.title.toLowerCase().includes(needle) ||
            s.subtitle.toLowerCase().includes(needle) ||
            s.phrases.some((p) => p.ko.includes(needle) || p.en.toLowerCase().includes(needle)),
        );
        if (items.length === 0) return null;
        return (
          <section key={g.group} className="mt-7">
            <p className="flex items-center gap-3 text-[14px] font-bold text-dku-600">
              <span className="h-[3px] w-6 rounded-full bg-dku-500" />
              {g.group}
            </p>
            <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((s) => (
                <li key={s.id}>
                  <Card
                    s={s}
                    lang={pref.lang}
                    open={open === s.id}
                    done={doneToday(s.id)}
                    onToggle={() => setOpen(open === s.id ? null : s.id)}
                    onStart={() => start(s)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {needle && groupsOf(pref.kind).every((g) => g.items.every((s) => !matches(s, needle))) && (
        <p className="mt-10 text-center text-[15px] text-slate-400">
          &lsquo;{q}&rsquo; 에 맞는 상황이 없습니다.
        </p>
      )}
    </>
  );
}

function matches(s: Scenario, needle: string): boolean {
  return (
    s.title.toLowerCase().includes(needle) ||
    s.subtitle.toLowerCase().includes(needle) ||
    s.phrases.some((p) => p.ko.includes(needle) || p.en.toLowerCase().includes(needle))
  );
}

function Card({
  s,
  lang,
  open,
  done,
  onToggle,
  onStart,
}: {
  s: Scenario;
  lang: GlobalPref["lang"];
  open: boolean;
  done: boolean;
  onToggle: () => void;
  onStart: () => void;
}) {
  return (
    <div
      className={`h-full rounded-2xl border bg-white transition ${
        open ? "border-dku-400" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-bold text-slate-900">{s.title}</span>
            {done && (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                오늘 연습함
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[14px] text-slate-500">{s.subtitle}</span>
        </span>
        <span className="shrink-0 pt-1 text-slate-400" aria-hidden>
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          <ul className="space-y-2.5">
            {s.phrases.map((p) => {
              const t = localized(lang, p.en);
              return (
                <li key={p.en} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => playPrompt(t?.text ?? p.en, null, undefined, lang)}
                    aria-label="문장 듣기"
                    className="shrink-0 rounded-lg bg-dku-50 p-2 text-dku-600 transition hover:bg-dku-100"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 9v6h4l5 4V5L8 9z" />
                      <path d="M16.5 8.5a5 5 0 010 7" />
                    </svg>
                  </button>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-slate-900">
                      {t?.text ?? p.en}
                    </span>
                    {t?.read && (
                      <span className="mt-0.5 block text-[12px] text-slate-400">[{t.read}]</span>
                    )}
                    <span className="mt-0.5 block text-[13px] text-slate-500">{p.ko}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={onStart}
            className="mt-4 w-full rounded-xl bg-dku-600 px-5 py-3 text-[15px] font-bold text-white transition hover:bg-dku-700"
          >
            이 상황 연습하기 →
          </button>
        </div>
      )}
    </div>
  );
}
