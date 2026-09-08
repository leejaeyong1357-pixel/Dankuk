"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SurveyForm } from "@/components/SurveyForm";
import { ExamSteps } from "@/components/ExamSteps";
import { playPrompt } from "@/lib/audio";
import { LevelPicker } from "@/components/LevelPicker";
import { Interviewer } from "@/components/Interviewer";
import { ExamTitle } from "@/components/ExamChrome";
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
    // 공용 재생기가 앞의 소리를 먼저 끊는다
    playPrompt(text, null, setSpeaking);
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
    // 설문이 덜 찬 채로 시작하면 출제 풀이 비어 문제지를 만들 수 없다
    if (!isSurveyComplete(survey)) { setStep("survey"); return; }
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

        return (
          <div className={step === "intro" ? "mx-auto max-w-6xl" : "mx-auto max-w-3xl"}>
            {/* ── 안내 ─────────────────────────────── */}
            {step === "intro" && <MockIntro prev={prev} onStart={() => setStep("survey")} />}

            {/* ── Background Survey ────────────────── */}
            {step === "survey" && (
              <>
                <ExamSteps current={1} />
                <h1 className="mt-6 text-2xl font-extrabold">Background Survey</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  질문을 읽고 정확히 답변해 주세요.
                  <strong className="text-slate-700"> 이 응답을 기초로 개인별 문항이 출제됩니다.</strong>
                </p>
                <div className="mt-6">
                  <SurveyForm
                    answers={survey}
                    onChange={setSurvey}
                    onExit={() => setStep("intro")}
                    onDone={() => setStep("level")}
                  />
                </div>
              </>
            )}

            {/* ── Self Assessment ──────────────────── */}
            {step === "level" && (
              <>
                <ExamSteps current={2} />
                <h1 className="mt-6 text-2xl font-extrabold">Self Assessment</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  본인 수준에 가장 가까운 단계를 고르세요. 이 선택이 문제 세트와 문항 수를 결정합니다.
                </p>
                <div className="mt-6">
                  <LevelPicker value={level} onChange={setLevel} recommended={recommended} />
                </div>
                {level && (
                  <p className="mt-4 rounded-lg border-l-4 border-dku-600 bg-dku-50 px-4 py-3.5 text-xs leading-relaxed text-dku-800">
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
                <ExamSteps current={3} />
                <h1 className="mt-6 text-2xl font-extrabold">Pre-Test Setup</h1>
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
                <ExamSteps current={4} />
                <h1 className="mt-6 text-2xl font-extrabold">Sample Question</h1>
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

                  <div className="mt-6">
                    <ExamTitle />
                  </div>
                  <div className="mt-6 flex justify-center">
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
                  nextLabel={starting ? "문제지 생성 중…" : "본 시험 시작 ›"}
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
  onBack, onNext, nextDisabled, nextLabel = "Next ›", nextHint,
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
          className="rounded-md bg-[#f3701b] px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#dd6114] disabled:bg-slate-300"
        >
          {nextLabel}
        </button>
      </div>
      {nextHint && <p className="mt-2 text-right text-xs text-slate-400">{nextHint}</p>}
    </div>
  );
}

/**
 * 모의고사 안내 화면.
 *
 * 시험을 처음 보는 사람이 무엇을 몇 번 겪게 되는지 한눈에 보고 들어가야 한다.
 * 왼쪽은 순서, 오른쪽은 시작 버튼과 준비물.
 */
const OT_STEPS = [
  ["사전 설문", "Background Survey", "평가 문항 구성을 위한 주제 선택"],
  ["난이도 선택", "Self Assessment", "현재 수준에 맞는 난이도 설정"],
  ["기기 점검", "Pre-Test Setup", "질문 청취 및 답변 녹음 사전 점검"],
  ["샘플 문항", "Sample Question", "화면과 답변 방식 미리 연습"],
];

function MockIntro({
  prev, onStart,
}: {
  prev: ReturnType<typeof latestResult>;
  onStart: () => void;
}) {
  const MAIN_STEPS = [
    ["1차 세션", `개인 맞춤형 질문 · 약 ${EXAM_CONFIG.firstSessionTarget}문항`],
    ["난이도 재조정", "쉬운 / 비슷한 / 어려운 질문 중 선택"],
    ["2차 세션", "개인 맞춤형 질문 · 약 5~8문항"],
  ];

  return (
    <>
      <nav className="text-xs font-semibold text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-600">홈</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600">모의고사</span>
      </nav>

      <h1 className="hero-headline mt-3 text-3xl text-slate-900 sm:text-4xl">실전 모의고사</h1>
      <p className="mt-2 text-slate-500">실제 OPIc의 흐름 그대로, 실전 감각을 완성하세요.</p>

      {/* 시험 조건 세 가지 */}
      <section className="mt-6 grid gap-4 rounded-2xl bg-dku-50 px-6 py-6 sm:grid-cols-3 sm:divide-x sm:divide-dku-200">
        {[
          [<ClockIcon key="c" />, `${EXAM_CONFIG.totalMinutes}분`, "전체 시험 시간"],
          [<HeadsetIcon key="h" />, `질문 청취 ${EXAM_CONFIG.maxPlays}회`, ""],
          [<PaperIcon key="p" />, "문항별 답변 시간 제한 없음", ""],
        ].map(([icon, title, sub], i) => (
          <div key={i} className="flex items-center gap-3.5 sm:justify-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-dku-600 shadow-sm">
              {icon}
            </span>
            <span>
              <span className="block font-extrabold text-slate-900">{title}</span>
              {sub && <span className="block text-sm text-slate-500">{sub}</span>}
            </span>
          </div>
        ))}
      </section>

      {prev && (
        <Link
          href="/mock/result"
          className="mt-5 flex items-center justify-between rounded-xl border-l-4 border-dku-600 bg-dku-50 px-5 py-3.5 transition hover:bg-dku-100"
        >
          <span className="text-sm font-bold text-dku-800">
            지난 응시 결과 · AI 예상 등급 {prev.grade.grade} ({prev.initialDifficulty}-
            {prev.secondDifficulty}, {prev.takenAt.slice(0, 10)})
          </span>
          <span className="text-sm font-bold text-dku-700">→</span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* 진행 순서 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-xl font-extrabold text-slate-900">시험은 이렇게 진행돼요</h2>
          <p className="mt-1 text-sm text-slate-500">오리엔테이션부터 본 시험까지</p>

          <p className="mt-6 font-bold text-dku-700">오리엔테이션</p>
          <ol className="mt-3">
            {OT_STEPS.map(([ko, en, d], i) => (
              <Step key={ko} no={i + 1} ko={ko} en={en} desc={d} tone="light" last={i === OT_STEPS.length - 1} />
            ))}
          </ol>

          <div className="mt-6 rounded-2xl bg-dku-50/70 px-5 py-5">
            <p className="font-bold text-dku-700">본 시험</p>
            <ol className="mt-3">
              {MAIN_STEPS.map(([ko, d], i) => (
                <Step key={ko} no={i + 5} ko={ko} desc={d} tone="solid" last={i === MAIN_STEPS.length - 1} />
              ))}
            </ol>
          </div>
        </section>

        {/* 시작과 준비물 */}
        <div className="space-y-5">
          <section className="rounded-2xl bg-dku-600 p-7 text-white">
            <span className="text-white/80">
              <HeadsetIcon big />
            </span>
            <p className="mt-4 text-[11px] font-bold tracking-[0.18em] text-white/70">READY FOR OPIc</p>
            <p className="hero-headline mt-2 text-2xl">
              이제, 실전처럼
              <br />
              시작해 볼까요?
            </p>
            <p className="mt-3 text-sm text-white/85">사전 설문부터 차근차근 안내해 드릴게요.</p>
            <button
              type="button"
              onClick={onStart}
              className="mt-6 w-full rounded-xl bg-white px-6 py-4 font-extrabold text-dku-700 transition hover:bg-dku-50"
            >
              모의고사 시작하기 <span aria-hidden>→</span>
            </button>
            <p className="mt-3 text-center text-xs text-white/70">
              오리엔테이션 후 본 시험이 시작됩니다.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-lg font-extrabold text-slate-900">시작 전 확인해 주세요</h2>
            <ul className="mt-4 space-y-4">
              {[
                [<MuteIcon key="m" />, "조용한 환경에서 응시해 주세요."],
                [<MicIcon key="i" />, "마이크와 스피커를 준비해 주세요."],
                [<PaperIcon key="d" />, "시험 중에는 첨삭과 모범답안이 표시되지 않습니다."],
              ].map(([icon, text], i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dku-50 text-dku-600">
                    {icon}
                  </span>
                  <span className="pt-1.5 text-sm leading-relaxed text-slate-700">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-dku-50 px-4 py-3.5">
              <span className="shrink-0 text-dku-600">
                <InfoIcon />
              </span>
              <p className="text-sm font-semibold leading-relaxed text-dku-800">
                채점 결과와 AI 피드백은 시험 종료 후 확인할 수 있어요.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Step({
  no, ko, en, desc, tone, last,
}: {
  no: number; ko: string; en?: string; desc: string; tone: "light" | "solid"; last: boolean;
}) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />}
      <span
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
          tone === "solid" ? "bg-dku-700 text-white" : "border border-slate-200 bg-white text-slate-500"
        }`}
      >
        {no}
      </span>
      <span className="grid flex-1 gap-1 sm:grid-cols-[132px_1fr] sm:items-baseline">
        <span className="font-extrabold text-slate-900">{ko}</span>
        <span>
          {en && <span className="block font-bold text-dku-700">{en}</span>}
          <span className="block text-sm text-slate-500">{desc}</span>
        </span>
      </span>
    </li>
  );
}

// ── 아이콘 ──────────────────────────────────────────────────
const I = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function ClockIcon() {
  return <svg {...I} width="22" height="22"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function HeadsetIcon({ big = false }: { big?: boolean }) {
  const n = big ? 40 : 22;
  return (
    <svg {...I} width={n} height={n}>
      <path d="M4 14v-2a8 8 0 1116 0v2" />
      <rect x="2.5" y="13.5" width="4.5" height="6.5" rx="2.2" />
      <rect x="17" y="13.5" width="4.5" height="6.5" rx="2.2" />
    </svg>
  );
}
function PaperIcon() {
  return <svg {...I} width="22" height="22"><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>;
}
function MicIcon() {
  return <svg {...I} width="18" height="18"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>;
}
function MuteIcon() {
  return <svg {...I} width="18" height="18"><path d="M4 9v6h3.5L12 19V5L7.5 9z" /><path d="M17 10l4 4M21 10l-4 4" /></svg>;
}
function InfoIcon() {
  return <svg {...I} width="18" height="18"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
}
