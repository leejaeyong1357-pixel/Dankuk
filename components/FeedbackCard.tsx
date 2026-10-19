"use client";

import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { playPrompt, stopAudio } from "@/lib/audio";
import { mirror } from "@/lib/remote";
import { saveVocabEntry } from "@/lib/sync";
import type { AnswerFeedback, Grade, LlmFeedback } from "@/lib/types";

/** 말하기 수준 지도에 세우는 아홉 등급 (낮은 쪽부터) */
const GRADES: Grade[] = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];
const VOCAB_KEY = "dku-opic:vocab";

/**
 * 이번 답변 분석 — 학습 리포트 (시안: 답변분석.png).
 *
 *   위    예상 등급 | 핵심 진단 | 즉시 개선 포인트        ← 판정(먼저 도착)
 *   가운데 문장별 진단 → 한 번에 바꿔 말하기 → 현지식 표현  ← 코칭(뒤에 도착)
 *   아래  목표 등급 답변 구조 예시                      ← 판정
 *
 * 판정이 먼저 오면 코칭 칸은 "만드는 중"으로 두고 채워지기를 기다린다.
 * 예전에 저장된 결과(새 칸이 없는 것)도 그릴 수 있게 빈 칸은 있는 자료로 메운다.
 *
 * 등급은 AI 가 이번 답변 하나로 본 범위이며 공식 성적이 아니다 — 화면에 늘 밝힌다.
 */
