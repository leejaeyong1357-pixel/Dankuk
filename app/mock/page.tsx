"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { buildExam, questionCount, seedFrom } from "@/lib/exam-engine";

/**
 * 모의고사 — 실전 진행(헤드셋 안내 / Ava 오리엔테이션 / 7번 후 2차 난이도 선택 /
 * 종료 후 성적표)은 다음 단계에서 구현한다.
 * 지금은 출제 엔진이 실제로 만들어내는 문제지를 확인할 수 있게 미리보기만 제공한다.
 */
export default function Mock() {
  return (
    <AppShell>
      {(profile) => {
        const seed = seedFrom(`${profile.email}:preview`);
        const exam = buildExam(profile.survey, profile.selfAssessment, seed);

        return (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">모의고사</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              내 Background Survey 응답과 자가평가 {profile.selfAssessment}단계로 만든{" "}
              {questionCount(profile.selfAssessment)}문항 세트입니다.
            </p>

            <div className="mt-5 rounded-xl bg-amber-50 px-5 py-4">
              <p className="text-sm font-bold text-amber-900">아직 준비 중입니다</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                실전 진행 화면(헤드셋 안내 → Ava 오리엔테이션 → 7번 문항 후 2차 난이도 선택 →
                성적표)은 다음 단계에서 붙입니다. 아래는 출제 엔진이 지금 실제로 만들어내는 문제지입니다.
                <br />
                먼저 <Link href="/study" className="font-bold underline">유형별 학습</Link>에서
                문항별로 연습해 보세요.
              </p>
            </div>

            <ol className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {exam.map((slot) => (
                <li key={slot.no} className="flex gap-4 px-5 py-4">
                  <span className="w-7 shrink-0 text-lg font-extrabold text-dku-700">
                    {slot.no}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                      {slot.setLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {slot.question.textEn}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{slot.question.textKo}</p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        );
      }}
    </AppShell>
  );
}
