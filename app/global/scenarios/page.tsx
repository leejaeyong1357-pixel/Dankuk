"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/global/Flag";
import { SceneArt } from "@/components/global/SceneArt";
import { SceneIcon, TONE, groupIcon, sceneMeta } from "@/components/global/scene-meta";
import { playPrompt, stopAudio } from "@/lib/audio";
import {
  COUNTRIES,
  KIND_KO,
  LANG_BY_COUNTRY,
  groupsOf,
  languageKo,
  scenariosOf,
  type GlobalKind,
  type LangCode,
  type Scenario,
} from "@/lib/global/content";
import { loadLanguages } from "@/lib/global/lang";
import { localized } from "@/lib/global/translations";
import { createSession, doneToday, loadPref, savePref, type GlobalPref } from "@/lib/global/store";

/**
 * 상황별 연습 (시안: 메인.png).
 *
 *   머리   제목 · 나라·언어·유형 · 지구본 그림 · 찾기
 *   고르기 활용 목적 / 국가·언어 / 직무 분야(직무별일 때)
 *   목록   묶음마다 흰 판 — 아이콘·이름·항목 수·설명·접기, 안에 상황 카드 세 장
 *
 * 카드를 누르면 그 자리에서 펼쳐져 그 나라 말 문장 세 개가 나온다.
 * 왼쪽 스피커는 보통 속도, 오른쪽 ▶ 는 천천히 읽는다. 펼친 카드 옆 카드들은
 * 그림을 크게 보여 줘 줄 높이가 비어 보이지 않게 한다.
 */
export default function ScenariosPage() {
  return <AppShell>{() => <Body />}</AppShell>;
}

const KIND_ICON: Record<GlobalKind, ReactNode> = {
  meeting: <SceneIcon name="people" size={17} />,
  trip: <SceneIcon name="briefcase" size={17} />,
  job: <SceneIcon name="briefcase" size={17} />,
};

/** 머리 그림의 인사말 — 고른 언어로 */
const HELLO: Record<LangCode, string> = {
  en: "Hello",
  pl: "Cześć",
  zh: "你好",
  hi: "नमस्ते",
  pt: "Olá",
  es: "Hola",
};

