"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 마이크 입력 표시기.
 *
 * 응시자가 가장 불안해하는 것은 "내 말이 들어가고 있나" 다.
 * 녹음 중이라는 글자만으로는 알 수 없으므로 실제 입력 세기를 막대로 보여 준다.
 * 소리를 내면 막대가 움직이고, 마이크가 죽어 있으면 움직이지 않는다.
 *
 * 전사(SpeechRecognition)는 자기 마이크를 따로 잡는다. 여기서 여는 것은
 * 세기를 재기 위한 별도의 스트림이고, 꺼질 때 반드시 닫는다.
 */
export function MicMeter({ active, bars = 28 }: { active: boolean; bars?: number }) {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0));
  const [state, setState] = useState<"idle" | "ok" | "denied">("idle");
  const raf = useRef<number | null>(null);
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active) return;
    let dead = false;

    (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!dead) setState("denied");
        return;
      }
      if (dead) { stream.getTracks().forEach((t) => t.stop()); return; }

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      setState("ok");

      const tick = () => {
        analyser.getByteFrequencyData(buf);
        // 낮은 쪽 절반(사람 목소리 대역)만 막대 수에 맞춰 묶는다
        const usable = Math.floor(buf.length * 0.55);
        const per = Math.max(1, Math.floor(usable / bars));
        const next: number[] = [];
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          for (let j = 0; j < per; j++) sum += buf[i * per + j] ?? 0;
          next.push(Math.min(1, sum / per / 150));
        }
        setLevels(next);
        raf.current = requestAnimationFrame(tick);
      };
      tick();

      stop.current = () => {
        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = null;
        src.disconnect();
        void ctx.close().catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
      };
    })();

    return () => {
      dead = true;
      stop.current?.();
      stop.current = null;
      setLevels(Array(bars).fill(0));
      setState("idle");
    };
  }, [active, bars]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-12 items-center gap-[3px]" aria-hidden>
        {levels.map((v, i) => (
          <span
            key={i}
            className="w-[5px] rounded-full bg-dku-600 transition-[height] duration-75"
            style={{ height: `${Math.max(6, v * 48)}px`, opacity: 0.45 + v * 0.55 }}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {state === "ok" ? "마이크가 소리를 받고 있습니다" : state === "denied" ? "마이크를 쓸 수 없습니다" : ""}
      </p>
    </div>
  );
}

/** 마이크 연결 상태 한 줄 — 녹음 전에도 보여 준다 */
export function MicStatus({ ok }: { ok: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-sm font-bold ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white ${
          ok ? "bg-emerald-500" : "bg-slate-300"
        }`}
        aria-hidden
      >
        ✓
      </span>
      {ok ? "마이크 정상 연결" : "마이크 확인 중"}
    </span>
  );
}
