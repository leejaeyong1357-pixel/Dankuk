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
import type { ExamGrade, ExamResult } from "@/lib/types";

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
              {/* ── 머리줄 ─────────────────────── */}
              <div className="flex items-center justify-between gap-4">
                <BrandLogo />
                <span className="text-[13px] text-slate-500">
                  AI 학습용 분석 · 공식 OPIc 성적 아님
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
                <div className="min-w-0">
                  <h2 className="hero-headline text-[32px] leading-tight text-slate-900">
                    OPIc 모의고사 분석 리포트
                  </h2>
                  <p className="mt-1.5 text-[15px] text-slate-500">
                    {profile.name} · {result.answers.length}문항 · {result.takenAt.slice(0, 10)}
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-white px-6 py-4">
                  <div className="flex items-end gap-5">
                    <span className="text-center">
                      <span className="block text-[12px] text-slate-400">AI 예상</span>
                      <span className="block text-[32px] font-extrabold leading-tight text-slate-900">
                        {grade.grade}
                      </span>
                    </span>
                    <span className="pb-2 text-[20px] text-slate-300" aria-hidden>→</span>
                    <span className="text-center">
                      <span className="block text-[12px] text-slate-400">목표</span>
                      <span className="block text-[32px] font-extrabold leading-tight text-dku-600">
                        {result.targetGrade}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-center text-[12px] text-slate-400">
                    {achieved ? "목표 수준에 닿았습니다" : "지금은 출발점, 다음 목표까지 함께"}
                  </p>
                </div>
              </div>

              {/* ── 핵심 한 줄 ─────────────────── */}
              <div className="mt-5 rounded-2xl bg-[#0d2f6b] px-6 py-6 sm:px-8">
                <p className="flex items-center gap-2.5 text-[14px] font-bold text-dku-200">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15" aria-hidden>
                    💡
                  </span>
                  이번 시험에서 확인한 핵심
                </p>
                <p className="mt-3 break-keep text-[23px] font-bold leading-snug text-white">
                  <Focus text={grade.headline} mark={grade.headlineFocus} />
                </p>
              </div>

              <div className="mt-4">
                {/* ── 1·2 잘한 점 / 부족한 점 ──── */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <PointList
                    tone="good"
                    title="잘한 점 · 계속 살릴 강점"
                    items={grade.strengths}
                  />
                  <PointList
                    tone="bad"
                    title="부족한 점 · 우선 보완할 부분"
                    items={grade.weaknesses}
                    note="질문이 요구한 것과 실제 답변의 차이입니다."
                  />
                </div>

                {/* ── 4 문항별 분석 ─────────────── */}
                <Card icon={<IconDoc />} title="문항마다 무엇을 바꾸면 좋을까요?">
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[780px] border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[13px] font-bold text-slate-500">
                          <th className="w-[152px] rounded-l-lg px-4 py-3">문항 · 유형</th>
                          <th className="px-4 py-3">질문이 요구한 것</th>
                          <th className="px-4 py-3">실제 발화</th>
                          <th className="px-4 py-3">구체적인 보완</th>
                          <th className="rounded-r-lg px-4 py-3">다시 말할 때 확인</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.answers.map((a) => {
                          const c = grade.perQuestion.find((q) => q.no === a.no);
                          const typeKo =
                            QUESTION_TYPE_KO[a.questionType as keyof typeof QUESTION_TYPE_KO] ??
                            a.questionType;
                          return (
                            <tr key={a.no} className="border-t border-slate-200 align-top">
                              <td className="px-4 py-3.5">
                                <span className="flex items-center gap-2">
                                  <span className="rounded-md bg-dku-100/80 px-1.5 py-0.5 text-[12px] font-bold text-dku-700">
                                    Q{a.no}
                                  </span>
                                  <span className="whitespace-nowrap text-[14px] font-bold text-slate-900">{typeKo}</span>
                                </span>
                                {a.isWarmup && (
                                  <span className="mt-1 block text-[11px] text-slate-400">워밍업</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-[14px] leading-relaxed text-slate-600">
                                {c?.asked ?? "—"}
                              </td>
                              <td className="px-4 py-3.5 text-[14px] leading-relaxed text-slate-600">
                                {c?.said ?? (a.transcript.trim() ? "—" : "무응답")}
                              </td>
                              <td className="bg-[#fdfaf3] px-4 py-3.5 text-[14px] leading-relaxed text-slate-800">
                                {c?.fix ?? "—"}
                              </td>
                              <td className="px-4 py-3.5 text-[14px] leading-relaxed text-slate-600">
                                {c?.check ?? "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* ── 5 유형별로 되풀이된 것 ────── */}
                {grade.typePatterns.length > 0 && (
                  <Card
                    icon={<IconBook />}
                    title="여러 문항에서 되풀이된 것"
                    hint="한 문항이 아니라 시험 전체에서 보인 경향입니다."
                  >
                    <ul className="mt-4 grid gap-4 lg:grid-cols-3">
                      {grade.typePatterns.slice(0, 3).map((t, i) => (
                        <li key={i} className="rounded-xl border border-slate-200 px-5 py-4">
                          <p className="flex items-start gap-2.5">
                            <StepNo no={i + 1} />
                            <span className="text-[16px] font-bold text-slate-900">{t.title}</span>
                          </p>
                          <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{t.detail}</p>
                          <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] font-bold text-dku-600">
                            근거 {t.evidence}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* ── 6 목표 등급까지 ───────────── */}
                {grade.targetShifts.length > 0 && (
                  <Card
                    icon={<IconTarget />}
                    title={`목표 ${result.targetGrade}를 위해 달라져야 할 말하기`}
                    hint="문장 수보다, 연결된 내용을 여러 과제에서 얼마나 유지하는지 봅니다."
                  >
                    <ul className="mt-4 grid gap-4 lg:grid-cols-3">
                      {grade.targetShifts.slice(0, 3).map((t, i) => (
                        <li key={i} className="rounded-xl bg-[#f4f8fe] px-5 py-4">
                          <p className="text-[16px] font-bold text-slate-900">{t.title}</p>
                          <p className="mt-1 text-[13px] font-bold text-dku-600">{t.shift}</p>
                          <p className="mt-3 border-t border-dku-100 pt-3 text-[14px] leading-relaxed text-slate-600">
                            {t.detail}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-right text-[12px] text-slate-400">
                      이는 연습 방향이며, 등급은 여러 과제에서 나타나는 전체 수행으로 판단합니다.
                    </p>
                  </Card>
                )}

                {/* ── 3·7 바꿔 말하기 / 맞춤 연습 ─ */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {grade.rewrite.example && (
                    <Card icon={<IconChat />} title="이렇게 바꿔 말해보세요">
                      <p className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-dku-100/80 px-1.5 py-0.5 text-[12px] font-bold text-dku-700">
                          Q{grade.rewrite.no}
                        </span>
                        <span className="text-[14px] font-bold text-slate-700">
                          {grade.rewrite.pattern}
                        </span>
                      </p>
                      <p className="mt-3 rounded-xl bg-[#eaf1fc] px-5 py-4 text-[16px] font-bold leading-relaxed text-dku-900">
                        {grade.rewrite.example}
                      </p>
                      <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                        {grade.rewrite.note}
                      </p>
                      {grade.rewrite.added && (
                        <p className="mt-2 text-[12px] leading-relaxed text-amber-700">
                          ※ 설명을 위해 넣은 예시입니다 — {grade.rewrite.added}. 실제 내 상황에 맞게 바꿔 연습하세요.
                        </p>
                      )}
                    </Card>
                  )}

                  {grade.drills.length > 0 && (
                    <Card icon={<IconPen />} title="오늘의 맞춤 연습">
                      <ol className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                        {grade.drills.slice(0, 3).map((d, i) => (
                          <li
                            key={i}
                            className={`grid grid-cols-[auto_minmax(72px,22%)_1fr] items-start gap-3 px-4 py-3.5 ${
                              i > 0 ? "border-t border-slate-200" : ""
                            }`}
                          >
                            <StepNo no={i + 1} />
                            <span className="text-[14px] font-bold text-slate-900">{d.label}</span>
                            <span className="text-[14px] leading-relaxed text-slate-600">{d.task}</span>
                          </li>
                        ))}
                      </ol>
                      {grade.recheck && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#f4f8fe] px-4 py-3 text-[13px] leading-relaxed text-slate-600">
                          <span className="text-dku-500">◎</span>
                          재응답 후 확인: {grade.recheck}
                        </p>
                      )}
                      <Link
                        href="/study"
                        className="mt-4 inline-block rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
                      >
                        맞춤 연습 시작 →
                      </Link>
                    </Card>
                  )}
                </div>

                {/* ── 준거 점수 ─────────────────── */}
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
                  <GradeRow grade={grade.grade} target={result.targetGrade} />
                </Card>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-slate-400">
                AI 학습용 분석 · 공식 OPIc 성적이 아닙니다 · 출제되지 않은 유형과 자료가 부족한
                항목은 평가하지 않습니다
              </p>
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

/**
 * 핵심 한 줄에서 가장 중요한 구절만 색을 입힌다.
 *
 * 한 줄을 통째로 흰 글씨로 두면 어디가 핵심인지 읽는 사람이 다시 찾아야 한다.
 * 채점이 지목한 구절을 그대로 받아 칠한다 — 못 찾으면 그냥 둔다.
 */
function Focus({ text, mark }: { text: string; mark: string }) {
  const at = mark ? text.indexOf(mark) : -1;
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-dku-300">{text.slice(at, at + mark.length)}</span>
      {text.slice(at + mark.length)}
    </>
  );
}

/**
 * 잘한 점 / 부족한 점 목록.
 *
 * 둘 다 근거 문항 번호를 달고 나온다. 번호가 없으면 학습자는
 * "내가 언제 그랬지" 하고 되짚을 수 없다.
 */
function PointList({
  tone,
  title,
  items,
  note,
}: {
  tone: "good" | "bad";
  title: string;
  items: ExamGrade["strengths"];
  note?: string;
}) {
  const good = tone === "good";
  return (
    <section
      className={`rounded-2xl px-5 py-5 sm:px-6 ${good ? "bg-[#eef4fd]" : "bg-[#f4f6fa]"}`}
    >
      <p className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-white ${
            good ? "bg-dku-600" : "bg-slate-500"
          }`}
          aria-hidden
        >
          {good ? "👍" : "📊"}
        </span>
        <span className="text-[18px] font-bold text-slate-900">{title}</span>
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-[14px] leading-relaxed text-slate-500">
          근거가 될 발화가 충분하지 않아 이 항목은 판정하지 않았습니다.
        </p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {items.map((p, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 ${i > 0 ? "border-t border-white/70 pt-3.5" : ""}`}
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-white px-2 py-1 text-[12px] font-bold text-dku-700">
                Q{p.no}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-slate-900">{p.title}</span>
                <span className="mt-1 block text-[14px] leading-relaxed text-slate-600">
                  {p.why}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {note && <p className="mt-4 text-right text-[12px] text-slate-400">{note}</p>}
    </section>
  );
}