function Body() {
  const router = useRouter();
  const [pref, setPref] = useState<GlobalPref | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [closed, setClosed] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
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
  const langKo = languageKo(pref.lang);

  function change(patch: Partial<GlobalPref>) {
    const next = { ...pref!, ...patch };
    setPref(next);
    savePref(next);
    setOpen(null);
    setActiveGroup(null);
  }

  function start(s: Scenario) {
    const session = createSession({ scenarioId: s.id, pref: pref! });
    router.push(`/global/practice/?s=${session.id}`);
  }

  function jump(group: string, i: number) {
    setActiveGroup(group);
    setClosed((c) => c.filter((g) => g !== group));
    document.getElementById(`g${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const groups = groupsOf(pref.kind)
    .map((g) => ({ ...g, items: g.items.filter((s) => !needle || matches(s, needle, pref.lang)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="relative">
      {/* 바탕 — 머리 쪽만 옅은 하늘색 */}
      <div className="pointer-events-none absolute inset-x-[-20px] -top-6 h-[300px] bg-gradient-to-b from-[#e7f0fd] to-transparent" aria-hidden />

      {/* ── 머리 ─────────────────────────────────────── */}
      <header className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 pt-1">
          <p className="flex items-center gap-2 text-[13px] text-slate-500">
            <Link href="/global/" className="hover:text-dku-700">오늘의 글로벌</Link>
            <span aria-hidden>›</span>
            <span className="font-bold text-dku-600">상황별 연습</span>
          </p>
          <h1 className="mt-3 text-[38px] font-black leading-tight tracking-[-0.03em] text-[#14234b]">상황별 연습</h1>
          <p className="mt-2 text-[18px] font-bold text-[#14234b]">
            {country.ko} · {langKo} · {KIND_KO[pref.kind]} {total}가지
          </p>
          <p className="mt-1.5 text-[15px] text-slate-500">
            실무에서 바로 사용할 수 있는 {langKo} 표현을 상황별로 익혀보세요.
          </p>
        </div>

        <div className="flex items-start gap-4">
          <HeroArt hello={HELLO[pref.lang]} />
          <label className="relative mt-2 block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <SceneIcon name="search" size={17} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="상황 찾기 (예: 납기, 호텔, 회의)"
              aria-label="상황 찾기"
              className="w-[270px] rounded-full border border-[#dbe5f3] bg-white py-3 pl-11 pr-4 text-[14px] shadow-[0_2px_10px_-6px_rgba(15,40,90,0.25)] outline-none transition placeholder:text-slate-400 focus:border-dku-500"
            />
          </label>
        </div>
      </header>

      {/* ── 고르기 ───────────────────────────────────── */}
      <section className="relative mt-6 rounded-2xl border border-[#e3eaf5] bg-white px-5 py-4 shadow-[0_4px_18px_-12px_rgba(15,40,90,0.25)]">
        <Row label="활용 목적">
          {(["meeting", "trip", "job"] as GlobalKind[]).map((k) => (
            <Chip key={k} on={pref.kind === k} solid onClick={() => change({ kind: k })}>
              {KIND_ICON[k]}
              {KIND_KO[k]}
            </Chip>
          ))}
        </Row>
        <Row label="국가/언어">
          {COUNTRIES.map((c) => (
            <Chip key={c.code} on={c.code === pref.country} onClick={() => change({ country: c.code, lang: LANG_BY_COUNTRY[c.code] })}>
              <Flag code={c.code} className="h-[13px] w-[19px]" />
              {c.ko}
            </Chip>
          ))}
        </Row>
        {pref.kind === "job" && (
          <Row label="직무 분야">
            {groupsOf("job").map((g, i) => (
              <Chip key={g.group} on={activeGroup === g.group} solid small onClick={() => jump(g.group, i)}>
                {g.group.split(" · ").pop()}
              </Chip>
            ))}
          </Row>
        )}
      </section>

      {/* ── 목록 ─────────────────────────────────────── */}
      {groups.map((g) => {
        const index = groupsOf(pref.kind).findIndex((x) => x.group === g.group);
        const isClosed = closed.includes(g.group);
        const openInGroup = g.items.some((s) => s.id === open);
        return (
          <section
            key={g.group}
            id={`g${index}`}
            className={`mt-4 scroll-mt-24 rounded-2xl border bg-white/80 px-4 py-4 sm:px-5 ${
              activeGroup === g.group ? "border-dku-300" : "border-[#e3eaf5]"
            }`}
          >
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2d65c8]">
                <SceneIcon name={groupIcon(g.group)} size={19} />
              </span>
              <h2 className="text-[19px] font-black text-[#14234b]">{g.group}</h2>
              <span className="rounded-full bg-[#eef2f8] px-2.5 py-0.5 text-[12px] font-semibold text-slate-500">
                {g.items.length}개 항목
              </span>
              <span className="ml-auto hidden text-[13px] text-slate-500 md:block">{describe(g.group, g.items)}</span>
              <button
                type="button"
                onClick={() => setClosed((c) => (isClosed ? c.filter((x) => x !== g.group) : [...c, g.group]))}
                aria-expanded={!isClosed}
                aria-label={isClosed ? "펼치기" : "접기"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 max-md:ml-auto"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`transition ${isClosed ? "rotate-180" : ""}`} aria-hidden>
                  <path d="m6 15 6-6 6 6" />
                </svg>
              </button>
            </header>

            {!isClosed && (
              <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {g.items.map((s) => (
                  <li key={s.id} className="min-w-0">
                    <Card
                      s={s}
                      lang={pref.lang}
                      langKo={langKo}
                      open={open === s.id}
                      tall={openInGroup && open !== s.id}
                      done={doneToday(s.id)}
                      onToggle={() => setOpen(open === s.id ? null : s.id)}
                      onStart={() => start(s)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {needle && groups.length === 0 && (
        <p className="mt-10 text-center text-[15px] text-slate-400">&lsquo;{q}&rsquo; 에 맞는 상황이 없습니다.</p>
      )}
    </div>
  );
}

/** 묶음 설명 — 그 묶음의 상황 이름으로 만든다 */
function describe(group: string, items: Scenario[]): string {
  const name = group.split(" · ").pop();
  const titles = items.slice(0, 3).map((s) => s.title.replace(/ · /g, "·"));
  return `${titles.join(", ")} 등 ${name} 관련 표현을 학습합니다.`;
}

function matches(s: Scenario, needle: string, lang: LangCode): boolean {
  return (
    s.title.toLowerCase().includes(needle) ||
    s.subtitle.toLowerCase().includes(needle) ||
    s.group.toLowerCase().includes(needle) ||
    s.phrases.some(
      (p) =>
        p.ko.includes(needle) ||
        p.en.toLowerCase().includes(needle) ||
        (localized(lang, p.en)?.text.toLowerCase().includes(needle) ?? false),
    )
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-[#eef2f8] py-3 first:border-t-0 first:pt-1 last:pb-1 sm:flex-row sm:items-center">
      <span className="w-[84px] shrink-0 text-[14px] font-bold text-[#14234b]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on, solid = false, small = false, onClick, children,
}: {
  on: boolean;
  /** 고르면 파랗게 꽉 채운다 (활용 목적·직무). 아니면 테두리만 (나라) */
  solid?: boolean;
  small?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const base = `flex items-center gap-2 rounded-xl border font-semibold transition ${small ? "px-3 py-2 text-[13px]" : "px-4 py-2.5 text-[14px]"}`;
  const style = on
    ? solid
      ? "border-dku-600 bg-dku-600 text-white shadow-[0_4px_12px_-6px_rgba(13,106,218,0.6)]"
      : "border-dku-500 bg-dku-50 text-dku-800 ring-1 ring-dku-500"
    : "border-[#e1e8f2] bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50";
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`${base} ${style}`}>
      {children}
      {on && (
        <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${solid ? "bg-white text-dku-600" : "bg-dku-600 text-white"}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" aria-hidden>
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>
      )}
    </button>
  );
}

function Card({
  s, lang, langKo, open, tall, done, onToggle, onStart,
}: {
  s: Scenario;
  lang: LangCode;
  langKo: string;
  open: boolean;
  /** 같은 줄의 다른 카드가 펼쳐져 있다 — 그림을 크게 */
  tall: boolean;
  done: boolean;
  onToggle: () => void;
  onStart: () => void;
}) {
  const meta = sceneMeta(s.id);

  const head = (
    <span className="flex items-center gap-3">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${TONE[meta.tone]}`}>
        <SceneIcon name={meta.icon} size={23} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[16px] font-black text-[#14234b]">{s.title}</span>
          {done && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700">오늘 연습함</span>}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-slate-500">{s.subtitle}</span>
      </span>
    </span>
  );

  if (open) {
    return (
      <div className="h-full rounded-2xl border-[1.5px] border-dku-500 bg-white px-4 py-4 shadow-[0_10px_28px_-16px_rgba(13,106,218,0.6)]">
        <button type="button" onClick={onToggle} aria-expanded className="flex w-full items-start gap-2">
          <span className="min-w-0 flex-1">{head}</span>
          <span className="mt-2.5 flex shrink-0 items-center gap-1.5 rounded-full bg-[#eef4fe] px-2.5 py-1 text-[11.5px] font-bold text-dku-700">
            <SceneIcon name="chat" size={13} />
            {langKo} 회화 예시
          </span>
        </button>

        <ul className="mt-3 space-y-2">
          {s.phrases.map((p) => {
            const t = localized(lang, p.en);
            const say = t?.text ?? p.en;
            return (
              <li key={p.en} className="flex items-center gap-3 rounded-xl bg-[#f6f9fe] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => playPrompt(say, null, undefined, lang)}
                  aria-label={`${say} 듣기`}
                  className="shrink-0 text-dku-600 transition hover:text-dku-800"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                    <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
                    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold leading-snug text-[#14234b]">{say}</span>
                  {t?.read && <span className="mt-0.5 block text-[11.5px] text-slate-400">[{t.read}]</span>}
                  <span className="mt-0.5 block text-[12.5px] text-slate-500">{p.ko}</span>
                </span>
                <button
                  type="button"
                  onClick={() => playPrompt(say, null, undefined, lang, 0.75)}
                  aria-label="천천히 듣기"
                  title="천천히 듣기"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-dku-600 shadow-[0_1px_4px_rgba(15,40,90,0.15)] transition hover:bg-dku-50"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
                    <path d="M7 4v16l13-8z" fill="currentColor" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        {!localized(lang, s.phrases[0].en) && lang !== "en" && (
          <p className="mt-2 text-[12px] text-amber-700">{langKo} 문장은 준비 중이라 영어로 보여 드립니다.</p>
        )}

        <button
          type="button"
          onClick={onStart}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-dku-600 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_18px_-10px_rgba(13,106,218,0.8)] transition hover:bg-dku-700"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
            <path d="M7 4v16l13-8z" fill="currentColor" />
          </svg>
          이 상황 연습하기 →
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={false}
      className={`group relative flex h-full w-full items-center overflow-hidden rounded-2xl border border-[#e3eaf5] bg-white text-left transition hover:border-dku-300 hover:shadow-[0_10px_24px_-16px_rgba(15,40,90,0.45)] ${
        tall ? "lg:flex-col lg:items-stretch" : ""
      }`}
    >
      <span className={`relative z-10 min-w-0 flex-1 py-4 pl-4 pr-[40%] ${tall ? "lg:flex-none lg:pr-4" : ""}`}>{head}</span>
      {/* 같은 줄의 카드가 펼쳐졌을 때 (넓은 화면, 한 줄 세 장) — 그림을 크게 */}
      {tall && (
        <span className="relative hidden min-h-[160px] flex-1 items-center justify-center bg-gradient-to-b from-white to-[#eef4fd] px-6 pb-4 lg:flex">
          <SceneArt art={meta.art} className="h-full max-h-[190px] w-full" />
          <span className="absolute right-4 top-1 text-slate-400">›</span>
        </span>
      )}
      <span
        className={`pointer-events-none absolute inset-y-0 right-0 flex w-[44%] items-center bg-gradient-to-l from-[#eef4fd] via-[#f5f8fe] to-transparent pl-6 ${
          tall ? "lg:hidden" : ""
        }`}
      >
        <SceneArt art={meta.art} className="h-[76px] w-full opacity-95 transition group-hover:scale-[1.04]" />
      </span>
    </button>
  );
}

/** 머리 그림 — 지구본, 그 나라 말 인사, 도시 실루엣 */
function HeroArt({ hello }: { hello: string }) {
  return (
    <svg viewBox="0 0 300 150" className="hidden h-[150px] w-auto shrink-0 lg:block" aria-hidden>
      <defs>
        <radialGradient id="ha-globe" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#bfe0ff" />
          <stop offset="0.55" stopColor="#4f9cf0" />
          <stop offset="1" stopColor="#1f5fc8" />
        </radialGradient>
        <linearGradient id="ha-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fb8ff" />
          <stop offset="1" stopColor="#3f86ee" />
        </linearGradient>
      </defs>
      {/* 도시 */}
      <g fill="#cfe0f7">
        <rect x="170" y="92" width="18" height="44" />
        <rect x="192" y="80" width="14" height="56" />
        <rect x="232" y="96" width="22" height="40" />
        <rect x="258" y="86" width="16" height="50" />
        <rect x="278" y="100" width="18" height="36" />
        <path d="M214 136V60l4-26 4 26v76z" />
        <circle cx="218" cy="70" r="6" />
        <circle cx="218" cy="92" r="4" />
        <path d="M206 136h24" stroke="#cfe0f7" strokeWidth="2" />
      </g>
      <ellipse cx="96" cy="140" rx="60" ry="6" fill="#c5d8f3" opacity="0.6" />
      {/* 지구본 */}
      <circle cx="96" cy="90" r="46" fill="url(#ha-globe)" />
      <path d="M62 72q14-6 22 6t20 0 14 10M70 104q12-10 24-2t22-4M88 50q-6 14 6 22" stroke="#d9ecff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.75" />
      <ellipse cx="80" cy="70" rx="12" ry="7" fill="#ffffff" opacity="0.35" />
      {/* 인사 말풍선 */}
      <g>
        <rect x="112" y="8" width="70" height="38" rx="10" fill="url(#ha-bubble)" />
        <path d="M124 46l-4 12 16-12z" fill="#3f86ee" />
        <text x="147" y="33" textAnchor="middle" fontSize={hello.length > 5 ? 15 : 19} fontWeight="800" fill="#ffffff">
          {hello}
        </text>
      </g>
      <g>
        <rect x="152" y="58" width="40" height="24" rx="8" fill="#9cc6fb" />
        <circle cx="163" cy="70" r="2.4" fill="#fff" />
        <circle cx="172" cy="70" r="2.4" fill="#fff" />
        <circle cx="181" cy="70" r="2.4" fill="#fff" />
      </g>
    </svg>
  );
}
