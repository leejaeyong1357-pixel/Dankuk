"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MicMeter } from "@/components/MicMeter";
import { playPrompt, stopAudio } from "@/lib/audio";
import { describeAiError } from "@/lib/ai-provider";
import { aiReady, coachTurns, partnerReply } from "@/lib/global/ai";
import { scenarioById, type Scenario } from "@/lib/global/content";
import {
  getSession,
  saveExpression,
  updateSession,
  type GlobalSession,
} from "@/lib/global/store";
import { PhraseLine, WordPanel } from "@/components/global/PhraseLine";
import { loadLanguages } from "@/lib/global/lang";
import { localized } from "@/lib/global/translations";
import { languageKo, type LangCode } from "@/lib/global/content";
import { checkSpeech, speechSummary, type SpeechCheck } from "@/lib/global/speech-check";
import type { LiveTranscript } from "@/lib/stt-browser";

/**
 * 오늘의 연습.
 *
 * 듣기 → 내 말로 바꿔 말하기 → 상대와 두세 번 주고받기 → 코칭 → 다시 말하기.
 * 정답을 맞혀야 넘어가는 구조가 아니다. 말해 보고, 받아 보고, 한 번 더 하는 것이
 * 전부이며 그것으로 완료다.
 *
 * 마이크를 못 쓰는 자리(사무실·회의 직전)가 많으므로 타이핑으로도 똑같이 된다.
 */
export default function PracticePage() {
  return (
    <AppShell>
      {() => (
        <Suspense fallback={<p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>}>
          <PracticeBody />
        </Suspense>
      )}
    </AppShell>
  );
}

