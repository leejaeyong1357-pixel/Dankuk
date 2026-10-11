"use client";

import { LEVEL_PROFILE, reportId } from "@/lib/actfl";
import { QUESTION_TYPE_KO } from "@/lib/exam/question-types";
import { BrandLogo } from "./BrandLogo";
import type { ExamResult } from "@/lib/types";

/** 첨부3 — 세부진단서 */
export function DiagnosticComments({ result, name }: { result: ExamResult; name: string }) {
  const p = LEVEL_PROFILE[result.grade.grade];
  const id = reportId(result.examId);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Diagnostic Comments
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">세부진단서 · {id}</p>
        </div>
        <BrandLogo />
      </div>

      <div className="px-8 py-6">
        <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {[
            ["Recipient Name", name],
            ["Test Date", result.takenAt.slice(0, 10)],
            ["Test ID", id],
            ["Rating", `${result.grade.grade} (${p.name.toUpperCase()})`],
            ["Language", "ENGLISH"],
            ["Target", result.targetGrade],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 border-b border-slate-100 py-2">
              <dt className="w-28 shrink-0 text-xs font-semibold italic text-slate-400">{k}</dt>
              <dd className="text-sm font-bold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>

        {/* 등급 서술 */}
        <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
          PROFICIENCY DESCRIPTION
        </h3>
        <p className="mt-1 text-base font-extrabold text-dku-800">
          {p.name.toUpperCase()}
          <span className="ml-2 text-xs font-bold text-slate-400">{p.nameKo}</span>
        </p>
        <div className="mt-3 space-y-3">
          {p.diagnostic.map((d, i) => (
            <div key={i}>
              <p className="text-sm leading-relaxed text-slate-700">{d}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{p.diagnosticKo[i]}</p>
            </div>
          ))}
        </div>

        {/* 이번 응시 진단 — AI 가 이 학생의 답변을 보고 쓴 부분 */}
        <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
          THIS TEST — 응시자 개별 진단
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{result.grade.summaryKo}</p>

        {(result.grade.strengths.length > 0 || result.grade.weaknesses.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {result.grade.strengths.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-extrabold text-emerald-900">유지할 점</p>
                <ul className="mt-2 space-y-1.5 text-sm text-emerald-900">
                  {result.grade.strengths.map((s, i) => (
                    <li key={i}>· Q{s.no} {s.title} — {s.why}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.grade.weaknesses.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-extrabold text-amber-900">보완할 점</p>
                <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                  {result.grade.weaknesses.map((s, i) => (
                    <li key={i}>· Q{s.no} {s.title} — {s.why}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result.grade.typePatterns.length > 0 && (
          <>
            <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
              REPEATED PATTERNS — 여러 문항에서 되풀이된 것
            </h3>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              {result.grade.typePatterns.slice(0, 3).map((t, i) => (
                <div key={i} className={`px-4 py-3 ${i % 2 ? "bg-white" : "bg-slate-50"}`}>
                  <p className="text-sm font-extrabold text-slate-900">
                    {t.title}
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {t.evidence}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{t.detail}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {result.grade.drills.length > 0 && (
          <>
            <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
              NEXT STEPS — 오늘의 맞춤 연습
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">
              {result.grade.drills.map((d, i) => (
                <li key={i}>
                  {i + 1}. <strong className="font-bold">{d.label}</strong> — {d.task}
                </li>
              ))}
            </ol>
            {result.grade.recheck && (
              <p className="mt-3 text-sm text-slate-500">재응답 후 확인: {result.grade.recheck}</p>
            )}
          </>
        )}

        <p className="mt-8 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3.5 text-[11px] leading-relaxed text-slate-500">
          등급 서술은 ACTFL 평가 준거를 근거로 자체 작성한 것이며, 개별 진단은 이번 응시 답변을
          분석해 생성했습니다. <strong>공식 OPIc 진단서가 아닙니다.</strong>
        </p>
      </div>
    </section>
  );
}
