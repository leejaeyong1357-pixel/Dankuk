"use client";

import { useState } from "react";
import { SpeakingLevelMap } from "./SpeakingLevelMap";
import { Improvements } from "./Improvements";
import type { AnswerFeedback, Grade } from "@/lib/types";

/**
 * AI 채점 결과.
 *
 * 답변 하나로 등급을 확정하지 않는다. 이번 답변에서 "확인된 것"과
 * "확인되지 않은 것"을 나눠 보여 주고, 다음에 무엇을 할지로 끝낸다.
 * 첨삭·모범답안처럼 길게 읽어야 하는 것은 상세 분석 안으로 접어 둔다.
 */
const CRITERIA_KO: Record<string, { label: string; desc: string }> = {
  F: { label: "과업 수행 · F", desc: "문항이 요구한 기능을 실제로 했는가" },
  C: { label: "내용·맥락 · C", desc: "다룬 화제의 범위와 구체성" },
  A: { label: "전달력 · A", desc: "문법·어휘·발음이 이해에 미친 영향" },
  T: { label: "발화 구조 · T", desc: "산출량과 조직 (문장 / 문단)" },
};

/** 진단 라벨에 맞는 색 — 단정적인 판정만 초록으로 둔다 */
function verdictTone(v: string): string {
  if (/충족|완료|양호|좋음/.test(v)) return "bg-emerald-50 text-emerald-700";
  if (/보완|미흡|부족|미확인/.test(v)) return "bg-amber-50 text-amber-700";
  if (/확인 필요|판정 안 함/.test(v)) return "bg-slate-100 text-slate-500";
  return "bg-dku-50 text-dku-700";
}

export function FeedbackCard({
  data,
  transcript,
  targetGrade,
  provider,
  onRetry,
}: {
  data: AnswerFeedback;
  transcript: string;
  targetGrade: string;
  provider?: { stt: string; llm: string };
  /** 이 질문을 다시 말하기 */
  onRetry?: () => void;
}) {
  const { metrics, llm } = data;
  const [detail, setDetail] = useState(false);
  const aiOff = provider?.llm === "metrics";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold text-slate-900">AI 채점 결과</h2>
        <span className="rounded-md bg-dku-50 px-2.5 py-1 text-xs font-bold text-dku-700">
          이번 답변
        </span>
        <button
          type="button"
          onClick={() => setDetail((v) => !v)}
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          상세 분석 <span aria-hidden>{detail ? "⌃" : "⌄"}</span>
        </button>
      </header>

      {aiOff && (
        <p className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          AI 채점이 꺼져 있거나 응답하지 않아 지표 기반 결과만 표시합니다.
        </p>
      )}

      {/* ── 수준 지도 + 이번 답변에서 확인한 수준 ───────────── */}
      <div className="mt-5 grid gap-6 rounded-2xl bg-slate-50/70 p-5 lg:grid-cols-[260px_1fr] sm:p-6">
        <SpeakingLevelMap target={targetGrade as Grade} />

        <div className="min-w-0">
          <p className="text-sm text-slate-500">이번 답변에서 확인한 수준</p>
          <p className="mt-1.5 text-2xl font-black text-slate-900">{llm.levelLabel}</p>
          <p className="mt-3 leading-relaxed text-slate-600">{llm.levelNote}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                📄 문항 수행
              </p>
              <p
                className={`mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${
                  llm.taskDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                <span aria-hidden>{llm.taskDone ? "✓" : "!"}</span>
                {llm.taskStatus}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                📊 종합 예상 등급
              </p>
              <p className="mt-2.5 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-500">
                <span aria-hidden>?</span>
                추가 진단 필요
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            입력된 텍스트 기준 · 음성 및 여러 답변으로 종합 추정
          </p>
        </div>
      </div>

      {/* ── 4가지 채점 기준 ─────────────────────────────────── */}
      <div className="mt-7">
        <h3 className="text-lg font-extrabold text-slate-900">4가지 채점 기준</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">기준</th>
                <th className="px-4 py-3">이번 답변 진단</th>
                <th className="px-4 py-3">근거</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {llm.criteria.map((c) => (
                <tr key={c.key}>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900">
                      {CRITERIA_KO[c.key]?.label ?? c.key}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${verdictTone(c.verdict)}`}>
                      {c.verdict}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">각 항목을 단순 합산해 등급을 만들지 않습니다.</p>
      </div>

      {/* ── 이번에 고칠 한 가지 / 다음 답변은 이렇게 ─────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-500">💡 이번에 고칠 한 가지</p>
          <p className="mt-1.5 text-lg font-extrabold text-slate-900">{llm.oneFix.title}</p>

          {llm.oneFix.quote && (
            <>
              <p className="mt-4 text-xs font-bold text-slate-400">현재 답변의 예시</p>
              <p className="mt-1.5 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                “{llm.oneFix.quote}”
              </p>
            </>
          )}
          <p className="mt-2.5 text-sm leading-relaxed text-slate-700">{llm.oneFix.advice}</p>

          {llm.oneFix.unclearQuote && (
            <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3">
              <p className="text-sm text-slate-600">“{llm.oneFix.unclearQuote}”</p>
              <p className="mt-1.5 text-xs text-slate-500">
                뜻을 확정하기 어려워 자동 교정하지 않았습니다.
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  녹음 확인 · 인식 내용 수정
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-500">🎯 다음 답변은 이렇게</p>
          <ol className="mt-3 space-y-2">
            {llm.nextFrames.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dku-600 text-[11px] font-black text-white">
                  {i + 1}
                </span>
                <span className="shrink-0 text-sm font-bold text-slate-700">{f.label}</span>
                <span className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {f.frame}
                </span>
              </li>
            ))}
          </ol>
          {llm.nextFrames.length > 0 ? (
            <p className="mt-3 text-xs text-slate-400">실제 내 이야기에 맞게 채워 말해 보세요.</p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              문장 틀은 AI 채점이 켜져 있을 때 이번 답변에 맞춰 만들어집니다.
            </p>
          )}
        </div>
      </div>

      {/* ── 상세 분석 ───────────────────────────────────────── */}
      {detail && <Detail data={data} transcript={transcript} targetGrade={targetGrade} metrics={metrics} />}

      {/* ── 마무리 ──────────────────────────────────────────── */}
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <span aria-hidden>🔄</span>
          다시 말한 후, 내용과 구조의 변화를 비교해요.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto rounded-xl bg-dku-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-dku-700"
          >
            🎤 이 질문 다시 말하기
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        AI 학습용 진단 · 공식 OPIc 성적이 아닙니다.
      </p>
    </section>
  );
}

