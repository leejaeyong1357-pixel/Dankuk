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
import { createSession, loadPref, savePref, todayScenario, type GlobalPref } from "@/lib/global/store";

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

  useEffect(() => {
    loadLanguages();
    setPref(loadPref());
  }, []);
  useEffect(() => () => stopAudio(), []);

  if (!pref) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

  const country = COUNTRIES.find((c) => c.code === pref.country) ?? COUNTRIES[2];
  // 오늘의 한 상황 — 날이 바뀌면 저절로 다른 것이 나온다
  const scenario = todayScenario(pref);

  function change(patch: Partial<GlobalPref>) {
    const next = { ...pref!, ...patch };
    setPref(next);
    savePref(next);
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
      <div className="mt-9">
        <h2 className="hero-headline text-[27px] text-slate-900">오늘, 어디와 연결되나요?</h2>
        <p className="mt-1 text-[15px] text-slate-500">
          국가를 고르면 오늘의 상황이 그 자리에 맞춰집니다.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,38%)]">
        {/* 지도 */}
        <section className="flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
          <p className="mb-2 text-right text-[12px] font-bold leading-snug text-dku-500">
            언어가 연결하는
            <br />더 큰 기회
          </p>
          <WorldMap
            value={pref.country}
            onChange={(code) =>
              change({
                country: code as Country["code"],
                lang: LANG_BY_COUNTRY[code as Country["code"]],
              })
            }
          />
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-6">
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => change({ country: c.code, lang: LANG_BY_COUNTRY[c.code] })}
                  aria-pressed={c.code === pref.country}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[14px] font-bold shadow-[0_2px_8px_-2px_rgba(15,23,42,0.14)] transition ${
                    c.code === pref.country
                      ? "text-dku-800 ring-2 ring-dku-500"
                      : "text-slate-600 ring-1 ring-slate-900/[0.07] hover:bg-slate-50"
                  }`}
                >
                  <span aria-hidden>{c.flag}</span>
                  {c.ko}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-[13px] font-bold text-dku-500">
            더 많은 사람들이, 더 많은 곳에서, 더 가까워질 수 있도록.
          </p>
          <p className="mt-1.5 text-center text-[12px] text-slate-400">
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

      {/* ── 학습 두 가지 ─────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <StudyCard
          tag="학습 1"
          eyebrow="SCENARIO PRACTICE"
          title="상황별 연습"
          desc="미팅 30가지, 출장 30가지 중에서 필요한 자리를 골라 연습해요."
          sample={`${KIND_KO.meeting} · ${scenariosOf("meeting").length}가지 / ${KIND_KO.trip} · ${scenariosOf("trip").length}가지`}
          note="듣기 · 따라 말하기 · 발음 확인 · AI 역할 연습"
          href="/global/scenarios/"
          cta="상황 고르러 가기 →"
          art={<ListArt />}
        />

        <StudyCard
          tag="학습 2"
          eyebrow="MEETING SCRIPT"
          title="내 미팅에 맞춘 스크립트"
          desc="이름, 직급, 회의 목적을 알려주세요."
          sample="품질팀 팀장 · 납기 일정 회의"
          note="한글 · 외국어 대조 · 문장별 듣기 · AI 리허설"
          href="/global/script/"
          cta="스크립트 만들기 →"
          art={<DocArt />}
        />
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

/**
 * 학습 한 칸.
 *
 * 두 칸이 같은 모양이어야 "둘 중 하나를 고르는 자리" 로 읽힌다.
 * 설명을 길게 늘어놓지 않고, 들어가서 무엇을 하는지 한 줄로만 적는다.
 */
function StudyCard({
  tag,
  eyebrow,
  title,
  desc,
  sample,
  note,
  href,
  cta,
  art,
}: {
  tag: string;
  eyebrow: string;
  title: string;
  desc: string;
  sample: string;
  note: string;
  href: string;
  cta: string;
  art: React.ReactNode;
}) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-7 py-7">
      <p className="flex flex-wrap items-center gap-2.5">
        <span className="rounded-md bg-dku-600 px-2 py-0.5 text-[12px] font-bold text-white">
          {tag}
        </span>
        <span className="text-[12px] font-bold tracking-[0.18em] text-dku-500">{eyebrow}</span>
      </p>
      <p className="mt-2.5 text-[23px] font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-[15px] text-slate-500">{desc}</p>

      <p className="mt-6 flex max-w-[420px] items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] text-slate-500">
        <span className="text-dku-500" aria-hidden>
          <DocIcon />
        </span>
        {sample}
      </p>

      <p className="mt-3.5 text-[13px] text-dku-600">{note}</p>

      <Link
        href={href}
        className="mt-5 inline-block self-start rounded-xl bg-dku-600 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-dku-700"
      >
        {cta}
      </Link>

      <span className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 lg:block">
        {art}
      </span>
    </section>
  );
}

/** 목록 그림 — 고를 것이 여럿이라는 인상 */
function ListArt() {
  return (
    <svg width="210" height="190" viewBox="0 0 210 190" fill="none" aria-hidden>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 10} ${i * 46 + 10})`}>
          <rect x="18" y="0" width="168" height="38" rx="10" fill="#eaf1fc" />
          <rect x="34" y="12" width="70" height="7" rx="3.5" fill="#b9d2f5" />
          <rect x="34" y="24" width="112" height="6" rx="3" fill="#d6e5fa" />
        </g>
      ))}
    </svg>
  );
}

/** 문서 그림 */
function DocArt() {
  return (
    <svg width="210" height="190" viewBox="0 0 210 190" fill="none" aria-hidden>
      <path d="M18 14h150l24 24v138H18z" fill="#eaf1fc" />
      <path d="M168 14v24h24" fill="#d6e5fa" />
      <g stroke="#b9d2f5" strokeWidth="7" strokeLinecap="round">
        <path d="M44 70h104M44 94h104M44 118h66" />
      </g>
    </svg>
  );
}

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
