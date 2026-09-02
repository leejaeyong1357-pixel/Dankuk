"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Interviewer } from "@/components/Interviewer";
import { ExamTimer } from "@/components/ExamTimer";
import { EXAM_CONFIG } from "@/lib/exam/config";
import { allSlots, generateSecondSession, type ExamSlot } from "@/lib/exam/generator";
import { applySelection, type DifficultySelection } from "@/lib/exam/question-types";
import { appendHistory } from "@/lib/exam/history";
import { closeExam } from "@/lib/sync";
import {
  clearSession, loadSession, saveResult, saveSession, type ExamSessionState,
} from "@/lib/exam/session";
import { loadProfile } from "@/lib/store";
import type { DeterministicMetrics, ExamAnswer, UserProfile } from "@/lib/types";

type Stage = "greeting" | "question" | "readjust" | "finishing" | "error";

const CHOICES: { value: DifficultySelection; label: string; desc: string }[] = [
  { value: "EASIER", label: "더 쉬운 질문", desc: "지금 난이도가 버겁게 느껴졌다면" },
  { value: "SIMILAR", label: "비슷한 질문", desc: "지금 수준이 적당하다면" },
  { value: "HARDER", label: "더 어려운 질문", desc: "여유가 있어 더 높은 등급을 노린다면" },
];

/**
 * 실전 모의고사 본시험.
 *
 * 시험 중에는 STT 결과·문법 교정·점수·모범답안을 일절 표시하지 않는다.
 * 전사는 백그라운드로 돌려 종료 후 대기 시간만 줄이고, 화면에는 노출하지 않는다.
 */
