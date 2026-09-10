"use client";

import Link from "next/link";
import { GRADE_ORDER } from "@/lib/grades";
import type { Grade } from "@/lib/types";
import type { ExamResult } from "@/lib/types";

/**
 * 배너 아래 카드 네 장 — 시험 일정 / 최근 모의고사 / 유형별 AI 연습 / 나의 현재 실력.
 *
 * 로그인하고 처음 보는 줄이라 여기서 오늘 할 일이 정해진다.
 * 기록이 없을 때 빈칸을 남기지 않고, 무엇을 하면 되는지로 채운다.
 */
export function HomeCards({
  examDate,
  dday,
  targetGrade,
  result,
  examCount,
  practiceDone,
}: {
  examDate: string;
  dday: number;
  targetGrade: string;
  result: ExamResult | null;
  examCount: number;
  practiceDone: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ExamScheduleCard examDate={examDate} dday={dday} result={result} />
      <RecentMockCard result={result} examCount={examCount} />
      <PracticeCard />
      <LevelCard targetGrade={targetGrade} result={result} practiceDone={practiceDone} />
    </div>
  );
}

// ── 카드 껍데기 ─────────────────────────────────────────────
function Card({
  icon, tone, title, action, actionHref, children,
}: {
  icon: React.ReactNode;
  tone: "blue" | "indigo" | "sky" | "violet";
  title: string;
  action: string;
  actionHref: string;
  children: React.ReactNode;
}) {
  const TONE = {
    blue: "bg-dku-50 text-dku-600",
    indigo: "bg-indigo-50 text-indigo-500",
    sky: "bg-sky-50 text-sky-500",
    violet: "bg-violet-50 text-violet-500",
  } as const;

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE[tone]}`}>
          {icon}
        </span>
        <h2 className="whitespace-nowrap text-[15px] font-extrabold text-slate-900">{title}</h2>
        <Link
          href={actionHref}
          className="ml-auto whitespace-nowrap text-[11px] font-bold text-dku-600 transition hover:text-dku-800"
        >
          {action} <span aria-hidden>›</span>
        </Link>
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

// ── 1. 내 시험 일정 ─────────────────────────────────────────
function ExamScheduleCard({
  examDate, dday, result,
}: {
  examDate: string; dday: number; result: ExamResult | null;
}) {
  const label = dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : `D+${-dday}`;
  const weekday = examDate ? ["일", "월", "화", "수", "목", "금", "토"][new Date(`${examDate}T00:00:00`).getDay()] : "";

  return (
    <Card
      icon={<CalendarIcon />}
      tone="blue"
      title="내 시험 일정"
      action="전체 일정 보기"
      actionHref="/setup"
    >
      {examDate ? (
        <div className="flex items-center gap-2">
          <p className="whitespace-nowrap text-lg font-black text-slate-900">
            {examDate} <span className="text-sm font-bold text-slate-500">({weekday})</span>
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
              dday < 0 ? "bg-slate-100 text-slate-500" : dday <= 7 ? "bg-red-500 text-white" : "bg-red-50 text-red-500"
            }`}
          >
            {label}
          </span>
        </div>
      ) : (
        <p className="text-lg font-black text-slate-400">응시일 미설정</p>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[10px] font-black text-white">
          !
        </span>
        <p className="text-xs leading-relaxed text-slate-500">
          {result
            ? <>지난 응시 AI 예상 등급 <b className="text-slate-700">{result.grade.grade}</b>.<br />남은 기간에 맞춰 계속 연습해보세요!</>
            : <>아직 응시 기록이 없습니다.<br />지금부터 차근차근 준비해보세요!</>}
        </p>
      </div>

      <Link
        href="/setup"
        className="mt-auto block rounded-xl bg-dku-50 pt-3.5 pb-3.5 text-center text-sm font-bold text-dku-700 transition hover:bg-dku-100"
      >
        시험 일정 {examDate ? "변경하기" : "등록하기"}
      </Link>
    </Card>
  );
}