function PracticeBody() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("s") ?? "";

  const [session, setSession] = useState<GlobalSession | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState<null | "partner" | "coaching">(null);
  const [error, setError] = useState<string | null>(null);

  // 새로고침해도 이어서 한다 — 저장소에서 다시 읽는다
  useEffect(() => {
    const s = id ? getSession(id) : null;
    if (!s) setMissing(true);
    else setSession(s);
  }, [id]);

  useEffect(() => {
    loadLanguages();
    return () => stopAudio();
  }, []);

  // 오른쪽 사전이 가리킬 단어
  const [word, setWord] = useState<string | null>(null);
  const [readOf, setReadOf] = useState<string>("");

  const patch = useCallback(
    (p: Partial<GlobalSession>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...p };
        updateSession(prev.id, p);
        return next;
      });
    },
    [],
  );

  if (missing) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-400">연습을 찾지 못했습니다.</p>
        <Link href="/global/" className="mt-3 inline-block text-sm font-bold text-dku-700">
          오늘의 글로벌로 돌아가기 →
        </Link>
      </div>
    );
  }
  if (!session) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

  const scenario = scenarioById(session.scenarioId);
  if (!scenario) {
    return <p className="py-20 text-center text-sm text-slate-400">상황 정보를 찾지 못했습니다.</p>;
  }

  async function sendTurn(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    const mine = { role: "user" as const, text: text.trim(), at: new Date().toISOString() };
    const turns = [...session!.turns, mine];
    patch({ turns, step: "roleplay" });

    if (!aiReady()) {
      setError("AI 연결이 없어 상대 응답은 생성되지 않습니다. 코칭도 데모로 표시됩니다.");
      return;
    }
    setBusy("partner");
    try {
      const r = await partnerReply(scenario!, { ...session!, turns }, mine.text);
      patch({
        turns: [...turns, { role: "partner", text: `${r.reply}\n${r.replyKo}`, at: new Date().toISOString() }],
      });
      playPrompt(r.reply);
    } catch (e) {
      setError(describeAiError(e));
    } finally {
      setBusy(null);
    }
  }

  async function finish() {
    if (busy) return;
    setError(null);
    if (!aiReady()) {
      patch({ step: "coaching", doneAt: new Date().toISOString() });
      return;
    }
    setBusy("coaching");
    try {
      const c = await coachTurns(scenario!, session!);
      patch({ coaching: c, step: "coaching", doneAt: new Date().toISOString() });
    } catch (e) {
      setError(describeAiError(e));
      patch({ step: "coaching", doneAt: new Date().toISOString() });
    } finally {
      setBusy(null);
    }
  }

  const spoke = session.turns.some((t) => t.role === "user");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/global/" className="text-[13px] font-bold text-dku-600">
            ← 오늘의 글로벌
          </Link>
          <h1 className="hero-headline mt-1.5 text-[28px] text-slate-900">{scenario.title}</h1>
          <p className="mt-1 text-[15px] text-slate-500">{scenario.subtitle}</p>
        </div>
        <Steps step={session.step} />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {error}
        </p>
      )}
      {!aiReady() && (
        <p className="mt-4 rounded-xl border-l-4 border-slate-400 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          AI 연결이 없는 데모 상태입니다. 표현 듣기와 말하기 연습은 그대로 되고, 상대 응답과
          코칭은 생성되지 않습니다.
        </p>
      )}

      {/* ── 1. 핵심 표현 듣기 ──────────────────────────── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,26%)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-6">
          <p className="text-[19px] font-bold text-slate-900">먼저, 이 말들을 들어보세요</p>
          <p className="mt-1 text-[14px] text-slate-500">
            {languageKo(session.lang as LangCode)}로 듣고 한 번 따라 말하면 다음 단계가 훨씬 쉬워집니다.
          </p>
          <ul className="mt-4 space-y-2">
            {scenario.phrases.map((p) => (
              <li key={p.en}>
                <Shadow
                  en={p.en}
                  ko={p.ko}
                  lang={session.lang as LangCode}
                  onWord={(w) => {
                    setWord(w);
                    if (w) setReadOf(localized(session.lang as LangCode, p.en)?.read ?? "");
                  }}
                  onSave={() =>
                    saveExpression({ en: p.en, ko: p.ko, scenarioId: scenario.id, lang: session.lang })
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <WordPanel word={word} read={readOf} lang={session.lang} />
      </div>

      {/* ── 2·3. 말하기와 역할 연습 ────────────────────── */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-6">
        <p className="text-[19px] font-bold text-slate-900">이제 내 말로 해보세요</p>
        <p className="mt-1 text-[14px] text-slate-500">
          위 표현을 내 회의 상황에 맞게 바꿔 말하면 됩니다. 상대가 답하면 한 번 더 이어서 말해보세요.
        </p>

        {session.turns.length > 0 && (
          <ul className="mt-4 space-y-2.5">
            {session.turns.map((t, i) => (
              <li
                key={i}
                className={`rounded-xl px-4 py-3.5 ${
                  t.role === "user" ? "bg-slate-50" : "bg-[#eaf1fc]"
                }`}
              >
                <p className="text-[12px] font-bold text-slate-400">
                  {t.role === "user" ? "나" : "상대"}
                </p>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
                  {t.text}
                </p>
              </li>
            ))}
          </ul>
        )}

        {busy === "partner" && (
          <p className="mt-3 text-[14px] text-slate-400">상대가 답하는 중…</p>
        )}

        <SayBox onSend={sendTurn} disabled={busy !== null} />

        {spoke && session.step !== "coaching" && (
          <button
            type="button"
            onClick={finish}
            disabled={busy !== null}
            className="mt-4 w-full rounded-xl bg-dku-600 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {busy === "coaching" ? "코칭을 받는 중…" : "여기까지 하고 코칭 받기 →"}
          </button>
        )}
      </section>

      {/* ── 4. 코칭 ─────────────────────────────────────── */}
      {session.step === "coaching" && (
        <CoachingCard
          session={session}
          onRetry={() => patch({ step: "say", coaching: null, turns: [] })}
        />
      )}

      <p className="mt-6 text-[12px] text-slate-400">
        글로벌 연습에는 점수·등급·합격 판정이 없습니다.
      </p>
    </>
  );
}

/**
 * 한 문장 따라 말하기.
 *
 * 듣고 바로 따라 하는 것이 가장 빨리 입에 붙는다. 다만 결과를 점수로
 * 바꾸지 않는다 — 인식기가 무엇으로 알아들었는지를 단어 단위로 보여 주는 것이
 * 전부다. 내 말이 상대에게 어떻게 들렸는지가 곧 통했는지 여부다.
 */
