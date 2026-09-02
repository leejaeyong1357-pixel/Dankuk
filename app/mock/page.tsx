"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SurveyForm } from "@/components/SurveyForm";
import { LevelPicker } from "@/components/LevelPicker";
import { Interviewer } from "@/components/Interviewer";
import { EXAM_CONFIG, totalQuestions } from "@/lib/exam/config";
import { emptyAnswers, isSurveyComplete, selectedSurveyTopics, type SurveyAnswers } from "@/lib/exam/survey";
import type { DifficultyLevel } from "@/lib/exam/question-types";
import { generateFirstSession } from "@/lib/exam/generator";
import { fetchHistory, openExam } from "@/lib/sync";
import { clearSession, latestResult, saveSession } from "@/lib/exam/session";
import { loadProfile, saveProfile } from "@/lib/store";

/**
 * 실전 모의고사 진입 흐름 (docs/SPEC §5.4).
 *   Background Survey -> Self Assessment -> 마이크 테스트 -> Sample Question -> 본시험
 */
type Step = "intro" | "survey" | "level" | "mic" | "sample";

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
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [sampleDone, setSampleDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [starting, setStarting] = useState(false);

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

  async function testMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicOk(true);
    } catch {
      setMicOk(false);
    }
  }

  async function begin(email: string) {
    if (!level || starting) return;
    setStarting(true);
    const topics = selectedSurveyTopics(survey);
    // 이력은 서버를 정본으로 쓴다. 브라우저 데이터를 지워도 같은 문제가 다시 나오지 않는다.
    const { history } = await fetchHistory(email);
    const plan = generateFirstSession({
      selectedSurveyTopics: topics,
      initialDifficulty: level,
      history,
    });
    const startedAt = new Date().toISOString();
    await openExam({
      email, examId: plan.examId, survey, topics,
      initialDifficulty: level, totalQuestions: plan.totalQuestions, startedAt,
    });
    clearSession();
    saveSession({
      plan,
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

        const steps: { key: Step; label: string }[] = [
          { key: "survey", label: "Background Survey" },
          { key: "level", label: "난이도 선택" },
          { key: "mic", label: "마이크 테스트" },
          { key: "sample", label: "Sample Question" },
        ];
        const stepIndex = steps.findIndex((s) => s.key === step);

        return (
          <div className="mx-auto max-w-3xl">
            {step !== "intro" && (
              <div className="mb-7 flex gap-2">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex-1">
                    <div className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-dku-600" : "bg-slate-200"}`} />
                    <p className={`mt-2 text-[11px] font-bold ${i <= stepIndex ? "text-dku-700" : "text-slate-400"}`}>
                      {s.label}
                    </p>
                  </div>
                ))}
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
                  <h2 className="text-lg font-extrabold text-slate-900">진행 순서</h2>
                  <ol className="mt-4 space-y-2 text-sm text-slate-700">
                    {[
                      "Background Survey — 관심 주제를 고르면 그 주제로 문항이 조립됩니다",
                      "Self Assessment — 난이도 1~6 중 하나를 고릅니다",
                      "마이크 테스트",
                      "Sample Question — 실제 문항 전 연습 문항",
                      "면접관 등장 → 자기소개",
                      `1st Session (${EXAM_CONFIG.firstSessionTarget}문항)`,
                      "중간 난이도 재조정 — 더 쉬운 / 비슷한 / 더 어려운",
                      "2nd Session — 재조정한 난이도로 새로 생성됩니다",
                      "시험 종료 → AI 분석 → 예상 등급 리포트",
                    ].map((t, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="shrink-0 font-extrabold text-dku-700">{i + 1}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-5 rounded-lg bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800">
                    전체 제한 시간은 <strong>{EXAM_CONFIG.totalMinutes}분</strong>입니다.
                    문항별 시간 제한은 없으니 스스로 배분하세요.
                    문항 음성은 최대 <strong>{EXAM_CONFIG.maxPlays}회</strong>까지 들을 수 있습니다.
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
                  onNext={() => setStep("mic")}
                  nextDisabled={!level}
                />
              </>
            )}

            {/* ── 마이크 테스트 ────────────────────── */}
            {step === "mic" && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">마이크 테스트</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  헤드셋을 착용하고 소리와 마이크가 정상인지 확인하세요. 조용한 곳에서 응시해야 인식률이 올라갑니다.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm font-extrabold text-slate-900">1) 소리 확인</p>
                    <p className="mt-1 text-xs text-slate-500">면접관 음성이 들리는지 확인합니다.</p>
                    <button
                      type="button"
                      onClick={() => {
                        speak("Hello. Can you hear me clearly? If you can, you are ready to begin.");
                        setSoundPlayed(true);
                      }}
                      className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                    >
                      ▶ 음성 재생
                    </button>
                    {soundPlayed && <p className="mt-2 text-xs font-bold text-emerald-600">재생했습니다.</p>}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm font-extrabold text-slate-900">2) 마이크 확인</p>
                    <p className="mt-1 text-xs text-slate-500">브라우저에 마이크 권한을 허용합니다.</p>
                    <button
                      type="button"
                      onClick={testMic}
                      className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                    >
                      🎙 마이크 테스트
                    </button>
                    {micOk === true && <p className="mt-2 text-xs font-bold text-emerald-600">정상입니다.</p>}
                    {micOk === false && (
                      <p className="mt-2 text-xs font-bold text-red-600">
                        권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.
                      </p>
                    )}
                  </div>
                </div>

                <NavButtons
                  onBack={() => setStep("level")}
                  onNext={() => setStep("sample")}
                  nextDisabled={micOk !== true}
                  nextHint={micOk !== true ? "마이크 테스트를 통과해야 진행할 수 있습니다" : undefined}
                />
              </>
            )}

            {/* ── Sample Question ──────────────────── */}
            {step === "sample" && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Sample Question</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  실제 문항이 어떻게 진행되는지 미리 보는 연습 문항입니다. 채점되지 않습니다.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <Interviewer speaking={speaking} caption="연습 문항" />
                  <p className="mt-6 text-center text-sm leading-relaxed text-slate-600">
                    면접관이 문항을 읽어줍니다. 화면에는 영어 문장이 표시되지 않습니다.
                    <br />
                    듣고 나서 바로 답변을 녹음하면 됩니다.
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        speak(SAMPLE_QUESTION);
                        setSampleDone(true);
                      }}
                      className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                    >
                      ▶ 연습 문항 들어보기
                    </button>
                  </div>
                  {sampleDone && (
                    <p className="mt-4 text-center text-xs font-bold text-emerald-600">
                      준비되었습니다. 아래 버튼을 누르면 실제 시험이 시작됩니다.
                    </p>
                  )}
                </div>

                <NavButtons
                  onBack={() => setStep("mic")}
                  onNext={() => void begin(profile.email)}
                  nextLabel={starting ? "문제지 생성 중…" : "시험 시작 →"}
                  nextDisabled={!sampleDone || starting}
                  nextHint={!sampleDone ? "연습 문항을 한 번 들어보세요" : undefined}
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
