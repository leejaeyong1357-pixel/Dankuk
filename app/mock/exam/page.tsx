"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Interviewer } from "@/components/Interviewer";
import { ExamFooter, ExamTitle, NextButton } from "@/components/ExamChrome";
import { ExamTimer } from "@/components/ExamTimer";
import { playPrompt, stopAudio } from "@/lib/audio";
import { EXAM_CONFIG } from "@/lib/exam/config";
import type { ExamPlan, ExamSlot } from "@/lib/exam/types";
import { applySelection, type DifficultySelection } from "@/lib/exam/question-types";
import { appendHistory } from "@/lib/exam/history";
import { closeExam, generateSecondSessionRemote } from "@/lib/sync";
import {
  clearSession, loadSession, saveResult, saveSession, type ExamSessionState,
} from "@/lib/exam/session";
import { loadProfile, saveProfile } from "@/lib/store";
import { fetchMe } from "@/lib/sync";
import type { DeterministicMetrics, ExamAnswer, Transcript, UserProfile } from "@/lib/types";

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
  const [live, setLive] = useState<{ final: string; partial: string }>({ final: "", partial: "" });
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selection, setSelection] = useState<DifficultySelection>("SIMILAR");
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef<ExamAnswer[]>([]);
  const pendingRef = useRef<Promise<unknown>[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** 브라우저 음성 인식. 녹음과 함께 시작해 함께 멈춘다 */
  const sttRef = useRef<{ stop: () => Promise<Transcript> } | null>(null);
  const transcriptRef = useRef<Transcript | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
    const me = await fetchMe();
    if (cancelled) return;
    // DB 가 켜져 있으면 서버 세션이 정본이다
    const p = me?.dbEnabled ? me.user : loadProfile();
    if (me?.dbEnabled && me.user) saveProfile(me.user);
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
    })();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopAudio();
  }, []);

  /**
   * 문항 음성 재생.
   *
   * 사전 생성한 파일(Kokoro)이 있으면 그것을 쓴다. 시험에서는 음성이 곧 문제이므로
   * 모든 학생이 같은 음성을 들어야 한다. 브라우저 음성은 OS·브라우저마다 달라
   * 개발 중 폴백으로만 쓴다.
   */
  const speak = useCallback((text: string, audioUrl?: string | null) => {
    // 공용 재생기가 앞의 소리를 먼저 끊는다 (두 번 누르면 겹쳐 들리던 문제)
    playPrompt(text, audioUrl, setSpeaking);
  }, []);

  if (!ready || !profile || !session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">불러오는 중…</div>;
  }

  const slots: ExamSlot[] = session.slots;
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

  /**
   * 답변 받기 — 소리 파일을 남기지 않고 말하는 즉시 인식한다.
   *
   * 채점에 쓰는 것은 전사 결과뿐이라 오디오를 따로 저장할 이유가 없다.
   * 인식 결과를 화면에 흘려 보여 주므로 응시자가 자기 발화를 눈으로 확인한다.
   */
  async function startRecording() {
    setError(null);
    setLive({ final: "", partial: "" });
    try {
      // 인식기가 마이크를 직접 잡지만, 권한 거부는 여기서 먼저 잡는다
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
      return;
    }
    // 전사는 서버가 아니라 브라우저에서 한다 (정적 배포에서도 동작하도록)
    const { startBrowserStt } = await import("@/lib/stt-browser");
    transcriptRef.current = null;
    sttRef.current = startBrowserStt(setLive);
    setSeconds(0);
    setRecording(true);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    const stt = sttRef.current;
    sttRef.current = null;
    setRecording(false);
    setRecorded(true);
    if (stt) {
      transcriptRef.current = null;
      void stt.stop().then((t) => {
        transcriptRef.current = t;
        setLive({ final: t.text, partial: "" });
      });
    }
  }

  /** 답변을 저장하고 다음 문항으로. 전사는 백그라운드로 돌린다. */
  function next() {
    const current = slot;
    {
      const task = (async () => {
        // 인식이 아직 끝나지 않았을 수 있으므로 잠깐 기다린다
        for (let i = 0; i < 20 && !transcriptRef.current; i++) {
          await new Promise((r) => setTimeout(r, 150));
        }
        const t = transcriptRef.current;
        transcriptRef.current = null;
        if (!t) throw new Error("음성 인식 실패");
        const { metricsFor } = await import("@/lib/client-engine");
        answersRef.current = [...answersRef.current, {
          no: current.no,
          questionId: current.question.id,
          questionType: current.question.questionType,
          session: current.session,
          isWarmup: current.isWarmup,
          transcript: t.text,
          metrics: metricsFor(t),
          promptText: current.question.promptText,
          probeType: current.question.probeType,
          topicKo: current.topicKo,
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
          promptText: current.question.promptText,
          probeType: current.question.probeType,
          topicKo: current.topicKo,
        }];
        syncAnswers();
      });
      pendingRef.current.push(task);
    }

    setRecorded(false);
    setLive({ final: "", partial: "" });
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
    setTimeout(() => speak(slots[nextIndex].question.promptText, slots[nextIndex].question.promptAudio), 400);
  }

  async function confirmReadjust() {
    setError(null);
    // 2nd Session 도 서버에서 만든다. 남은 문제지를 브라우저가 미리 알 수 없다.
    const res = await generateSecondSessionRemote({
      plan: session!.plan,
      selection,
      topics: session!.surveyTopics,
    });
    if (!res?.plan) {
      setError("남은 문제지를 만들지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    const nextSlots = res.slots as ExamSlot[];
    const merged = {
      ...session!,
      plan: res.plan as ExamPlan,
      slots: nextSlots,
      answers: answersRef.current,
      index: EXAM_CONFIG.firstSessionTarget,
    };
    setSession(merged);
    saveSession(merged);
    setIndex(EXAM_CONFIG.firstSessionTarget);
    setStage("question");
    const q = nextSlots[EXAM_CONFIG.firstSessionTarget].question;
    setTimeout(() => speak(q.promptText, q.promptAudio), 500);
  }

  async function finish() {
    setStage("finishing");
    stopAudio();
    try {
      await Promise.allSettled(pendingRef.current);
      const answers = [...answersRef.current].sort((a, b) => a.no - b.no);
      const plan = session!.plan;

      // 채점도 브라우저에서 한다. 키가 있으면 Claude, 없으면 지표 기반.
      const { gradeExamLocal } = await import("@/lib/client-engine");
      const json = await gradeExamLocal({
        answers,
        targetGrade: profile!.targetGrade,
        initialDifficulty: plan.initialDifficulty,
        secondDifficulty: plan.secondDifficulty ?? plan.initialDifficulty,
        difficultySelection: plan.difficultySelection ?? "SIMILAR",
      });

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
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-9 text-center shadow-sm sm:px-10">
            <ExamTitle />
            <p className="mt-5 text-sm text-slate-700">
              지금부터 English 말하기 평가를 시작하겠습니다.
            </p>

            <div className="mt-6 flex justify-center">
              <Interviewer speaking={speaking} size="lg" />
            </div>

            <p className="mt-5 text-sm text-slate-700">
              본 인터뷰 평가의 진행자는 <strong className="font-extrabold">Ariel</strong> 입니다.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              총 {total}문항이 주어집니다. 각 문항은 최대 {EXAM_CONFIG.maxPlays}회까지 들을 수 있고,
              답변 시간에는 제한이 없습니다. 전체 시험 시간은 {EXAM_CONFIG.totalMinutes}분입니다.
            </p>

            <button
              type="button"
              onClick={() =>
                speak("Hello. My name is Ariel, and I'll be your interviewer today. Let's begin.")
              }
              className="mt-5 rounded-md border border-slate-300 px-5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              ▶ 인사말 듣기
            </button>

            <div className="mt-7 flex justify-center">
              <NextButton
                onClick={() => {
                  setStage("question");
                  setTimeout(() => speak(slots[0].question.promptText, slots[0].question.promptAudio), 300);
                  setPlays(1);
                }}
              >
                Next
              </NextButton>
            </div>

            <ExamFooter />
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

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-9 shadow-sm sm:px-10">
              <ExamTitle />

              <div className="mt-6 flex justify-center">
                <Interviewer speaking={speaking} caption={slot.isWarmup ? "자기소개" : "질문 중"} />
              </div>

              {/* 실제 시험처럼 문항 텍스트는 표시하지 않는다. 듣고 답한다. */}
              <div className="mt-6 flex justify-center gap-2">
                <button
                  type="button"
                  disabled={plays >= EXAM_CONFIG.maxPlays || recording}
                  onClick={() => { setPlays((p) => p + 1); speak(slot.question.promptText, slot.question.promptAudio); }}
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
                      🎙 답변 시작
                    </button>
                  </div>
                )}
                {recording && (
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-red-600">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                      말하는 중 {mmss}
                    </span>
                    <LiveText live={live} listening />
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
                    <span className="text-sm font-semibold text-slate-600">
                      답변 저장됨 · {mmss} ·{" "}
                      {live.final.trim().split(/\s+/).filter(Boolean).length}단어
                    </span>
                    <LiveText live={live} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { transcriptRef.current = null; setRecorded(false); setLive({ final: "", partial: "" }); }}
                        className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        다시 답하기
                      </button>
                      <NextButton onClick={next}>
                        {slot.no >= total ? "시험 종료" : "Next"}
                      </NextButton>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-5 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <ExamFooter />
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
            <h1 className="mt-1.5 text-2xl font-extrabold">
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

            <div className="mt-7">
              <NextButton full onClick={() => void confirmReadjust()}>
                2nd Session 시작
              </NextButton>
            </div>
          </div>
        )}

        {/* ── 종료 / 분석 ─────────────────────── */}
        {stage === "finishing" && (
          <div className="py-24 text-center">
            <p className="text-2xl font-extrabold">시험이 종료되었습니다.</p>
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

/**
 * 말하는 동안 인식된 문장을 그대로 흘려 보여 준다.
 *
 * 확정된 부분은 진하게, 아직 확정되지 않은 부분은 흐리게 둔다.
 * 마이크가 살아 있는지, 내 말이 제대로 들어가고 있는지를 응시자가 바로 안다.
 */
function LiveText({ live, listening }: { live: { final: string; partial: string }; listening?: boolean }) {
  const empty = !live.final && !live.partial;
  return (
    <div className="max-h-40 w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[15px] leading-relaxed">
      {empty ? (
        <p className="text-sm text-slate-400">
          {listening ? "말씀하세요. 말하는 대로 여기에 바로 나타납니다." : "인식된 답변이 없습니다."}
        </p>
      ) : (
        <p className="text-slate-900">
          {live.final}
          {live.partial && (
            <>
              {live.final && " "}
              <span className="text-slate-400">{live.partial}</span>
            </>
          )}
          {listening && (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-dku-600 align-middle" />
          )}
        </p>
      )}
    </div>
  );
}