function Shadow({
  en,
  ko,
  lang,
  onWord,
  onSave,
}: {
  en: string;
  ko: string;
  lang: LangCode;
  onWord: (w: string | null) => void;
  onSave: () => void;
}) {
  const t = localized(lang, en);
  const say = t?.text ?? en;
  const [rec, setRec] = useState(false);
  const [check, setCheck] = useState<SpeechCheck | null>(null);
  const [live, setLive] = useState<LiveTranscript>({ final: "", partial: "" });
  const [micError, setMicError] = useState<string | null>(null);
  const stt = useRef<{ stop: () => Promise<{ text: string }> } | null>(null);

  async function start() {
    stopAudio();
    setMicError(null);
    setCheck(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError("마이크를 쓸 수 없습니다.");
      return;
    }
    const { startBrowserStt } = await import("@/lib/stt-browser");
    setLive({ final: "", partial: "" });
    stt.current = startBrowserStt(setLive);
    setRec(true);
  }

  async function stop() {
    const s = stt.current;
    stt.current = null;
    setRec(false);
    if (!s) return;
    const t = await s.stop();
    setCheck(checkSpeech(say, t.text));
    setLive({ final: "", partial: "" });
  }

  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => playPrompt(say, null, undefined, lang)}
          aria-label={`${say} 듣기`}
          className="shrink-0 rounded-lg bg-dku-50 p-2 text-dku-600 transition hover:bg-dku-100"
        >
          <SpeakerIcon />
        </button>
        <span className="min-w-0 flex-1">
          <PhraseLine
            text={say}
            onWord={onWord}
            className="block text-[16px] font-bold text-slate-900"
          />
          {t?.read && <span className="mt-0.5 block text-[13px] text-slate-400">[{t.read}]</span>}
          <span className="mt-0.5 block text-[14px] text-slate-500">{ko}</span>
          {!t && lang !== "en" && (
            <span className="mt-1 block text-[12px] text-amber-700">
              {languageKo(lang)} 문장은 준비 중 — 영어로 보여 드립니다
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={rec ? stop : start}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
            rec ? "bg-red-600 text-white" : "border border-dku-500 text-dku-700 hover:bg-dku-50"
          }`}
        >
          {rec ? "■ 끝내기" : "🎙 따라 말하기"}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50"
        >
          담기
        </button>
      </div>

      {rec && (
        <p className="mt-3 min-h-[22px] text-[14px] text-slate-500">
          {live.final}
          <span className="text-slate-400">{live.partial}</span>
        </p>
      )}
      {micError && <p className="mt-2 text-[13px] text-amber-700">{micError}</p>}

      {check && (
        <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
          <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-[15px]">
            {check.target.map((w, i) => (
              <span
                key={i}
                className={w.mark === "ok" ? "font-bold text-emerald-700" : "text-slate-400 line-through decoration-slate-300"}
              >
                {w.word}
              </span>
            ))}
          </p>
          {check.extras.length > 0 && (
            <p className="mt-1.5 text-[13px] text-slate-400">
              이렇게 들렸습니다: {check.extras.join(" ")}
            </p>
          )}
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{speechSummary(check)}</p>
        </div>
      )}
    </div>
  );
}

/** 지금 어디쯤인지 */
function Steps({ step }: { step: GlobalSession["step"] }) {
  const order: GlobalSession["step"][] = ["listen", "say", "roleplay", "coaching"];
  const labels = { listen: "듣기", say: "말하기", roleplay: "주고받기", coaching: "코칭" };
  const at = order.indexOf(step);
  return (
    <ol className="flex shrink-0 items-center gap-2">
      {order.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`rounded-lg px-3 py-1.5 text-[13px] font-bold ${
              i <= at ? "bg-dku-600 text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {labels[s]}
          </span>
          {i < order.length - 1 && <span className="text-slate-300" aria-hidden>→</span>}
        </li>
      ))}
    </ol>
  );
}

/**
 * 말하거나 타이핑하는 칸.
 *
 * 인식 결과를 그대로 보내지 않고 한 번 보여 준다. 한두 단어를 놓쳤다고
 * 처음부터 다시 말하게 하면 연습이 끊긴다.
 */
