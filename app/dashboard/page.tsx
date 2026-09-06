"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Roadmap } from "@/components/dashboard/Roadmap";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { daysUntil, loadProgress, type Progress } from "@/lib/store";
import { EXAM_CONFIG, totalQuestions } from "@/lib/exam/config";
import { comboLabel } from "@/lib/exam/question-types";
import { selectedSurveyTopics } from "@/lib/exam/survey";
import { TOPIC_BY_ID } from "@/lib/exam/topics";
import { fetchHistory } from "@/lib/sync";
import type { ExamResult } from "@/lib/types";

type Tab = "home" | "study" | "mock";

export default function Dashboard() {
  const [progress, setProgress] = useState<Progress>({ done: [], streak: 0 });
  const [result, setResult] = useState<ExamResult | null>(null);
  const [examCount, setExamCount] = useState(0);
  const [fromServer, setFromServer] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    void fetchHistory().then((h) => {
      setResult(h.latest);
      setExamCount(h.count);
      setFromServer(h.fromServer);
    });
  }, []);

  return (
    <AppShell>
      {(profile) => {
        const dday = daysUntil(profile.examDate);
        const myTopics = profile.lastSurvey ? selectedSurveyTopics(profile.lastSurvey) : [];
        const lv = profile.lastDifficulty;
        const dLabel = dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : `D+${-dday}`;

        return (
          <>
            <p className="mb-2 text-sm text-slate-500">
              안녕하세요, <strong className="font-bold text-slate-900">{profile.name}</strong>님
            </p>

            {/* ── 상단: 헤드라인 + 불꽃 / 로드맵 ─────────────── */}
            <div className="mb-6 grid items-stretch gap-4 md:gap-6 lg:grid-cols-[1fr_360px] md:mb-8">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <h1 className="headline-xl min-w-0 flex-1 text-slate-900">
                      언제 어디서든,
                      <br />
                      <span className="highlight-blue">목표 등급</span>까지.
                    </h1>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setGuide((g) => !g)}
                        className="whitespace-nowrap rounded-xl bg-dku-700 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-dku-800"
                      >
                        📘 이용 가이드
                      </button>
                      <Link
                        href={result ? "/mock/result" : "/mock"}
                        className="whitespace-nowrap rounded-xl border-2 border-dku-700 bg-white px-4 py-2.5 text-center text-sm font-bold text-dku-700 shadow-sm transition-colors hover:bg-dku-50"
                      >
                        📄 {result ? "내 결과지" : "결과지 만들기"}
                      </Link>
                    </div>
                  </div>
                  <p className="text-slate-600">
                    시간·장소 구애받지 않아요. 목표 등급 {profile.targetGrade}에 맞춘 OPIc 학습.
                  </p>

                  {guide && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                      <p className="font-extrabold text-slate-900">진행 방식</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                        <li>Background Survey — 설문 응답으로 내 출제 주제가 정해집니다.</li>
                        <li>Self Assessment — 난이도 1~6단계를 고릅니다.</li>
                        <li>Pre-Test Setup · Sample Question — 청취와 녹음을 미리 점검합니다.</li>
                        <li>
                          본시험 — 총 {EXAM_CONFIG.totalMinutes}분, 질문 청취 {EXAM_CONFIG.maxPlays}회.
                          {EXAM_CONFIG.firstSessionTarget}문항 뒤 난이도를 한 번 재조정합니다.
                        </li>
                        <li>종료 후 AI 예상 등급과 세부진단서가 나옵니다.</li>
                      </ol>
                      <p className="mt-3 text-xs text-slate-400">
                        시험 중에는 채점·첨삭·모범답안이 표시되지 않습니다. 실제 시험과 같습니다.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <StreakCard streak={progress.streak} done={progress.done.length} />
                </div>
              </div>

              <Roadmap />
            </div>

            {/* ── 탭 ─────────────────────────────────────── */}
            <div className="mb-8 flex gap-1 overflow-x-auto border-b border-slate-200">
              {([["home", "홈"], ["study", "학습"], ["mock", "모의고사"]] as [Tab, string][]).map(
                ([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
                      tab === id
                        ? "border-dku-700 text-dku-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>

            {tab === "home" && (
              <div className="space-y-6">
                {/* 내 시험 일정 */}
                <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-50/60 via-white to-dku-50 p-5">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />
                  <div className="relative">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 sm:text-xs">
                        📅 내 시험 일정
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-black ${
                          dday < 0
                            ? "bg-slate-200 text-slate-600"
                            : dday <= 7
                              ? "bg-red-500 text-white"
                              : "bg-dku-100 text-dku-700"
                        }`}
                      >
                        {profile.examDate ? dLabel : "미설정"}
                      </span>
                    </div>
                    <p className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                      {profile.examDate || "응시일을 정해 주세요"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {lv
                        ? `최근 응시 난이도 ${lv}단계 · ${totalQuestions(lv)}문항`
                        : "아직 응시 기록이 없습니다"}
                    </p>
                  </div>
                </div>

                {/* 지표 3종 */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Metric
                    label="시험까지"
                    value={profile.examDate ? dLabel : "—"}
                    sub={profile.examDate || "시험일 미정"}
                    accent="red"
                  />
                  <Metric label="목표 등급" value={profile.targetGrade} sub="초기 설정에서 선택" accent="blue" />
                  <Metric
                    label="AI 예상 등급"
                    value={result?.grade.grade ?? "—"}
                    sub={
                      result
                        ? `${comboLabel(result.initialDifficulty, result.secondDifficulty)} · ${result.takenAt.slice(0, 10)}`
                        : "모의고사 응시 전"
                    }
                    accent={result ? "green" : "gray"}
                  />
                </div>

                {/* 오늘 한 문제 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="mb-1 text-xs font-bold text-dku-700">QUICK START</p>
                      <h2 className="text-2xl font-black text-slate-900">
                        오늘 <span className="highlight-blue">한 문제</span>만이라도.
                      </h2>
                    </div>
                    <Link
                      href="/study"
                      className="shrink-0 rounded-xl bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-dku-800"
                    >
                      전체 보기 →
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600">
                    문항마다 AI가 답변을 첨삭하고 목표 등급 {profile.targetGrade}에 맞춘 모범답안을
                    만들어 줍니다. 연습 완료 {progress.done.length}문항 · 연속 {progress.streak}일.
                  </p>
                </div>

                {/* 내 출제 주제 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-xs font-bold text-slate-500">🎯 내 설문 기반 출제 주제</p>
                  {myTopics.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {myTopics.slice(0, 12).map((id) => (
                        <span
                          key={id}
                          className="rounded-md bg-dku-50 px-2 py-1 text-xs font-bold text-dku-700"
                        >
                          {TOPIC_BY_ID.get(id)?.ko ?? id}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      모의고사 시작 시 Background Survey 를 작성하면 여기에 표시됩니다.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">
                    여기에 <strong className="text-slate-700">돌발 주제</strong>가 반드시 섞여 나옵니다.
                  </p>
                </div>
              </div>
            )}

            {tab === "study" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  href="/study"
                  className="rounded-2xl border-2 border-slate-200 bg-white p-6 transition-colors hover:border-dku-700"
                >
                  <p className="mb-2 text-xs font-bold text-red-600">PRACTICE</p>
                  <h3 className="mb-2 text-2xl font-black text-slate-900">문제별 AI 연습</h3>
                  <p className="mb-4 text-sm text-slate-600">
                    주제·난이도를 골라 한 문항씩. 첨삭과 목표 등급 모범답안까지.
                  </p>
                  <span className="text-sm font-bold text-dku-700">학습 시작 →</span>
                </Link>
                <Link
                  href="/vocab"
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-dku-700"
                >
                  <p className="mb-1 text-xs font-bold text-dku-700">VOCAB</p>
                  <h3 className="mb-2 text-2xl font-black text-slate-900">내 단어장</h3>
                  <p className="mb-3 text-sm text-slate-600">
                    AI 피드백에서 모은 표현을 모아 둡니다.
                  </p>
                  <span className="text-sm font-bold text-dku-700">보러가기 →</span>
                </Link>
              </div>
            )}

            {tab === "mock" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h3 className="mb-2 text-2xl font-black text-slate-900">
                  <span className="highlight-blue">실전</span> 모의고사
                </h3>
                <p className="mb-2 text-slate-600">
                  실제 OPIc 과 같은 구성. Background Survey → 난이도 선택 → Pre-Test Setup →
                  Sample Question → 본시험 → AI 리포트.
                </p>
                <p className="mb-6 text-xs text-slate-400">
                  누적 응시 {examCount}회
                  {!fromServer && examCount > 0 && " · 이 브라우저 기록"}
                </p>
                <Link
                  href="/mock"
                  className="inline-block rounded-xl bg-dku-700 px-8 py-3.5 font-bold text-white transition-colors hover:bg-dku-800"
                >
                  모의고사 시작 →
                </Link>
                {result && (
                  <Link
                    href="/mock/result"
                    className="mt-4 block text-sm font-bold text-dku-700"
                  >
                    지난 결과지 보기 (AI 예상 등급 {result.grade.grade}) →
                  </Link>
                )}
              </div>
            )}
          </>
        );
      }}
    </AppShell>
  );
}

const ACCENT = {
  red: "text-red-600",
  blue: "text-dku-700",
  green: "text-emerald-600",
  gray: "text-slate-400",
} as const;

function Metric({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string; accent: keyof typeof ACCENT;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black tracking-tight ${ACCENT[accent]}`}>{value}</p>
      <p className="mt-1 truncate text-xs text-slate-400">{sub}</p>
    </div>
  );
}
