"use client";

import Link from "next/link";
import { use, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QuestionText } from "@/components/QuestionText";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { Recorder } from "@/components/Recorder";
import { FeedbackCard } from "@/components/FeedbackCard";
import { bandOf, studyQuestions } from "@/lib/exam-engine";
import { TOPIC_BY_ID } from "@/lib/topics";
import { markDone } from "@/lib/store";
import type { AnswerFeedback, GlossaryEntry, QuestionFunction } from "@/lib/types";

const FN_LABEL: Record<QuestionFunction, { ko: string; emoji: string; desc: string }> = {
  intro:      { ko: "자기소개", emoji: "👋", desc: "시험 첫 문항. 채점에는 반영되지 않습니다." },
  describe:   { ko: "묘사", emoji: "🖼️", desc: "현재시제로 대상을 그려 보이는 문항입니다." },
  habit:      { ko: "습관·루틴", emoji: "🔁", desc: "빈도와 절차를 순서대로 말하는 문항입니다." },
  experience: { ko: "과거 경험", emoji: "🕰️", desc: "과거시제 통제가 점수를 가르는 문항입니다." },
  compare:    { ko: "비교", emoji: "⚖️", desc: "두 시점 또는 두 집단을 대조하는 고난도 문항입니다." },
  issue:      { ko: "이슈·해결책", emoji: "💡", desc: "문제를 정의하고 해결책까지 제시하는 문항입니다." },
  rp_ask:     { ko: "롤플레이 · 질문하기", emoji: "❓", desc: "설명하지 말고 의문문만 3~4개 만드는 문항입니다." },
  rp_solve:   { ko: "롤플레이 · 대안 제시", emoji: "🛠️", desc: "상황 설명 후 대안을 2~3개 내놓는 문항입니다." },
  rp_relate:  { ko: "롤플레이 · 유사 경험", emoji: "🔗", desc: "롤플레이를 끝내고 실제 경험으로 돌아오는 문항입니다." },
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
        const band = bandOf(profile.selfAssessment);
        const list = studyQuestions(topicId, band);

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
        const label = FN_LABEL[q.fn];

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
                    {label.emoji} {topic.ko} · {label.ko}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {label.desc}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-slate-400">진행</p>
                  <p className="text-xl font-extrabold text-dku-700">
                    {index + 1} / {list.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[topic.ko, label.ko, `난이도 ${q.band}`].map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-dku-50 px-2.5 py-1 text-xs font-bold text-dku-700"
                  >
                    {t}
                  </span>
                ))}
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
                    text={q.textEn}
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
                    <p className="mt-1 text-sm text-slate-700">{q.textKo}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => speak(q.textEn, q.audioUrl)}
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
              glossary={q.glossary}
              onSave={saveWord}
              saved={saved}
            />
          </div>
        );
      }}
    </AppShell>
  );
}