function SayBox({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) {
  const [text, setText] = useState("");
  const [rec, setRec] = useState(false);
  const [live, setLive] = useState<LiveTranscript>({ final: "", partial: "" });
  const [micError, setMicError] = useState<string | null>(null);
  const stt = useRef<{ stop: () => Promise<{ text: string }> } | null>(null);

  async function start() {
    // 듣다가 "됐다, 말하자" 하고 누른 것이다. 재생 중인 소리를 먼저 끊는다
    stopAudio();
    setMicError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError("마이크를 쓸 수 없습니다. 아래에 타이핑해도 똑같이 연습됩니다.");
      return;
    }
    const { startBrowserStt } = await import("@/lib/stt-browser");
    setLive({ final: "", partial: "" });
    stt.current = startBrowserStt(setLive);
    setRec(true);
  }

  async function stop() {
    const s = stt.current;
    stt.current = null;
    setRec(false);
    if (!s) return;
    const t = await s.stop();
    setText((prev) => (prev ? `${prev} ${t.text}` : t.text).trim());
    setLive({ final: "", partial: "" });
  }

  return (
    <div className="mt-4">
      {rec && (
        <div className="rounded-xl bg-slate-50 px-4 py-4">
          <MicMeter active />
          <p className="mt-2 min-h-[24px] text-center text-[15px] text-slate-700">
            {live.final}
            <span className="text-slate-400">{live.partial}</span>
          </p>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="여기에 말한 내용이 들어옵니다. 직접 타이핑해도 됩니다."
        className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-300 focus:border-dku-500"
      />

      {micError && <p className="mt-2 text-[13px] text-amber-700">{micError}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={rec ? stop : start}
          disabled={disabled}
          className={`rounded-xl px-5 py-3 text-[15px] font-bold transition disabled:opacity-40 ${
            rec ? "bg-red-600 text-white hover:bg-red-700" : "border-2 border-dku-600 text-dku-700 hover:bg-dku-50"
          }`}
        >
          {rec ? "■ 말하기 끝내기" : "🎙 말하기"}
        </button>
        <button
          type="button"
          onClick={() => {
            onSend(text);
            setText("");
          }}
          disabled={disabled || !text.trim()}
          className="ml-auto rounded-xl bg-dku-600 px-5 py-3 text-[15px] font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          보내기 →
        </button>
      </div>
    </div>
  );
}

function CoachingCard({
  session,
  onRetry,
}: {
  session: GlobalSession;
  onRetry: () => void;
}) {
  const c = session.coaching;
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-6">
      <p className="text-[19px] font-bold text-slate-900">AI와 이렇게 연습해요</p>
      <p className="mt-1 text-[14px] text-slate-500">점수 대신, 다음 대화를 위한 작은 도움을 드려요.</p>

      {!c ? (
        <p className="mt-4 text-[15px] text-slate-400">
          코칭은 AI 연결이 있을 때 이번 발화에 맞춰 만들어집니다.
        </p>
      ) : (
        <>
          <p className="mt-5 text-[13px] font-bold text-dku-600">잘 전달한 점</p>
          <ul className="mt-2 space-y-1.5">
            {c.wellCommunicated.map((w, i) => (
              <li key={i} className="text-[15px] leading-relaxed text-slate-700">· {w}</li>
            ))}
          </ul>

          {c.suggestions.length > 0 && (
            <>
              <p className="mt-5 text-[13px] font-bold text-dku-600">이렇게 바꿔 말해보세요</p>
              <ul className="mt-2 space-y-3">
                {c.suggestions.map((s, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 px-4 py-4">
                    <span className="rounded-md bg-dku-100/80 px-2 py-0.5 text-[12px] font-bold text-dku-700">
                      {s.dimension}
                    </span>
                    <p className="mt-2.5 text-[14px] text-slate-500 line-through decoration-slate-300">
                      {s.original}
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-slate-900">{s.alternative}</p>
                    <p className="mt-1.5 text-[14px] text-slate-500">{s.reasonKo}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-5 rounded-xl bg-[#eaf1fc] px-5 py-4">
            <p className="text-[13px] font-bold text-dku-700">통째로 말해 보기</p>
            <p className="mt-2 text-[16px] font-bold leading-relaxed text-slate-900">
              {c.exampleResponse}
            </p>
          </div>

          <p className="mt-4 text-[15px] text-slate-600">{c.retryPrompt}</p>
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-dku-600 px-5 py-3 text-[15px] font-bold text-white transition hover:bg-dku-700"
        >
          다시 말하기 →
        </button>
        <Link
          href="/global/"
          className="rounded-xl border border-slate-200 px-5 py-3 text-[15px] font-bold text-slate-600 transition hover:bg-slate-50"
        >
          오늘의 글로벌로
        </Link>
      </div>
    </section>
  );
}

function SpeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 010 7" />
    </svg>
  );
}
