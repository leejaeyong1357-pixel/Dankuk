"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { daysUntil, loadProgress, type Progress } from "@/lib/store";
import { activeSurveyTopics, topicCounts } from "@/lib/exam-engine";
import { bandOfLevel, initialLabel, questionCountOf } from "@/lib/difficulty";
import { TOPIC_BY_ID } from "@/lib/topics";

export default function Dashboard() {
  const [progress, setProgress] = useState<Progress>({ done: [], streak: 0 });
  useEffect(() => setProgress(loadProgress()), []);

  return (
    <AppShell>
      {(profile) => {
        const dday = daysUntil(profile.examDate);
        const band = bandOfLevel(profile.selfAssessment);
        const myTopics = activeSurveyTopics(profile.survey);
        const all = topicCounts(band);
        const total = all.reduce((s, t) => s + t.count, 0);
        const pct = total ? Math.round((progress.done.length / total) * 100) : 0;

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
              {/* D-day */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500">📅 내 시험 일정</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {profile.examDate || "미설정"}
                </p>
                <p className="mt-2 inline-block rounded-full bg-red-50 px-3 py-1 text-sm font-extrabold text-red-600">
                  {dday >= 0 ? `D-${dday}` : `D+${-dday}`}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  시작 난이도 {initialLabel(profile.selfAssessment)} · 본시험{" "}
                  {questionCountOf(profile.selfAssessment)}문항
                </p>
              </section>

              {/* 진척도 */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500">🔥 학습 진척도</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {progress.done.length}
                  <span className="text-lg font-bold text-slate-400"> / {total}문항</span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-dku-600" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  연속 학습 <strong className="text-dku-700">{progress.streak}일</strong>
                </p>
              </section>

              {/* 출제 예상 */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500">🎯 내 설문 기반 출제 주제</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {myTopics.slice(0, 10).map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-dku-50 px-2 py-1 text-xs font-bold text-dku-700"
                    >
                      {TOPIC_BY_ID.get(id)?.ko ?? id}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  여기에 <strong className="text-slate-700">돌발 주제</strong>가 반드시 섞여 나옵니다.
                  설문에 없는 주제도 준비해야 합니다.
                </p>
              </section>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Link
                href="/study"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-dku-300 hover:shadow"
              >
                <p className="text-lg font-extrabold text-slate-900">유형별 학습 →</p>
                <p className="mt-1.5 text-sm text-slate-500">
                  문항마다 AI가 답변을 첨삭하고, 목표 등급 {profile.targetGrade}에 맞춘 모범답안을 만들어 줍니다.
                </p>
              </Link>
              <Link
                href="/mock"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-dku-300 hover:shadow"
              >
                <p className="text-lg font-extrabold text-slate-900">모의고사 →</p>
                <p className="mt-1.5 text-sm text-slate-500">
                  설문 응답으로 만든 {questionCountOf(profile.selfAssessment)}문항 실전 세트. 종료 후 성적표가 나옵니다.
                </p>
              </Link>
            </div>
          </>
        );
      }}
    </AppShell>
  );
}
