"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SurveyForm } from "@/components/SurveyForm";
import { LevelPicker } from "@/components/LevelPicker";
import { Interviewer } from "@/components/Interviewer";
import { EXAM_CONFIG, totalQuestions } from "@/lib/exam/config";
import { emptyAnswers, isSurveyComplete, selectedSurveyTopics, type SurveyAnswers } from "@/lib/exam/survey";
import type { DifficultyLevel } from "@/lib/exam/question-types";
import type { ExamPlan, ExamSlot } from "@/lib/exam/types";
import { generateFirstSessionRemote } from "@/lib/sync";
import { clearSession, latestResult, saveSession } from "@/lib/exam/session";
import { loadProfile, saveProfile } from "@/lib/store";

/**
 * 실전 모의고사 진입 흐름 (docs/SPEC §5.4).
 *   Background Survey -> Self Assessment -> 마이크 테스트 -> Sample Question -> 본시험
 */
type Step = "intro" | "survey" | "level" | "setup" | "sample";

const RECOMMENDED: Record<string, DifficultyLevel> = {
  IL: 2, IM2: 3, IM3: 4, IH: 5, AL: 6,
};

const SAMPLE_QUESTION =
  "Sample question. What is your favorite season, and what do you usually do in that season?";

export default function MockStart() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [survey, setSurvey] = useState<SurveyAnswers>(emptyAnswers());
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [testRecording, setTestRecording] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [micChecked, setMicChecked] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [samplePlays, setSamplePlays] = useState(0);
  const [sampleRecording, setSampleRecording] = useState(false);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const testRecorderRef = useRef<MediaRecorder | null>(null);
  const sampleRecorderRef = useRef<MediaRecorder | null>(null);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  /** 권한 확인에 그치지 않고 실제로 녹음해 재생까지 해 본다 */
  async function startTestRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (blob.size === 0) {
          setMicError("녹음된 소리가 없습니다. 마이크 입력을 확인해 주세요.");
          return;
        }
        setTestAudioUrl(URL.createObjectURL(blob));
      };
      rec.start();
      testRecorderRef.current = rec;
      setTestRecording(true);
    } catch {
      setMicError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
    }
  }

  function stopTestRecording() {
    testRecorderRef.current?.stop();
    setTestRecording(false);
  }

  /** Sample Question 답변 연습 — 실제 시험과 같은 방식으로 녹음해 본다 */
  async function startSampleRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setSampleAudioUrl(URL.createObjectURL(new Blob(chunks, { type: "audio/webm" })));
      };
      rec.start();
      sampleRecorderRef.current = rec;
      setSampleRecording(true);
    } catch {
      setMicError("마이크 권한이 필요합니다.");
    }
  }

  function stopSampleRecording() {
    sampleRecorderRef.current?.stop();
    setSampleRecording(false);
  }

  async function begin() {
    if (!level || starting) return;
    setStarting(true);
    const topics = selectedSurveyTopics(survey);
    const startedAt = new Date().toISOString();

    // 출제는 서버에서 한다. 문항 뱅크를 브라우저로 내려보내지 않는다.
    const res = await generateFirstSessionRemote({
      survey, topics, initialDifficulty: level, startedAt,
    });
    if (!res?.plan) {
      setStarting(false);
      setStartError("문제지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const plan = res.plan as ExamPlan;
    const slots = res.slots as ExamSlot[];
    clearSession();
    saveSession({
      plan,
      slots,
      survey,
      surveyTopics: topics,
      initialDifficulty: level,
      startedAt,
      answers: [],
      index: 0,
    });
    // 다음 시험과 연습 모드의 기본값으로 재사용
    const profile = loadProfile();
    if (profile) saveProfile({ ...profile, lastSurvey: survey, lastDifficulty: level });
    router.push("/mock/exam");
  }

  return (
    <AppShell>
      {(profile) => {
        const prev = latestResult();
        const recommended = RECOMMENDED[profile.targetGrade];

        // 공식 진행 프로세스의 오리엔테이션(OT) 4단계와 이름·순서를 맞춘다
        const steps: { key: Step; no: number; label: string }[] = [
          { key: "survey", no: 1, label: "Background Survey" },
          { key: "level", no: 2, label: "Self Assessment" },
          { key: "setup", no: 3, label: "Pre-Test Setup" },
          { key: "sample", no: 4, label: "Sample Question" },
        ];
        const stepIndex = steps.findIndex((s) => s.key === step);

        return (
          <div className="mx-auto max-w-3xl">
            {step !== "intro" && (
              <div className="mb-7">
                <p className="mb-2 text-[11px] font-extrabold tracking-wide text-slate-400">
                  오리엔테이션 (OT)
                </p>
                <div className="flex gap-2">
                  {steps.map((s, i) => (
                    <div key={s.key} className="flex-1">
                      <div className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-dku-600" : "bg-slate-200"}`} />
                      <p className={`mt-2 text-[11px] font-bold ${i <= stepIndex ? "text-dku-700" : "text-slate-400"}`}>
                        <span className="mr-1">{s.no}</span>{s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 안내 ─────────────────────────────── */}
            {step === "intro" && (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight">실전 모의고사</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  실제 OPIc 과 같은 순서로 진행합니다. 시험 중에는 첨삭이나 모범답안이 표시되지 않습니다.
                </p>

                {prev && (
                  <Link
                    href="/mock/result"
                    className="mt-5 flex items-center justify-between rounded-xl border border-dku-200 bg-dku-50 px-5 py-3.5 transition hover:bg-dku-100"
                  >
                    <span className="text-sm font-bold text-dku-800">
                      지난 응시 결과 · AI 예상 등급 {prev.grade.grade} (
                      {prev.initialDifficulty}-{prev.secondDifficulty},{" "}
                      {prev.takenAt.slice(0, 10)})
                    </span>
                    <span className="text-sm font-bold text-dku-700">→</span>
                  </Link>
                )}

                <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h2 className="text-lg font-extrabold text-slate-900">진행 프로세스</h2>

                  <p className="mt-4 text-[11px] font-extrabold tracking-wide text-slate-400">
                    오리엔테이션 (OT)
                  </p>
                  <ol className="mt-2 space-y-2 text-sm text-slate-700">
                    {[
                      ["Background Survey", "평가문항을 위한 사전 설문"],
                      ["Self Assessment", "평가의 난이도 결정을 위한 수준 선택"],
                      ["Pre-Test Setup", "질문 청취 및 답변 녹음 기능 사전 점검"],
                      ["Sample Question", "화면 구성, 청취 및 답변 방법 안내, 답변 연습"],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-extrabold text-slate-600">
                          {i + 1}
                        </span>
                        <span>
                          <strong className="font-bold">{t}</strong>
                          <span className="block text-xs text-slate-500">{d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <p className="mt-5 text-[11px] font-extrabold tracking-wide text-dku-600">
                    본 시험
                  </p>
                  <ol className="mt-2 space-y-2 text-sm text-slate-700">
                    {[
                      ["1st Session", `개인 맞춤형 문항 (약 ${EXAM_CONFIG.firstSessionTarget}문항) · 질문 청취 ${EXAM_CONFIG.maxPlays}회 · 문항별 답변시간 제한 없음`],
                      ["난이도 재조정", "2차 난이도 선택 · 쉬운 / 비슷한 / 어려운 질문 中 선택"],
                      ["2nd Session", `개인 맞춤형 문항 (약 5~8문항) · 질문 청취 ${EXAM_CONFIG.maxPlays}회 · 문항별 답변시간 제한 없음`],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dku-600 text-[11px] font-extrabold text-white">
                          {i + 5}
                        </span>
                        <span>
                          <strong className="font-bold">{t}</strong>
                          <span className="block text-xs text-slate-500">{d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-5 rounded-lg bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800">
                    전체 제한 시간은 <strong>{EXAM_CONFIG.totalMinutes}분</strong>이며 문항별 답변시간
                    제한은 없습니다. 시험이 끝나기 전까지 채점 결과·첨삭·모범답안은 표시되지 않습니다.
                  </p>
                </section>

                <button
                  type="button"
                  onClick={() => setStep("survey")}
                  className="mt-6 w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800"
                >
                  시작하기 →
                </button>
              </>
            )}

            {/* ── Background Survey ────────────────── */}
            {step === "survey" && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Background Survey</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  질문을 읽고 정확히 답변해 주세요.
                  <strong className="text-slate-700"> 이 응답을 기초로 개인별 문항이 출제됩니다.</strong>
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <SurveyForm answers={survey} onChange={setSurvey} />
                </div>
                <NavButtons
                  onBack={() => setStep("intro")}
                  onNext={() => setStep("level")}
                  nextDisabled={!isSurveyComplete(survey)}
                />
              </>
            )}

            {/* ── Self Assessment ──────────────────── */}
            {step === "level" && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Self Assessment</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  본인 수준에 가장 가까운 단계를 고르세요. 이 선택이 문제 세트와 문항 수를 결정합니다.
                </p>
                <div className="mt-6">
                  <LevelPicker value={level} onChange={setLevel} recommended={recommended} />
                </div>
                {level && (
                  <p className="mt-4 rounded-lg bg-dku-50 p-3.5 text-xs leading-relaxed text-dku-800">
                    난이도 <strong>{level}단계</strong>를 선택하면 총{" "}
                    <strong>{totalQuestions(level)}문항</strong>이 출제됩니다.
                    7번 문항 후 한 번 더 조정하므로 최종 난이도는{" "}
                    <strong>{level}-{Math.max(1, level - 1)}</strong> ·{" "}
                    <strong>{level}-{level}</strong> ·{" "}
                    <strong>{level}-{Math.min(6, level + 1)}</strong> 중 하나가 됩니다.
                  </p>
                )}
                <NavButtons
                  onBack={() => setStep("survey")}
                  onNext={() => setStep("setup")}
                  nextDisabled={!level}
                />
              </>
            )}

            {/* ── Pre-Test Setup ───────────────────── */}
            {step === "setup" && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Pre-Test Setup</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  질문 청취와 답변 녹음 기능을 미리 점검합니다. 헤드셋을 착용하고 조용한 곳에서
                  진행해야 인식률이 올라갑니다.
                </p>

                <div className="mt-6 space-y-3">
                  {/* 1) 질문 청취 점검 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">1) 질문 청취 점검</p>
                        <p className="mt-1 text-xs text-slate-500">
                          면접관 음성이 또렷하게 들리는지 확인합니다.
                        </p>
                      </div>
                      {soundPlayed && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                          확인
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        speak("Hello. This is a sound check. If you can hear me clearly, you are ready.");
                        setSoundPlayed(true);
                      }}
                      className="mt-4 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                    >
                      ▶ 음성 재생
                    </button>
                  </div>

                  {/* 2) 답변 녹음 기능 점검 — 실제로 녹음하고 다시 들어본다 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">2) 답변 녹음 점검</p>
                        <p className="mt-1 text-xs text-slate-500">
                          아무 말이나 5초 정도 녹음한 뒤 다시 들어보세요.
                          본인 목소리가 들려야 실제 시험에서 답변이 저장됩니다.
                        </p>
                      </div>
                      {micChecked && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                          확인
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!testRecording && (
                        <button
                          type="button"
                          onClick={startTestRecording}
                          className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
                        >
                          ● {testAudioUrl ? "다시 녹음" : "녹음 시작"}
                        </button>
                      )}
                      {testRecording && (
                        <>
                          <span className="flex items-center gap-2 text-sm font-bold text-red-600">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                            녹음 중
                          </span>
                          <button
                            type="button"
                            onClick={stopTestRecording}
                            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                          >
                            ■ 녹음 종료
                          </button>
                        </>
                      )}
                      {testAudioUrl && !testRecording && (
                        <button
                          type="button"
                          onClick={() => {
                            void new Audio(testAudioUrl).play();
                            setMicChecked(true);
                          }}
                          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          ▶ 녹음 확인
                        </button>
                      )}
                    </div>

                    {micError && (
                      <p className="mt-3 text-xs font-bold text-red-600">{micError}</p>
                    )}
                  </div>
                </div>

                <NavButtons
                  onBack={() => setStep("level")}
                  onNext={() => setStep("sample")}
                  nextDisabled={!soundPlayed || !micChecked}
                  nextHint={
                    !soundPlayed || !micChecked
                      ? "두 항목을 모두 점검해야 다음으로 넘어갈 수 있습니다"
                      : undefined
                  }
                />
              </>
            )}

            {/* ── Sample Question ──────────────────── */}
            {step === "sample" && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Sample Question</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  실제 시험 화면 구성과 답변 방법을 안내하는 연습 문항입니다. 채점되지 않습니다.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-700">Sample Question</span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                      ⏱ 40:00
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-0 rounded-full bg-dku-600" />
                  </div>

                  <div className="mt-8">
                    <Interviewer speaking={speaking} caption="연습 문항" />
                  </div>

                  <p className="mt-6 text-center text-sm leading-relaxed text-slate-600">
                    실제 시험에서는 <strong className="text-slate-800">문항이 화면에 표시되지 않습니다.</strong>
                    <br />
                    면접관의 음성을 듣고 답변하며, 문항당 최대 {EXAM_CONFIG.maxPlays}회까지 들을 수 있습니다.
                  </p>

                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      disabled={samplePlays >= EXAM_CONFIG.maxPlays}
                      onClick={() => { setSamplePlays((n) => n + 1); speak(SAMPLE_QUESTION); }}
                      className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {samplePlays === 0
                        ? "▶ Listen"
                        : `↺ Replay (${EXAM_CONFIG.maxPlays - samplePlays}회 남음)`}
                    </button>
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-8">
                    <p className="text-center text-xs font-bold text-slate-400">답변 연습</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      {!sampleRecording && !sampleAudioUrl && (
                        <button
                          type="button"
                          disabled={samplePlays === 0}
                          onClick={startSampleRecording}
                          className="rounded-lg bg-dku-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          ● 답변 녹음 시작
                        </button>
                      )}
                      {sampleRecording && (
                        <>
                          <span className="flex items-center gap-2 text-sm font-bold text-red-600">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                            녹음 중
                          </span>
                          <button
                            type="button"
                            onClick={stopSampleRecording}
                            className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-900"
                          >
                            ■ 답변 종료
                          </button>
                        </>
                      )}
                      {sampleAudioUrl && !sampleRecording && (
                        <>
                          <button
                            type="button"
                            onClick={() => void new Audio(sampleAudioUrl).play()}
                            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            ▶ 내 답변 듣기
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSampleAudioUrl(null); }}
                            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            다시 녹음
                          </button>
                        </>
                      )}
                    </div>
                    {samplePlays === 0 && (
                      <p className="mt-3 text-center text-xs text-slate-400">
                        먼저 문항을 들어보세요.
                      </p>
                    )}
                    {sampleAudioUrl && (
                      <p className="mt-3 text-center text-xs font-bold text-emerald-600">
                        연습이 끝났습니다. 실제 시험에서도 같은 방식으로 진행됩니다.
                      </p>
                    )}
                  </div>
                </div>

                <NavButtons
                  onBack={() => setStep("setup")}
                  onNext={() => void begin()}
                  nextLabel={starting ? "문제지 생성 중…" : "본 시험 시작 →"}
                  nextDisabled={!sampleAudioUrl || starting}
                  nextHint={startError ?? undefined}
                />
              </>
            )}
          </div>
        );
      }}
    </AppShell>
  );
}

function NavButtons({
  onBack, onNext, nextDisabled, nextLabel = "다음 →", nextHint,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextHint?: string;
}) {
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-lg bg-dku-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
        >
          {nextLabel}
        </button>
      </div>
      {nextHint && <p className="mt-2 text-right text-xs text-slate-400">{nextHint}</p>}
    </div>
  );
}
