"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { QuestionText } from "@/components/QuestionText";
import { Callout } from "@/components/Callout";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { glossaryFor } from "@/lib/dictionary";
import { playPrompt, stopAudio } from "@/lib/audio";
import { Recorder } from "@/components/Recorder";
import { FeedbackCard } from "@/components/FeedbackCard";
import { fetchPracticeQuestions, type PracticeQuestion } from "@/lib/sync";
import type { Transcript } from "@/lib/types";
import { TOPIC_BY_ID } from "@/lib/exam/topics";
import { QUESTION_TYPE_KO, type DifficultyLevel, type QuestionType } from "@/lib/exam/question-types";
import { loadProfile, markDone } from "@/lib/store";
import { LevelChips } from "@/components/LevelPicker";
import { saveVocabEntry } from "@/lib/sync";
import type { AnswerFeedback, FocusArea, GlossaryEntry } from "@/lib/types";
import { FocusPicker } from "@/components/FocusPicker";

const TYPE_META: Partial<Record<QuestionType, { emoji: string; desc: string }>> = {
  SELF_INTRODUCTION: { emoji: "👋", desc: "시험 첫 문항. 채점에는 반영되지 않습니다." },
  DESCRIPTION_PLACE: { emoji: "🏞️", desc: "현재시제로 장소를 그려 보이는 문항입니다." },
  DESCRIPTION_OBJECT: { emoji: "📦", desc: "사물의 생김새와 쓰임을 설명하는 문항입니다." },
  DESCRIPTION_PERSON: { emoji: "🧑", desc: "인물의 외형과 성격을 묘사하는 문항입니다." },
  ROUTINE: { emoji: "🔁", desc: "빈도와 절차를 순서대로 말하는 문항입니다." },
  PREFERENCE: { emoji: "⭐", desc: "선호와 그 근거를 제시하는 문항입니다." },
  PAST_EXPERIENCE: { emoji: "🕰️", desc: "과거시제 통제가 점수를 가르는 문항입니다." },
  PAST_RECENT: { emoji: "📅", desc: "가장 최근의 경험을 서술하는 문항입니다." },
  PAST_MEMORABLE: { emoji: "💭", desc: "기억에 남는 경험을 장문으로 서술하는 문항입니다." },
  FIRST_EXPERIENCE: { emoji: "🌱", desc: "처음 경험과 지금의 차이를 다루는 문항입니다." },
  CHANGE: { emoji: "📈", desc: "시간에 따른 변화를 설명하는 문항입니다." },
  COMPARE: { emoji: "⚖️", desc: "두 대상을 대조하는 문항입니다." },
  CHANGE_COMPARE: { emoji: "🔀", desc: "변화와 비교를 함께 요구하는 고난도 문항입니다." },
  ROLEPLAY_ASK: { emoji: "❓", desc: "설명하지 말고 의문문만 만드는 문항입니다." },
  ROLEPLAY_INFORMATION: { emoji: "📞", desc: "상황 설명 후 정보를 요청하는 문항입니다." },
  ROLEPLAY_PROBLEM: { emoji: "⚠️", desc: "문제 상황을 설명하고 대안을 내는 문항입니다." },
  ROLEPLAY_SOLUTION: { emoji: "🛠️", desc: "선택지를 비교하고 해결책을 추천하는 문항입니다." },
  ROLEPLAY_PAST_EXPERIENCE: { emoji: "🔗", desc: "롤플레이를 끝내고 실제 경험으로 돌아오는 문항입니다." },
  OPINION: { emoji: "🗣️", desc: "의견과 근거를 제시하는 문항입니다." },
  ISSUE: { emoji: "📰", desc: "사회적 문제와 해결책까지 다루는 최고 난이도 문항입니다." },
  CAUSE_EFFECT: { emoji: "🔎", desc: "원인과 결과를 연결해 설명하는 문항입니다." },
  ADVANTAGE_DISADVANTAGE: { emoji: "➕", desc: "장단점을 균형 있게 다루는 문항입니다." },
  HYPOTHETICAL: { emoji: "🔮", desc: "가정 상황을 상상해 설명하는 문항입니다." },
};

const VOCAB_KEY = "dku-opic:vocab";

/** 쿼리스트링의 난이도를 1~6 범위로 정규화한다 */
function toLevel(raw: string | undefined): DifficultyLevel | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? (n as DifficultyLevel) : null;
}

export function StudyTopicClient({ topicId }: { topicId: string }) {
  return (
    <Suspense fallback={null}>
      <StudyTopic topicId={topicId} />
    </Suspense>
  );
}