export function FeedbackCard({
  data,
  transcript,
  targetGrade,
  questionTitle,
  provider,
  onRetry,
  onNext,
}: {
  data: AnswerFeedback;
  transcript: string;
  targetGrade: string;
  questionTitle?: string;
  provider?: { stt: string; llm: string };
  /** 이 질문을 다시 말하기 */
  onRetry?: () => void;
  /** 다음(비슷한) 질문으로 */
  onNext?: () => void;
}) {
  const { metrics, llm } = data;
  const [detail, setDetail] = useState(false);
  const [saved, setSaved] = useState(false);

  // 키가 없어 AI 를 부르지 않은 것과, 불렀는데 실패한 것은 고칠 곳이 다르다
  const aiOff = provider?.llm === "metrics";
  const aiFailed = provider?.llm === "failed";
  const coachPending = llm.coachState === "pending";

  const diagnosis = llm.diagnosis?.length
    ? llm.diagnosis
    : llm.gapToTarget.slice(0, 3).map((g) => ({ title: g, detail: "" }));
  const quickFixes = llm.quickFixes?.length
    ? llm.quickFixes
    : [{ title: llm.oneFix.title, detail: llm.oneFix.advice, icon: "spark" }];

  function saveAll() {
    const items = [
      ...llm.nativeTouch.map((n) => ({ en: n.en, ko: n.ko })),
      ...llm.coaching.filter((c) => c.nativeEn).map((c) => ({ en: c.nativeEn!, ko: c.nativeKo ?? "" })),
    ];
    try {
      const raw = window.localStorage.getItem(VOCAB_KEY);
      const list: { en: string; ko: string }[] = raw ? JSON.parse(raw) : [];
      for (const it of items) if (!list.some((x) => x.en === it.en)) list.push(it);
      window.localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
      mirror(VOCAB_KEY);
    } catch {
      /* 저장하지 못해도 화면은 그대로 */
    }
    for (const it of items) void saveVocabEntry(it);
    setSaved(true);
  }

  return (
    <div className="mt-6 overflow-hidden rounded-[22px] bg-gradient-to-b from-[#eef4fd] to-[#f6f9fe] px-4 py-5 sm:px-7 sm:py-7">
      {/* ── 머리 ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <BrandLogo />
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] font-bold text-slate-500 sm:block">학습 리포트</span>
          <button
            type="button"
            onClick={() => setDetail((v) => !v)}
            className="rounded-xl border-[1.5px] border-dku-500 bg-white px-4 py-2.5 text-[13px] font-bold text-dku-700 transition hover:bg-dku-50"
          >
            {detail ? "상세 분석 접기" : "상세 분석 · 첨삭 보기 →"}
          </button>
        </div>
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-4">
        <div className="min-w-0 pb-2">
          <h2 className="text-[30px] font-black leading-tight tracking-[-0.02em] text-[#14234b] sm:text-[34px]">
            이번 답변 분석
          </h2>
          <p className="mt-1 text-[15px] text-slate-500">
            {questionTitle ? `${questionTitle} · ` : ""}가장 아쉬운 문장부터 바로 고쳐보세요.
          </p>
        </div>
        <Robot />
      </div>

      {(aiOff || aiFailed) && (
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {aiFailed ? llm.tipKo : "AI 채점 키가 설정되어 있지 않아 지표 기반 결과만 표시합니다."}
        </p>
      )}

      {/* ── 예상 등급 · 핵심 진단 · 즉시 개선 포인트 ───────── */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_1fr_1fr]">
        <GradeCard llm={llm} targetGrade={targetGrade} metrics={metrics} />

        <Panel tone="green" icon={<BulbIcon />} title="핵심 진단">
          <ol className="mt-3 space-y-2">
            {diagnosis.slice(0, 3).map((d, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-white px-3.5 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold text-[#14234b]">{d.title}</span>
                  {d.detail && <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{d.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel tone="orange" icon={<TargetIcon />} title="즉시 개선 포인트">
          <ul className="mt-3 space-y-2">
            {quickFixes.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dku-50 text-dku-600">
                  <FixIcon name={f.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-dku-700">{f.title}</span>
                  {f.detail && <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{f.detail}</span>}
                </span>
                <span className="shrink-0 text-slate-300">›</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ── 문장별 진단 ───────────────────────────────────── */}
      <Section
        icon={<DocIcon />}
        title="문장별 진단"
        hint="내가 말한 문장을 하나씩 확인하고, 더 자연스러운 표현으로 고쳐보세요."
        action={
          llm.coaching.length > 0 && (
            <button
              type="button"
              onClick={() => playAll(llm.coaching.map((c) => c.better))}
              className="flex items-center gap-2 rounded-lg border-[1.5px] border-dku-500 bg-white px-3.5 py-2 text-[13px] font-bold text-dku-700 transition hover:bg-dku-50"
            >
              <PlayIcon /> 전체 재생
            </button>
          )
        }
      >
        {coachPending ? (
          <Pending text="문장별 진단을 만드는 중입니다…" rows={3} />
        ) : llm.coaching.length === 0 ? (
          <p className="mt-3 text-[14px] text-slate-400">
            {llm.coachState === "failed"
              ? "문장별 코칭을 받지 못했습니다. 같은 질문에 다시 말해 보세요."
              : "문장별 진단은 AI 채점이 켜져 있을 때 이번 답변에 맞춰 만들어집니다."}
          </p>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {llm.coaching.map((c, i) => (
              <SentenceRow key={i} no={i + 1} c={c} />
            ))}
          </ol>
        )}
      </Section>

      {/* ── 한 번에 바꿔 말하기 ───────────────────────────── */}
      {(coachPending || (llm.rephrase?.length ?? 0) > 0) && (
        <Section icon={<BulbIcon />} title="한 번에 바꿔 말하기" hint="자주 사용한 표현을 더 자연스럽게 바꿔보세요.">
          {coachPending ? (
            <Pending text="바꿔 말할 대목을 고르는 중입니다…" rows={1} />
          ) : (
            <ul className="mt-3 grid gap-3 lg:grid-cols-3">
              {llm.rephrase!.map((r, i) => (
                <li key={i} className="rounded-2xl border border-[#e3eaf5] bg-white px-4 py-4">
                  <p className="flex items-center gap-2.5 text-[15px] font-bold text-[#14234b]">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${TONES[i % 3].chip}`}>
                      {[<PinIcon key="p" />, <HomeIcon key="h" />, <HeartIcon key="r" />][i % 3]}
                    </span>
                    {r.label}
                  </p>
                  <p className="mt-2.5 text-[13px] italic text-slate-400">&ldquo;{r.before}&rdquo;</p>
                  <p className="mt-1.5 flex items-start gap-2 text-[14.5px] leading-snug text-[#14234b]">
                    <span className="mt-0.5 text-slate-400">→</span>
                    <span>
                      <Marked text={r.after} marks={r.chips} />
                    </span>
                  </p>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {r.chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-[#f1f5fb] px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                        {chip}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* ── 현지식 표현 추천 ───────────────────────────────── */}
      {(coachPending || llm.nativeTouch.length > 0) && (
        <Section icon={<SparkIcon />} title="현지식 표현 추천" hint="OPIc에서 바로 활용할 수 있는 자연스러운 표현들입니다.">
          {coachPending ? (
            <Pending text="이 주제에 맞는 표현을 고르는 중입니다…" rows={1} />
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {llm.nativeTouch.map((n, i) => {
                const t = CARD_TONES[i % CARD_TONES.length];
                return (
                  <li key={i} className={`relative flex flex-col overflow-hidden rounded-2xl px-4 py-4 ${t.bg}`}>
                    <div className="flex items-start gap-2">
                      <p className={`min-w-0 flex-1 text-[16px] font-black leading-snug ${t.text}`}>{n.en}</p>
                      <SpeakButton text={n.en} />
                    </div>
                    <p className="mt-1 text-[13px] text-slate-600">{n.ko}</p>
                    <p className="mt-2 text-[12.5px] leading-snug text-slate-500">
                      <Marked text={n.example} marks={[n.en]} />
                    </p>
                    <span className="flex-1" />
                    {n.tag && (
                      <span className={`mt-3 w-fit rounded-full px-2.5 py-1 text-[11.5px] font-bold ${t.tag}`}>{n.tag}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      )}

      {/* ── 목표 등급 답변 구조 예시 ───────────────────────── */}
      {llm.modelAnswer.length > 0 && llm.modelAnswer[0].label !== "안내" && (
        <Section
          icon={<TargetIcon />}
          title={`목표 ${targetGrade} 답변 구조 예시`}
          hint={`${llm.modelAnswer.map((p) => p.label).join(" → ")}가 이어지는 흐름을 참고하세요.`}
          action={
            onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border-[1.5px] border-dku-500 bg-white px-3.5 py-2 text-[13px] font-bold text-dku-700 transition hover:bg-dku-50"
              >
                내 답변으로 연습하기 →
              </button>
            )
          }
        >
          <ol className="mt-3 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {llm.modelAnswer.map((part, i) => (
              <ModelStep key={i} no={i + 1} part={part} last={i === llm.modelAnswer.length - 1} />
            ))}
          </ol>
          <p className="mt-2.5 text-[12.5px] text-slate-400">
            연습용 예시입니다. 그대로 외우지 말고 내 경험에 맞게 바꿔 말해 보세요.
          </p>
        </Section>
      )}

      {/* ── 상세 분석 ─────────────────────────────────────── */}
      {detail && <Detail llm={llm} transcript={transcript} targetGrade={targetGrade} metrics={metrics} />}

      {/* ── 마무리 단추 ───────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
          >
            <SparkIcon /> 내 답변 다시 만들기
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl border-[1.5px] border-dku-300 bg-white px-5 py-3 text-[14px] font-bold text-dku-700 transition hover:bg-dku-50"
          >
            유사 질문 연습하기
          </button>
        )}
        <button
          type="button"
          onClick={saveAll}
          disabled={saved || coachPending || llm.nativeTouch.length + llm.coaching.length === 0}
          className="rounded-xl border-[1.5px] border-dku-300 bg-white px-5 py-3 text-[14px] font-bold text-dku-700 transition hover:bg-dku-50 disabled:border-slate-200 disabled:text-slate-400"
        >
          {saved ? "✓ 단어장에 저장했어요" : "☆ 피드백 표현 저장"}
        </button>
      </div>

      <p className="mt-4 text-center text-[12px] text-slate-400">
        AI 예상 · 공식 OPIc 성적 아님 — 이번 답변 하나로 본 학습용 진단입니다.
      </p>
    </div>
  );
}

// ── 예상 등급 ────────────────────────────────────────────
function GradeCard({
  llm, targetGrade, metrics,
}: {
  llm: LlmFeedback;
  targetGrade: string;
  metrics: AnswerFeedback["metrics"];
}) {
  const lo = Math.min(GRADES.indexOf(llm.observed.from), GRADES.indexOf(llm.observed.to));
  const hi = Math.max(GRADES.indexOf(llm.observed.from), GRADES.indexOf(llm.observed.to));
  // 범위가 사다리를 거의 다 덮으면 판정이 안 된 것이다 (AI 가 꺼져 있을 때)
  const known = hi - lo < GRADES.length - 3;
  const t = GRADES.indexOf(targetGrade as Grade);

  return (
    <Panel
      tone="blue"
      icon={<TrophyIcon />}
      title="예상 OPIc 등급"
      aside={<span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-500">AI 예상 범위</span>}
    >
      <p className="mt-2 text-[44px] font-black leading-none tracking-[-0.03em] text-dku-600">
        {known ? (lo === hi ? GRADES[lo] : `${GRADES[lo]} ~ ${GRADES[hi]}`) : "—"}
      </p>
      <p className="mt-2 text-[14.5px] font-bold text-[#14234b]">
        {known ? llm.headline || llm.observed.gapNote : "AI 채점이 켜져 있을 때 범위를 판정합니다."}
      </p>

      <ol className="mt-4 grid grid-cols-9 gap-1">
        {GRADES.map((g, i) => {
          const on = known && i >= lo && i <= hi;
          return (
            <li key={g} className="text-center">
              <span
                className={`flex h-3.5 items-center justify-center rounded-full ${on ? "bg-dku-600" : "bg-[#dfe6f2]"} ${
                  i === t && !on ? "ring-2 ring-dku-300" : ""
                }`}
              >
                {on && <span className="h-1 w-1 rounded-full bg-white" />}
              </span>
              <span className={`mt-1.5 block text-[10.5px] font-bold ${on ? "text-dku-700" : i === t ? "text-slate-600" : "text-slate-400"}`}>
                {g}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-1 text-right text-[11px] text-slate-400">목표 {targetGrade} · {metrics.durationSec}초 · {metrics.wordCount}단어</p>

      <div className="mt-3 flex items-start gap-3 rounded-xl bg-white px-3.5 py-3">
        <span className="mt-0.5 shrink-0 text-dku-500">
          <BarsIcon />
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-dku-700">이런 점이 반영되었어요</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{llm.observed.note}</span>
        </span>
      </div>
      {llm.relevance.match !== "on" && known && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-800">
          {llm.relevance.verdict}
        </p>
      )}
    </Panel>
  );
}

// ── 문장 한 줄 ────────────────────────────────────────────
function SentenceRow({ no, c }: { no: number; c: LlmFeedback["coaching"][number] }) {
  const issues = c.issues?.length ? c.issues : c.ok ? [] : c.why ? [c.why] : [];
  const tone = TONES[(no - 1) % 3];
  return (
    <li className="grid gap-3 rounded-2xl border border-[#e3eaf5] bg-white px-4 py-4 lg:grid-cols-[44px_1fr_1fr_1.1fr_1.15fr] lg:gap-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-black ${tone.chip}`}>
        {String(no).padStart(2, "0")}
      </span>

      <Col label="원문" icon={<ChatIcon />} tone="text-slate-500">
        <p className="text-[14.5px] leading-snug text-slate-700">{c.quote}</p>
      </Col>

      <Col label={c.ok ? "그대로 좋아요" : "문제점"} icon={c.ok ? <CheckIcon /> : <AlertIcon />} tone={c.ok ? "text-emerald-600" : "text-red-500"}>
        {issues.length ? (
          <ul className="space-y-1">
            {issues.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-[13px] leading-snug text-slate-600">
                <span className="text-red-400">•</span>
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-slate-500">원어민도 이렇게 말합니다.</p>
        )}
      </Col>

      <Col label="더 자연스럽게" icon={<CheckIcon />} tone="text-emerald-600">
        <p className="text-[14.5px] leading-snug text-[#14234b]">
          <Marked text={c.better} marks={c.nativeEn ? [c.nativeEn] : []} />
        </p>
      </Col>

      <Col label="현지식 표현" icon={<StarIcon />} tone="text-amber-500">
        {c.nativeEn ? (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 rounded-xl bg-[#eef4fe] px-3 py-2.5">
              <p className="text-[14px] font-bold leading-snug text-dku-700">{c.nativeEn}</p>
              {c.nativeKo && <p className="mt-0.5 text-[12px] text-slate-500">{c.nativeKo}</p>}
            </div>
            <span className="flex shrink-0 flex-col gap-1.5">
              <SpeakButton text={c.better} />
              <CopyButton text={c.better} />
            </span>
          </div>
        ) : (
          <span className="flex gap-1.5">
            <SpeakButton text={c.better} />
            <CopyButton text={c.better} />
          </span>
        )}
      </Col>
    </li>
  );
}

function Col({ label, icon, tone, children }: { label: string; icon: ReactNode; tone: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={`mb-1.5 flex items-center gap-1.5 text-[13px] font-bold ${tone}`}>
        {icon}
        <span className="text-[#14234b]">{label}</span>
      </p>
      {children}
    </div>
  );
}

// ── 목표 구조 한 토막 ─────────────────────────────────────
function ModelStep({ no, part, last }: { no: number; part: LlmFeedback["modelAnswer"][number]; last: boolean }) {
  return (
    <>
      <li className="rounded-2xl border border-[#e3eaf5] bg-white px-4 py-4">
        <p className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-dku-50 text-[13px] font-black text-dku-700">{no}</span>
          <span className="text-dku-600">{[<PinIcon key="p" />, <HomeIcon key="h" />, <HeartIcon key="r" />][(no - 1) % 3]}</span>
          <span className="text-[15px] font-bold text-[#14234b]">{part.label}</span>
          {part.hint && <span className="min-w-0 truncate text-[12px] text-slate-400">{part.hint}</span>}
        </p>
        <p className="mt-2.5 text-[13.5px] leading-[1.7] text-slate-700">{part.text}</p>
      </li>
      {!last && <span className="hidden items-center text-slate-300 lg:flex">▶</span>}
    </>
  );
}

// ── 상세 분석 ─────────────────────────────────────────────
function Detail({
  llm, transcript, targetGrade, metrics,
}: {
  llm: LlmFeedback;
  transcript: string;
  targetGrade: string;
  metrics: AnswerFeedback["metrics"];
}) {
  return (
    <section className="mt-4 rounded-2xl bg-white px-5 py-5 sm:px-7">
      <p className="text-sm font-extrabold text-slate-900">내 답변</p>
      <p className="mt-2 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
        {transcript || "(발화 없음)"}
      </p>

      {llm.corrected && (
        <>
          <p className="mt-5 text-sm font-extrabold text-slate-900">첨삭 (문법만 최소 수정)</p>
          <p className="mt-2 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3.5 text-sm leading-relaxed text-emerald-900">
            {llm.corrected}
          </p>
        </>
      )}

      <p className="mt-5 text-sm font-extrabold text-slate-900">질문과 답변</p>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <dt className="text-xs text-slate-400">질문에서 요구한 내용</dt>
          <dd className="mt-0.5 text-slate-700">{llm.relevance.askedFor}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <dt className="text-xs text-slate-400">실제 답변</dt>
          <dd className="mt-0.5 text-slate-700">{llm.relevance.actuallySaid}</dd>
        </div>
      </dl>

      <p className="mt-5 text-sm font-extrabold text-slate-900">이번 답변 지표</p>
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
          <p className="mt-5 text-sm font-extrabold text-slate-900">목표 {targetGrade} 대비 부족한 점</p>
          <ul className="mt-2 space-y-1.5">
            {llm.gapToTarget.map((g, i) => (
              <li key={i} className="text-sm text-slate-600">• {g}</li>
            ))}
          </ul>
        </>
      )}

      {llm.summaryKo && (
        <div className="mt-5 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-5 py-4">
          <p className="text-sm font-extrabold text-indigo-700">총평</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{llm.summaryKo}</p>
        </div>
      )}
    </section>
  );
}

// ── 부품 ─────────────────────────────────────────────────
const PANEL: Record<"blue" | "green" | "orange", string> = {
  blue: "bg-[#e9f1fe]",
  green: "bg-[#e9f7ef]",
  orange: "bg-[#fff1e6]",
};

function Panel({
  tone, icon, title, aside, children,
}: {
  tone: keyof typeof PANEL;
  icon: ReactNode;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl px-4 py-4 sm:px-5 ${PANEL[tone]}`}>
      <header className="flex items-center gap-2.5">
        <span className="text-[22px]">{icon}</span>
        <span className="text-[17px] font-black text-[#14234b]">{title}</span>
        <span className="ml-auto">{aside}</span>
      </header>
      {children}
    </section>
  );
}

function Section({
  icon, title, hint, action, children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-3 rounded-2xl bg-white/70 px-4 py-4 sm:px-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-dku-50 text-dku-600">{icon}</span>
        <span className="text-[19px] font-black text-[#14234b]">{title}</span>
        {hint && <span className="text-[13px] text-slate-500">{hint}</span>}
        {action && <span className="ml-auto">{action}</span>}
      </header>
      {children}
    </section>
  );
}

function Pending({ text, rows }: { text: string; rows: number }) {
  return (
    <div className="mt-3 space-y-2" role="status" aria-live="polite">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white" />
      ))}
      <p className="flex items-center gap-2 text-[13px] font-semibold text-dku-600">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-dku-200 border-t-dku-600" />
        {text}
      </p>
    </div>
  );
}

const TONES = [
  { chip: "bg-rose-50 text-rose-500" },
  { chip: "bg-sky-50 text-sky-600" },
  { chip: "bg-violet-50 text-violet-600" },
];

const CARD_TONES = [
  { bg: "bg-[#eaf2ff]", text: "text-dku-700", tag: "bg-white text-dku-600" },
  { bg: "bg-[#e8f7ee]", text: "text-emerald-800", tag: "bg-white text-emerald-700" },
  { bg: "bg-[#f1ecff]", text: "text-violet-800", tag: "bg-white text-violet-700" },
  { bg: "bg-[#fff1e3]", text: "text-orange-700", tag: "bg-white text-orange-700" },
];

/** 문장 안에서 표현을 굵게 — 어디에 들어갔는지 눈에 보여야 따라 쓴다 */
function Marked({ text, marks }: { text: string; marks: string[] }) {
  const m = marks.find((x) => x && text.toLowerCase().includes(x.toLowerCase()));
  if (!m) return <>{text}</>;
  const at = text.toLowerCase().indexOf(m.toLowerCase());
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-extrabold text-dku-700">{text.slice(at, at + m.length)}</strong>
      {text.slice(at + m.length)}
    </>
  );
}

/** 여러 문장을 차례로 읽는다 — 하나가 끝나면 다음 */
function playAll(lines: string[]) {
  stopAudio();
  let i = 0;
  const next = () => {
    if (i >= lines.length) return;
    const text = lines[i++];
    let started = false;
    playPrompt(text, null, (speaking) => {
      if (speaking) started = true;
      else if (started) next();
    });
  };
  next();
}

function SpeakButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => playPrompt(text)}
      aria-label={`${text} 듣기`}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-dku-600 shadow-[0_1px_4px_rgba(15,40,90,0.12)] transition hover:bg-dku-50"
    >
      <PlayIcon />
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
      aria-label="문장 복사"
      title="복사"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_1px_4px_rgba(15,40,90,0.12)] transition hover:bg-slate-50"
    >
      {done ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

/** 머리의 로봇 — 장식 */
function Robot() {
  return (
    <svg viewBox="0 0 300 120" className="hidden h-[112px] w-auto shrink-0 sm:block" aria-hidden>
      <defs>
        <linearGradient id="rb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe8f6" />
        </linearGradient>
        <linearGradient id="rb-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d2b55" />
          <stop offset="1" stopColor="#0c1634" />
        </linearGradient>
        <linearGradient id="rb-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5aa2ff" />
          <stop offset="1" stopColor="#1f6fe6" />
        </linearGradient>
      </defs>
      {/* 손글씨 쪽지 */}
      <g transform="rotate(-6 60 55)">
        <rect x="8" y="18" width="104" height="72" rx="12" fill="#fff" stroke="#c9d7f0" />
        <text x="22" y="44" fontFamily="'Segoe Script','Brush Script MT',cursive" fontSize="14" fill="#1d2b55">Better</text>
        <text x="30" y="62" fontFamily="'Segoe Script','Brush Script MT',cursive" fontSize="14" fill="#1d2b55">English,</text>
        <text x="18" y="80" fontFamily="'Segoe Script','Brush Script MT',cursive" fontSize="13" fill="#1d2b55">A bigger you!</text>
      </g>
      {/* 로봇 */}
      <ellipse cx="180" cy="112" rx="40" ry="5" fill="#c9d7f0" opacity=".6" />
      <rect x="150" y="76" width="60" height="34" rx="14" fill="url(#rb-body)" stroke="#d3def0" />
      <rect x="140" y="20" width="80" height="62" rx="26" fill="url(#rb-body)" stroke="#d3def0" />
      <rect x="150" y="32" width="60" height="38" rx="18" fill="url(#rb-face)" />
      <path d="M163 50q5-6 10 0M187 50q5-6 10 0" stroke="#7fd3ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M172 59q8 6 16 0" stroke="#7fd3ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="136" cy="51" r="7" fill="url(#rb-blue)" />
      <circle cx="224" cy="51" r="7" fill="url(#rb-blue)" />
      <path d="M210 88q14-4 18-18" stroke="#d3def0" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* 막대그래프 말풍선 */}
      <rect x="236" y="30" width="56" height="48" rx="14" fill="url(#rb-blue)" />
      <path d="M244 78l-6 10 14-10z" fill="#1f6fe6" />
      <rect x="251" y="54" width="6" height="14" rx="3" fill="#fff" />
      <rect x="261" y="46" width="6" height="22" rx="3" fill="#fff" />
      <rect x="271" y="40" width="6" height="28" rx="3" fill="#fff" />
    </svg>
  );
}

// ── 아이콘 ───────────────────────────────────────────────
function I({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}
const TrophyIcon = () => <span className="text-amber-500"><I size={22}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></I></span>;
const BulbIcon = () => <span className="text-amber-500"><I size={20}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.5h6c0-1.2.4-1.9 1-2.5A6 6 0 0 0 12 3z" /></I></span>;
const TargetIcon = () => <span className="text-orange-500"><I size={20}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></I></span>;
const DocIcon = () => <I size={18}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></I>;
const SparkIcon = () => <I size={16}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></I>;
const PinIcon = () => <I size={15}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></I>;
const HomeIcon = () => <I size={15}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></I>;
const HeartIcon = () => <I size={15}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></I>;
const ChatIcon = () => <I size={14}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.3A8 8 0 1 1 21 12z" /></I>;
const AlertIcon = () => <I size={14}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></I>;
const CheckIcon = () => <I size={14}><path d="m5 12 5 5 9-10" /></I>;
const StarIcon = () => <I size={14}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></I>;
const BarsIcon = () => <I size={18}><path d="M5 20V10M12 20V4M19 20v-7" /></I>;
const PlayIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden><path d="M7 4v16l13-8z" fill="currentColor" /></svg>;
const CopyIcon = () => <I size={14}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></I>;

function FixIcon({ name }: { name: string }) {
  switch (name) {
    case "link": return <I><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></I>;
    case "pin": return <PinIcon />;
    case "clock": return <I><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>;
    case "list": return <I><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></I>;
    case "chat": return <ChatIcon />;
    default: return <SparkIcon />;
  }
}
