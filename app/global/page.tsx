"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { WorldMap } from "@/components/global/WorldMap";
import { playPrompt, stopAudio } from "@/lib/audio";
import {
  COUNTRIES,
  LANG_BY_COUNTRY,
  languageKo,
  languagesFor,
  type Country,
  type GlobalKind,
  type LangCode,
  type Phrase,
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
 * 받은 시안(오늘의.png, 1448 x 1086)을 재어 옮겼다. 크기는 모두 "시안의 몇 px" 로
 * 적고, 실제 크기는 --u (시안 1px 이 화면에서 몇 px 인가) 를 곱해 정한다.
 *
 *   --u = 화면 폭 / 1448      (본문 폭은 985 * --u, 가운데 정렬)
 *
 * 시안은 본문을 화면 가운데 68% 폭에 놓고, 윗머리 글씨를 그 본문 왼쪽 끝에 맞춘다.
 * 같은 비율로 계산하므로 윗머리 사진(글씨 포함)을 그대로 깔아도 글씨와 카드 왼쪽이 맞는다.
 * 너무 좁거나 넓은 화면에서는 --u 를 0.88 ~ 1.38px 안으로 묶고, 1024px 아래에서는
 * 1px 로 두고 칸을 세로로 쌓는다.
 *
 * OPIc 성적과 섞지 않는다. 이 화면에는 목표 등급도 시험 일정도 두지 않는다.
 */
export default function GlobalPage() {
  return <AppShell>{() => <GlobalBody />}</AppShell>;
}

/** 시안의 n px */
const u = (n: number) => `calc(${n} * var(--u))`;

/** 시안 글자색 */
const NAVY = "text-[#14234b]";
const GREY = "text-[#5f6b85]";

/** 흰 카드 공통 — 옅은 테두리와 그림자 */
const CARD = "border border-[#e9eef6] bg-white shadow-[0_4px_16px_-8px_rgba(15,40,90,0.14)]";

function GlobalBody() {
  const router = useRouter();
  const [pref, setPref] = useState<GlobalPref | null>(null);

  useEffect(() => {
    loadLanguages();
    setPref(loadPref());
  }, []);
  useEffect(() => () => stopAudio(), []);

  if (!pref) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

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
    <div className="[--u:clamp(0.88px,calc((100vw-60px)/985),1.38px)] max-lg:[--u:1px]">
      <Hero />

      <div className="relative mx-auto" style={{ width: `min(${u(985)}, 100%)`, marginTop: u(-21) }}>
        {/* ── 오늘, 어디와 연결되나요? | 하루에 한문장! ────────── */}
        <div className="grid lg:grid-cols-[638fr_337fr]" style={{ gap: u(10) }}>
          <section className={CARD} style={{ borderRadius: u(10), padding: `${u(14)} ${u(18)} ${u(13)}` }}>
            <h2 className={`font-black tracking-[-0.02em] ${NAVY}`} style={{ fontSize: u(25), lineHeight: 1.15 }}>
              오늘, 어디와 연결되나요?
            </h2>
            <p className={GREY} style={{ fontSize: u(13.5), marginTop: u(5) }}>
              관심 국가를 선택하면, 현지 상황에 맞춘 표현을 바로 학습할 수 있습니다.
            </p>
            <div className="overflow-hidden bg-[#f3f8fd]" style={{ marginTop: u(10), borderRadius: u(10) }}>
              <WorldMap
                value={pref.country}
                onChange={(code) =>
                  change({
                    country: code as Country["code"],
                    lang: LANG_BY_COUNTRY[code as Country["code"]],
                  })
                }
              />
            </div>
            {/* 좁은 화면에서는 지도 이름표를 숨기므로 나라를 여기서 고른다 */}
            <div className="mt-3 flex flex-wrap gap-2 md:hidden">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => change({ country: c.code, lang: LANG_BY_COUNTRY[c.code] })}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
                    c.code === pref.country ? "border-dku-500 text-dku-700" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {c.ko}
                </button>
              ))}
            </div>
          </section>

          {/* 하루에 한문장! — 넓은 화면에서는 왼쪽 칸 높이에 딱 붙는다 */}
          <div className="relative min-w-0">
            <section
              className={`${CARD} flex flex-col lg:absolute lg:inset-0`}
              style={{ borderRadius: u(10), padding: `${u(11)} ${u(13)} ${u(9)}` }}
            >
              <div className="flex items-center justify-between" style={{ gap: u(10) }}>
                <p className={`font-black tracking-[-0.02em] ${NAVY}`} style={{ fontSize: u(19) }}>
                  하루에 한문장!
                </p>
                <span className="relative shrink-0">
                  <select
                    value={pref.lang}
                    onChange={(e) => change({ lang: e.target.value as LangCode })}
                    aria-label="대화 언어"
                    className={`appearance-none border border-[#dfe5ef] bg-white font-medium ${NAVY}`}
                    style={{ fontSize: u(14), height: u(36), minWidth: u(110), borderRadius: u(6), padding: `0 ${u(34)} 0 ${u(13)}` }}
                  >
                    {languagesFor(pref.country).map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.ko}
                      </option>
                    ))}
                  </select>
                  <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${NAVY}`} style={{ right: u(10) }}>
                    <ChevronIcon size={u(16)} />
                  </span>
                </span>
              </div>

              <TodayPhrase
                phrase={scenario.phrases[0]}
                lang={pref.lang}
                onStart={() => start(scenario)}
              />

              <div
                className="flex min-h-0 flex-1 flex-col bg-[#f5f8fd]"
                style={{ marginTop: u(12), borderRadius: u(8), padding: `${u(10)} ${u(10)} ${u(8)}` }}
              >
                <p className={`font-black ${NAVY}`} style={{ fontSize: u(15), paddingLeft: u(4) }}>
                  다른 표현도 함께 연습해요
                </p>
                <div className="flex flex-1 flex-col justify-evenly" style={{ gap: u(6), marginTop: u(6) }}>
                  {scenario.phrases.slice(1, 3).map((p) => (
                    <OtherPhrase key={p.en} phrase={p} lang={pref.lang} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── 유형별 학습 ─────────────────────────────────── */}
        <div className="flex flex-wrap items-baseline justify-between" style={{ marginTop: u(13), gap: u(8) }}>
          <p className="flex flex-wrap items-baseline" style={{ gap: `${u(4)} ${u(22)}` }}>
            <span className={`font-black tracking-[-0.02em] ${NAVY}`} style={{ fontSize: u(25) }}>
              유형별 학습
            </span>
            <span className={GREY} style={{ fontSize: u(14) }}>
              상황에 맞는 학습 유형을 선택해보세요.
            </span>
          </p>
          <Link
            href="/global/scenarios/"
            className="flex items-center font-bold text-dku-500 hover:text-dku-700"
            style={{ fontSize: u(15), gap: u(6) }}
          >
            전체 보기 <ArrowIcon size={u(16)} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3" style={{ gap: u(14), marginTop: u(8) }}>
          <KindCard
            icon={<PlaneIcon size={u(30)} />}
            title="해외 출장"
            desc={"공항, 호텔, 회의, 일정까지\n실전 표현을 연습하세요."}
            photo="/global-trip.jpg"
            onClick={() => openKind("trip")}
          />
          <KindCard
            icon={<PeopleIcon size={u(30)} />}
            title="글로벌 미팅"
            desc={"비즈니스 미팅과 협상에\n필요한 표현을 학습하세요."}
            photo="/global-meeting.jpg"
            onClick={() => openKind("meeting")}
          />
          <KindCard
            icon={<DocIcon size={u(30)} />}
            title="직무별 활용 표현"
            desc={"연구개발부터 경영지원까지\n14개 직무의 실무 표현을 익히세요."}
            photo="/global-job.jpg"
            onClick={() => openKind("job")}
          />
        </div>

        {/* ── 스크립트 · 튜터 · 학습 현황 ─────────────────── */}
        <div className="grid md:grid-cols-[640fr_326fr]" style={{ gap: u(12), marginTop: u(11), marginBottom: u(40) }}>
          <ScriptCard />
          <ProgressCard />
        </div>
      </div>
    </div>
  );
}

/**
 * 윗머리 띠 — 화면 끝까지 꽉 찬다.
 *
 * 배경은 시안의 도로 사진에서 글씨를 지운 것이고(public/sl-global-hero.jpg),
 * 글씨는 사진에 박지 않고 여기서 쓴다 — 사진 속 글씨는 키우면 뭉개진다.
 * 크기·자간·위치는 시안을 재어 --u 로 옮겼고, 글씨 왼쪽 끝은 아래 카드 안쪽에 맞춘다.
 *
 * 메인 대시보드 배너(BRAND.heroImage)로 내려가지 않는다.
 */
function Hero() {
  const [ok, setOk] = useState(true);
  return (
    <section
      className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-dku-700 to-dku-900 max-md:[--u:0.62px]"
      style={{ height: `max(${u(261)}, 220px)` }}
    >
      {ok && (
        // 정적 배포라 next/image 최적화를 쓰지 않는다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/sl-global-hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[62%_50%]"
          onError={() => setOk(false)}
        />
      )}
      {/* 글씨가 단풍 위에서도 읽히게 왼쪽만 살짝 어둡게 */}
      <span className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" aria-hidden />

      <div
        className="relative mx-auto text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.28)]"
        style={{ width: `min(${u(985)}, calc(100% - 40px))`, padding: `${u(44)} 0 0 ${u(14)}` }}
      >
        <p style={{ fontSize: u(18), fontWeight: 500, letterSpacing: "0.34em", lineHeight: 1 }}>
          PEOPLE DRIVE US
        </p>
        <h1 style={{ fontSize: u(61), fontWeight: 760, letterSpacing: "-0.02em", lineHeight: 1, marginTop: u(8) }}>
          We Drive the World
        </h1>
        <span className="block bg-white" style={{ width: u(50), height: u(3), marginTop: u(10) }} aria-hidden />
        <p style={{ fontSize: u(20), fontWeight: 600, lineHeight: u(28), marginTop: u(12), letterSpacing: "-0.01em" }}>
          언어로 더 가까운 세상을 만듭니다.
          <br />
          오늘의 상황을 선택해 학습해보세요.
        </p>
      </div>
    </section>
  );
}

/** 사진 한 장 — 없으면 깨진 그림 아이콘 대신 아예 그리지 않는다 */
function Photo({ src, className }: { src: string; className?: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden className={className} onError={() => setGone(true)} />
  );
}

/** 오늘의 표현 — 시안 303 x 168 */
function TodayPhrase({ phrase, lang, onStart }: { phrase: Phrase; lang: LangCode; onStart: () => void }) {
  const t = localized(lang, phrase.en);
  const say = t?.text ?? phrase.en;
  return (
    <div className="bg-[#f5f8fd]" style={{ marginTop: u(8), borderRadius: u(8), padding: `${u(9)} ${u(14)} ${u(11)}` }}>
      <p className={GREY} style={{ fontSize: u(12.5) }}>
        오늘의 표현 · 5분
      </p>
      <div className="flex items-center" style={{ gap: u(10), marginTop: u(5) }}>
        <p
          className={`line-clamp-2 min-w-0 flex-1 font-bold tracking-[-0.01em] ${NAVY}`}
          style={{ fontSize: u(22), lineHeight: 1.18 }}
          title={t?.read ? `[${t.read}]` : undefined}
        >
          {say}
        </p>
        <SpeakButton text={say} lang={lang} size={u(22)} />
      </div>
      <p className={`truncate ${GREY}`} style={{ fontSize: u(15), marginTop: u(4) }} title={phrase.ko}>
        {phrase.ko}
      </p>
      {!t && lang !== "en" && (
        <p className="text-amber-700" style={{ fontSize: u(11.5), marginTop: u(3) }}>
          {languageKo(lang)} 문장은 준비 중이라 영어로 보여 드립니다.
        </p>
      )}
      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-center justify-center bg-dku-500 font-semibold text-white transition hover:bg-dku-600"
        style={{ height: u(36), fontSize: u(14.5), borderRadius: u(4), marginTop: u(9), gap: u(8) }}
      >
        오늘의 연습 시작하기 <ArrowIcon size={u(15)} />
      </button>
    </div>
  );
}

/** 다른 표현 한 줄 — 시안 274 x 47 */
function OtherPhrase({ phrase, lang }: { phrase: Phrase; lang: LangCode }) {
  const t = localized(lang, phrase.en);
  const say = t?.text ?? phrase.en;
  return (
    <div className="flex items-center bg-white" style={{ borderRadius: u(6), padding: `${u(5)} ${u(12)} ${u(5)} ${u(14)}`, gap: u(8), lineHeight: 1.3 }}>
      <span className="min-w-0 flex-1">
        <span className={`block truncate ${NAVY}`} style={{ fontSize: u(14) }} title={t?.read ? `[${t.read}]` : undefined}>
          {say}
        </span>
        <span className={`block truncate ${GREY}`} style={{ fontSize: u(13.5) }}>
          {phrase.ko}
        </span>
      </span>
      <SpeakButton text={say} lang={lang} size={u(18)} />
    </div>
  );
}

function SpeakButton({ text, lang, size }: { text: string; lang: LangCode; size: string }) {
  return (
    <button
      type="button"
      onClick={() => playPrompt(text, null, undefined, lang)}
      aria-label={`${text} 듣기`}
      className="shrink-0 text-dku-500 transition hover:text-dku-700"
    >
      <SpeakerIcon size={size} />
    </button>
  );
}

/**
 * 유형 한 칸 — 시안 318 x 206. 사진이 위, 설명이 아래.
 */
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
      <span className="block overflow-hidden bg-gradient-to-br from-dku-100 to-dku-200" style={{ height: u(118) }}>
        <Photo src={photo} className="h-full w-full object-cover" />
      </span>
      <span className="flex flex-1 items-center" style={{ padding: `${u(11)} ${u(14)} ${u(10)} ${u(17)}`, gap: u(13) }}>
        <span className="shrink-0 self-start text-dku-500" style={{ marginTop: u(2) }} aria-hidden>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`flex items-center font-black ${NAVY}`} style={{ fontSize: u(17), gap: u(8) }}>
            {title}
            {soon && (
              <span className="border border-[#e1e6ef] bg-[#f4f6fa] font-semibold text-[#6b7590]" style={{ fontSize: u(11.5), padding: `${u(1)} ${u(6)}`, borderRadius: u(4) }}>
                준비중
              </span>
            )}
          </span>
          <span className={`block whitespace-pre-line tracking-[-0.02em] lg:whitespace-pre ${GREY}`} style={{ fontSize: u(14), lineHeight: u(21), marginTop: u(3) }}>
            {desc}
          </span>
        </span>
        <span
          className={`flex shrink-0 items-center justify-center rounded-full ${soon ? "bg-[#f1f4f9] text-slate-400" : "bg-[#eef4fe] text-dku-500"}`}
          style={{ width: u(32), height: u(32) }}
        >
          <ArrowIcon size={u(16)} />
        </span>
      </span>
    </>
  );

  const box = `${CARD} relative flex flex-col overflow-hidden text-left`;
  const style = { minHeight: u(206), borderRadius: u(10) };

  if (soon) {
    return (
      <section aria-disabled className={box} style={style}>
        {body}
      </section>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${box} transition hover:border-dku-300 hover:shadow-[0_10px_24px_-12px_rgba(15,40,90,0.3)]`} style={style}>
      {body}
    </button>
  );
}

