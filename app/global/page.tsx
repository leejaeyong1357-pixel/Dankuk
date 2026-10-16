"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/global/Flag";
import { WorldMap } from "@/components/global/WorldMap";
import { playPrompt, stopAudio } from "@/lib/audio";
import { BRAND } from "@/lib/brand";
import {
  COUNTRIES,
  KIND_KO,
  LANG_BY_COUNTRY,
  languageKo,
  languagesFor,
  type Country,
  type GlobalKind,
  type LangCode,
  type Scenario,
} from "@/lib/global/content";
import { loadLanguages } from "@/lib/global/lang";
import { localized } from "@/lib/global/translations";
import {
  allSessions,
  createSession,
  loadPref,
  localDay,
  savePref,
  todayScenario,
  type GlobalPref,
} from "@/lib/global/store";
import { loadProgress } from "@/lib/store";

/**
 * 오늘의 글로벌.
 *
 * 들어오면 오늘의 한 상황이 바로 보인다 — 매일 열었을 때 고르는 수고 없이
 * 5분을 쓰게 하려는 것이다. 더 하고 싶으면 아래 유형별 학습에서 60가지를
 * 직접 고른다.
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

  /** 유형 칸을 누르면 그 유형으로 맞춰 놓고 상황 목록으로 보낸다 */
  function openKind(kind: GlobalKind) {
    change({ kind });
    router.push("/global/scenarios/");
  }

  return (
    <>
      <Hero />

      {/* ── 오늘, 어디와 연결되나요? ──────────────────────── */}
      <div className="mt-9">
        <h2 className="hero-headline text-[28px] text-slate-900">오늘, 어디와 연결되나요?</h2>
        <p className="mt-1.5 text-[15px] text-slate-500">
          언어는 더 가까운 세상을 만듭니다. 오늘의 상황을 선택해보세요.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,36%)]">
        {/* 지도 */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
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
                  <Flag code={c.code} className="h-[14px] w-[21px]" />
                  {c.ko}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 하루에 한문장! */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[22px] font-bold text-slate-900">하루에 한문장!</p>
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
                    ? "bg-dku-700 text-white"
                    : "border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                }`}
              >
                {KIND_KO[k]}
              </button>
            ))}
          </div>

          <p className="mt-6 text-[13px] text-slate-500">오늘의 상황 · 5분</p>
          <p className="mt-1 text-[26px] font-bold text-slate-900">{scenario.title}</p>
          <p className="mt-1 text-[15px] text-slate-600">{scenario.subtitle}</p>

          <Preview phrase={scenario.phrases[0]} lang={pref.lang} country={country} />

          <button
            type="button"
            onClick={() => start(scenario)}
            className="mt-4 w-full rounded-xl bg-dku-700 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-800"
          >
            오늘의 연습 시작하기 →
          </button>
          <p className="mt-3 text-center text-[14px] text-slate-500">
            듣기 · 따라 말하기 · 다시 연습
          </p>
        </section>
      </div>

      {/* ── 유형별 학습 ──────────────────────────────────── */}
      <section className="relative mt-5 overflow-hidden rounded-2xl bg-dku-50 px-7 py-7">
        <div className="relative z-10 flex items-center gap-4">
          <span className="text-dku-600" aria-hidden>
            <GridIcon />
          </span>
          <div className="min-w-0">
            <p className="hero-headline text-[26px] text-slate-900">유형별 학습</p>
            <p className="mt-1 text-[15px] text-slate-500">
              상황에 맞는 학습 유형을 선택해보세요.
            </p>
          </div>
        </div>
        <span className="pointer-events-none absolute -right-6 -top-6 opacity-60" aria-hidden>
          <Globe />
        </span>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <KindCard
          icon={<PlaneIcon />}
          title="해외 출장"
          desc={"공항, 호텔, 현지 일정까지\n실전 표현을 연습하세요."}
          photo="/global-trip.jpg"
          onClick={() => openKind("trip")}
        />
        <KindCard
          icon={<PeopleIcon />}
          title="글로벌 미팅"
          desc={"비즈니스 미팅과 협상에\n필요한 표현을 학습하세요."}
          photo="/global-meeting.jpg"
          onClick={() => openKind("meeting")}
        />
        <KindCard
          icon={<DocIcon />}
          title="일상 커뮤니케이션"
          desc={"현지 생활과 문화에 필요한\n표현을 연습하세요."}
          photo="/global-daily.jpg"
          soon
        />
      </div>

      {/* ── 스크립트 · 학습 현황 ─────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,36%)]">
        <ScriptCard />
        <ProgressCard />
      </div>

      <p className="mt-6 text-[12px] text-slate-400">
        글로벌 연습에는 점수·등급·합격 판정이 없습니다. OPIc 성적과도 섞이지 않습니다.
      </p>
    </>
  );
}

/**
 * 윗머리 띠.
 *
 * 시안은 가로로 꽉 찬 사진 위에 문구를 얹는다. 그 사진은 저장소에 없으므로
 * public/sl-global-hero.jpg 를 먼저 찾고, 없으면 브랜드 사진으로 내려간다.
 * 둘 다 없어도 아래 파란 바탕이 남아 글씨는 언제나 읽힌다.
 */
function Hero() {
  return (
    <section className="-mx-5 -mt-6 h-[200px] overflow-hidden bg-dku-800 sm:h-[240px]">
      <div className="relative h-full">
        <Photo
          src="/sl-global-hero.jpg"
          fallback={BRAND.heroImage}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* 왼쪽을 어둡게 깔아야 흰 글씨가 사진에 묻히지 않는다 */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/35 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5">
          <p className="text-[22px] font-light leading-tight text-white/90 sm:text-[30px]">
            people drive us
          </p>
          <p className="hero-headline text-[30px] leading-tight text-white sm:text-[44px]">
            We Drive the World
          </p>
          <span className="mt-4 h-[3px] w-12 rounded bg-white/80" />
        </div>
      </div>
    </section>
  );
}

/**
 * 사진 한 장.
 *
 * 저장소에 없는 사진을 가리키면 브라우저가 깨진 그림 아이콘을 남긴다.
 * 그래서 못 읽으면 대체 사진으로 한 번 내려가고, 그것도 없으면 아예
 * 그리지 않는다 — 뒤에 깔린 파란 바탕만 남아 깔끔하다.
 */
function Photo({
  src,
  fallback,
  className,
}: {
  src: string;
  fallback?: string;
  className?: string;
}) {
  const [cur, setCur] = useState(src);
  const [gone, setGone] = useState(false);
  if (gone || !cur) return null;
  return (
    // 정적 배포라 next/image 최적화를 쓰지 않는다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cur}
      alt=""
      aria-hidden
      className={className}
      onError={() => {
        if (fallback && cur !== fallback) setCur(fallback);
        else setGone(true);
      }}
    />
  );
}

/** 유형 한 칸 */
function KindCard({
  icon,
  title,
  desc,
  photo,
  onClick,
  soon = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  photo: string;
  onClick?: () => void;
  /** 아직 내용이 없는 유형 — 눌러도 갈 곳이 없으므로 막아 둔다 */
  soon?: boolean;
}) {
  const body = (
    <>
      <div className="px-6 pt-6">
        <span className="text-dku-600" aria-hidden>
          {icon}
        </span>
        <p className="mt-3 flex items-center gap-2 text-[21px] font-bold text-slate-900">
          {title}
          {soon && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
              준비 중
            </span>
          )}
        </p>
        <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-slate-500">
          {desc}
        </p>
      </div>
      <div className="relative mt-5 h-[130px] overflow-hidden bg-gradient-to-br from-dku-100 to-dku-200">
        <span className="absolute inset-0 flex items-center justify-center text-dku-300" aria-hidden>
          {icon}
        </span>
        <Photo src={photo} className="relative h-full w-full object-cover" />
        {!soon && (
          <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-dku-600 text-white shadow-lg">
            <ArrowIcon />
          </span>
        )}
      </div>
    </>
  );

  if (soon) {
    return (
      <section
        aria-disabled
        className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-70"
      >
        {body}
      </section>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-dku-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.3)]"
    >
      {body}
    </button>
  );
}