/** 접혀 있는 상세 분석 — 첨삭, 표현 교체, 모범답안, 지표 */
function Detail({
  data, transcript, targetGrade, metrics,
}: {
  data: AnswerFeedback;
  transcript: string;
  targetGrade: string;
  metrics: AnswerFeedback["metrics"];
}) {
  const { llm } = data;
  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <p className="text-sm font-extrabold text-slate-900">내 답변</p>
      <p className="mt-2 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
        {transcript || "(발화 없음)"}
      </p>

      <p className="mt-5 text-sm font-extrabold text-slate-900">첨삭 (최소 수정)</p>
      <p className="mt-2 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3.5 text-sm leading-relaxed text-emerald-900">
        {llm.corrected}
      </p>

      <Improvements items={llm.improvements} />

      <p className="mt-6 text-sm font-extrabold text-slate-900">
        목표 등급 {targetGrade} 모범답안
      </p>
      <p className="mt-2 rounded-lg border-l-4 border-dku-500 bg-dku-50 px-4 py-3.5 text-sm leading-relaxed text-slate-800">
        {llm.modelAnswer}
      </p>

      {llm.keyExpressions.length > 0 && (
        <>
          <p className="mt-6 text-sm font-extrabold text-slate-900">바로 써먹을 표현</p>
          <ul className="mt-2 space-y-2">
            {llm.keyExpressions.map((k) => (
              <li key={k.en} className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">{k.en}</p>
                <p className="mt-0.5 text-sm text-slate-600">{k.ko}</p>
                <p className="mt-1 text-xs text-slate-400">{k.why}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-sm font-extrabold text-slate-900">이번 답변 지표</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["발화 시간", `${metrics.durationSec}초`],
          ["단어 수", `${metrics.wordCount}개`],
          ["연결어", `${metrics.distinctConnectors.length}종`],
          ["2초 이상 침묵", `${metrics.pauseOverTwoSec}회`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">{k}</p>
            <p className="mt-0.5 font-bold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      {llm.gapToTarget.length > 0 && (
        <>
          <p className="mt-6 text-sm font-extrabold text-slate-900">
            목표 {targetGrade} 대비 부족한 점
          </p>
          <ul className="mt-2 space-y-1.5">
            {llm.gapToTarget.map((g, i) => (
              <li key={i} className="text-sm text-slate-600">• {g}</li>
            ))}
          </ul>
        </>
      )}

      {llm.tipKo && (
        <div className="mt-6 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-5 py-4">
          <p className="text-sm font-extrabold text-indigo-700">💡 TIP!</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{llm.tipKo}</p>
        </div>
      )}
    </div>
  );
}