// ── 2. 최근 모의고사 ────────────────────────────────────────
function RecentMockCard({ result, examCount }: { result: ExamResult | null; examCount: number }) {
  return (
    <Card icon={<DocIcon />} tone="indigo" title="최근 모의고사" action="더보기" actionHref="/mock">
      {result ? (
        <div className="text-center">
          <p className="text-4xl font-black text-dku-700">{result.grade.grade}</p>
          <p className="mt-1.5 text-xs font-bold text-slate-500">AI 예상 등급 · 공식 성적 아님</p>
          <p className="mt-1 text-xs text-slate-400">
            {result.takenAt.slice(0, 10)} · 누적 {examCount}회
          </p>
        </div>
      ) : (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
            <LinesIcon />
          </span>
          <p className="mt-3 text-sm font-extrabold text-slate-800">아직 응시한 모의고사가 없어요.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            실전과 유사한 환경에서
            <br />
            지금 바로 도전해보세요.
          </p>
        </div>
      )}

      <Link
        href={result ? "/mock/result" : "/mock"}
        className="mt-auto block rounded-xl bg-dku-50 pt-3.5 pb-3.5 text-center text-sm font-bold text-dku-700 transition hover:bg-dku-100"
      >
        {result ? "결과지 보기 →" : "모의고사 시작하기 →"}
      </Link>
    </Card>
  );
}

// ── 3. 유형별 AI 연습 ───────────────────────────────────────
const PRACTICE_LINKS = [
  { href: "/study", icon: <CompassIcon />, label: "주제별 문제 연습" },
  { href: "/study", icon: <HeadsetIcon />, label: "AI 피드백 받기" },
  { href: "/vocab", icon: <SparkIcon />, label: "더 자연스러운 답변 완성" },
];

function PracticeCard() {
  return (
    <Card icon={<ChatIcon />} tone="sky" title="유형별 AI 연습" action="바로 연습하기" actionHref="/study">
      <p className="text-sm font-bold text-slate-800">AI와 함께하는 맞춤형 OPIc 연습</p>
      <div className="mt-3 space-y-2">
        {PRACTICE_LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 transition hover:bg-dku-50"
          >
            <span className="shrink-0 text-dku-600">{l.icon}</span>
            <span className="whitespace-nowrap text-[13px] font-semibold text-slate-700">{l.label}</span>
            <span className="ml-auto shrink-0 text-slate-400" aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ── 4. 나의 현재 실력 ───────────────────────────────────────
/**
 * 도넛에 들어가는 값은 지어내지 않는다.
 *
 * 응시 기록이 있으면 사다리 위에서 목표까지 얼마나 왔는지를,
 * 없으면 연습량으로 시작 지점을 보여 준다 — 그리고 무엇을 센 값인지 밑에 적는다.
 */
function progress(result: ExamResult | null, targetGrade: string, practiceDone: number) {
  if (result) {
    const now = GRADE_ORDER.indexOf(result.grade.grade);
    const target = GRADE_ORDER.indexOf(targetGrade as Grade);
    if (now >= 0 && target > 0) {
      return { pct: Math.max(0, Math.min(100, Math.round((now / target) * 100))), basis: "목표 등급까지" };
    }
  }
  // 연습 30문항을 한 바퀴로 본다. 응시 전에도 오늘 한 것이 보이도록.
  return { pct: Math.min(100, Math.round((practiceDone / 30) * 100)), basis: "연습 진행률" };
}

function LevelCard({
  targetGrade, result, practiceDone,
}: {
  targetGrade: string; result: ExamResult | null; practiceDone: number;
}) {
  const { pct, basis } = progress(result, targetGrade, practiceDone);
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <Card icon={<ChartIcon />} tone="violet" title="나의 학습 목표" action="상세 분석 보기" actionHref="/mock/result">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-4xl font-black leading-none text-dku-700">
            {result ? result.grade.grade : targetGrade}
          </p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
            {result ? <>목표 {targetGrade}까지<br />함께해요!</> : <>목표 등급<br />달성까지 함께해요!</>}
          </p>
        </div>

        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="#e2e8f0" strokeWidth="9" />
            <circle
              cx="40" cy="40" r={R} fill="none"
              stroke="#3468d4" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-900">{pct}%</span>
            <span className="text-[10px] font-semibold text-slate-400">{basis}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-xl bg-dku-50/70 px-3.5 py-3">
        <span aria-hidden>🎯</span>
        <p className="whitespace-nowrap text-[11px] font-semibold text-dku-800">꾸준한 연습이 좋은 결과를 만듭니다!</p>
      </div>
    </Card>
  );
}

// ── 아이콘 ──────────────────────────────────────────────────
const S = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true } as const;

function CalendarIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" strokeLinejoin="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 18V10M12 18V6M18 18v-5" />
    </svg>
  );
}
function LinesIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M5 8h14M5 12h10M5 16h6" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 4-4 2 2-4z" strokeLinejoin="round" />
    </svg>
  );
}
function HeadsetIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14v-2a8 8 0 1116 0v2" strokeLinecap="round" />
      <rect x="2.5" y="13.5" width="4" height="6" rx="2" />
      <rect x="17.5" y="13.5" width="4" height="6" rx="2" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg {...S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </svg>
  );
}
