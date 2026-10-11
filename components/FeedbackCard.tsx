"use client";

import { useState } from "react";
import type { AnswerFeedback, Grade } from "@/lib/types";

/** 말하기 수준 지도에 세우는 아홉 등급 (낮은 쪽부터) */
const GRADES: Grade[] = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

/**
 * AI 채점 결과.
 *
 * 답변 하나로 등급을 확정하지 않는다. 이번 답변에서 "확인된 것"과
 * "확인되지 않은 것"을 나눠 보여 주고, 다음에 무엇을 할지로 끝낸다.
 * 첨삭·모범답안처럼 길게 읽어야 하는 것은 상세 분석 안으로 접어 둔다.
 */
/**
 * 기준 이름.
 *
 * F·C·A·T 라는 약자만 적어 두면 학습자는 무엇을 본 것인지 알 수 없다.
 * 무엇을 보는 항목인지 이름 자체로 읽히게 쓴다.
 */
const CRITERIA_KO: Record<string, { label: string; desc: string }> = {
  F: { label: "질문에 맞게 답했는가", desc: "문항이 요구한 것을 실제로 했는지" },
  C: { label: "얼마나 구체적으로 말했는가", desc: "다룬 내용의 범위와 구체성" },
  A: { label: "알아듣기 쉬웠는가", desc: "문법·어휘가 이해를 방해했는지" },
  T: { label: "문장을 얼마나 이어 말했는가", desc: "단어 나열인지, 문장인지, 문단인지" },
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
  // 키가 없어 AI 를 부르지 않은 것과, 불렀는데 실패한 것은 고칠 곳이 다르다
  const aiOff = provider?.llm === "metrics";
  const aiFailed = provider?.llm === "failed";

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
          className="ml-auto rounded-xl border-2 border-dku-600 bg-white px-4 py-2 text-sm font-bold text-dku-700 transition hover:bg-dku-50"
        >
          {detail ? "상세 분석 접기" : "상세 분석 · 첨삭 보기"} <span aria-hidden>{detail ? "⌃" : "⌄"}</span>
        </button>
      </header>

      {(aiOff || aiFailed) && (
        <p className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {aiFailed
            ? // tipKo 에 실패 사유가 한 줄로 들어 있다 (모델 이름 오타·한도 초과 등).
              // 셋은 고치는 방법이 다르므로 뭉뚱그리지 않는다.
              llm.tipKo
            : "AI 채점 키가 설정되어 있지 않아 지표 기반 결과만 표시합니다."}
        </p>
      )}

      {/* ── 답변 주제 확인 ─────────────────────────────────── */}
      <Relevance r={llm.relevance} />

      {/* ── 확인한 수준 · 다음 연습 포인트 ──────────────────── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-dku-50/70 px-5 py-5">
          <p className="text-sm text-slate-500">이번 답변에서 확인한 수준</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-[40px] font-extrabold leading-none text-slate-900">
              {llm.observed.from}
              {llm.observed.from !== llm.observed.to && ` ~ ${llm.observed.to}`}
            </span>
            <span className="text-xl font-bold text-slate-800">{llm.observed.label}</span>
          </p>
          <p className="mt-3 leading-relaxed text-slate-500">{llm.observed.note}</p>
        </div>

        <div className="rounded-xl bg-slate-50 px-5 py-5">
          <p className="text-sm text-slate-500">다음 답변의 연습 포인트</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{llm.oneFix.title}</p>
          {llm.nextFrames.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {llm.nextFrames.map((f, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  {f.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── 말하기 수준 지도 ───────────────────────────────── */}
      <div className="mt-7 border-t border-slate-100 pt-6">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-lg font-extrabold text-slate-900">말하기 수준 지도</h3>
          <span className="text-sm font-bold text-dku-700">목표 {targetGrade}</span>
        </div>

        <LevelRow target={targetGrade as Grade} from={llm.observed.from} to={llm.observed.to} />

        <p className="mt-4 flex items-start gap-2 text-sm text-slate-500">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] text-slate-400" aria-hidden>
            i
          </span>
          이번 답변에서 확인된 범위이며, 답변 하나로 등급을 확정하지 않습니다.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          입력된 텍스트 기준 · 음성 및 여러 답변으로 종합 추정
        </p>
      </div>

      {/* ── 무엇을 어떻게 고칠지 ───────────────────────────── */}
      <SpeakingFeedback llm={llm} transcript={transcript} targetGrade={targetGrade} />

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

/**
 * 답변 주제 확인.
 *
 * 채점에서 가장 먼저 읽혀야 하는 줄이다. 주제가 어긋난 답변에 문법 교정을
 * 아무리 붙여도 소용이 없기 때문이다.
 * 요구한 것과 실제로 말한 것을 두 줄 표로 나란히 놓아 눈으로 바로 비교된다.
 */
