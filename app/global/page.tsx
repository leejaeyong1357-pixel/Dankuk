"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/global/Flag";
import { WorldMap } from "@/components/global/WorldMap";
import { playPrompt, stopAudio } from "@/lib/audio";
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
 * 받은 시안(components/file_000000000c9482098d266a8cf7242b0f.png, 1024 x 1536)을
 * 픽셀로 재어 옮겼다. 크기는 모두 "시안의 몇 px" 로 적고, 실제 크기는
 * --u (시안 1px 이 화면에서 몇 px 인가) 를 곱해 정한다.
 *
 *   --u = 본문 폭 / 950   (시안 본문 폭이 950px 이다)
 *
 * 그래서 화면이 넓든 좁든 글자·칸·간격의 비율이 시안과 같다. 좁은 화면에서는
 * 1px 아래로 내려가지 않게 막아 두었다 — 휴대폰에서는 칸이 세로로 쌓인다.
 *
 * 지도 칸과 "하루에 한문장!" 칸은 시안에서 둘 다 448px 높이로 끝선이 맞는다.
 * 왼쪽(제목 + 지도)이 높이를 정하고 오른쪽 칸이 거기에 붙는다.
 *
 * OPIc 성적과 섞지 않는다. 이 화면에는 목표 등급도 시험 일정도 두지 않는다.
 */
export default function GlobalPage() {
  return <AppShell>{() => <GlobalBody />}</AppShell>;
}

/** 시안의 n px */
const u = (n: number) => `calc(${n} * var(--u))`;

/**
 * 시안 기본 글자색 (#09194c).
 *
 * 제목은 font-black 을 쓴다. tailwind 설정이 굵기를 한 단씩 낮춰 두어
 * font-extrabold 로는 시안보다 가늘게 나온다.
 */
