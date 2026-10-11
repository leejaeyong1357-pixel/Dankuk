"use client";

import { BrandLogo } from "@/components/BrandLogo";
import {
  Card,
  IconBook,
  IconChat,
  IconDoc,
  IconPen,
  IconTarget,
  LabelTable,
  ReportFrame,
  StepNo,
} from "@/components/report/Parts";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { latestResult } from "@/lib/exam/session";
import { GRADE_DESCRIPTION, meetsTarget } from "@/lib/grades";
import { QUESTION_TYPE_KO, comboLabel } from "@/lib/exam/question-types";
import { ScoreReport } from "@/components/ScoreReport";
import { DiagnosticComments } from "@/components/DiagnosticComments";
import { ProficiencyLadder } from "@/components/ProficiencyLadder";
import type { ExamResult } from "@/lib/types";

const CRITERIA = [
  { key: "function", label: "Global Tasks / Functions", ko: "기능 수행" },
  { key: "content", label: "Context / Content", ko: "화제 범위" },
  { key: "accuracy", label: "Accuracy", ko: "정확성·이해도" },
  { key: "textType", label: "Text Type", ko: "산출량·조직" },
] as const;

const SELECTION_KO = { EASIER: "더 쉬운 질문", SIMILAR: "비슷한 질문", HARDER: "더 어려운 질문" };

type Tab = "summary" | "score" | "diagnostic";

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: "summary", label: "요약", hint: "지표와 문항별 결과" },
  { key: "score", label: "Score Report", hint: "결과지" },
  { key: "diagnostic", label: "세부진단서", hint: "등급 서술과 개별 진단" },
];

