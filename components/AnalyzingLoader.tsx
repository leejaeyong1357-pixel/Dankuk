"use client";

import { useEffect, useState } from "react";

/**
 * AI 가 분석하는 동안 보여 주는 화면.
 *
 * "채점 중… 18초" 처럼 초를 세면 기다리는 사람이 시계만 보게 된다.
 * 지금 무엇을 보고 있는지 단계로 보여 주고, 단계는 시간이 흐르는 대로 넘어간다
 * (실제 진행률이 아니라 기다리는 동안의 안내다 — 마지막 단계에서 멈춰 기다린다).
 *
 * 연습 채점, 모의고사 채점, 스크립트 만들기가 함께 쓴다.
 */
export function AnalyzingLoader({
  title,
  steps,
  note,
  every = 2200,
  compact = false,
}: {
  title: string;
  steps: string[];
  note?: string;
  /** 다음 단계로 넘어가는 간격(ms) */
  every?: number;
  /** 카드 안에 작게 */
  compact?: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(steps.length - 1, s + 1)), every);
    return () => clearInterval(t);
  }, [steps.length, every]);

  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? "py-8" : "py-14"}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-dku-100 border-t-dku-600" />
        <span className="absolute inset-[9px] animate-pulse rounded-full bg-dku-50" />
        <svg width="22" height="22" viewBox="0 0 24 24" className="relative text-dku-600" aria-hidden>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" />
        </svg>
      </span>
      <p className="mt-5 text-[18px] font-bold text-slate-900">{title}</p>
      <p className="mt-1.5 text-[14px] text-dku-700">{steps[step]}…</p>

      <ul className="mt-5 w-full max-w-[320px] space-y-2 text-left">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition ${
              i < step ? "text-slate-400" : i === step ? "bg-dku-50 font-bold text-dku-700" : "text-slate-300"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                i < step ? "bg-emerald-100 text-emerald-600" : i === step ? "bg-dku-600 text-white" : "bg-slate-100"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ul>
      {note && <p className="mt-5 text-[12.5px] text-slate-400">{note}</p>}
    </div>
  );
}

/** 연습 한 문항 채점 */
export const PRACTICE_STEPS = [
  "답변 받아쓰기 확인",
  "질문에 맞게 답했는지 확인",
  "예상 등급 범위 판단",
  "문장별 진단 만들기",
  "현지식 표현 고르기",
];

/** 모의고사 전체 채점 */
export const EXAM_STEPS = [
  "15문항 답변 모으기",
  "문항별로 질문에 답했는지 확인",
  "발화량·연결어·시제 지표 정리",
  "ACTFL 기준으로 등급 판정",
  "코칭 리포트 작성",
];
