"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { WorldMap } from "@/components/global/WorldMap";
import { playPrompt, stopAudio } from "@/lib/audio";
import {
  COUNTRIES,
  KIND_KO,
  LANGUAGES,
  scenariosOf,
  type GlobalKind,
  type Scenario,
} from "@/lib/global/content";
import {
  createSession,
  doneToday,
  loadPref,
  savePref,
  todayScenario,
  type GlobalPref,
} from "@/lib/global/store";

/**
 * 오늘의 글로벌.
 *
 * 하루에 한 상황만 권한다. 매일 5분이 쌓이는 쪽이, 한 번에 몰아서 하고
 * 다시 열지 않는 것보다 낫기 때문이다. 그렇다고 막지는 않는다 —
 * 더 하고 싶으면 다른 상황을 골라 얼마든지 이어서 할 수 있다.
 *
 * OPIc 성적과 섞지 않는다. 이 화면에는 목표 등급도 시험 일정도 두지 않는다.
 */
export default function GlobalPage() {
  return (
    <AppShell>
      {() => <GlobalBody />}
    </AppShell>
  );
}

function GlobalBody() {
  const router = useRouter();
  const [pref, setPref] = useState<GlobalPref | null>(null);
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState<Scenario | null>(null);

  // 빌드 결과가 서버에서 그려지므로 저장값은 브라우저에서 읽는다
  useEffect(() => setPref(loadPref()), []);
  useEffect(() => () => stopAudio(), []);

  if (!pref) {
    return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;
  }

  const country = COUNTRIES.find((c) => c.code === pref.country) ?? COUNTRIES[2];
  const scenario = chosen ?? todayScenario(pref);
  const already = doneToday(scenario.id);

  function change(patch: Partial<GlobalPref>) {
    const next = { ...pref!, ...patch };
    setPref(next);
    savePref(next);
    // 맥락이 바뀌면 오늘의 추천도 다시 고른다
    setChosen(null);
    setPicking(false);
  }

  function start() {
    const s = createSession({ scenarioId: scenario.id, pref: pref! });
    router.push(`/global/practice/?s=${s.id}`);
  }

  return (
    <>
      {/* ── 소개 띠 ─────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid items-center gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_auto] lg:py-10">
          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-[0.16em] text-dku-500">TODAY&apos;S GLOBAL</p>
            <h1 className="hero-headline mt-3 break-keep text-[30px] text-slate-900 sm:text-[38px]">
              하루 한 상황,
              <br />
              <span className="text-dku-800">내일의 대화를 준비하세요.</span>
            </h1>
            <p className="mt-3 break-keep text-[16px] text-slate-500">
              해외출장과 글로벌 미팅, 하루 5분씩 편하게 연습해요.
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

      {/* ── 오늘, 어디와 연결되나요? ──────────────────────── */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="hero-headline text-[26px] text-slate-900">오늘, 어디와 연결되나요?</h2>
          <p className="mt-1 text-[15px] text-slate-500">
            국가와 상황을 선택하면 오늘의 연습이 시작됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          className="shrink-0 text-[14px] font-bold text-dku-600 transition hover:text-dku-800"
        >
          {picking ? "접기 ←" : "다른 상황 고르기 →"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,40%)]">
        {/* 지도 */}
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

        {/* 오늘의 연습 */}
        <section className="min-w-0 rounded-2xl bg-[#eaf1fc] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[19px] font-bold text-slate-900">
              {country.ko} · {LANGUAGES.find((l) => l.code === pref.lang)?.ko ?? "영어"}
            </p>
            <select
              value={pref.lang}
              onChange={(e) => change({ lang: e.target.value })}
              aria-label="학습 언어"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[14px] font-bold text-slate-700"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} disabled={!l.enabled}>
                  {l.ko}
                </option>
              ))}
            </select>
          </div>

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

          {picking ? (
            <ScenarioPicker
              kind={pref.kind}
              current={scenario.id}
              onPick={(s) => {
                setChosen(s);
                setPicking(false);
              }}
            />
          ) : (
            <>
              <p className="mt-5 text-[13px] text-slate-500">
                오늘의 상황 · 5분
                {already && <span className="ml-2 font-bold text-dku-600">오늘 완료</span>}
              </p>
              <p className="mt-1 text-[24px] font-bold text-slate-900">{scenario.title}</p>
              <p className="mt-1 text-[15px] text-slate-600">{scenario.subtitle}</p>

              <button
                type="button"
                onClick={() => playPrompt(scenario.phrases[0].en)}
                className="mt-4 flex w-full items-start gap-3 rounded-xl bg-white px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-dku-700">
                    {scenario.phrases[0].en}
                  </span>
                  <span className="mt-1 block text-[14px] text-slate-500">
                    {scenario.phrases[0].ko}
                  </span>
                </span>
                <span className="shrink-0 text-dku-600" aria-label="문장 듣기">
                  <SpeakerIcon />
                </span>
              </button>

              <button
                type="button"
                onClick={start}
                className="mt-4 w-full rounded-xl bg-dku-600 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-700"
              >
                오늘의 연습 시작하기 →
              </button>
              <p className="mt-3 text-center text-[13px] text-slate-500">
                듣기 → 내 말로 말하기 → 다시 연습
              </p>
            </>
          )}
        </section>
      </div>

      {/* ── 스크립트 · AI 안내 ───────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6">
          <p className="text-[12px] font-bold tracking-[0.16em] text-dku-500">MEETING SCRIPT</p>
          <p className="mt-2 text-[22px] font-bold text-slate-900">내 미팅에 맞춘 스크립트</p>
          <p className="mt-1 text-[15px] text-slate-500">이름, 직급, 회의 목적을 알려주세요.</p>

          <p className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] text-slate-500">
            <span className="text-dku-500" aria-hidden>
              <DocIcon />
            </span>
            품질팀 팀장 · 납기 일정 회의
          </p>

          <p className="mt-3 text-[13px] text-dku-600">한글 · 외국어 대조 · 문장별 듣기 · AI 리허설</p>

          <Link
            href="/global/script/"
            className="mt-4 inline-block rounded-xl bg-dku-600 px-5 py-3 text-[15px] font-bold text-white transition hover:bg-dku-700"
          >
            스크립트 만들기 →
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6">
          <p className="text-[22px] font-bold text-slate-900">AI와 이렇게 연습해요</p>
          <p className="mt-1 text-[15px] text-slate-500">
            점수 대신, 다음 대화를 위한 작은 도움을 드려요.
          </p>

          <dl className="mt-5">
            {DIMENSIONS.map((d, i) => (
              <div
                key={d.label}
                className={`grid grid-cols-[auto_minmax(80px,22%)_1fr] items-start gap-3 py-3.5 ${
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

          <p className="mt-4 text-[13px] text-dku-600">
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

/** 네 가지 봐 주는 것 — 점수가 아니라 다음 대화를 위한 항목이다 */
const DIMENSIONS = [
  { label: "목적 달성", desc: "안건을 소개하고 필요한 요청을 해봤나요?", icon: <TargetIcon /> },
  { label: "명확성", desc: "날짜·수량·담당자·기한을 분명하게 말해봐요.", icon: <BulbIcon /> },
  { label: "업무 어조", desc: "상대와 상황에 맞는 정중한 표현을 연습해요.", icon: <PeopleIcon /> },
  { label: "표현", desc: "지금 내 수준에서 바로 쓸 수 있는 말로 바꿔봐요.", icon: <ChatIcon /> },
];

function ScenarioPicker({
  kind,
  current,
  onPick,
}: {
  kind: GlobalKind;
  current: string;
  onPick: (s: Scenario) => void;
}) {
  const list = scenariosOf(kind);
  return (
    <>
      <p className="mt-5 text-[13px] text-slate-500">{KIND_KO[kind]} · 상황 {list.length}개</p>
      <ul className="mt-2 max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
        {list.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onPick(s)}
              aria-pressed={s.id === current}
              className={`w-full rounded-xl px-4 py-3 text-left transition ${
                s.id === current ? "bg-dku-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="block text-[15px] font-bold">{s.title}</span>
              <span
                className={`mt-0.5 block text-[13px] ${
                  s.id === current ? "text-white/80" : "text-slate-500"
                }`}
              >
                {s.subtitle}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── 그림 ─────────────────────────────────────────────────
const ICON = {
  width: 20,
  height: 20,
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
function SpeakerIcon() {
  return (
    <svg {...ICON} width={22} height={22}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
    </svg>
  );
}

/** 지구 — 연결선이 도는 모습 */
function Globe() {
  return (
    <svg
      width="168"
      height="130"
      viewBox="0 0 168 130"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <circle cx="84" cy="65" r="42" stroke="#c6d8f3" strokeWidth="1.3" />
      <ellipse cx="84" cy="65" rx="42" ry="17" stroke="#c6d8f3" strokeWidth="1.3" />
      <ellipse cx="84" cy="65" rx="17" ry="42" stroke="#c6d8f3" strokeWidth="1.3" />
      <path d="M42 65h84M84 23v84" stroke="#dde7f6" strokeWidth="1" />
      <ellipse
        cx="84"
        cy="65"
        rx="62"
        ry="26"
        stroke="#9dc0ea"
        strokeWidth="1.2"
        transform="rotate(-22 84 65)"
      />
      <ellipse
        cx="84"
        cy="65"
        rx="58"
        ry="22"
        stroke="#cfe0f6"
        strokeWidth="1.1"
        transform="rotate(26 84 65)"
      />
      {[
        [30, 44],
        [142, 52],
        [60, 104],
        [128, 96],
        [84, 18],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill="#2563eb" opacity="0.75" />
      ))}
    </svg>
  );
}
