"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Recorder } from "@/components/Recorder";
import { buildExam, seedFrom, questionCount } from "@/lib/exam-engine";
import { clearSession, loadSession, saveResult, saveSession } from "@/lib/exam-session";
import type { DeterministicMetrics, ExamAnswer, SecondChoice, UserProfile } from "@/lib/types";

type Stage = "orientation" | "question" | "difficulty" | "grading";

const CHOICES: { value: SecondChoice; label: string; desc: string }[] = [
  { value: "easier", label: "더 쉬운 질문", desc: "지금 난이도가 버겁게 느껴졌다면" },
  { value: "similar", label: "비슷한 질문", desc: "지금 수준이 적당하다면 (대부분 권장)" },
  { value: "harder", label: "더 어려운 질문", desc: "여유가 있어 더 높은 등급을 노린다면" },
];

export default function MockExam() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("orientation");
  const [index, setIndex] = useState(0);
  const [secondChoice, setSecondChoice] = useState<SecondChoice>("similar");
  // 답변은 화면에 그리지 않으므로 state 가 아니라 ref 에 쌓는다.
  // 채점 시점에 state 업데이트 반영을 기다릴 필요가 없어진다.
  const answersRef = useRef<ExamAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const [replays, setReplays] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const seedRef = useRef<number | null>(null);
  const startedRef = useRef<string>(new Date().toISOString());

  // 전사는 시험 진행과 겹쳐 백그라운드로 돌린다. 종료 후 대기 시간을 줄이기 위함이다.
  const pending = useRef<Promise<void>[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (s) {
      seedRef.current = s.seed;
      startedRef.current = s.startedAt;
    }
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  return (
    <AppShell>
      {(profile: UserProfile) => {
        if (seedRef.current === null) {
          seedRef.current = seedFrom(`${profile.email}:${startedRef.current}`);
        }
        const exam = buildExam(profile.survey, profile.selfAssessment, seedRef.current);
        const total = Math.min(exam.length, questionCount(profile.selfAssessment));
        const slot = exam[Math.min(index, total - 1)];

        function persist(next: Partial<{ index: number; secondChoice: SecondChoice }>) {
          saveSession({
            seed: seedRef.current!,
            startedAt: startedRef.current,
            index: next.index ?? index,
            secondChoice: next.secondChoice ?? secondChoice,
            answers: {},
          });
        }

        function advance() {
          const nextIndex = index + 1;
          // 7번 문항을 마치면 2차 난이도 선택 화면이 뜬다 (실제 시험과 동일)
          if (index + 1 === 7 && total > 7) {
            setStage("difficulty");
            return;
          }
          if (nextIndex >= total) {
            void finish();
            return;
          }
          setIndex(nextIndex);
          setReplays(0);
          persist({ index: nextIndex });
        }

        async function submit(blob: Blob) {
          setBusy(true);
          setError(null);
          const no = slot.no;
          const questionId = slot.question.id;

          // 전사를 기다리지 않고 다음 문항으로 넘어간다.
          const task = (async () => {
            const form = new FormData();
            form.append("audio", blob, "answer.webm");
            const res = await fetch("/api/transcribe", { method: "POST", body: form });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "음성 인식에 실패했습니다.");
            const entry: ExamAnswer = {
              no,
              questionId,
              transcript: json.transcript as string,
              metrics: json.metrics as DeterministicMetrics,
            };
            answersRef.current = [...answersRef.current, entry];
          })().catch((e) => {
            setError(e instanceof Error ? e.message : "음성 인식 오류");
          });

          pending.current.push(task);
          setBusy(false);
          advance();
        }

        async function finish() {
          setStage("grading");
          try {
            await Promise.allSettled(pending.current);
            const sorted = [...answersRef.current].sort((a, b) => a.no - b.no);

            const res = await fetch("/api/grade-exam", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                answers: sorted,
                targetGrade: profile.targetGrade,
                selfAssessment: profile.selfAssessment,
                secondChoice,
              }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "채점에 실패했습니다.");

            saveResult({
              takenAt: startedRef.current,
              selfAssessment: profile.selfAssessment,
              secondChoice,
              targetGrade: profile.targetGrade,
              answers: sorted,
              grade: json.grade,
              provider: json.provider,
            });
            clearSession();
            router.push("/mock/result");
          } catch (e) {
            setError(e instanceof Error ? e.message : "채점 오류");
            setStage("question");
          }
        }

        // ── 오리엔테이션 ──────────────────────────────
        if (stage === "orientation") {
          return (
            <div className="mx-auto max-w-2xl py-8 text-center">
              <p className="text-6xl">🎧</p>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
                Ava와의 인터뷰를 시작합니다
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                지금부터 {total}개의 질문이 주어집니다.
                <br />
                각 질문은 한 번 더 들을 수 있으며, 답변 시간에는 제한이 없습니다.
                <br />
                편안하게, 하지만 최대한 자세히 답변해 주세요.
              </p>
              <button
                type="button"
                onClick={() =>
                  speak(
                    "Hello, my name is Ava. I'll be asking you some questions today. Let's get started.",
                  )
                }
                className="mt-6 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white"
              >
                ▶ Ava 인사말 듣기
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage("question");
                  speak(exam[0].question.textEn);
                }}
                className="mt-4 block w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800"
              >
                1번 문항으로 →
              </button>
            </div>
          );
        }

        // ── 2차 난이도 선택 (7번 문항 후) ─────────────
        if (stage === "difficulty") {
          return (
            <div className="mx-auto max-w-2xl py-8">
              <p className="text-xs font-bold text-slate-400">7 / {total} 문항 완료</p>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">
                남은 문항의 난이도를 선택해 주세요
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                지금까지의 질문이 어떠셨나요? 남은 문항의 난이도를 한 번 조정할 수 있습니다.
              </p>

              <div className="mt-6 space-y-2.5">
                {CHOICES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSecondChoice(c.value)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition ${
                      secondChoice === c.value
                        ? "border-dku-600 bg-dku-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-base font-extrabold text-slate-900">{c.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.desc}</p>
                  </button>
                ))}
              </div>

              <p className="mt-4 rounded-lg bg-slate-100 p-3 text-xs leading-relaxed text-slate-600">
                이 선택은 문제 세트를 바꾸지 않고 표현 수준만 조정합니다.
                처음 고른 난이도가 이미 적절하다면 &ldquo;비슷한 질문&rdquo;을 권합니다.
              </p>

              <button
                type="button"
                onClick={() => {
                  setStage("question");
                  setIndex(7);
                  setReplays(0);
                  persist({ index: 7, secondChoice });
                  speak(exam[7].question.textEn);
                }}
                className="mt-6 w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800"
              >
                계속하기 →
              </button>
            </div>
          );
        }

        // ── 채점 대기 ────────────────────────────────
        if (stage === "grading") {
          return (
            <div className="mx-auto max-w-lg py-20 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-dku-600" />
              <p className="mt-6 text-lg font-extrabold text-slate-900">채점 중입니다</p>
              <p className="mt-2 text-sm text-slate-500">
                답변 전체를 한 번에 평가하고 있습니다. 창을 닫지 말아 주세요.
              </p>
              {error && (
                <p className="mt-5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>
          );
        }

        // ── 문항 진행 ────────────────────────────────
        return (
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-extrabold text-white">
                {slot.setLabel}
              </span>
              <span className="text-sm font-extrabold text-dku-700">
                {slot.no} / {total}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-dku-600 transition-all"
                style={{ width: `${(slot.no / total) * 100}%` }}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dku-100 text-lg">
                  🎧
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Ava</p>
                  <p className="text-xs text-slate-400">문항을 듣고 답변하세요</p>
                </div>
              </div>

              {/*
                실제 시험은 문항 텍스트를 보여주지 않는다. 듣기만 한다.
                모의고사도 동일하게 하되, 다시 듣기를 1회 허용한다.
              */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => speak(slot.question.textEn)}
                  className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                >
                  ▶ 문항 재생
                </button>
                <button
                  type="button"
                  disabled={replays >= 1}
                  onClick={() => {
                    setReplays((r) => r + 1);
                    speak(slot.question.textEn);
                  }}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-300"
                >
                  ↺ 다시 듣기 {replays >= 1 ? "(사용함)" : "(1회)"}
                </button>
              </div>

              <div className="mt-6">
                <Recorder key={slot.no} onSubmit={submit} busy={busy} />
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-between text-xs text-slate-400">
              <span>답변 후 자동으로 다음 문항으로 넘어갑니다.</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("시험을 중단하시겠습니까? 지금까지의 답변은 저장되지 않습니다.")) {
                    clearSession();
                    router.push("/mock");
                  }
                }}
                className="font-bold text-slate-400 hover:text-red-600"
              >
                시험 중단
              </button>
            </div>
          </div>
        );
      }}
    </AppShell>
  );
}