const NAVY = "text-[#0b1b4d]";

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

      {/* 본문 폭을 재는 칸 — 그 안에서 --u 가 정해진다 */}
      <div style={{ containerType: "inline-size" }}>
        <div
          style={
            {
              "--u": "clamp(1px, calc(100cqw / 950), 1.6px)",
              paddingTop: u(33),
            } as React.CSSProperties
          }
        >
          {/* ── 오늘, 어디와 연결되나요? | 하루에 한문장! ────────── */}
          <div className="grid xl:grid-cols-[617fr_318fr]" style={{ columnGap: u(15), rowGap: u(16) }}>
            <div className="min-w-0">
              <h2 className={`font-black tracking-[-0.02em] ${NAVY}`} style={{ fontSize: u(27), lineHeight: 1.25 }}>
                오늘, 어디와 연결되나요?
              </h2>
              <p className="text-[#3d4a66]" style={{ fontSize: u(15), marginTop: u(10) }}>
                언어는 더 가까운 세상을 만듭니다. 오늘의 상황을 선택해보세요.
              </p>

              {/* 지도 칸 */}
              <section
                className="overflow-hidden bg-dku-50"
                style={{ marginTop: u(22), borderRadius: u(14), padding: `${u(3)} ${u(15)} ${u(10)} 0` }}
              >
                <WorldMap
                  value={pref.country}
                  onChange={(code) =>
                    change({
                      country: code as Country["code"],
                      lang: LANG_BY_COUNTRY[code as Country["code"]],
                    })
                  }
                />
                <ul
                  className="flex flex-wrap items-center justify-around bg-white"
                  style={{ marginTop: u(8), marginLeft: u(12), borderRadius: u(10), padding: `${u(9)} ${u(8)}`, rowGap: u(6) }}
                >
                  {COUNTRIES.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => change({ country: c.code, lang: LANG_BY_COUNTRY[c.code] })}
                        aria-pressed={c.code === pref.country}
                        className={`flex items-center transition ${
                          c.code === pref.country ? "font-bold text-dku-700" : "font-medium text-[#1b2b55] hover:text-dku-700"
                        }`}
                        style={{ gap: u(8), fontSize: u(13), padding: `${u(2)} ${u(4)}` }}
                      >
                        <Flag code={c.code} style={{ width: u(20), height: u(13) }} />
                        {c.ko}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 하루에 한문장! — 넓은 화면에서는 왼쪽 높이에 딱 붙는다 */}
            <div className="relative min-w-0">
              <section
                className="flex flex-col border border-dku-100 bg-dku-50 xl:absolute xl:inset-0"
                style={{ borderRadius: u(14), padding: `${u(17)} ${u(20)} ${u(16)}` }}
              >
                <div className="flex items-center justify-between" style={{ gap: u(10) }}>
                  <p className="font-semibold text-[#1b2b55]" style={{ fontSize: u(19) }}>
                    하루에 한문장!
                  </p>
                  <select
                    value={pref.lang}
                    onChange={(e) => change({ lang: e.target.value as LangCode })}
                    aria-label="대화 언어"
                    className="border border-slate-200 bg-white font-medium text-[#1b2b55]"
                    style={{ fontSize: u(13), height: u(31), minWidth: u(97), borderRadius: u(6), padding: `0 ${u(10)}` }}
                  >
                    {languagesFor(pref.country).map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.ko}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2" style={{ gap: u(11), marginTop: u(14) }}>
                  {(["meeting", "trip"] as GlobalKind[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => change({ kind: k })}
                      aria-pressed={pref.kind === k}
                      className={`font-semibold transition ${
                        pref.kind === k
                          ? "bg-dku-600 text-white shadow-[0_3px_8px_-3px_rgba(1,84,194,0.6)]"
                          : "border border-slate-200 bg-white text-[#3d4a66] hover:text-dku-700"
                      }`}
                      style={{ height: u(40), fontSize: u(14), borderRadius: u(6) }}
                    >
                      {KIND_KO[k]}
                    </button>
                  ))}
                </div>

                {/* 남는 높이는 여기서 흡수한다 — 시안도 탭과 상황 사이가 비어 있다 */}
                <span className="flex-1" style={{ minHeight: u(24) }} />

                <p className="text-[#5a6478]" style={{ fontSize: u(12.5) }}>
                  오늘의 상황 · 5분
                </p>
                <p className={`font-black ${NAVY}`} style={{ fontSize: u(22), marginTop: u(8), lineHeight: 1.25 }}>
                  {scenario.title}
                </p>
                <p className="text-[#3d4a66]" style={{ fontSize: u(14), marginTop: u(8) }}>
                  {scenario.subtitle}
                </p>

                <Preview phrase={scenario.phrases[0]} lang={pref.lang} country={country} />

                <button
                  type="button"
                  onClick={() => start(scenario)}
                  className="flex w-full items-center justify-center bg-dku-600 font-semibold text-white transition hover:bg-dku-700"
                  style={{ height: u(46), fontSize: u(14), borderRadius: u(6), marginTop: u(18), gap: u(8) }}
                >
                  오늘의 연습 시작하기 <ArrowIcon size={u(16)} />
                </button>
                <p className="text-center text-[#5a6478]" style={{ fontSize: u(12), marginTop: u(16) }}>
                  듣기 · 따라 말하기 · 다시 연습
                </p>
              </section>
            </div>
          </div>

          {/* ── 유형별 학습 띠 ─────────────────────────────── */}
          <section
            className="relative flex items-center overflow-hidden border border-dku-100 bg-gradient-to-r from-dku-50 via-dku-50 to-[#eaf2fd]"
            style={{ marginTop: u(27), height: u(106), borderRadius: u(10), paddingLeft: u(27) }}
          >
            <Photo
              src="/global-banner.jpg"
              className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto mix-blend-multiply [mask-image:linear-gradient(to_right,transparent,black_35%)]"
            />
            <span className="relative text-dku-600" aria-hidden>
              <GridIcon size={u(43)} />
            </span>
            <div className="relative min-w-0" style={{ marginLeft: u(24) }}>
              <p className={`font-black tracking-[-0.02em] ${NAVY}`} style={{ fontSize: u(32), lineHeight: 1.15 }}>
                유형별 학습
              </p>
              <p className="text-[#3d4a66]" style={{ fontSize: u(16), marginTop: u(8) }}>
                상황에 맞는 학습 유형을 선택해보세요.
              </p>
            </div>
          </section>

          <div className="grid md:grid-cols-3" style={{ gap: u(14), marginTop: u(17) }}>
            <KindCard
              icon={<PlaneIcon size={u(32)} />}
              title="해외 출장"
              desc={"공항, 호텔, 현지 일정까지\n실전 표현을 연습하세요."}
              photo="/global-trip.jpg"
              onClick={() => openKind("trip")}
            />
            <KindCard
              icon={<PeopleIcon size={u(32)} />}
              title="글로벌 미팅"
              desc={"비즈니스 미팅과 협상에\n필요한 표현을 학습하세요."}
              photo="/global-meeting.jpg"
              onClick={() => openKind("meeting")}
            />
            <KindCard
              icon={<DocIcon size={u(32)} />}
              title="일상 커뮤니케이션"
              desc={"현지 생활과 문화에 필요한\n표현을 연습하세요."}
              photo="/global-daily.jpg"
              soon
            />
          </div>

          {/* ── 스크립트 · 학습 현황 ─────────────────────────── */}
          <div className="grid lg:grid-cols-[588fr_344fr]" style={{ gap: u(18), marginTop: u(22), marginBottom: u(30) }}>
            <ScriptCard />
            <ProgressCard />
          </div>

        </div>
      </div>
    </>
  );
}

