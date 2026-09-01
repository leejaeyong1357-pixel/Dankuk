"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "recording" | "recorded";

/** MediaRecorder 로 답변을 녹음한다. 결과는 webm blob 으로 STT 라우트에 넘긴다. */
export function Recorder({
  onSubmit,
  busy,
}: {
  onSubmit: (blob: Blob) => void;
  busy: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setPhase("recorded");
      };
      rec.start();
      recorderRef.current = rec;
      setSeconds(0);
      setPhase("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {phase === "idle" && (
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
          >
            ● 답변 녹음 시작
          </button>
        )}

        {phase === "recording" && (
          <>
            <span className="flex items-center gap-2 text-sm font-bold text-red-600">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              녹음 중 {mmss}
            </span>
            <button
              type="button"
              onClick={stop}
              className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
            >
              ■ 녹음 종료
            </button>
          </>
        )}

        {phase === "recorded" && (
          <>
            <span className="text-sm font-semibold text-slate-600">녹음 완료 · {mmss}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => blobRef.current && onSubmit(blobRef.current)}
              className="rounded-lg bg-dku-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
            >
              {busy ? "채점 중…" : "AI 피드백 받기 →"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPhase("idle")}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white disabled:text-slate-300"
            >
              다시 녹음
            </button>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        실제 시험은 답변 시간에 제한이 없습니다. 목표 등급 권장 발화량을 채우는 데 집중하세요.
      </p>
    </div>
  );
}
