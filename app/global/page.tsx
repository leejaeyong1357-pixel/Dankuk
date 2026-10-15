"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { WorldMap } from "@/components/global/WorldMap";
import { playPrompt, stopAudio } from "@/lib/audio";
import {
  COUNTRIES,
  HOME_KO,
  KIND_KO,
  LANGUAGES,
  groupsOf,
  scenariosOf,
  type GlobalKind,
  type Scenario,
} from "@/lib/global/content";
import { createSession, doneToday, loadPref, savePref, type GlobalPref } from "@/lib/global/store";

/**
 * 글로벌 회화.
 *
 * 해외 사업장과 일하는 사람이 "내일 그 자리에서 쓸 말" 을 찾아 연습하는 곳이다.
 * 하루에 하나만 주지 않는다 — 내일 회의가 클로징이면 클로징을, 다음 주 출장이면
 * 공항부터 보면 되기 때문이다. 상황을 전부 펼쳐 두고 필요한 것을 고르게 한다.
 *
 * OPIc 성적과 섞지 않는다. 목표 등급도 시험 일정도 이 화면에는 두지 않는다.
 */
export default function GlobalPage() {
  return <AppShell>{() => <GlobalBody />}</AppShell>;
}

function GlobalBody() {
  const router = useRouter();
  const [pref, setPref] = useState<GlobalPref | null>(null);
  const [open, setOpen] = useState<Scenario | null>(null);

  useEffect(() => setPref(loadPref()), []);
  useEffect(() => () => stopAudio(), []);

  if (!pref) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

  const country = COUNTRIES.find((c) => c.code === pref.country) ?? COUNTRIES[2];
  const groups = groupsOf(pref.kind);
  const total = scenariosOf(pref.kind).length;

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
      {/* ── 소개 띠 ─────────────────────────────────────── */}
      <section className="-mx-4 border-b border-slate-200 bg-white px-4 py-9 sm:-mx-5 sm:px-5 lg:py-10">
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-[0.18em] text-dku-500">
              SL LANGUAGE STUDIO
            </p>
            <h1 className="hero-headline mt-3 break-keep text-[30px] text-slate-900 sm:text-[38px]">
              현장에서 쓰는 말,
              <br />
              <span className="text-dku-800">상황마다 골라 연습하세요.</span>
            </h1>
            <p className="mt-3 break-keep text-[16px] text-slate-500">
              글로벌 미팅 {scenariosOf("meeting").length}가지, 해외출장{" "}
              {scenariosOf("trip").length}가지 상황을 듣고 따라 말해 보세요.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Globe />
            <div className="hidden min-w-0 sm:block">
              <p className="text-[13px] tracking-wide text-slate-400">people drive us</p>
              <p className="text-[22px] font-bold text-dku-800">We Drive the World</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                사람이 세상을 움직입니다.
                <br />
                에스엘의 기술로 더 나은 내일을 만듭니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 어디와 연결되나요 ───────────────────────────── */}
      <div className="mt-8">
        <h2 className="hero-headline text-[26px] text-slate-900">오늘, 어디와 연결되나요?</h2>
        <p className="mt-1 text-[15px] text-slate-500">
          국가와 유형을 고르면 그 자리에서 쓰는 표현이 아래에 나옵니다.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,38%)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
          <WorldMap value={pref.country} onChange={(code) => change({ country: code })} />
          <ul className="mt-4 flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => change({ country: c.code })}
                  aria-pressed={c.code === pref.country}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-bold transition ${
                    c.code === pref.country
                      ? "border-dku-500 bg-dku-50 text-dku-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span aria-hidden>{c.flag}</span>
                  {c.ko}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-slate-400">
            지도의 핀은 국가를 가리킵니다 — 실제 사업장 위치가 아닙니다.
          </p>
        </section>

        <section className="min-w-0 rounded-2xl bg-[#eaf1fc] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[20px] font-bold text-slate-900">
              {country.ko} · {HOME_KO}
            </p>
            <select
              value={pref.lang}
              onChange={(e) => change({ lang: e.target.value })}
              aria-label="대화 언어"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[14px] font-bold text-slate-700"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} disabled={!l.enabled}>
                  {l.ko}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            {country.ko} 사업장과 {HOME_KO} 사이의 대화를 {LANGUAGES[0].ko}로 연습합니다.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/70 p-1">
            {(["meeting", "trip"] as GlobalKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => change({ kind: k })}
                aria-pressed={pref.kind === k}
                className={`rounded-lg py-2.5 text-[15px] font-bold transition ${
                  pref.kind === k ? "bg-dku-600 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {KIND_KO[k]}
              </button>
            ))}
          </div>

          <p className="mt-5 text-[13px] text-slate-500">{KIND_KO[pref.kind]} · 상황 {total}가지</p>
          <p className="mt-1 text-[22px] font-bold text-slate-900">필요한 자리를 바로 고르세요</p>
          <p className="mt-1 text-[15px] text-slate-600">
            듣고 → 따라 말하고 → 발음과 표현을 바로 확인합니다.
          </p>

          <Link
            href="/global/script/"
            className="mt-5 block rounded-xl bg-white px-5 py-4 text-center text-[15px] font-bold text-dku-700 transition hover:bg-slate-50"
          >
            내 미팅에 맞춘 스크립트 만들기 →
          </Link>
          <p className="mt-2 text-center text-[13px] text-slate-500">
            이름·직급·회의 목적으로 그 회의에서 읽을 말을 만듭니다.
          </p>
        </section>
      </div>

      {/* ── 상황 목록 ───────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="hero-headline text-[26px] text-slate-900">{KIND_KO[pref.kind]} 상황</h2>
        <p className="mt-1 text-[15px] text-slate-500">
          상황을 누르면 표현이 펼쳐집니다. 스피커로 듣고, 바로 연습을 시작하세요.
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.group} className="mt-6">
          <p className="flex items-center gap-3 text-[14px] font-bold text-dku-600">
            <span className="h-[3px] w-6 rounded-full bg-dku-500" />
            {g.group}
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {g.items.map((s) => (
              <li key={s.id}>
                <ScenarioCard
                  s={s}
                  open={open?.id === s.id}
                  done={doneToday(s.id)}
                  onToggle={() => setOpen(open?.id === s.id ? null : s)}
                  onStart={() => start(s)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-8 text-[12px] text-slate-400">
        글로벌 회화에는 점수·등급·합격 판정이 없습니다. OPIc 성적과도 섞이지 않습니다.
      </p>
    </>
  );
}

function ScenarioCard({
  s,
  open,
  done,
  onToggle,
  onStart,
}: {
  s: Scenario;
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
          <ul className="space-y-2">
            {s.phrases.map((p) => (
              <li key={p.en} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => playPrompt(p.en)}
                  aria-label={`${p.en} 듣기`}
                  className="shrink-0 rounded-lg bg-dku-50 p-2 text-dku-600 transition hover:bg-dku-100"
                >
                  <SpeakerIcon />
                </button>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-slate-900">{p.en}</span>
                  <span className="mt-0.5 block text-[13px] text-slate-500">{p.ko}</span>
                </span>
              </li>
            ))}
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

function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 010 7" />
    </svg>
  );
}

/** 지구 — 연결선이 도는 모습 */
function Globe() {
  return (
    <svg width="168" height="130" viewBox="0 0 168 130" fill="none" className="shrink-0" aria-hidden>
      <circle cx="84" cy="65" r="42" stroke="#c6d8f3" strokeWidth="1.3" />
      <ellipse cx="84" cy="65" rx="42" ry="17" stroke="#c6d8f3" strokeWidth="1.3" />
      <ellipse cx="84" cy="65" rx="17" ry="42" stroke="#c6d8f3" strokeWidth="1.3" />
      <path d="M42 65h84M84 23v84" stroke="#dde7f6" strokeWidth="1" />
      <ellipse cx="84" cy="65" rx="62" ry="26" stroke="#9dc0ea" strokeWidth="1.2" transform="rotate(-22 84 65)" />
      <ellipse cx="84" cy="65" rx="58" ry="22" stroke="#cfe0f6" strokeWidth="1.1" transform="rotate(26 84 65)" />
      {[[30, 44], [142, 52], [60, 104], [128, 96], [84, 18]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill="#2563eb" opacity="0.75" />
      ))}
    </svg>
  );
}