function Relevance({ r }: { r: AnswerFeedback["llm"]["relevance"] }) {
  return (
    <div className="mt-5">
      <p className="text-sm text-slate-500">답변 주제 확인</p>
      <p className="mt-1.5 text-lg font-bold text-slate-900">{r.verdict}</p>
      <p className="mt-1 text-slate-500">
        {r.match === "off"
          ? `${r.askedFor}을(를) 묻는 질문에 ${r.actuallySaid}를 했습니다.`
          : r.match === "partial"
            ? "요구한 내용 가운데 일부만 다루었습니다."
            : "질문이 요구한 내용을 다루었습니다."}
      </p>

      <dl className="mt-4 overflow-hidden rounded-xl border border-slate-100">
        <div className="flex flex-col border-b border-slate-100 sm:flex-row">
          <dt className="shrink-0 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-600 sm:w-[210px]">
            질문에서 요구한 내용
          </dt>
          <dd className="bg-white px-5 py-3.5 text-slate-800">{r.askedFor}</dd>
        </div>
        <div className="flex flex-col sm:flex-row">
          <dt className="shrink-0 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-600 sm:w-[210px]">
            실제 답변
          </dt>
          <dd className="bg-white px-5 py-3.5 text-slate-800">{r.actuallySaid}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * 말하기 수준 지도 — 가로 한 줄.
 *
 * 아홉 등급을 왼쪽에서 오른쪽으로 세워 두고, 이번 답변 자리와 목표 자리를
 * 표시한다. 세로 사다리보다 "지금 어디, 목표 어디" 의 거리가 한눈에 보인다.
 */
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
                  ? "border-dku-400 bg-dku-50 text-dku-700"
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
function RegisterTag({ value }: { value: string }) {
  const casual = value === "일상 대화";
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
        casual ? "bg-amber-50 text-amber-700" : value === "격식" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {value}
    </span>
  );
}

const KIND_STYLE: Record<string, string> = {
  "콩글리시": "bg-red-50 text-red-700",
  "문법": "bg-orange-50 text-orange-700",
  "어색한 표현": "bg-amber-50 text-amber-700",
  "더 자연스럽게": "bg-sky-50 text-sky-700",
  "단조로움": "bg-violet-50 text-violet-700",
};

/** 시안2 의 작은 머리표 — 01 | 제목 */
function StepLabel({ no, label }: { no: string; label: string }) {
  return (
    <p className="flex items-center gap-3">
      <span className="rounded-md bg-dku-50 px-2.5 py-1 text-[13px] font-extrabold text-dku-700">{no}</span>
      <span className="h-3.5 w-px bg-slate-200" />
      <span className="text-sm font-bold text-slate-500">{label}</span>
    </p>
  );
}

/**
 * 채점 결과 아래쪽 — 무엇을 어떻게 고칠지.
 *
 * 위 카드가 "어땠는가" 라면 여기는 "그래서 다음에 어떻게 말하는가" 다.
 * 받은 시안 그대로 네 칸으로 나눈다 —
 * 답변의 방향 / 다음 답변의 구성 / 내 표현 다듬기 / 함께 익혀두면 좋은 표현.
 */
function SpeakingFeedback({
  llm,
  transcript,
  targetGrade,
}: {
  llm: AnswerFeedback["llm"];
  transcript: string;
  targetGrade: string;
}) {
  const said = llm.oneFix.quote || transcript;

  return (
    <section className="mt-8">
      {/* 머리글 */}
      <div className="flex items-center gap-3">
        <span className="h-[3px] w-8 rounded-full bg-dku-500" />
        <span className="text-sm font-bold tracking-[0.14em] text-dku-600">SPEAKING FEEDBACK</span>
      </div>
      <h3 className="hero-headline mt-3 break-keep text-[28px] text-slate-900">
        답변을 더 명확하게, 표현은 더 자연스럽게
      </h3>
      <p className="mt-2 text-slate-500">
        주제에 맞게 답하고, 나의 문장을 한 단계 다듬어보세요.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* 01 — 답변의 방향 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <StepLabel no="01" label="답변의 방향" />
          <p className="mt-3 text-[21px] font-bold text-slate-900">{llm.oneFix.title}</p>

          {said && (
            <>
              <p className="mt-5 text-sm text-slate-500">이번에 말한 내용</p>
              <blockquote className="mt-2 rounded-r-lg border-l-[3px] border-dku-400 bg-slate-50 px-4 py-3.5 leading-relaxed text-slate-700">
                “{said}”
              </blockquote>
            </>
          )}

          <p className="mt-4 flex items-start gap-3 rounded-lg bg-dku-50/60 px-4 py-3.5 text-slate-700">
            <span className="mt-0.5 shrink-0 text-dku-500" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M12 7v13M12 7c-2-2-5-2.5-8-2v13c3-.5 6 0 8 2M12 7c2-2 5-2.5 8-2v13c-3-.5-6 0-8 2" />
              </svg>
            </span>
            {llm.oneFix.advice}
          </p>
        </div>

        {/* 02 — 다음 답변의 구성 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <StepLabel no="02" label="다음 답변의 구성" />
          <p className="mt-3 text-[21px] font-bold text-slate-900">
            {llm.nextFrames.length > 0 ? `${llm.nextFrames.length}단계로 이야기를 완성하세요` : "다음 답변의 틀"}
          </p>

          {llm.nextFrames.length > 0 ? (
            <>
              <ol className="mt-4 divide-y divide-slate-100">
                {llm.nextFrames.map((f, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-extrabold text-slate-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="w-12 shrink-0 text-sm font-bold text-slate-700">{f.label}</span>
                    <span className="min-w-0 flex-1 text-[15px] leading-relaxed text-slate-800">
                      {f.frame}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <span aria-hidden>✎</span> 빈칸을 내 이야기로 채워보세요.
              </p>
            </>
          ) : (
            <p className="mt-4 text-slate-400">
              문장 틀은 AI 채점이 켜져 있을 때 이번 답변에 맞춰 만들어집니다.
            </p>
          )}
        </div>
      </div>

      {/* 03 — 내 표현 다듬기 (문장마다) */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
        <StepLabel no="03" label="내 표현 다듬기" />
        <p className="mt-3 text-[21px] font-bold text-slate-900">이런 표현이 더 좋아요!</p>
        <p className="mt-1.5 text-slate-500">내가 말한 문장을 하나씩 짚어 다듬었습니다.</p>

        {llm.coaching.length === 0 ? (
          <p className="mt-5 text-slate-400">
            표현 다듬기는 AI 채점이 켜져 있을 때 이번 답변에 맞춰 만들어집니다.
          </p>
        ) : (
          <ul className="mt-5 space-y-5">
            {llm.coaching.map((c, i) => (
              <li key={i}>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                  <div className="rounded-xl bg-slate-50 px-5 py-4">
                    <p className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-wider text-slate-400">
                      BEFORE
                      <span className="h-3 w-px bg-slate-300" />
                      <span className="font-bold tracking-normal text-slate-500">내가 말한 표현</span>
                    </p>
                    <p className="mt-2 text-[17px] leading-relaxed text-slate-700">{c.quote}</p>
                  </div>

                  <span className="hidden items-center text-slate-300 lg:flex" aria-hidden>→</span>

                  <div className={`rounded-xl px-5 py-4 ${c.ok ? "bg-emerald-50/70" : "bg-dku-50"}`}>
                    <p className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-wider text-dku-600">
                      AFTER
                      <span className="h-3 w-px bg-dku-200" />
                      <span className="font-bold tracking-normal text-dku-700">
                        {c.ok ? "그대로 좋아요" : "다듬은 표현"}
                      </span>
                    </p>
                    <p className="mt-2 text-[17px] font-bold leading-relaxed text-slate-900">{c.better}</p>
                  </div>
                </div>

                <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                  <span className="text-dku-500" aria-hidden>✦</span>
                  {c.why}
                  <RegisterTag value={c.register} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 함께 익혀두면 좋은 표현 */}
      {llm.nativeTouch.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="flex flex-wrap items-center gap-3">
            <span className="text-[21px] font-bold text-slate-900">함께 익혀두면 좋은 표현</span>
            <span className="h-4 w-px bg-slate-200" />
            <span className="text-slate-400">이 주제를 말할 때 활용해보세요.</span>
          </p>

          <ul className="mt-5 grid gap-4 lg:grid-cols-2">
            {llm.nativeTouch.map((n, i) => (
              <li key={i} className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dku-50 text-dku-500" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-extrabold text-slate-900">{n.en}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">{n.ko}</span>
                  </span>
                </div>
                <p className="mt-4 border-t border-slate-100 pt-3.5 leading-relaxed text-slate-700">
                  {n.example}
                </p>
                {n.caution && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">⚠ {n.caution}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 마지막 — 내가 말한 전체 vs 목표 등급에 맞춘 모범답안 */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="flex flex-wrap items-center gap-3">
          <span className="text-[21px] font-bold text-slate-900">
            목표 등급 {targetGrade} 모범답안
          </span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-slate-400">
            내가 말한 내용을 그대로 살려 {targetGrade} 수준으로 다시 썼습니다.
          </span>
        </p>

        {/*
          좌우로 세우는 이유.
          따로 읽으면 "좋은 답변이네" 로 끝난다. 내 문장 옆에 두어야
          무엇이 모자랐는지가 눈으로 보인다.
        */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <div className="rounded-xl bg-slate-50 px-5 py-5">
            <p className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-wider text-slate-400">
              BEFORE
              <span className="h-3 w-px bg-slate-300" />
              <span className="font-bold tracking-normal text-slate-500">내가 말한 전체</span>
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[17px] leading-[1.75] text-slate-700">
              {transcript || "(발화 없음)"}
            </p>
          </div>

          <span className="hidden items-center text-slate-300 lg:flex" aria-hidden>
            →
          </span>

          <div className="rounded-xl bg-dku-50 px-5 py-5">
            <p className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-wider text-dku-600">
              AFTER
              <span className="h-3 w-px bg-dku-200" />
              <span className="font-bold tracking-normal text-dku-700">
                {targetGrade} 수준으로 다듬은 답변
              </span>
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[17px] font-bold leading-[1.75] text-slate-900">
              {llm.modelAnswer}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          그대로 외우지 말고, 오른쪽 문장을 소리 내어 한 번 읽은 뒤 같은 질문에 다시 답해 보세요.
        </p>
      </div>
    </section>
  );
}
