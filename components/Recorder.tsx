"use client";

import { useEffect, useRef, useState } from "react";
import type { Transcript } from "@/lib/types";
import type { LiveTranscript } from "@/lib/stt-browser";

type Phase = "idle" | "listening" | "done";

/**
 * 답변을 받는다 — 녹음이 아니라 실시간 음성 인식이다.
 *
 * 말하는 동안 인식 결과가 바로 화면에 쌓인다. 자기가 무슨 말을 하고 있는지
 * 눈으로 보면서 말해야 문장을 이어 붙이는 연습이 된다. 소리 파일은 채점에
 * 쓰지 않으므로 남기지 않는다.
 *
 * 말을 마친 뒤에는 그 자리에서 고쳐 쓸 수 있다. 인식이 한두 단어를 놓쳤다고
 * 처음부터 다시 말하게 하면 연습이 끊긴다. 마이크가 없거나 조용히 해야 하는
 * 곳에서는 아예 타이핑으로만 답해도 된다.
 */
export function Recorder({
  onSubmit,
  busy,
}: {
  onSubmit: (transcript: Transcript) => void;
  busy: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [live, setLive] = useState<LiveTranscript>({ final: "", partial: "" });
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  /** 채점을 기다린 시간 — 멈춘 것처럼 보이지 않게 초를 보여 준다 */
  const [waited, setWaited] = useState(0);
  /** 인식이 끝난 뒤 직접 고쳐 쓴 답변 */
  const [edited, setEdited] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sttRef = useRef<{ stop: () => Promise<Transcript> } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  /** 인식이 끝난 뒤 채점으로 넘길 전사 */
  const pendingRef = useRef<Transcript | null>(null);

  useEffect(() => {
    void import("@/lib/stt-browser").then((m) => setSupported(m.browserSttAvailable()));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!busy) { setWaited(0); return; }
    const id = setInterval(() => setWaited((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [busy]);

  // 말이 길어지면 늘 마지막 줄이 보이게 한다
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [live]);

  async function start() {
    setError(null);
    setLive({ final: "", partial: "" });
    try {
      // 인식기가 마이크를 직접 잡지만, 권한 거부를 여기서 먼저 잡아낸다
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
      return;
    }
    const { startBrowserStt } = await import("@/lib/stt-browser");
    sttRef.current = startBrowserStt(setLive);
    setSeconds(0);
    setPhase("listening");
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    const stt = sttRef.current;
    sttRef.current = null;
    setPhase("done");
    if (!stt) return;
    const t = await stt.stop();
    setLive({ final: t.text, partial: "" });
    setEdited(t.text);
    if (!t.text.trim()) {
      setError("음성이 인식되지 않았습니다. 직접 입력해서 답변해도 됩니다.");
    }
    pendingRef.current = t;
  }

  /**
   * 고쳐 쓴 문장으로 채점을 넘긴다.
   *
   * 발화 시간·침묵 같은 지표는 실제로 말한 것에서 나온 값이라 그대로 두고,
   * 글자만 바꿔 넣는다. 타이핑으로만 답한 경우에는 단어 수로 시간을 추정한다.
   */
  function submit() {
    const text = edited.trim();
    if (!text) return;
    const spoken = pendingRef.current;
    const words = text.split(/\s+/).filter(Boolean);
    if (spoken && spoken.text.trim()) {
      onSubmit({ ...spoken, text, segments: spoken.segments.map((sg) => ({ ...sg, text })) });
      return;
    }
    // 말하지 않고 쓰기만 한 답변 — 분당 130단어로 읽었다고 보고 길이를 잡는다
    const durationSec = Math.max(seconds, Math.round((words.length / 130) * 60));
    onSubmit({
      text,
      words: words.map((w, i) => ({
        word: w,
        start: (durationSec / words.length) * i,
        end: (durationSec / words.length) * (i + 1),
      })),
      segments: [{ text, start: 0, end: durationSec, language: "en" }],
      durationSec,
    });
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const words = `${live.final} ${live.partial}`.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        {phase === "idle" && (
          <>
            <button
              type="button"
              onClick={() => void start()}
              className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
            >
              🎙 말하기 시작
            </button>
            <button
              type="button"
              onClick={() => { setPhase("done"); setEdited(""); pendingRef.current = null; }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              ⌨ 직접 입력
            </button>
          </>
        )}

        {phase === "listening" && (
          <>
            <span className="flex items-center gap-2 text-sm font-bold text-red-600">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              듣는 중 {mmss}
            </span>
            <button
              type="button"
              onClick={() => void stop()}
              className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
            >
              ■ 답변 마치기
            </button>
          </>
        )}

        {phase === "done" && (
          <>
            <span className="text-sm font-semibold text-slate-600">
              {pendingRef.current ? `답변 완료 · ${mmss} · ` : "직접 입력 · "}
              {edited.trim().split(/\s+/).filter(Boolean).length}단어
            </span>
            <button
              type="button"
              disabled={busy || !edited.trim()}
              onClick={submit}
              className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
            >
              {busy ? `채점 중… ${waited}초` : "AI 피드백 받기 →"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPhase("idle");
                setLive({ final: "", partial: "" });
                setEdited("");
                pendingRef.current = null;
                setError(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:text-slate-300"
            >
              다시 말하기
            </button>
          </>
        )}

        <span className="ml-auto text-xs font-semibold text-slate-400">
          {phase === "listening" ? `${words}단어` : ""}
        </span>
      </div>

      {/* 말을 마친 뒤에는 그 자리에서 고쳐 쓴다 */}
      {phase === "done" ? (
        <div className="px-4 py-3.5">
          <label className="mb-1.5 block text-xs font-bold text-slate-500">
            답변 (고쳐 쓸 수 있습니다)
          </label>
          <textarea
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            disabled={busy}
            rows={5}
            placeholder="여기에 직접 입력해도 됩니다."
            className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-[15px] leading-relaxed outline-none transition focus:border-dku-500 disabled:bg-slate-50"
          />
        </div>
      ) : (
      <div
        ref={boxRef}
        className="max-h-52 min-h-[104px] overflow-y-auto px-4 py-3.5 text-[15px] leading-relaxed"
        aria-live="polite"
      >
        {live.final || live.partial ? (
          <p className="text-slate-900">
            {live.final}
            {live.partial && (
              <>
                {live.final && " "}
                <span className="text-slate-400">{live.partial}</span>
              </>
            )}
            {phase === "listening" && (
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-dku-600 align-middle" />
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            {phase === "listening"
              ? "말씀하세요. 말하는 대로 여기에 바로 나타납니다."
              : "말하기를 시작하면 인식된 문장이 여기에 실시간으로 표시됩니다."}
          </p>
        )}
      </div>
      )}

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {!supported && (
        <p className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          이 브라우저는 실시간 음성 인식을 지원하지 않습니다. 크롬·엣지·사파리를 사용해 주세요.
        </p>
      )}
      <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        실제 시험은 답변 시간에 제한이 없습니다. 목표 등급 권장 발화량을 채우는 데 집중하세요.
      </p>
    </div>
  );
}