/**
 * AI 맞춤 대화 스크립트 — 안내(왼쪽)와 튜터 미리보기(오른쪽)가 한 칸이다.
 * 튜터 쪽은 어떤 모습인지 보여 주는 그림이며 실제 대화가 아니다.
 */
function ScriptCard() {
  return (
    <section className={`${CARD} grid md:grid-cols-[300fr_310fr]`} style={{ borderRadius: u(10), padding: `${u(12)} ${u(14)} ${u(12)} ${u(20)}`, gap: u(20) }}>
      <div className="flex flex-col">
        <p className="font-semibold text-dku-500" style={{ fontSize: u(12.5) }}>
          AI가 제안하는
        </p>
        <p className={`font-black tracking-[-0.02em] ${NAVY}`} style={{ fontSize: u(19), lineHeight: 1.25, marginTop: u(1) }}>
          내 맞춤 대화 스크립트
        </p>
        <p className={GREY} style={{ fontSize: u(13.5), lineHeight: u(19), marginTop: u(4) }}>
          실제 비즈니스 상황을 반영한 시나리오로
          <br />
          더 효율적으로 연습해보세요.
        </p>
        <span className="flex-1" style={{ minHeight: u(8) }} />
        <Link
          href="/global/script/"
          className="flex w-full items-center justify-center bg-dku-500 font-semibold text-white transition hover:bg-dku-600"
          style={{ height: u(34), borderRadius: u(4), fontSize: u(14.5), gap: u(8) }}
        >
          스크립트 학습하기 <ArrowIcon size={u(16)} />
        </Link>
      </div>

      <div className="flex flex-col max-md:hidden" aria-hidden>
        <p className="flex items-center font-bold text-dku-500" style={{ gap: u(10), fontSize: u(14) }}>
          <span
            className="flex shrink-0 items-center justify-center rounded-full bg-dku-500 font-black italic text-white"
            style={{ width: u(30), height: u(30), fontSize: u(11) }}
          >
            SL
          </span>
          SL AI Tutor
        </p>
        <div className="bg-[#f4f7fc]" style={{ marginTop: u(6), marginLeft: u(40), padding: `${u(5)} ${u(10)}`, borderRadius: u(6) }}>
          <p className={`truncate ${GREY}`} style={{ fontSize: u(12.5) }}>
            이 프로젝트의 일정을 공유해 주시겠습니까?
          </p>
          <p className={NAVY} style={{ fontSize: u(14), lineHeight: u(17), marginTop: u(4) }}>
            Could you share the timeline
            <br />
            for the project?
          </p>
        </div>
        <span className="flex-1" style={{ minHeight: u(8) }} />
        <div
          className="flex items-center rounded-full bg-white shadow-[0_2px_10px_-4px_rgba(15,40,90,0.3)]"
          style={{ height: u(50), padding: `0 ${u(2)} 0 ${u(22)}` }}
        >
          <Wave />
          <span
            className="ml-auto flex shrink-0 items-center justify-center rounded-full bg-dku-500 text-white"
            style={{ width: u(50), height: u(50) }}
          >
            <MicIcon size={u(22)} />
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * 나의 학습 현황 — 시안 326 x 150.
 *
 * 숫자를 지어내지 않는다. 이번 주(월~일) 마친 글로벌 연습 횟수와 OPIc 학습을 센다.
 * 시안의 68% · 5회 · 8회는 그림용 숫자다. 목표 8회는 시안을 따랐다.
 */
function ProgressCard() {
  const [week, setWeek] = useState<{ marks: boolean[]; count: number } | null>(null);

  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return localDay(d);
    });
    const inWeek = new Set(days);

    const studied = new Set<string>();
    let count = 0;
    for (const s of allSessions()) {
      if (!s.doneAt) continue;
      const d = localDay(new Date(s.doneAt));
      if (inWeek.has(d)) {
        studied.add(d);
        count += 1;
      }
    }
    // OPIc 학습은 날짜별 기록이 없어 마지막 학습일만 한 번으로 센다
    const p = loadProgress();
    if (p.lastStudied && inWeek.has(p.lastStudied)) {
      studied.add(p.lastStudied);
      count += 1;
    }
    setWeek({ marks: days.map((d) => studied.has(d)), count });
  }, []);

  const count = week?.count ?? 0;
  const goal = 8;
  const pct = Math.min(100, Math.round((count / goal) * 100));

  return (
    <section className={`${CARD} flex flex-col`} style={{ borderRadius: u(10), padding: `${u(12)} ${u(16)} ${u(12)}` }}>
      <div className="flex items-center justify-between">
        <p className={`font-black ${NAVY}`} style={{ fontSize: u(17) }}>
          나의 학습 현황
        </p>
        <Link href="/global/scenarios/" className="flex items-center font-bold text-dku-500 hover:text-dku-700" style={{ fontSize: u(14), gap: u(5) }}>
          전체 보기 <ArrowIcon size={u(15)} />
        </Link>
      </div>

      <div className="flex items-center" style={{ gap: u(22), marginTop: u(6) }}>
        <Ring pct={pct} size={u(72)} />
        <div className="min-w-0">
          <p className={`font-bold ${NAVY}`} style={{ fontSize: u(14), lineHeight: 1.35 }}>
            {count >= goal ? "이번 주 목표를" : "이번주 목표까지"}
            <br />
            <span className="text-dku-500">{count >= goal ? "채웠어요!" : "조금만 더!"}</span>
          </p>
          <p className={GREY} style={{ fontSize: u(12), marginTop: u(3) }}>
            이번 주 {count}회 학습 · 총 {goal}회 목표
          </p>
        </div>
      </div>

      <span className="flex-1" style={{ minHeight: u(6) }} />
      <ul className="flex items-end justify-between">
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <li key={d} className="flex flex-col items-center" style={{ gap: u(5) }}>
            <span className={`font-semibold ${NAVY}`} style={{ fontSize: u(12) }}>
              {d}
            </span>
            <span
              role="img"
              aria-label={`${d}요일 ${week?.marks[i] ? "학습함" : "학습 안 함"}`}
              className={`flex items-center justify-center rounded-full ${
                week?.marks[i] ? "bg-dku-500 text-white" : "border-[1.5px] border-[#cfd6e2]"
              }`}
              style={{ width: u(22), height: u(22) }}
            >
              {week?.marks[i] && <CheckIcon size={u(13)} />}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 달성률 고리 */
function Ring({ pct, size }: { pct: number; size: string }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" className="text-dku-100" stroke="currentColor" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className="text-dku-500"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-black ${NAVY}`} style={{ fontSize: `calc(${size} * 0.3)` }}>
        {pct}
        <span className="font-bold" style={{ fontSize: `calc(${size} * 0.17)` }}>
          %
        </span>
      </span>
    </span>
  );
}

// ── 아이콘 ─────────────────────────────────────────────
function Svg({ size, sw = 2, children }: { size: string; sw?: number; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size }}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function PlaneIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={1.8}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </Svg>
  );
}

function PeopleIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={1.8}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function DocIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={1.8}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
    </Svg>
  );
}

function ArrowIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2.4}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

function ChevronIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2.4}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

function MicIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Svg>
  );
}

function CheckIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={3}>
      <path d="m5 12 5 5 9-10" />
    </Svg>
  );
}

function SpeakerIcon({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 음성 파형 — 녹음 중인 모습을 흉내 낸 장식이다 */
function Wave() {
  const bars = [6, 10, 8, 16, 26, 12, 20, 10, 16, 8, 22, 12, 8, 18, 10, 6, 12, 8];
  return (
    <span className="flex items-center" style={{ gap: u(3), height: u(28) }} aria-hidden>
      {bars.map((h, i) => (
        <span key={i} className="rounded-full bg-dku-500" style={{ width: u(2.5), height: u(h) }} />
      ))}
    </span>
  );
}