function StudyTopic({ topicId }: { topicId: string }) {
  // 목록 화면에서 고른 난이도를 그대로 이어받는다
  const initialLevel = toLevel(useSearchParams().get("level") ?? undefined);

  const [index, setIndex] = useState(0);
  const [showKo, setShowKo] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [word, setWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusArea[]>(["Vocabulary", "Grammar"]);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [transcript, setTranscript] = useState("");
  const [providers, setProviders] = useState<{ stt: string; llm: string } | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  const [list, setList] = useState<PracticeQuestion[] | null>(null);

  // 문항 뱅크는 서버에만 둔다. 이 주제·난이도의 문항만 받아온다.
  const effectiveLevel = level ?? initialLevel ?? loadProfile()?.lastDifficulty ?? 3;
  useEffect(() => {
    let cancelled = false;
    setList(null);
    void fetchPracticeQuestions(topicId, effectiveLevel).then((res) => {
      if (!cancelled) setList(res?.questions ?? []);
    });
    return () => { cancelled = true; };
  }, [topicId, effectiveLevel]);

  const topic = TOPIC_BY_ID.get(topicId);

  function saveWord(entry: GlossaryEntry, questionId: string) {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(VOCAB_KEY);
    const list: GlossaryEntry[] = raw ? JSON.parse(raw) : [];
    if (!list.some((x) => x.en === entry.en)) {
      list.push(entry);
      window.localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
    }
    setSaved((s) => [...s, entry.en]);
    void saveVocabEntry({ ...entry, sourceQuestionId: questionId });
  }

  function speak(text: string, audioUrl?: string) {
    // 공용 재생기가 앞의 소리를 먼저 끊는다 (두 번 누르면 겹쳐 들리던 문제)
    playPrompt(text, audioUrl, setSpeaking);
  }

  return (
    <AppShell>
      {(profile) => {
        // AppShell 의 render prop 안이므로 훅을 쓰지 않는다.
        // (AppShell 이 로딩 중 early return 하면 훅 순서가 깨진다)
        const lv: DifficultyLevel = effectiveLevel;

        if (list === null) {
          return <p className="text-sm text-slate-400">문항을 불러오는 중…</p>;
        }
        if (!topic || list.length === 0) {
          return (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-bold text-slate-700">이 주제에는 아직 문항이 없습니다.</p>
              <Link href="/study" className="mt-3 inline-block text-sm font-bold text-dku-700">
                ← 유형별 학습으로
              </Link>
            </div>
          );
        }

        const q = list[Math.min(index, list.length - 1)];
        const qType = q.questionType as QuestionType;
        const meta = TYPE_META[qType] ?? { emoji: "📝", desc: "" };
        const typeKo = QUESTION_TYPE_KO[qType] ?? qType;

        async function submit(t: Transcript) {
          setBusy(true);
          setError(null);
          setFeedback(null);
          try {
            // 전사·지표·피드백을 모두 브라우저에서 처리한다 (정적 배포 대응)
            const { feedbackForAnswer } = await import("@/lib/client-feedback");
            const res = await feedbackForAnswer({
              question: q, transcript: t, targetGrade: profile.targetGrade,
              focusAreas: focus,
            });
            setFeedback({ metrics: res.metrics, llm: res.llm });
            setTranscript(t.text);
            setProviders(res.providers);
            markDone(q.id);
          } catch (e) {
            setError(e instanceof Error ? e.message : "알 수 없는 오류");
          } finally {
            setBusy(false);
          }
        }

        function go(next: number) {
          setIndex(next);
          setFeedback(null);
          setTranscript("");
          setError(null);
          setWord(null);
          setMeaning(null);
          stopAudio();
        }

        return (
          <div className="mx-auto grid max-w-[1400px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href="/study" className="text-xs font-bold text-slate-400 hover:text-slate-600">
                    ← 유형별 학습
                  </Link>
                  <h1 className="mt-1.5 text-3xl font-extrabold">
                    {meta.emoji} {topic.ko} · {typeKo}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">{meta.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-slate-400">진행</p>
                  <p className="text-xl font-extrabold text-dku-700">
                    {index + 1} / {list.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[topic.ko, typeKo, q.probeType, `난이도 ${lv}단계`].map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-dku-50 px-2.5 py-1 text-xs font-bold text-dku-700"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <LevelChips
                  value={lv}
                  onChange={(next) => { setLevel(next); go(0); }}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Callout label="📌 미션">
                  <span className="font-bold">{q.missionKo}</span>
                </Callout>

                <p className="mt-5 text-xs font-extrabold text-red-600">
                  QUESTION <span className="font-bold text-slate-400">단어에 마우스를 올리면 뜻이 뜹니다</span>
                </p>
                <div className="mt-2">
                  <QuestionText
                    text={q.promptText}
                    onHover={(w, m) => { setWord(w); setMeaning(m); }}
                  />
                </div>

                {showKo && (
                  <Callout label="한글 번역" tone="blue" className="mt-5">
                    {q.promptTextKo}
                  </Callout>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      speaking
                        ? (stopAudio(), setSpeaking(false))
                        : speak(q.promptText, q.promptAudio ?? undefined)
                    }
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                  >
                    {speaking ? "■ 멈추기" : "▶ 문제 듣기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKo((v) => !v)}
                    className="rounded-lg bg-dku-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-dku-700"
                  >
                    KR {showKo ? "한글 숨기기" : "한글 보기"}
                  </button>
                </div>

                <div className="mt-5">
                  <FocusPicker value={focus} onChange={setFocus} />
                </div>

                <div className="mt-4">
                  <Recorder onSubmit={submit} busy={busy} />
                </div>

                {error && (
                  <p className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                )}
              </div>

              {feedback && (
                <FeedbackCard
                  data={feedback}
                  transcript={transcript}
                  targetGrade={profile.targetGrade}
                  provider={providers}
                  onRetry={() => { setFeedback(null); setError(null); }}
                />
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => go(index - 1)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-white disabled:opacity-40"
                >
                  ← 이전 문제
                </button>
                <button
                  type="button"
                  disabled={index >= list.length - 1}
                  onClick={() => go(index + 1)}
                  className="rounded-lg bg-dku-800 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-dku-900 disabled:opacity-40"
                >
                  다음 문제 →
                </button>
              </div>
            </div>

            <div className="xl:sticky xl:top-24 xl:h-fit">
              <DictionaryPanel
              word={word}
              meaning={meaning}
              glossary={glossaryFor(q.promptText)}
              onSave={(entry) => saveWord(entry, q.id)}
              saved={saved}
              />
            </div>
          </div>
        );
      }}
    </AppShell>
  );
}