/** AI 스크립트 안내 칸 */
function ScriptCard() {
  return (
    <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white px-7 py-7 sm:grid-cols-[minmax(0,1fr)_minmax(240px,44%)]">
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-dku-500">AI가 제안하는</p>
        <p className="hero-headline mt-1 text-[26px] text-slate-900">내 맞춤 대화 스크립트</p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
          실제 비즈니스 상황을 반영한 시나리오로
          <br />
          더 효과적으로 연습해보세요.
        </p>
        <Link
          href="/global/script/"
          className="mt-6 inline-block rounded-xl bg-dku-700 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-dku-800"
        >
          스크립트 학습하기 →
        </Link>
      </div>

      {/* 어떤 모습인지 보여 주는 그림 — 실제 대화가 아니다 */}
      <div className="rounded-2xl bg-dku-50 p-4" aria-hidden>
        <p className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-dku-700 text-[10px] font-bold text-white">
            SL
          </span>
          SL AI Tutor
        </p>
        <p className="mt-2 text-[13px] text-slate-500">다음 상황에서 어떻게 말하면 좋을까요?</p>
        <p className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
          Could you share the timeline for the project?
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 shadow-sm">
          <Wave />
          <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dku-600 text-white">
            <MicIcon />
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * 나의 학습 현황.
 *
 * 숫자를 지어내지 않는다. 이번 주 월~일 가운데 실제로 학습한 날만 센다 —
 * 글로벌 연습을 마친 날과 OPIc 학습을 한 날이다. 기록이 없으면 0일로 둔다.
 */
function ProgressCard() {
  const [week, setWeek] = useState<{ marks: boolean[]; count: number } | null>(null);

  useEffect(() => {
    const today = new Date();
    // 월요일을 주의 시작으로 본다
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    const studied = new Set<string>();
    for (const s of allSessions()) {
      if (s.doneAt) studied.add(localDay(new Date(s.doneAt)));
    }
    const p = loadProgress();
    if (p.lastStudied) studied.add(p.lastStudied);

    const marks = [...Array(7)].map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return studied.has(localDay(d));
    });
    setWeek({ marks, count: marks.filter(Boolean).length });
  }, []);

  const count = week?.count ?? 0;
  // 주 5일을 기준으로 삼는다. 화면에도 그렇게 적어 둔다
  const goal = 5;
  const pct = Math.min(100, Math.round((count / goal) * 100));

  return (
    <section className="rounded-2xl bg-dku-700 px-7 py-7 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[17px] font-bold">
          <CheckSquare />
          나의 학습 현황
        </p>
        <Link href="/global/scenarios/" className="text-[13px] text-white/70 transition hover:text-white">
          전체 보기 ›
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-6">
        <Ring pct={pct} />
        <div className="min-w-0">
          <p className="text-[19px] font-bold leading-snug">
            {count >= goal ? (
              <>
                이번 주 목표를
                <br />
                채웠어요!
              </>
            ) : (
              <>
                이번주 목표까지
                <br />
                조금만 더!
              </>
            )}
          </p>
          <p className="mt-2 text-[13px] text-white/70">
            이번 주 학습한 날 {count}일 — 주 {goal}일 기준입니다.
          </p>
        </div>
      </div>

      <ul className="mt-6 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3.5">
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <li key={d} className="flex flex-col items-center gap-2">
            <span className="text-[13px] font-bold text-white/80">{d}</span>
            <span
              role="img"
              aria-label={`${d}요일 ${week?.marks[i] ? "학습함" : "학습 안 함"}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                week?.marks[i] ? "bg-white text-dku-700" : "border border-white/40"
              }`}
            >
              {week?.marks[i] ? "✓" : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 달성률 고리 */
function Ring({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="9" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[20px] font-bold">
        {pct}%
      </span>
    </span>
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
        className="mt-4 flex w-full items-center gap-3 rounded-xl bg-dku-50 px-5 py-4 text-left transition hover:bg-dku-100"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-slate-900">{t?.text ?? phrase.en}</span>
          {t?.read && <span className="mt-1 block text-[13px] text-slate-400">[{t.read}]</span>}
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

// ── 아이콘 ─────────────────────────────────────────────
const ICON = {
  width: 21,
  height: 21,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function GridIcon() {
  return (
    <svg {...ICON} width={34} height={34}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg {...ICON} width={30} height={30}>
      <path d="M10.2 13.8 3 11.4l1.4-1.8 3.2.6 2.3-2.9-6-3.5L5.6 2l7.8 2.4 3.6-4.4" transform="translate(1 4)" />
      <path d="M21 3.5a1.8 1.8 0 0 0-2.6 0L5.6 16.3l-3 1 1 3L16.4 7.6l4.6-1.5a1.8 1.8 0 0 0 0-2.6Z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg {...ICON} width={30} height={30}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.9M16.5 3.6a4 4 0 0 1 0 7" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg {...ICON} width={30} height={30}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...ICON} width={20} height={20} strokeWidth={2.2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg {...ICON} width={17} height={17}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function CheckSquare() {
  return (
    <svg {...ICON} width={19} height={19}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function SpeakerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg {...ICON} width={size} height={size}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

/** 음성 파형 — 녹음 중인 모습을 흉내 낸 장식이다 */
function Wave() {
  const bars = [6, 12, 20, 14, 26, 18, 10, 22, 14, 8, 16, 24, 12, 7, 18, 11];
  return (
    <span className="flex h-7 flex-1 items-center gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-dku-300" style={{ height: `${h}px` }} />
      ))}
    </span>
  );
}

/** 지구 — 유형별 학습 띠 오른쪽의 옅은 장식 */
function Globe() {
  return (
    <svg width="190" height="190" viewBox="0 0 248 196" fill="none" aria-hidden>
      <g stroke="#bcd3f0" strokeWidth="1.1">
        <circle cx="124" cy="98" r="58" />
        <ellipse cx="124" cy="98" rx="58" ry="23" />
        <ellipse cx="124" cy="98" rx="23" ry="58" />
        <path d="M66 98h116M124 40v116" />
      </g>
    </svg>
  );
}
