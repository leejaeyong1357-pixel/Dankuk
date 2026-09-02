"use client";

import type { AnswerFeedback, Grade } from "@/lib/types";
import { ProficiencyLadder } from "./ProficiencyLadder";

const CRITERIA: { key: keyof AnswerFeedback["llm"]["scores"]; label: string; desc: string }[] = [
  { key: "function", label: "Global Tasks / Functions", desc: "문항이 요구한 기능을 수행했는가" },
  { key: "content", label: "Context / Content", desc: "다룬 화제의 범위와 구체성" },
  { key: "accuracy", label: "Accuracy", desc: "문법·어휘·발음이 이해도에 미친 영향" },
  { key: "textType", label: "Text Type", desc: "산출량과 조직 (문장 / 문단 / 다문단)" },
];

export function FeedbackCard({
  data,
  transcript,
  targetGrade,
  provider,
}: {
  data: AnswerFeedback;
  transcript: string;
  targetGrade: string;
  provider?: { stt: string; llm: string };
}) {
  const { metrics, llm } = data;

  return (
    <div className="mt-5 space-y-4">
      {provider?.llm === "mock" && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          목업 모드입니다. 실제 채점을 보려면 <code>ANTHROPIC_API_KEY</code>(채점)와{" "}
          <code>STT_URL</code>(음성 인식)을 설정하세요.
        </p>
      )}

      {/* 등급 사다리 — 이번 답변의 AI 예상 등급 */}
      <ProficiencyLadder
        grade={llm.estimatedGrade}
        target={targetGrade as Grade}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-extrabold text-slate-900">이번 답변 총평</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{llm.summaryKo}</p>
      </section>

      {/* 객관 지표 — LLM 을 거치지 않고 계산된 값 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-extrabold text-slate-900">객관 지표</p>
        <p className="mt-0.5 text-xs text-slate-400">
          음성에서 직접 계산한 값입니다. AI 판단이 아니라 매번 동일하게 재현됩니다.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["발화 시간", `${metrics.durationSec}초`],
            ["단어 수", `${metrics.wordCount}개`],
            ["분당 단어", `${metrics.wpm}`],
            ["필러", `${metrics.fillerCount}회`],
            ["연결어", `${metrics.distinctConnectors.length}종`],
            ["어휘 다양성", `${(metrics.typeTokenRatio * 100).toFixed(0)}%`],
            ["2초+ 침묵", `${metrics.pauseOverTwoSec}회`],
            ["과거시제", `${metrics.pastTenseVerbCount}개`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-slate-500">{k}</p>
              <p className="mt-0.5 text-lg font-extrabold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        {metrics.koreanSpillover && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            ⚠ 한국어 발화 {metrics.koreanSpilloverSec}초가 감지되었습니다. OPIc은 한국어 사용을 감점합니다.
          </p>
        )}
        {metrics.distinctConnectors.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            사용한 연결어: {metrics.distinctConnectors.join(", ")}
          </p>
        )}
      </section>

      {/* ACTFL 4대 준거 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-extrabold text-slate-900">ACTFL 4대 준거</p>
        <div className="mt-4 space-y-3">
          {CRITERIA.map((c) => {
            const score = llm.scores[c.key];
            return (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-slate-800">{c.label}</span>
                  <span className="text-sm font-extrabold text-dku-700">{score} / 5</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-dku-600"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 목표 대비 부족한 점 */}
      {llm.gapToTarget.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-extrabold text-amber-900">
            목표 {targetGrade} 대비 부족한 점
          </p>
          <ul className="mt-3 space-y-1.5">
            {llm.gapToTarget.map((g, i) => (
              <li key={i} className="text-sm text-amber-900">
                • {g}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 내 답변 + 첨삭 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-extrabold text-slate-900">내 답변</p>
        <p className="mt-2 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          {transcript || "(발화 없음)"}
        </p>
        <p className="mt-5 text-sm font-extrabold text-slate-900">첨삭 (최소 수정)</p>
        <p className="mt-2 rounded-lg bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
          {llm.corrected}
        </p>
      </section>

      {/* 모범답안 */}
      <section className="rounded-2xl border-2 border-dku-200 bg-dku-50/60 p-6">
        <p className="text-sm font-extrabold text-dku-900">
          목표 등급 {targetGrade} 모범답안
        </p>
        <p className="mt-0.5 text-xs text-dku-700/70">
          지금 바로 소리 내어 따라 읽을 수 있는 수준으로 맞췄습니다.
        </p>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.9] text-slate-800">
          {llm.modelAnswer}
        </p>
      </section>

      {/* 핵심 표현 */}
      {llm.keyExpressions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-extrabold text-slate-900">외워 갈 표현</p>
          <ul className="mt-3 space-y-3">
            {llm.keyExpressions.map((e, i) => (
              <li key={i} className="border-l-2 border-dku-300 pl-3">
                <p className="text-sm font-bold text-slate-900">{e.en}</p>
                <p className="text-xs text-slate-600">{e.ko}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{e.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
