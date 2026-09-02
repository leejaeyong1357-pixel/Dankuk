"use client";

import { LEVEL_PROFILE, reportId } from "@/lib/actfl";
import { comboLabel } from "@/lib/exam/question-types";
import { DkuLogo } from "./DkuLogo";
import type { ExamResult } from "@/lib/types";

/** 공식 성적표가 아님을 명확히 하는 표시 */
function NotOfficial() {
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-amber-800">
      AI 예상 · 공식 OPIc 성적 아님
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-slate-100 py-2">
      <dt className="w-32 shrink-0 text-xs font-semibold italic text-slate-400">{label}</dt>
      <dd className="text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}

/** 첨부2 — 모의고사 결과지 */
export function ScoreReport({ result, name }: { result: ExamResult; name: string }) {
  const p = LEVEL_PROFILE[result.grade.grade];
  const id = reportId(result.examId);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Score Report</h2>
          <p className="mt-0.5 text-xs text-slate-400">리포트 번호 : {id}</p>
        </div>
        <div className="flex items-center gap-3">
          <NotOfficial />
          <DkuLogo />
        </div>
      </div>

      <div className="px-8 py-6">
        <dl>
          <Field label="Recipient Name" value={name} />
          <Field label="Test Date" value={result.takenAt.slice(0, 10)} />
          <Field label="Test ID" value={id} />
          <Field
            label="Rating"
            value={`${result.grade.grade} (${p.name.toUpperCase()})`}
          />
          <Field label="Language" value="ENGLISH" />
          <Field
            label="Difficulty"
            value={`${comboLabel(result.initialDifficulty, result.secondDifficulty)} · ${result.answers.length}문항`}
          />
        </dl>

        {/* Functional Highlights */}
        <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
          {p.band.toUpperCase()} LEVEL SPEAKERS — FUNCTIONAL HIGHLIGHTS
        </h3>
        <p className="mt-1 text-xs text-slate-400">이 등급 화자가 할 수 있는 것</p>
        <ul className="mt-3 space-y-2">
          {p.highlights.map((h, i) => (
            <li key={i} className="text-sm leading-relaxed text-slate-700">
              <span className="mr-1.5 text-slate-400">·</span>
              {h}
              <span className="mt-0.5 block pl-3 text-xs text-slate-500">{p.highlightsKo[i]}</span>
            </li>
          ))}
        </ul>

        {/* 4축 표 */}
        <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
          {p.name.toUpperCase()} — SPEAKERS
        </h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          {([
            ["Communication Tasks", p.rubric.communicationTasks, p.rubricKo.communicationTasks],
            ["Contexts/Content", p.rubric.contextsContent, p.rubricKo.contextsContent],
            ["Discourse Type", p.rubric.discourseType, p.rubricKo.discourseType],
            ["Accuracy", p.rubric.accuracy, p.rubricKo.accuracy],
          ] as const).map(([label, en, ko], i) => (
            <div
              key={label}
              className={`grid gap-4 px-4 py-3 sm:grid-cols-[150px_1fr] ${
                i % 2 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <div className="text-xs font-extrabold text-slate-600">{label}</div>
              <div>
                <p className="text-sm leading-relaxed text-slate-700">{en}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{ko}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <h3 className="mt-8 text-sm font-extrabold tracking-wide text-slate-900">
          TIPS FOR IMPROVING PROFICIENCY
        </h3>
        <ul className="mt-3 space-y-2.5">
          {p.tips.map((t, i) => (
            <li key={i} className="text-sm leading-relaxed text-slate-700">
              <span className="mr-1.5 font-extrabold text-dku-700">·</span>
              <strong className="font-bold">{t}</strong>
              <span className="mt-0.5 block pl-3 text-xs text-slate-500">{p.tipsKo[i]}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 rounded-lg bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-500">
          이 리포트는 단국대 OPIc 트레이너가 생성한 <strong>AI 예상 등급</strong>입니다.
          ACTFL 이 정한 평가 준거를 근거로 하되 공식 채점자가 판정한 것이 아니며,
          실제 OPIc 성적을 대체하거나 보증하지 않습니다.
        </p>
      </div>
    </section>
  );
}
