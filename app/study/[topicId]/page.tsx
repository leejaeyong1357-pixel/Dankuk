"use client";

import Link from "next/link";
import { use, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QuestionText } from "@/components/QuestionText";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { Recorder } from "@/components/Recorder";
import { FeedbackCard } from "@/components/FeedbackCard";
import { questionsForPractice } from "@/lib/exam/repository";
import { TOPIC_BY_ID } from "@/lib/exam/topics";
import { QUESTION_TYPE_KO, type DifficultyLevel, type QuestionType } from "@/lib/exam/question-types";
import { markDone } from "@/lib/store";
import { LevelChips } from "@/components/LevelPicker";
import { glossaryFor } from "@/lib/dictionary";
import type { AnswerFeedback, GlossaryEntry } from "@/lib/types";

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

export default function StudyTopic({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);

  const [index, setIndex] = useState(0);
  const [showKo, setShowKo] = useState(true);
  const [word, setWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [transcript, setTranscript] = useState("");
  const [providers, setProviders] = useState<{ stt: string; llm: string } | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<DifficultyLevel | null>(null);

  const topic = TOPIC_BY_ID.get(topicId);

  function saveWord(entry: GlossaryEntry) {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(VOCAB_KEY);
    const list: GlossaryEntry[] = raw ? JSON.parse(raw) : [];
    if (!list.some((x) => x.en === entry.en)) {
      list.push(entry);
      window.localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
    }
    setSaved((s) => [...s, entry.en]);
  }

  function speak(text: string, audioUrl?: string) {
    // Kokoro 로 사전 생성한 음성이 있으면 그걸 재생한다.
    if (audioUrl) {
      void new Audio(audioUrl).play();
      return;
    }
    // 아직 배치 생성 전이면 브라우저 음성으로 대체한다.
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  return (
    <AppShell>
      {(profile) => {
        // AppShell 의 render prop 안이므로 훅을 쓰지 않는다.
        // (AppShell 이 로딩 중 early return 하면 훅 순서가 깨진다)
        const lv: DifficultyLevel = level ?? profile.lastDifficulty ?? 3;
        const list = questionsForPractice(topicId, lv);

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
        const meta = TYPE_META[q.questionType] ?? { emoji: "📝", desc: "" };
        const typeKo = QUESTION_TYPE_KO[q.questionType];

        async function submit(blob: Blob) {
          setBusy(true);
          setError(null);
          setFeedback(null);
          try {
            const form = new FormData();
            form.append("audio", blob, "answer.webm");
            form.append("questionId", q.id);
            form.append("targetGrade", profile.targetGrade);
            const res = await fetch("/api/feedback", { method: "POST", body: form });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "채점에 실패했습니다.");
            setFeedback({ metrics: json.metrics, llm: json.llm });
            setTranscript(json.transcript ?? "");
            setProviders(json.providers);
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
        }

        return (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href="/study" className="text-xs font-bold text-slate-400 hover:text-slate-600">
                    ← 유형별 학습
                  </Link>
                  <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight">
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
                <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4">
                  <p className="text-xs font-bold text-indigo-700">📌 미션</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{q.missionKo}</p>
                </div>

                <p className="mt-5 text-xs font-extrabold text-red-600">
                  QUESTION (단어 위에 마우스 → 뜻)
                </p>
                <div className="mt-2">
                  <QuestionText
                    text={q.promptText}
                    activeWord={word}
                    onHover={(w, m) => {
                      setWord(w);
                      setMeaning(m);
                    }}
                  />
                </div>

                {showKo && (
                  <div className="mt-5 rounded-lg border-l-4 border-dku-500 bg-dku-50 p-4">
                    <p className="text-xs font-bold text-dku-700">한글 번역</p>
                    <p className="mt-1 text-sm text-slate-700">{q.promptTextKo}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => speak(q.promptText, q.promptAudio ?? undefined)}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                  >
                    ▶ 문제 듣기
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
                  <Recorder onSubmit={submit} busy={busy} />
                </div>

                {error && (
                  <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
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

            <DictionaryPanel
              word={word}
              meaning={meaning}
              glossary={glossaryFor(q.promptText)}
              onSave={saveWord}
              saved={saved}
            />
          </div>
        );
      }}
    </AppShell>
  );
}