/**
 * 윗머리 띠.
 *
 * 시안의 윗머리를 그대로 잘라 썼다 (public/sl-global-hero.jpg, 글씨 포함).
 * 사진의 가로세로비를 그대로 지켜 어느 폭에서도 시안과 같은 모양이 나온다.
 * 글씨가 사진에 들어 있으므로 읽는 기계를 위해 같은 문구를 숨겨 둔다.
 *
 * 사진이 없으면 파란 바탕 위에 같은 문구를 직접 그린다.
 * 메인 대시보드 배너(BRAND.heroImage)로 내려가지 않는다.
 */
function Hero() {
  const [ok, setOk] = useState(true);
  return (
    <section className="relative -mx-5 -mt-6 overflow-hidden bg-dku-800" style={{ aspectRatio: "1024 / 180" }}>
      <h1 className="sr-only">people drive us — We Drive the World</h1>
      {ok ? (
        // 정적 배포라 next/image 최적화를 쓰지 않는다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/sl-global-hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-br from-dku-700 to-dku-900 pl-[5.6%] text-white" aria-hidden>
          <p className="text-[3.5vw] font-light leading-tight">people drive us</p>
          <p className="text-[5vw] font-black leading-tight">We Drive the World</p>
          <span className="mt-[2vw] h-[0.25vw] w-[4.5vw] bg-white" />
        </div>
      )}
    </section>
  );
}

/**
 * 사진 한 장.
 *
 * 저장소에 없는 사진을 가리키면 브라우저가 깨진 그림 아이콘을 남긴다.
 * 못 읽으면 아예 그리지 않는다 — 뒤에 깔린 바탕만 남아 깔끔하다.
 */
function Photo({ src, className }: { src: string; className?: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden className={className} onError={() => setGone(true)} />
  );
}