export default function ExamRun() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<ExamSessionState | null>(null);
  const [stage, setStage] = useState<Stage>("greeting");
  const [index, setIndex] = useState(0);
  const [plays, setPlays] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selection, setSelection] = useState<DifficultySelection>("SIMILAR");
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef<ExamAnswer[]>([]);
  const pendingRef = useRef<Promise<unknown>[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const p = loadProfile();
    const s = loadSession();
    if (!p) { router.replace("/onboarding"); return; }
    if (!s) { router.replace("/mock"); return; }
    setProfile(p);
    setSession(s);
    // 새로고침해도 이어서 응시할 수 있도록 진행 상태를 복구한다.
    // (녹음 blob 은 복구되지 않지만, 이미 전사된 답변은 그대로 남는다)
    answersRef.current = s.answers ?? [];
    if (s.index > 0) {
      setIndex(s.index);
      const needsReadjust =
        s.index >= EXAM_CONFIG.firstSessionTarget && s.plan.secondSession.length === 0;
      setStage(needsReadjust ? "readjust" : "question");
    }
    setReady(true);
  }, [router]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  if (!ready || !profile || !session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">불러오는 중…</div>;
  }

  const slots: ExamSlot[] = allSlots(session.plan);
  const total = session.plan.totalQuestions;
  const slot = slots[Math.min(index, slots.length - 1)];

  /** 전사가 끝난 답변을 세션에 반영한다 (새로고침 대비) */
  function syncAnswers() {
    const cur = loadSession();
    if (cur) saveSession({ ...cur, answers: answersRef.current });
  }

  function persist(next: Partial<ExamSessionState>) {
    const merged = { ...session!, answers: answersRef.current, index, ...next };
    setSession(merged);
    saveSession(merged);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setRecorded(true);
      };
      rec.start();
      recorderRef.current = rec;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  }

  /** 답변을 저장하고 다음 문항으로. 전사는 백그라운드로 돌린다. */
  function next() {
    const blob = blobRef.current;
    const current = slot;
    if (blob) {
      const task = (async () => {
        const form = new FormData();
        form.append("audio", blob, "answer.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "음성 인식 실패");
        answersRef.current = [...answersRef.current, {
          no: current.no,
          questionId: current.question.id,
          questionType: current.question.questionType,
          session: current.session,
          isWarmup: current.isWarmup,
          transcript: json.transcript as string,
          metrics: json.metrics as DeterministicMetrics,
        }];
        syncAnswers();
      })().catch(() => {
        // 시험 흐름을 끊지 않는다. 무응답으로 남기고 종료 후 채점에 반영한다.
        answersRef.current = [...answersRef.current, {
          no: current.no,
          questionId: current.question.id,
          questionType: current.question.questionType,
          session: current.session,
          isWarmup: current.isWarmup,
          transcript: "",
          metrics: emptyMetrics(),
        }];
        syncAnswers();
      });
      pendingRef.current.push(task);
    }

    blobRef.current = null;
    setRecorded(false);
    setPlays(0);

    const nextIndex = index + 1;
    // 1st Session 을 마치면 난이도 재조정 화면
    if (nextIndex === EXAM_CONFIG.firstSessionTarget && session!.plan.secondSession.length === 0) {
      setStage("readjust");
      persist({ index: nextIndex });
      return;
    }
    if (nextIndex >= total) { void finish(); return; }
    setIndex(nextIndex);
    persist({ index: nextIndex });
    setTimeout(() => speak(slots[nextIndex].question.promptText), 400);
  }

  function confirmReadjust() {
    const full = generateSecondSession({
      plan: session!.plan,
      selection,
      selectedSurveyTopics: session!.surveyTopics,
      history: [],
    });
    const merged = { ...session!, plan: full, answers: answersRef.current, index: EXAM_CONFIG.firstSessionTarget };
    setSession(merged);
    saveSession(merged);
    setIndex(EXAM_CONFIG.firstSessionTarget);
    setStage("question");
    const nextSlots = allSlots(full);
    setTimeout(() => speak(nextSlots[EXAM_CONFIG.firstSessionTarget].question.promptText), 500);
  }

  async function finish() {
    setStage("finishing");
    window.speechSynthesis?.cancel();
    try {
      await Promise.allSettled(pendingRef.current);
      const answers = [...answersRef.current].sort((a, b) => a.no - b.no);
      const plan = session!.plan;

      const res = await fetch("/api/grade-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          targetGrade: profile!.targetGrade,
          initialDifficulty: plan.initialDifficulty,
          secondDifficulty: plan.secondDifficulty ?? plan.initialDifficulty,
          difficultySelection: plan.difficultySelection ?? "SIMILAR",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "채점 실패");

      const finishedAt = new Date().toISOString();
      const elapsedSec = Math.round(
        (new Date(finishedAt).getTime() - new Date(session!.startedAt).getTime()) / 1000,
      );
      const questionIds = slots.map((s) => s.question.id);

      // 서버에 남긴다. DB 가 없으면 no-op 이고 로컬 저장만 남는다.
      await closeExam({
        examId: plan.examId,
        secondDifficulty: plan.secondDifficulty ?? plan.initialDifficulty,
        difficultySelection: plan.difficultySelection ?? "SIMILAR",
        finishedAt,
        elapsedSec,
        grade: json.grade,
        gradeProvider: json.provider,
        testletIds: plan.usedTestletIds,
        questionIds,
        answers,
      });

      saveResult({
        examId: plan.examId,
        takenAt: session!.startedAt,
        finishedAt,
        initialDifficulty: plan.initialDifficulty,
        secondDifficulty: plan.secondDifficulty ?? plan.initialDifficulty,
        difficultySelection: plan.difficultySelection ?? "SIMILAR",
        targetGrade: profile!.targetGrade,
        elapsedSec,
        answers,
        grade: json.grade,
        provider: json.provider,
      });
      appendHistory({
        examId: plan.examId,
        takenAt: session!.startedAt,
        testletIds: plan.usedTestletIds,
        questionIds,
      });
      clearSession();
      router.push("/mock/result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "채점 중 오류가 발생했습니다.");
      setStage("error");
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header profile={profile} minimal />
      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* ── 면접관 등장 ─────────────────────── */}
        {stage === "greeting" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Interviewer speaking={speaking} caption="면접관" />
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight">
              지금부터 인터뷰를 시작합니다
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              총 {total}문항이 주어집니다. 각 문항은 최대 {EXAM_CONFIG.maxPlays}회까지 들을 수 있습니다.
              <br />
              답변 시간에는 제한이 없으며, 전체 시험 시간은 {EXAM_CONFIG.totalMinutes}분입니다.
            </p>
            <button
              type="button"
              onClick={() =>
                speak("Hello. My name is Ariel, and I'll be your interviewer today. Let's begin.")
              }
              className="mt-6 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ▶ 인사말 듣기
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("question");
                setTimeout(() => speak(slots[0].question.promptText), 300);
                setPlays(1);
              }}
              className="mt-3 block w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800"
            >
              1번 문항 시작 →
            </button>
          </div>
        )}

        {/* ── 문항 진행 ───────────────────────── */}
        {stage === "question" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-700">
                Question {slot.no} of {total}
              </span>
              <ExamTimer
                startedAt={session.startedAt}
                totalMinutes={EXAM_CONFIG.totalMinutes}
                onExpire={() => stage === "question" && void finish()}
              />
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-dku-600 transition-all"
                style={{ width: `${(slot.no / total) * 100}%` }}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
              <Interviewer speaking={speaking} caption={slot.isWarmup ? "자기소개" : "질문 중"} />

              {/* 실제 시험처럼 문항 텍스트는 표시하지 않는다. 듣고 답한다. */}
              <div className="mt-8 flex justify-center gap-2">
                <button
                  type="button"
                  disabled={plays >= EXAM_CONFIG.maxPlays || recording}
                  onClick={() => { setPlays((p) => p + 1); speak(slot.question.promptText); }}
                  className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {plays === 0 ? "▶ Listen" : `↺ Replay (${EXAM_CONFIG.maxPlays - plays}회 남음)`}
                </button>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-8">
                {!recording && !recorded && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="rounded-lg bg-dku-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-dku-800"
                    >
                      ● 답변 녹음 시작
                    </button>
                  </div>
                )}
                {recording && (
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-red-600">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                      녹음 중 {mmss}
                    </span>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-lg bg-slate-800 px-7 py-3 text-sm font-bold text-white transition hover:bg-slate-900"
                    >
                      ■ 답변 종료
                    </button>
                  </div>
                )}
                {recorded && (
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">답변 저장됨 · {mmss}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { blobRef.current = null; setRecorded(false); }}
                        className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        다시 녹음
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        className="rounded-lg bg-dku-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-dku-800"
                      >
                        {slot.no >= total ? "시험 종료 →" : "NEXT →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-5 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>시험 중에는 평가 결과가 표시되지 않습니다.</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("시험을 중단하시겠습니까? 지금까지의 답변은 저장되지 않습니다.")) {
                    clearSession();
                    router.push("/mock");
                  }
                }}
                className="font-bold hover:text-red-600"
              >
                시험 중단
              </button>
            </div>
          </>
        )}

        {/* ── 중간 난이도 재조정 ──────────────── */}
        {stage === "readjust" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-9 shadow-sm">
            <p className="text-xs font-bold text-slate-400">
              {EXAM_CONFIG.firstSessionTarget} / {total} 문항 완료 · 1st Session 종료
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">
              지금까지의 질문 난이도는 어떠셨나요?
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              남은 문항은 여기서 고른 난이도로 새로 출제됩니다. 현재 난이도는{" "}
              <strong className="text-dku-700">{session.plan.initialDifficulty}단계</strong>입니다.
            </p>

            <div className="mt-6 space-y-2.5">
              {CHOICES.map((c) => {
                const result = applySelection(session.plan.initialDifficulty, c.value);
                const noChange = result === session.plan.initialDifficulty && c.value !== "SIMILAR";
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelection(c.value)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition ${
                      selection === c.value ? "border-dku-600 bg-dku-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-base font-extrabold text-slate-900">{c.label}</p>
                      <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-xs font-extrabold text-white">
                        {session.plan.initialDifficulty}-{result}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {noChange ? `이미 ${result === 1 ? "최저" : "최고"} 난이도라 그대로 유지됩니다` : c.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={confirmReadjust}
              className="mt-7 w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800"
            >
              2nd Session 시작 →
            </button>
          </div>
        )}

        {/* ── 종료 / 분석 ─────────────────────── */}
        {stage === "finishing" && (
          <div className="py-24 text-center">
            <p className="text-2xl font-extrabold tracking-tight">시험이 종료되었습니다.</p>
            <div className="mx-auto mt-8 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-dku-600" />
            <p className="mt-6 text-sm text-slate-500">
              답변을 분석하고 있습니다. 창을 닫지 말아 주세요.
            </p>
          </div>
        )}

        {stage === "error" && (
          <div className="py-20 text-center">
            <p className="text-lg font-extrabold text-slate-900">분석 중 오류가 발생했습니다</p>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void finish()}
              className="mt-6 rounded-lg bg-dku-700 px-6 py-3 text-sm font-bold text-white"
            >
              다시 시도
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function emptyMetrics(): DeterministicMetrics {
  return {
    durationSec: 0, wordCount: 0, wpm: 0, fillerCount: 0, fillerRate: 0,
    connectorCount: 0, distinctConnectors: [], typeTokenRatio: 0,
    longestPauseSec: 0, pauseOverTwoSec: 0, pastTenseVerbCount: 0,
    koreanSpilloverSec: 0, koreanSpillover: false,
  };
}
