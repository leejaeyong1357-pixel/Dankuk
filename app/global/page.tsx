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
  LANG_BY_COUNTRY,
  groupsOf,
  languageKo,
  languagesFor,
  scenariosOf,
  type Country,
  type GlobalKind,
  type LangCode,
  type Scenario,
} from "@/lib/global/content";
import { loadLanguages } from "@/lib/global/lang";
import { localized } from "@/lib/global/translations";
import { createSession, loadPref, savePref, type GlobalPref } from "@/lib/global/store";

/**
 * 오늘의 글로벌.
 *
 * 들어오면 추천 한 상황이 바로 보인다 — 매일 열었을 때 고르는 수고 없이
 * 5분을 쓰게 하려는 것이다. 다만 하루 하나로 막지는 않는다.
 * "다른 상황 고르기" 를 누르면 미팅 30 · 출장 30 이 전부 펼쳐지고,
 * 내일 회의가 클로징이면 클로징을 바로 고르면 된다.
 *
 * OPIc 성적과 섞지 않는다. 이 화면에는 목표 등급도 시험 일정도 두지 않는다.
 */
export default function GlobalPage() {
  return <AppShell>{() => <GlobalBody />}</AppShell>;
}

function GlobalBody() {
  const router = useRouter();
  const [pref, setPref] = useState<GlobalPref | null>(null);
  const [picked, setPicked] = useState<Scenario | null>(null);
  const [browsing, setBrowsing] = useState(false);

  useEffect(() => {
    loadLanguages();
    setPref(loadPref());
  }, []);
  useEffect(() => () => stopAudio(), []);

  if (!pref) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

  const country = COUNTRIES.find((c) => c.code === pref.country) ?? COUNTRIES[2];
  const list = scenariosOf(pref.kind);
  const scenario = picked ?? list[0];

  function change(patch: Partial<GlobalPref>) {
    const next = { ...pref!, ...patch };
    setPref(next);
    savePref(next);
    setPicked(null);
  }

  function start(s: Scenario) {
    const session = createSession({ scenarioId: s.id, pref: pref! });
    router.push(`/global/practice/?s=${session.id}`);
  }

  return (
    <>
      {/* ── 소개 띠 ─────────────────────────────────────── */}
      <section className="-mx-5 border-b border-slate-200 bg-white px-5 py-9 lg:py-10">
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-[0.18em] text-dku-500">TODAY&apos;S GLOBAL</p>
            <h1 className="hero-headline mt-3 break-keep text-[30px] text-slate-900 sm:text-[38px]">
              하루 한 상황,
              <br />
              <span className="text-dku-800">내일의 대화를 준비하세요.</span>
            </h1>
            <p className="mt-3 break-keep text-[16px] text-slate-500">
              해외출장과 글로벌 미팅, 하루 5분씩 편하게 연습해요.
            </p>
          </div>

          <div className="flex items-center gap-7">
            <Globe />
            <div className="hidden min-w-0 sm:block">
              <p className="text-[14px] tracking-wide text-slate-400">people drive us</p>
              <p className="text-[24px] font-bold text-dku-800">We Drive the World</p>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                사람이 세상을 움직입니다.
                <br />
                에스엘의 기술로 더 나은 내일을 만듭니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 오늘, 어디와 연결되나요? ──────────────────────── */}
      <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="hero-headline text-[27px] text-slate-900">오늘, 어디와 연결되나요?</h2>
          <p className="mt-1 text-[15px] text-slate-500">
            국가와 상황을 선택하면 오늘의 연습이 시작됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBrowsing((v) => !v)}
          className="shrink-0 text-[15px] font-bold text-dku-600 transition hover:text-dku-800"
        >
          {browsing ? "접기 ←" : "다른 상황 고르기 →"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,38%)]">
        {/* 지도 */}
        <section className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
          <WorldMap
            value={pref.country}
            onChange={(code) =>
              change({
                country: code as Country["code"],
                lang: LANG_BY_COUNTRY[code as Country["code"]],
              })
            }
          />
          <ul className="mt-2 flex flex-wrap justify-center gap-2.5">
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => change({ country: c.code, lang: LANG_BY_COUNTRY[c.code] })}
                  aria-pressed={c.code === pref.country}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[15px] font-bold transition ${
                    c.code === pref.country
                      ? "border-dku-500 bg-white text-dku-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span aria-hidden>{c.flag}</span>
                  {c.ko}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[12px] text-slate-400">
            지도의 핀은 국가를 가리킵니다 — 실제 사업장 위치가 아닙니다.
          </p>
        </section>

        {/* 오늘의 연습 */}
        <section className="min-w-0 rounded-2xl bg-[#eaf1fc] px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[21px] font-bold text-slate-900">
              {languageKo(pref.lang)} · {HOME_KO}어
            </p>
            <select
              value={pref.lang}
              onChange={(e) => change({ lang: e.target.value as LangCode })}
              aria-label="대화 언어"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[14px] font-bold text-slate-700"
            >
              {languagesFor(pref.country).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.ko}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["meeting", "trip"] as GlobalKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => change({ kind: k })}
                aria-pressed={pref.kind === k}
                className={`rounded-xl py-3 text-[15px] font-bold transition ${
                  pref.kind === k
                    ? "bg-dku-600 text-white"
                    : "bg-white text-slate-500 hover:text-slate-800"
                }`}
              >
                {KIND_KO[k]}
              </button>
            ))}
          </div>

          <p className="mt-5 text-[13px] text-slate-500">오늘의 상황 · 5분</p>
          <p className="mt-1 text-[26px] font-bold text-slate-900">{scenario.title}</p>
          <p className="mt-1 text-[15px] text-slate-600">{scenario.subtitle}</p>

          <Preview phrase={scenario.phrases[0]} lang={pref.lang} country={country} />

          <button
            type="button"
            onClick={() => start(scenario)}
            className="mt-4 w-full rounded-xl bg-dku-600 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-700"
          >
            오늘의 연습 시작하기 →
          </button>
          <p className="mt-3 text-center text-[14px] text-slate-500">
            듣기 → 내 말로 말하기 → 다시 연습
          </p>
        </section>
      </div>

      {/* ── 상황 전체 (다른 상황 고르기) ─────────────────── */}
      {browsing && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-6 sm:px-7">
          <p className="text-[21px] font-bold text-slate-900">
            {KIND_KO[pref.kind]} 상황 {list.length}가지
          </p>
          <p className="mt-1 text-[15px] text-slate-500">
            필요한 자리를 고르면 위 카드가 그 상황으로 바뀝니다.
          </p>

          {groupsOf(pref.kind).map((g) => (
            <div key={g.group} className="mt-6">
              <p className="flex items-center gap-3 text-[14px] font-bold text-dku-600">
                <span className="h-[3px] w-6 rounded-full bg-dku-500" />
                {g.group}
              </p>
              <ul className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPicked(s);
                        setBrowsing(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-pressed={s.id === scenario.id}
                      className={`h-full w-full rounded-xl border px-4 py-3.5 text-left transition ${
                        s.id === scenario.id
                          ? "border-dku-500 bg-dku-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-[15px] font-bold text-slate-900">{s.title}</span>
                      <span className="mt-0.5 block text-[13px] text-slate-500">{s.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ── 스크립트 · AI 안내 ───────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-7 py-7">
          <p className="text-[12px] font-bold tracking-[0.18em] text-dku-500">MEETING SCRIPT</p>
          <p className="mt-2.5 text-[23px] font-bold text-slate-900">내 미팅에 맞춘 스크립트</p>
          <p className="mt-1 text-[15px] text-slate-500">이름, 직급, 회의 목적을 알려주세요.</p>

          <p className="mt-6 flex max-w-[420px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] text-slate-500">
            <span className="text-dku-500" aria-hidden>
              <DocIcon />
            </span>
            품질팀 팀장 · 납기 일정 회의
          </p>

          <p className="mt-3.5 text-[13px] text-dku-600">
            한글 · 외국어 대조 · 문장별 듣기 · AI 리허설
          </p>

          <Link
            href="/global/script/"
            className="mt-5 inline-block rounded-xl bg-dku-600 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-dku-700"
          >
            스크립트 만들기 →
          </Link>

          {/* 오른쪽 장식 — 문서 한 장 */}
          <svg
            className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 lg:block"
            width="210"
            height="190"
            viewBox="0 0 210 190"
            fill="none"
            aria-hidden
          >
            <path d="M18 14h150l24 24v138H18z" fill="#eaf1fc" />
            <path d="M168 14v24h24" fill="#d6e5fa" />
            <g stroke="#b9d2f5" strokeWidth="7" strokeLinecap="round">
              <path d="M44 70h104M44 94h104M44 118h66" />
            </g>
          </svg>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white px-7 py-7">
          <p className="text-[23px] font-bold text-slate-900">AI와 이렇게 연습해요</p>
          <p className="mt-1 text-[15px] text-slate-500">
            점수 대신, 다음 대화를 위한 작은 도움을 드려요.
          </p>

          <dl className="mt-5">
            {DIMENSIONS.map((d, i) => (
              <div
                key={d.label}
                className={`grid grid-cols-[auto_minmax(84px,22%)_1fr] items-center gap-4 py-3.5 ${
                  i > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <span className="text-dku-500" aria-hidden>
                  {d.icon}
                </span>
                <dt className="text-[15px] font-bold text-slate-900">{d.label}</dt>
                <dd className="text-[14px] leading-relaxed text-slate-500">{d.desc}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-[14px] font-bold text-dku-600">
            잘 전달한 점 → 표현 제안 1~2개 → 다시 말하기 →
          </p>
        </section>
      </div>

      <p className="mt-6 text-[12px] text-slate-400">
        글로벌 연습에는 점수·등급·합격 판정이 없습니다. OPIc 성적과도 섞이지 않습니다.
      </p>
    </>
  );
}

/**
 * 오늘의 상황 미리듣기 한 줄.
 *
 * 고른 언어로 보여 주고, 한글 발음을 함께 적는다. 중국어·힌디어는
 * 글자를 못 읽으면 들어도 따라 할 수가 없기 때문이다.
 * 그 언어 번역이 아직 없으면 영어인 척하지 않고 그렇게 말한다.
 */
function Preview({
  phrase,
  lang,
  country,
}: {
  phrase: { en: string; ko: string };
  lang: LangCode;
  country: Country;
}) {
  const t = localized(lang, phrase.en);

  return (
    <>
      <button
        type="button"
        onClick={() => playPrompt(t?.text ?? phrase.en, null, undefined, lang)}
        className="mt-4 flex w-full items-center gap-3 rounded-xl bg-white px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold text-dku-700">
            {t?.text ?? phrase.en}
          </span>
          {t?.read && (
            <span className="mt-1 block text-[13px] text-slate-400">[{t.read}]</span>
          )}
          <span className="mt-1 block text-[14px] text-slate-500">{phrase.ko}</span>
        </span>
        <span className="shrink-0 text-dku-600" aria-label="문장 듣기">
          <SpeakerIcon size={24} />
        </span>
      </button>

      {!t && lang !== "en" && (
        <p className="mt-2 text-[13px] text-amber-700">
          {languageKo(lang)} 문장은 아직 준비 중입니다. 지금은 영어로 보여 드립니다.
        </p>
      )}
      {!t && lang === "en" && country && null}
    </>
  );
}

/** 네 가지 봐 주는 것 — 점수가 아니라 다음 대화를 위한 항목이다 */
const DIMENSIONS = [
  { label: "목적 달성", desc: "안건을 소개하고 필요한 요청을 해봤나요?", icon: <TargetIcon /> },
  { label: "명확성", desc: "날짜·수량·담당자·기한을 분명하게 말해봐요.", icon: <BulbIcon /> },
  { label: "업무 어조", desc: "상대와 상황에 맞는 정중한 표현을 연습해요.", icon: <PeopleIcon /> },
  { label: "표현", desc: "지금 내 수준에서 바로 쓸 수 있는 말로 바꿔봐요.", icon: <ChatIcon /> },
];

const ICON = {
  width: 21,
  height: 21,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function TargetIcon() {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.6" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg {...ICON}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-3.5 10.9V16h7v-2.1A6 6 0 0012 3z" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg {...ICON}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0111 0M16 7.2a3.2 3.2 0 010 6M17 19a5.5 5.5 0 00-2-4.3" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...ICON}>
      <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...ICON}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
function SpeakerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg {...ICON} width={size} height={size}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
    </svg>
  );
}

/**
 * 지구 — 궤도선이 도는 모습.
 *
 * 시안처럼 가는 선으로만 그린다. 면을 칠하면 옆 글씨보다 무거워져
 * 소개 띠의 무게중심이 오른쪽으로 쏠린다.
 */
function Globe() {
  return (
    <svg width="248" height="196" viewBox="0 0 248 196" fill="none" className="shrink-0" aria-hidden>
      <g stroke="#cfe0f6" strokeWidth="1.1">
        <circle cx="124" cy="98" r="58" />
        <ellipse cx="124" cy="98" rx="58" ry="23" />
        <ellipse cx="124" cy="98" rx="23" ry="58" />
        <ellipse cx="124" cy="98" rx="41" ry="58" />
        <path d="M66 98h116M124 40v116" />
      </g>
      <g stroke="#a9c8ee" strokeWidth="1.2" fill="none">
        <ellipse cx="124" cy="98" rx="104" ry="44" transform="rotate(-24 124 98)" />
        <ellipse cx="124" cy="98" rx="98" ry="38" transform="rotate(22 124 98)" />
      </g>
      {[
        [24, 62],
        [226, 76],
        [60, 158],
        [196, 146],
        [124, 20],
        [214, 30],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#2563eb" opacity="0.8" />
      ))}
    </svg>
  );
}