/**
 * 유형 한 칸 — 시안 304 x 245.
 *
 * 사진은 칸 아래쪽을 채우고, 위로 갈수록 흰색으로 풀어 글씨 쪽과 잇는다.
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
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-br from-dku-100 to-dku-200" style={{ height: u(125) }}>
        <Photo src={photo} className="h-full w-full object-cover" />
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white to-transparent" />
      </span>

      <span className="relative block" style={{ padding: `${u(18)} ${u(25)} 0` }}>
        <span className="block text-dku-600" aria-hidden>
          {icon}
        </span>
        <span
          className={`flex items-center font-black tracking-[-0.02em] ${NAVY}`}
          style={{ fontSize: u(21), marginTop: u(14), gap: u(8), lineHeight: 1.2 }}
        >
          {title}
          {soon && (
            <span className="bg-slate-100 font-bold text-slate-500" style={{ fontSize: u(11), padding: `${u(2)} ${u(7)}`, borderRadius: u(4) }}>
              준비 중
            </span>
          )}
        </span>
        <span className="block whitespace-pre-line text-[#3d4a66]" style={{ fontSize: u(15), lineHeight: u(23), marginTop: u(6) }}>
          {desc}
        </span>
      </span>

      {!soon && (
        <span
          className="absolute flex items-center justify-center rounded-full bg-white text-dku-600 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.35)]"
          style={{ right: u(16), bottom: u(16), width: u(44), height: u(44) }}
        >
          <ArrowIcon size={u(20)} />
        </span>
      )}
    </>
  );

  // button 은 기본으로 내용을 세로 가운데에 놓아 글씨가 사진 쪽으로 처졌다. 위에서부터 쌓는다
  const box = "relative flex flex-col justify-start overflow-hidden border border-slate-200/70 bg-white text-left";
  const style = { height: u(245), borderRadius: u(10) };

  if (soon) {
    return (
      <section aria-disabled className={box} style={style}>
        {body}
      </section>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${box} transition hover:border-dku-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.3)]`}
      style={style}
    >
      {body}
    </button>
  );
}

/** AI 스크립트 안내 칸 — 시안 588 x 285 */
function ScriptCard() {
  return (
    <section
      className="relative grid overflow-hidden bg-dku-50 sm:grid-cols-[1fr_auto]"
      style={{ minHeight: u(285), borderRadius: u(10), padding: `${u(28)} ${u(14)} ${u(15)} ${u(28)}`, gap: u(20) }}
    >
      <div className="flex min-w-0 flex-col">
        <p className="font-semibold text-dku-600" style={{ fontSize: u(16) }}>
          AI가 제안하는
        </p>
        <p className={`whitespace-nowrap font-black tracking-[-0.03em] ${NAVY}`} style={{ fontSize: u(28), marginTop: u(6), lineHeight: 1.25 }}>
          내 맞춤 대화 스크립트
        </p>
        <p className="whitespace-nowrap tracking-[-0.01em] text-[#3d4a66]" style={{ fontSize: u(16), lineHeight: u(25), marginTop: u(16) }}>
          실제 비즈니스 상황을 반영한 시나리오로
          <br />
          더 효과적으로 연습해보세요.
        </p>
        <span className="flex-1" style={{ minHeight: u(20) }} />
        <Link
          href="/global/script/"
          className="flex items-center justify-center self-start bg-dku-600 font-semibold text-white transition hover:bg-dku-700"
          style={{ width: u(216), height: u(55), borderRadius: u(4), fontSize: u(15), gap: u(8), marginBottom: u(22) }}
        >
          스크립트 학습하기 <ArrowIcon size={u(17)} />
        </Link>
      </div>

      {/* 어떤 모습인지 보여 주는 그림 — 실제 대화가 아니다 */}
      <div
        className="flex flex-col bg-white/70 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] max-sm:hidden"
        style={{ width: u(255), height: u(226), borderRadius: u(12), marginTop: u(15) }}
        aria-hidden
      >
        <div className="bg-white" style={{ borderRadius: `${u(12)} ${u(12)} 0 0`, padding: `${u(12)} ${u(14)} ${u(12)}` }}>
          <p className="flex items-center text-[#1b2b55]" style={{ gap: u(10), fontSize: u(12) }}>
            <span
              className="flex shrink-0 items-center justify-center rounded-full bg-dku-600 font-black italic text-white"
              style={{ width: u(28), height: u(28), fontSize: u(10) }}
            >
              SL
            </span>
            <span>
              SL AI Tutor
              <span className="block whitespace-nowrap tracking-[-0.02em] text-[#3d4a66]" style={{ fontSize: u(11), marginTop: u(4) }}>
                다음 상황에서 어떻게 말하면 좋을까요?
              </span>
            </span>
          </p>
          <p
            className="bg-[#f6f9fe] text-[#1b2b55]"
            style={{ marginTop: u(10), marginLeft: u(26), padding: `${u(9)} ${u(14)}`, borderRadius: u(10), fontSize: u(12.5), lineHeight: u(18) }}
          >
            Could you share the timeline for the project?
          </p>
        </div>
        <div className="flex flex-1 items-center" style={{ padding: `${u(8)} ${u(14)}` }}>
          <div
            className="flex flex-1 items-center rounded-full bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.25)]"
            style={{ height: u(54), padding: `0 ${u(4)} 0 ${u(18)}` }}
          >
            <Wave unit={u(1)} />
            <span
              className="ml-auto flex shrink-0 items-center justify-center rounded-full bg-dku-600 text-white"
              style={{ width: u(48), height: u(48) }}
            >
              <MicIcon size={u(20)} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 나의 학습 현황 — 시안 344 x 285.
 *
 * 숫자를 지어내지 않는다. 이번 주 월~일 가운데 실제로 학습한 날만 센다 —
 * 글로벌 연습을 마친 날과 OPIc 학습을 한 날이다. 기록이 없으면 0일로 둔다.
 * 시안의 72% 와 월~목 체크는 그림용 숫자라 옮기지 않았다.
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
    <section
      className="flex flex-col bg-gradient-to-br from-dku-700 via-dku-600 to-dku-500 text-white"
      style={{ minHeight: u(285), borderRadius: u(10), padding: `${u(20)} ${u(15)} ${u(15)}` }}
    >
      <div className="flex items-center justify-between" style={{ padding: `0 ${u(4)}` }}>
        <p className="flex items-center font-semibold" style={{ fontSize: u(19), gap: u(10) }}>
          <CheckSquare size={u(22)} />
          나의 학습 현황
        </p>
        <Link href="/global/scenarios/" className="text-white/85 transition hover:text-white" style={{ fontSize: u(12) }}>
          전체 보기 ›
        </Link>
      </div>

      <div className="flex flex-1 items-center" style={{ gap: u(22), padding: `0 ${u(4)}` }}>
        <Ring pct={pct} size={u(116)} />
        <div className="min-w-0">
          <p className="font-semibold" style={{ fontSize: u(19), lineHeight: 1.45 }}>
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
          <p className="text-white/80" style={{ fontSize: u(12), marginTop: u(6) }}>
            이번 주 {count}일 학습 · 주 {goal}일 기준
          </p>
        </div>
      </div>

      <ul className="flex items-center justify-around bg-white" style={{ height: u(78), borderRadius: u(8) }}>
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <li key={d} className="flex flex-col items-center" style={{ gap: u(8) }}>
            <span className="font-semibold text-[#1b2b55]" style={{ fontSize: u(13) }}>
              {d}
            </span>
            <span
              role="img"
              aria-label={`${d}요일 ${week?.marks[i] ? "학습함" : "학습 안 함"}`}
              className={`flex items-center justify-center rounded-full ${
                week?.marks[i] ? "bg-dku-600 text-white" : "border-[1.5px] border-slate-300"
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
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bcd6ff" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring-g)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ fontSize: `calc(${size} * 0.29)` }}>
        {pct}
        <span className="font-normal" style={{ fontSize: `calc(${size} * 0.17)`, marginLeft: "0.08em" }}>
          %
        </span>
      </span>
    </span>
  );
}

/**
 * 오늘의 상황 미리듣기 한 줄 — 시안 287 x 66.
 *
 * 시안처럼 두 줄(문장 / 뜻)만 보여 주고 넘치면 말줄임표로 자른다.
 * 한글 발음은 마우스를 올리면 보인다. 누르면 그 언어로 읽어 준다.
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
        title={t?.read ? `[${t.read}]` : undefined}
        className="flex w-full items-center bg-white text-left transition hover:bg-[#fbfdff]"
        style={{ marginTop: u(16), minHeight: u(66), padding: `${u(10)} ${u(14)}`, borderRadius: u(8), gap: u(10) }}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-[#1b2b55]" style={{ fontSize: u(12.5) }}>
            {t?.text ?? phrase.en}
          </span>
          <span className="block truncate text-[#5a6478]" style={{ fontSize: u(12), marginTop: u(6) }}>
            {phrase.ko}
          </span>
        </span>
        <span className="shrink-0 text-dku-600" aria-label="문장 듣기">
          <SpeakerIcon size={u(22)} />
        </span>
      </button>

      {!t && lang !== "en" && (
        <p className="text-amber-700" style={{ fontSize: u(12), marginTop: u(6) }}>
          {languageKo(lang)} 문장은 아직 준비 중입니다. 지금은 영어로 보여 드립니다.
        </p>
      )}
      {!t && lang === "en" && country && null}
    </>
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

function GridIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2.4}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

function PlaneIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </Svg>
  );
}

function PeopleIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function DocIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2}>
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

function MicIcon({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Svg>
  );
}

function CheckSquare({ size }: { size: string }) {
  return (
    <Svg size={size} sw={2}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 3 3 5-6" />
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
function Wave({ unit }: { unit: string }) {
  const bars = [4, 8, 6, 14, 22, 10, 16, 8, 12, 6, 18, 10, 6, 14, 8, 4, 10, 6];
  return (
    <span className="flex items-center" style={{ gap: `calc(${unit} * 3)`, height: `calc(${unit} * 24)` }} aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="rounded-full bg-dku-400"
          style={{ width: `calc(${unit} * 2)`, height: `calc(${unit} * ${h})` }}
        />
      ))}
    </span>
  );
}
