"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Card,
  IconBook,
  IconChat,
  IconDoc,
  IconInfo,
  IconPen,
  IconTarget,
  LabelTable,
  ReportFrame,
  StepNo,
} from "@/components/report/Parts";
import type { AnswerFeedback, Grade } from "@/lib/types";

/** 말하기 수준 지도에 세우는 아홉 등급 (낮은 쪽부터) */
const GRADES: Grade[] = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

/**
 * 이번 답변 분석 — 학습 리포트.
 *
 * 한 장으로 읽히게 짠다. 위에서부터 "무엇이 문제였나 → 어떻게 말할까 →
 * 내 문장을 어떻게 고칠까 → 무슨 표현을 익힐까 → 목표 등급이면 이렇게 말한다".
 * 길게 읽어야 하는 첨삭·지표는 상세 분석 안으로 접어 둔다.
 */
export function FeedbackCard({
  data,
  transcript,
  targetGrade,
  questionTitle,
  provider,
  onRetry,
}: {
  data: AnswerFeedback;
  transcript: string;
  targetGrade: string;
  /** 머리글에 쓰는 이번 문항 이름 */
  questionTitle?: string;
  provider?: { stt: string; llm: string };
  /** 이 질문을 다시 말하기 */
  onRetry?: () => void;
}) {
  const { metrics, llm } = data;
  const [detail, setDetail] = useState(false);

  // 키가 없어 AI 를 부르지 않은 것과, 불렀는데 실패한 것은 고칠 곳이 다르다
  const aiOff = provider?.llm === "metrics";
  const aiFailed = provider?.llm === "failed";

  return (
    <ReportFrame>
      {/* ── 리포트 머리줄 ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <BrandLogo />
        <span className="text-[13px] font-bold text-slate-500">학습 리포트</span>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="hero-headline text-[30px] leading-tight text-slate-900">이번 답변 분석</h2>
          <p className="mt-1.5 text-[15px] text-slate-500">
            {questionTitle ? `${questionTitle} · ` : ""}답변 피드백
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDetail((v) => !v)}
          className="shrink-0 rounded-xl border-[1.5px] border-dku-500 bg-white px-5 py-3 text-[14px] font-bold text-dku-700 transition hover:bg-dku-50"
        >
          {detail ? "상세 분석 접기 ←" : "상세 분석 · 첨삭 보기 →"}
        </button>
      </div>

      {(aiOff || aiFailed) && (
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {aiFailed
            ? // tipKo 에 실패 사유가 한 줄로 들어 있다 (모델 이름 오타·한도 초과 등)
              llm.tipKo
            : "AI 채점 키가 설정되어 있지 않아 지표 기반 결과만 표시합니다."}
        </p>
      )}

      <div className="mt-5">
        {/* ── 01 답변 진단 ───────────────────────────────── */}
        <Card icon={<IconDoc />} title="답변 진단">
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_minmax(260px,34%)]">
            <div className="min-w-0">
              <p className="break-keep text-[19px] font-bold leading-snug text-slate-900">
                {llm.relevance.verdict}
              </p>
              <p className="mt-2 break-keep text-[15px] leading-relaxed text-slate-500">
                {llm.oneFix.advice}
              </p>
              <LabelTable
                rows={[
                  ["질문에서 요구한 내용", llm.relevance.askedFor],
                  ["실제 답변", llm.relevance.actuallySaid],
                ]}
              />
            </div>

            {/* 오른쪽 — 이번 답변에서 확인한 범위 */}
            <div className="rounded-xl bg-[#eaf1fc] px-5 py-5">
              <p className="text-[13px] text-slate-500">이번 답변에서 확인한 범위</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-2.5">
                <span className="text-[42px] font-extrabold leading-none text-slate-900">
                  {llm.observed.from}
                  {llm.observed.from !== llm.observed.to && `~${llm.observed.to}`}
                </span>
                <span className="text-[17px] font-bold text-slate-700">{llm.observed.label}</span>
              </p>
              <p className="mt-3 text-[13px] text-slate-500">
                {metrics.durationSec}초 발화 · {metrics.wordCount}단어
              </p>
              <p className="mt-4 border-t border-slate-300/60 pt-3.5 text-[15px] font-bold text-slate-700">
                목표 {targetGrade}
              </p>
            </div>
          </div>

          <LevelRow target={targetGrade as Grade} from={llm.observed.from} to={llm.observed.to} />

          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
            이번 답변에서 확인한 범위이며, 답변 하나로 등급을 확정하지 않습니다.
            <br />
            입력된 텍스트 기준 · 음성 및 여러 답변으로 종합 추정
          </p>
        </Card>

        {/* ── 02 내 이야기로 답변 만들기 ──────────────────── */}
        {llm.nextFrames.length > 0 && (
          <Card icon={<IconPen />} title="내 이야기로 답변 만들기" hint={llm.oneFix.title}>
            <ul className="mt-4 grid gap-4 lg:grid-cols-3">
              {llm.nextFrames.map((f, i) => (
                <li key={i} className="overflow-hidden rounded-xl border border-slate-200">
                  <p className="flex items-center gap-2.5 bg-[#eaf1fc] px-4 py-3">
                    <StepNo no={i + 1} />
                    <span className="text-[16px] font-bold text-slate-900">{f.label}</span>
                  </p>
                  <p className="px-4 py-4 text-[15px] leading-relaxed text-slate-700">{f.frame}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-slate-400">
              <span className="text-dku-500">
                <IconInfo />
              </span>
              빈칸을 실제 내 이야기로 채워보세요.
            </p>
          </Card>
        )}

        {/* ── 03 문장별 코칭 ─────────────────────────────── */}
        <Card
          icon={<IconChat />}
          title="문장별 코칭"
          hint="내가 말한 문장을 한 줄씩 다듬습니다"
          aside="예시는 실제 내 상황에 맞게 바꿔 사용하세요."
        >
          {llm.coaching.length === 0 ? (
            <p className="mt-4 text-[15px] text-slate-400">
              문장별 코칭은 AI 채점이 켜져 있을 때 이번 답변에 맞춰 만들어집니다.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <p className="bg-slate-50 px-4 py-3 text-[13px] font-bold text-slate-500">
                  내가 말한 문장
                </p>
                <p className="hidden bg-[#eaf1fc] px-4 py-3 text-[13px] font-bold text-dku-700 sm:block">
                  다듬은 예시
                </p>
              </div>
              <ul>
                {llm.coaching.map((c, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-1 border-t border-slate-200 sm:grid-cols-2"
                  >
                    <p className="bg-slate-50/60 px-4 py-4 text-[15px] leading-relaxed text-slate-600">
                      {c.quote}
                    </p>
                    <div className="border-t border-slate-200 px-4 py-4 sm:border-l sm:border-t-0">
                      <p className="text-[15px] font-bold leading-relaxed text-slate-900">
                        {c.ok ? `${c.better}` : c.better}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                        {c.ok ? "그대로 좋습니다. " : ""}
                        {c.why}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* ── 04 이번에 익힐 표현 ────────────────────────── */}
        {llm.nativeTouch.length > 0 && (
          <Card
            icon={<IconBook />}
            title="이번에 익힐 표현"
            hint="실제 경험과 상황에 맞는 표현을 골라 연습해보세요."
          >
            <ul className="mt-4 grid gap-4 lg:grid-cols-3">
              {llm.nativeTouch.map((n, i) => (
                <li key={i} className="rounded-xl border border-slate-200 px-5 py-4">
                  <p className="flex items-start gap-2.5">
                    <StepNo no={i + 1} />
                    <span className="min-w-0">
                      <span className="block text-[16px] font-extrabold text-slate-900">{n.en}</span>
                      <span className="mt-0.5 block text-[13px] text-slate-500">{n.ko}</span>
                    </span>
                  </p>
                  <p className="mt-3.5 border-t border-slate-100 pt-3.5 text-[15px] leading-relaxed text-slate-700">
                    <Highlight text={n.example} mark={n.en} />
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ── 05 목표 등급 답변 구성 예시 ────────────────── */}
        {llm.modelAnswer.length > 0 && (
          <Card
            icon={<IconTarget />}
            title={`목표 ${targetGrade} · 답변 구성 예시`}
            hint={`${llm.modelAnswer.map((p) => p.label).join(" → ")}가 이어지는 흐름을 참고하세요.`}
            aside="연습용 예시이며, 실제 경험에 맞게 바꿔주세요."
          >
            <ul className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {llm.modelAnswer.map((part, i) => (
                <li
                  key={i}
                  className={`grid grid-cols-1 gap-x-4 px-4 py-4 sm:grid-cols-[minmax(96px,16%)_1fr] ${
                    i > 0 ? "border-t border-slate-200" : ""
                  }`}
                >
                  <p className="flex items-center gap-2.5">
                    <StepNo no={i + 1} />
                    <span className="text-[15px] font-bold text-slate-900">{part.label}</span>
                  </p>
                  <p className="mt-2 text-[15px] leading-[1.75] text-slate-800 sm:mt-0">
                    {part.text}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
              그대로 외우지 말고, 한 번 소리 내어 읽은 뒤 같은 질문에 다시 답해 보세요.
            </p>
          </Card>
        )}
      </div>

      {/* ── 상세 분석 ──────────────────────────────────────── */}
      {detail && (
        <div className="mt-4 rounded-2xl bg-white px-5 py-1 sm:px-7">
          <Detail data={data} transcript={transcript} targetGrade={targetGrade} metrics={metrics} />
        </div>
      )}

      {/* ── 마무리 ────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="text-[13px] text-slate-500">
          다시 말한 후, 내용과 구조의 변화를 비교해요.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
          >
            🎤 이 질문 다시 말하기
          </button>
        )}
      </div>

      <p className="mt-3 text-[12px] text-slate-400">
        AI 학습용 진단 · 공식 OPIc 성적이 아닙니다.
      </p>
    </ReportFrame>
  );
}

/**
 * 예문 안에서 익힐 표현만 굵게.
 *
 * 표현이 예문 어디에 들어갔는지 눈에 보여야 "이렇게 쓰는 거구나" 가 된다.
 * 대소문자가 달라도 찾고, 못 찾으면 그냥 문장을 그대로 둔다.
 */
function Highlight({ text, mark }: { text: string; mark: string }) {
  const at = text.toLowerCase().indexOf(mark.toLowerCase());
  if (at === -1 || !mark) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-extrabold text-dku-700">{text.slice(at, at + mark.length)}</strong>
      {text.slice(at + mark.length)}
    </>
  );
}

function LevelRow({ target, from, to }: { target: Grade; from: Grade; to: Grade }) {
  const lo = Math.min(GRADES.indexOf(from), GRADES.indexOf(to));
  const hi = Math.max(GRADES.indexOf(from), GRADES.indexOf(to));
  const t = GRADES.indexOf(target);

  /*
    범위가 사다리를 거의 다 덮으면 판정이 안 된 것이다 (AI 채점이 꺼져 있을 때).
    그걸 그대로 칠하면 아홉 칸이 전부 "이번 답변" 이 되어 아무 뜻이 없다.
  */
  const known = hi - lo < GRADES.length - 3;

  return (
    <ol className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
      {GRADES.map((g, i) => {
        const inRange = known && i >= lo && i <= hi;
        const isTarget = i === t;
        return (
          <li key={g} className="min-w-0 flex-1">
            <div
              className={`rounded-lg border-2 py-3.5 text-center text-sm font-bold ${
                inRange
                  ? "border-dku-600 bg-dku-600 text-white"
                  : isTarget
                    ? "border-dku-700 bg-white text-dku-800"
                    : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              {g}
            </div>
            {/* 꼬리표는 범위의 첫 칸에만 — 칸마다 붙이면 글자가 줄줄이 늘어선다 */}
            <p className="mt-1.5 h-4 text-center text-[11px] font-bold">
              {inRange && i === lo && <span className="text-dku-600">이번 답변</span>}
              {!inRange && isTarget && <span className="text-slate-500">목표</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

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

/** 어떤 자리에서 쓰는 말인지 */
