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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sttRef = useRef<{ stop: () => Promise<Transcript> } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  /** 인식이 끝난 뒤 채점으로 넘길 전사 */
  const pendingRef = useRef<Transcript | null>(null);

  useEffect(() => {
    void import("@/lib/stt-browser").then((m) => setSupported(m.browserSttAvailable()));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

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
    if (!t.text.trim()) {
      setError("음성이 인식되지 않았습니다. 크롬·엣지·사파리에서 다시 시도해 주세요.");
      return;
    }
    pendingRef.current = t;
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const words = `${live.final} ${live.partial}`.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        {phase === "idle" && (
          <button
            type="button"
            onClick={() => void start()}
            className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
          >
            🎙 말하기 시작
          </button>
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
              답변 완료 · {mmss} · {words}단어
            </span>
            <button
              type="button"
              disabled={busy || !live.final.trim()}
              onClick={() => pendingRef.current && onSubmit(pendingRef.current)}
              className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
            >
              {busy ? "채점 중…" : "AI 피드백 받기 →"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => { setPhase("idle"); setLive({ final: "", partial: "" }); setError(null); }}
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

      {/* 실시간 인식 결과 */}
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
