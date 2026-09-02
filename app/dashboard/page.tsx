"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { daysUntil, loadProgress, type Progress } from "@/lib/store";
import { EXAM_CONFIG, totalQuestions } from "@/lib/exam/config";
import { comboLabel } from "@/lib/exam/question-types";
import { selectedSurveyTopics } from "@/lib/exam/survey";
import { TOPIC_BY_ID } from "@/lib/exam/topics";
import { latestResult } from "@/lib/exam/session";
import { loadHistory } from "@/lib/exam/history";
import type { ExamResult } from "@/lib/types";

export default function Dashboard() {
  const [progress, setProgress] = useState<Progress>({ done: [], streak: 0 });
  const [result, setResult] = useState<ExamResult | null>(null);
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
    setResult(latestResult());
    setExamCount(loadHistory().length);
  }, []);

  return (
    <AppShell>
      {(profile) => {
        const dday = daysUntil(profile.examDate);
        const myTopics = profile.lastSurvey ? selectedSurveyTopics(profile.lastSurvey) : [];
        const lv = profile.lastDifficulty;

        return (
          <>
            <p className="text-sm text-slate-500">
              안녕하세요, <strong className="text-slate-800">{profile.name}</strong>님
            </p>
            <h1 className="mt-1 text-4xl font-extrabold leading-tight tracking-tight text-dku-800">
              목표 등급 {profile.targetGrade}까지,
              <br />
              함께 갑니다.
            </h1>

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500">📅 내 시험 일정</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {profile.examDate || "미설정"}
                </p>
                <p className="mt-2 inline-block rounded-full bg-red-50 px-3 py-1 text-sm font-extrabold text-red-600">
                  {dday >= 0 ? `D-${dday}` : `D+${-dday}`}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  {lv
                    ? `최근 응시 난이도 ${lv}단계 · ${totalQuestions(lv)}문항`
                    : "아직 응시 기록이 없습니다"}
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500">📊 최근 모의고사</p>
                {result ? (
                  <>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-dku-800">
                      {result.grade.grade}
                      <span className="ml-2 text-sm font-bold text-slate-400">
                        {comboLabel(result.initialDifficulty, result.secondDifficulty)}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      AI 예상 등급 · {result.takenAt.slice(0, 10)}
                    </p>
                    <Link href="/mock/result" className="mt-3 inline-block text-xs font-bold text-dku-700">
                      리포트 보기 →
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-lg font-bold text-slate-400">기록 없음</p>
                    <p className="mt-2 text-xs text-slate-500">
                      실전 모의고사를 한 번 보면 취약 유형이 진단됩니다.
                    </p>
                  </>
                )}
                <p className="mt-3 text-xs text-slate-400">누적 응시 {examCount}회</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500">🎯 내 설문 기반 출제 주제</p>
                {myTopics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {myTopics.slice(0, 10).map((id) => (
                      <span key={id} className="rounded-md bg-dku-50 px-2 py-1 text-xs font-bold text-dku-700">
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
              </section>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Link
                href="/mock"
                className="rounded-2xl border-2 border-dku-200 bg-white p-6 shadow-sm transition hover:border-dku-400 hover:shadow"
              >
                <p className="text-lg font-extrabold text-slate-900">실전 모의고사 →</p>
                <p className="mt-1.5 text-sm text-slate-500">
                  Background Survey → 난이도 선택 → 마이크 테스트 → 본시험 →{" "}
                  {EXAM_CONFIG.firstSessionTarget}문항 후 난이도 재조정 → AI 리포트.
                  시험 중에는 첨삭이 표시되지 않습니다.
                </p>
              </Link>
              <Link
                href="/study"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-dku-300 hover:shadow"
              >
                <p className="text-lg font-extrabold text-slate-900">문제별 AI 연습 →</p>
                <p className="mt-1.5 text-sm text-slate-500">
                  문항마다 AI가 답변을 첨삭하고 목표 등급 {profile.targetGrade}에 맞춘 모범답안을 만들어 줍니다.
                  연습 완료 {progress.done.length}문항 · 연속 {progress.streak}일
                </p>
              </Link>
            </div>
          </>
        );
      }}
    </AppShell>
  );
}