export default function MockResult() {
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("summary");

  useEffect(() => {
    setResult(latestResult());
    setLoaded(true);
  }, []);

  return (
    <AppShell>
      {(profile) => {
        if (!loaded) return <p className="text-sm text-slate-400">불러오는 중…</p>;
        if (!result) {
          return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-400">아직 응시 기록이 없습니다.</p>
              <Link href="/mock" className="mt-3 inline-block text-sm font-bold text-dku-700">
                모의고사 응시하러 가기 →
              </Link>
            </div>
          );
        }

        const { grade } = result;
        const desc = GRADE_DESCRIPTION[grade.grade];
        const achieved = meetsTarget(grade.grade, result.targetGrade);
        const scored = result.answers.filter((a) => !a.isWarmup);
        const avg = (f: (a: typeof scored[number]) => number) =>
          scored.length ? Math.round(scored.reduce((s, a) => s + f(a), 0) / scored.length) : 0;

        return (
          <>
            {/*
              AI 채점이 돌지 않은 결과는 반드시 그렇다고 말한다. 등급만 보고
              실제 실력으로 오해하면 연습 방향이 어긋난다.

              "mock" 은 서버 채점기 이름이다. 브라우저에서 채점하는 정적 배포는
              "metrics"(키 없음) 나 "failed"(불렀으나 실패) 를 내보내므로,
              그 둘을 빠뜨리면 경고가 한 번도 뜨지 않는다.
            */}
            {["mock", "metrics", "failed"].includes(result.provider ?? "") && (
              <p className="mb-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
                {result.provider === "failed" ? (
                  <>
                    AI 채점을 불렀지만 받지 못해, 지표만으로 낸 결과입니다.
                    {result.providerNote && (
                      <>
                        {" "}
                        <strong className="font-extrabold">{result.providerNote}</strong>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    AI 채점 키가 이 빌드에 들어 있지 않아, 지표만으로 낸 결과입니다.
                    배포 환경변수에 <code className="mx-0.5">NEXT_PUBLIC_ANTHROPIC_API_KEY</code> 를 넣고
                    다시 배포하면 상세 평가가 적용됩니다. 키는 빌드할 때 박히므로, 미리보기
                    주소로 보고 있다면 Preview 환경에도 같은 값이 있어야 합니다.
                  </>
                )}
              </p>
            )}

            <div className="mb-5 flex gap-1 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    tab === t.key
                      ? "border-dku-600 text-dku-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "score" && <ScoreReport result={result} name={profile.name} />}
            {tab === "diagnostic" && <DiagnosticComments result={result} name={profile.name} />}

            {tab === "summary" && (
            <ReportFrame>
              {/* ── 리포트 머리줄 ───────────────── */}
              <div className="flex items-center justify-between gap-4">
                <BrandLogo />
                <span className="text-[13px] font-bold text-slate-500">모의고사 채점표</span>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="hero-headline text-[30px] leading-tight text-slate-900">
                    모의고사 결과 분석
                  </h2>
                  <p className="mt-1.5 text-[15px] text-slate-500">
                    {result.takenAt.slice(0, 10)} 응시 · {result.answers.length}문항
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-slate-500">
                  AI 예상 · 공식 OPIc 성적 아님
                </span>
              </div>

              <div className="mt-5">
                {/* ── 01 시험 진단 ─────────────── */}
                <Card icon={<IconDoc />} title="시험 진단">
                  <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_minmax(260px,34%)]">
                    <div className="min-w-0">
                      <p className="break-keep text-[19px] font-bold leading-snug text-slate-900">
                        {grade.summaryKo}
                      </p>
                      <p className="mt-2 break-keep text-[15px] leading-relaxed text-slate-500">
                        {desc.ko}
                      </p>
                      <LabelTable
                        rows={[
                          ["응시자", profile.name],
                          ["난이도", `${comboLabel(result.initialDifficulty, result.secondDifficulty)} · ${SELECTION_KO[result.difficultySelection]}`],
                          ["소요 시간", `${Math.floor(result.elapsedSec / 60)}분 ${result.elapsedSec % 60}초`],
                        ]}
                      />
                    </div>

                    <div className="rounded-xl bg-[#eaf1fc] px-5 py-5">
                      <p className="text-[13px] text-slate-500">AI 예상 등급</p>
                      <p className="mt-2 flex flex-wrap items-baseline gap-2.5">
                        <span className="text-[42px] font-extrabold leading-none text-slate-900">
                          {grade.grade}
                        </span>
                        <span className="text-[15px] font-bold text-slate-700">{desc.name}</span>
                      </p>
                      <p
                        className={`mt-3 inline-block rounded-md px-2.5 py-1 text-[12px] font-bold ${
                          achieved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        목표 {result.targetGrade} {achieved ? "달성" : "미달"}
                      </p>
                      <p className="mt-4 border-t border-slate-300/60 pt-3.5 text-[13px] text-slate-500">
                        문항당 평균 {avg((a) => a.metrics.durationSec)}초 · {avg((a) => a.metrics.wordCount)}단어
                      </p>
                    </div>
                  </div>

                  <GradeRow grade={grade.grade} target={result.targetGrade} />

                  <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                    AI 가 예상한 등급이며 공식 OPIc 성적이 아닙니다.
                    <br />
                    자기소개(워밍업)를 제외한 채점 대상 문항으로 산출했습니다.
                  </p>
                </Card>

                {/* ── 02 ACTFL 4대 준거 ────────── */}
                <Card icon={<IconTarget />} title="ACTFL 4대 준거" hint="네 축을 따로 봅니다">
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {CRITERIA.map((c) => {
                      const v = grade.scores[c.key];
                      return (
                        <div key={c.key}>
                          <div className="flex items-baseline justify-between">
                            <span className="text-[15px] font-bold text-slate-800">{c.ko}</span>
                            <span className="text-[15px] font-extrabold tabular-nums text-dku-700">
                              {v} / 5
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-dku-600"
                              style={{ width: `${(v / 5) * 100}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-[12px] text-slate-400">{c.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* ── 03 잘한 점 · 보완할 점 ────── */}
                {(grade.strengths.length > 0 || grade.weaknesses.length > 0) && (
                  <Card icon={<IconPen />} title="잘한 점과 보완할 점">
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <p className="bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-800">
                          잘한 점
                        </p>
                        <ul className="space-y-2 px-4 py-4 text-[15px] leading-relaxed text-slate-700">
                          {grade.strengths.map((s, i) => <li key={i}>· {s}</li>)}
                          {grade.strengths.length === 0 && <li className="text-slate-400">—</li>}
                        </ul>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <p className="bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800">
                          보완할 점
                        </p>
                        <ul className="space-y-2 px-4 py-4 text-[15px] leading-relaxed text-slate-700">
                          {grade.weaknesses.map((s, i) => <li key={i}>· {s}</li>)}
                          {grade.weaknesses.length === 0 && <li className="text-slate-400">—</li>}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}

                {/* ── 04 여기부터 연습 ─────────── */}
                {grade.weakTypes.length > 0 && (
                  <Card
                    icon={<IconBook />}
                    title="여기부터 연습하세요"
                    hint="이번 시험에서 가장 약했던 유형입니다."
                  >
                    <ul className="mt-4 grid gap-4 lg:grid-cols-3">
                      {grade.weakTypes.slice(0, 3).map((w, i) => (
                        <li key={i} className="rounded-xl border border-slate-200 px-5 py-4">
                          <p className="flex items-start gap-2.5">
                            <StepNo no={i + 1} />
                            <span className="min-w-0">
                              <span className="block text-[16px] font-extrabold text-slate-900">
                                {w.label}
                              </span>
                              <span className="mt-0.5 block text-[12px] text-slate-400">
                                {w.questionType}
                              </span>
                            </span>
                          </p>
                          <p className="mt-3.5 border-t border-slate-100 pt-3.5 text-[15px] leading-relaxed text-slate-700">
                            {w.reason}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/study"
                      className="mt-4 inline-block rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
                    >
                      유형별 AI 연습으로 이동 →
                    </Link>
                  </Card>
                )}

                {/* ── 05 문항별 결과 ───────────── */}
                <Card icon={<IconChat />} title="문항별 결과" aside="워밍업은 등급 산출에서 제외됩니다.">
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(180px,30%)_1fr]">
                      <p className="bg-slate-50 px-4 py-3 text-[13px] font-bold text-slate-500">문항</p>
                      <p className="hidden bg-[#eaf1fc] px-4 py-3 text-[13px] font-bold text-dku-700 sm:block">
                        코멘트
                      </p>
                    </div>
                    <ul>
                      {result.answers.map((a) => {
                        const comment = grade.perQuestion.find((c) => c.no === a.no)?.comment;
                        return (
                          <li
                            key={a.no}
                            className="grid grid-cols-1 border-t border-slate-200 sm:grid-cols-[minmax(180px,30%)_1fr]"
                          >
                            <div className="bg-slate-50/60 px-4 py-4">
                              <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                                <span className="tabular-nums text-dku-700">{a.no}</span>
                                {QUESTION_TYPE_KO[a.questionType as keyof typeof QUESTION_TYPE_KO] ?? a.questionType}
                              </p>
                              <p className="mt-1 text-[12px] text-slate-400">
                                {a.metrics.durationSec}초 · {a.metrics.wordCount}단어
                                {a.isWarmup && " · 워밍업"}
                              </p>
                            </div>
                            <div className="border-t border-slate-200 px-4 py-4 text-[15px] leading-relaxed text-slate-700 sm:border-l sm:border-t-0">
                              {comment ?? (a.transcript.trim() ? "—" : "무응답")}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Card>

                {/* ── 06 다음에 할 것 ──────────── */}
                {grade.nextSteps.length > 0 && (
                  <Card icon={<IconTarget />} title="다음에 할 것" hint="순서대로 하나씩">
                    <ol className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      {grade.nextSteps.map((s, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-3 px-4 py-4 text-[15px] leading-relaxed text-slate-800 ${
                            i > 0 ? "border-t border-slate-200" : ""
                          }`}
                        >
                          <StepNo no={i + 1} />
                          {s}
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-white px-5 py-5 sm:px-7">
                <ProficiencyLadder grade={grade.grade} target={result.targetGrade} />
              </div>
            </ReportFrame>
            )}

            <div className="mt-6 flex gap-3">
              <Link
                href="/mock"
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white"
              >
                다시 응시하기
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
              >
                대시보드로 →
              </Link>
            </div>
          </>
        );
      }}
    </AppShell>
  );
}

/**
 * 아홉 등급 가로줄.
 *
 * 받은 등급 칸을 꽉 채우고 목표 칸은 테두리만 둔다.
 * 연습 결과지와 같은 모양이어야 두 화면이 같은 리포트로 읽힌다.
 */
const ALL_GRADES = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"] as const;

function GradeRow({ grade, target }: { grade: string; target: string }) {
  return (
    <ol className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
      {ALL_GRADES.map((g) => {
        const got = g === grade;
        const isTarget = g === target;
        return (
          <li key={g} className="min-w-0 flex-1">
            <div
              className={`rounded-lg border-2 py-3.5 text-center text-sm font-bold ${
                got
                  ? "border-dku-600 bg-dku-600 text-white"
                  : isTarget
                    ? "border-dku-700 bg-white text-dku-800"
                    : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              {g}
            </div>
            <p className="mt-1.5 h-4 text-center text-[11px] font-bold">
              {got && <span className="text-dku-600">이번 시험</span>}
              {!got && isTarget && <span className="text-slate-500">목표</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
