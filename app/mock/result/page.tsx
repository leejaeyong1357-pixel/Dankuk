"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { loadResult } from "@/lib/exam-session";
import { GRADE_DESCRIPTION, meetsTarget, validUntil } from "@/lib/grades";
import { applyChoice, difficultyLabel } from "@/lib/difficulty";
import { ALL_QUESTIONS } from "@/lib/exam-engine";
import { TOPIC_BY_ID } from "@/lib/topics";
import type { ExamResult } from "@/lib/types";

const CRITERIA = [
  { key: "function", label: "Global Tasks / Functions", ko: "기능 수행" },
  { key: "content", label: "Context / Content", ko: "화제 범위" },
  { key: "accuracy", label: "Accuracy", ko: "정확성·이해도" },
  { key: "textType", label: "Text Type", ko: "산출량·조직" },
] as const;

export default function MockResult() {
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setResult(loadResult());
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
        const scored = result.answers.filter((a) => a.no > 1);
        const avgWords = scored.length
          ? Math.round(scored.reduce((s, a) => s + a.metrics.wordCount, 0) / scored.length)
          : 0;
        const avgSec = scored.length
          ? Math.round(scored.reduce((s, a) => s + a.metrics.durationSec, 0) / scored.length)
          : 0;
        const koreanSpill = scored.filter((a) => a.metrics.koreanSpillover).length;

        return (
          <>
            {result.provider === "mock" && (
              <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
                목업 채점 결과입니다. 실제 등급 판정을 보려면 <code>ANTHROPIC_API_KEY</code> 를 설정하세요.
              </p>
            )}

            {/* 성적표 헤더 — 실제 OPIc 성적표 형식 */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-8 py-4">
                <p className="text-xs font-extrabold tracking-[0.2em] text-slate-500">
                  OPIc MOCK TEST · SCORE REPORT
                </p>
              </div>

              <div className="grid gap-8 px-8 py-8 sm:grid-cols-[200px_1fr]">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400">등급</p>
                  <p className="mt-1 text-6xl font-extrabold tracking-tight text-dku-800">
                    {grade.grade}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{desc.name}</p>
                  <p
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold ${
                      achieved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    목표 {result.targetGrade} {achieved ? "달성" : "미달"}
                  </p>
                </div>

                <div>
                  <p className="text-sm leading-relaxed text-slate-700">{desc.ko}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{grade.summaryKo}</p>

                  <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                    {[
                      ["응시자", profile.name],
                      ["응시일", result.takenAt.slice(0, 10)],
                      ["유효기간", `${validUntil(result.takenAt)} 까지`],
                      [
                        "난이도",
                        difficultyLabel(applyChoice(result.selfAssessment, result.secondChoice)),
                      ],
                      ["문항 수", `${result.answers.length}문항`],
                      [
                        "2차 선택",
                        { easier: "더 쉬운 질문", similar: "비슷한 질문", harder: "더 어려운 질문" }[
                          result.secondChoice
                        ],
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold text-slate-400">{k}</dt>
                        <dd className="font-bold text-slate-800">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </section>

            {/* 4대 준거 */}
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-extrabold text-slate-900">ACTFL 4대 준거</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {CRITERIA.map((c) => {
                  const v = grade.scores[c.key];
                  return (
                    <div key={c.key}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-slate-800">{c.ko}</span>
                        <span className="text-sm font-extrabold text-dku-700">{v} / 5</span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-dku-600"
                          style={{ width: `${(v / 5) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{c.label}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 객관 지표 요약 */}
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-extrabold text-slate-900">응시 지표</p>
              <p className="mt-0.5 text-xs text-slate-400">
                자기소개(1번)를 제외한 채점 대상 문항의 평균입니다.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["문항당 평균 발화", `${avgSec}초`],
                  ["문항당 평균 단어", `${avgWords}개`],
                  ["무응답", `${scored.filter((a) => !a.transcript.trim()).length}문항`],
                  ["한국어 이탈", `${koreanSpill}문항`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-slate-500">{k}</p>
                    <p className="mt-0.5 text-lg font-extrabold text-slate-900">{v}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 강점 / 약점 */}
            {(grade.strengths.length > 0 || grade.weaknesses.length > 0) && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {grade.strengths.length > 0 && (
                  <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                    <p className="text-sm font-extrabold text-emerald-900">잘한 점</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-emerald-900">
                      {grade.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </section>
                )}
                {grade.weaknesses.length > 0 && (
                  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <p className="text-sm font-extrabold text-amber-900">부족한 점</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-amber-900">
                      {grade.weaknesses.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {/* 취약 유형 */}
            {grade.weakTypes.length > 0 && (
              <section className="mt-4 rounded-2xl border-2 border-dku-300 bg-white p-7">
                <p className="text-sm font-extrabold text-slate-900">취약 유형 — 여기부터 연습하세요</p>
                <div className="mt-4 space-y-3">
                  {grade.weakTypes.slice(0, 3).map((w, i) => (
                    <div key={i} className="rounded-xl bg-dku-50 p-4">
                      <p className="text-sm font-extrabold text-dku-800">
                        {i + 1}. {w.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{w.reason}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/study"
                  className="mt-4 inline-block rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
                >
                  유형별 학습으로 이동 →
                </Link>
              </section>
            )}

            {/* 문항별 */}
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-extrabold text-slate-900">문항별 결과</p>
              <ul className="mt-4 divide-y divide-slate-100">
                {result.answers.map((a) => {
                  const q = ALL_QUESTIONS.find((x) => x.id === a.questionId);
                  const topicKo =
                    q?.kind === "intro" ? "자기소개" : (q ? TOPIC_BY_ID.get(q.topicId)?.ko : null);
                  const comment = grade.perQuestion.find((c) => c.no === a.no)?.comment;
                  return (
                    <li key={a.no} className="py-3.5">
                      <div className="flex items-baseline gap-3">
                        <span className="w-6 shrink-0 text-sm font-extrabold text-dku-700">
                          {a.no}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-400">
                            {topicKo ?? "—"} · {a.metrics.durationSec}초 · {a.metrics.wordCount}단어
                            {a.no === 1 && " · 채점 제외"}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {comment ?? (a.transcript.trim() ? "—" : "무응답")}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* 다음 할 일 */}
            {grade.nextSteps.length > 0 && (
              <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-sm font-extrabold text-slate-900">다음에 할 것</p>
                <ol className="mt-3 space-y-2 text-sm text-slate-700">
                  {grade.nextSteps.map((s, i) => (
                    <li key={i}>{i + 1}. {s}</li>
                  ))}
                </ol>
              </section>
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
