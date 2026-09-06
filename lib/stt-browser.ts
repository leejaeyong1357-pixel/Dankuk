"use client";

/**
 * 브라우저 음성 인식 — 서버 없이 답변을 전사한다.
 *
 * 서버(faster-whisper)를 쓸 수 없는 정적 배포용이다.
 * Web Speech API 는 크롬·엣지·사파리에서 동작하고 파이어폭스에는 없다.
 *
 * Whisper 와 달리 단어별 타임스탬프를 주지 않는다. 인식 결과가 도착한 시각을
 * 직접 재서 근사 타임스탬프를 만든다. 인식기는 말이 끊길 때 구간을 확정하므로,
 * 구간 경계가 실제로 침묵이 있던 자리와 대체로 일치한다. 침묵 길이는
 * 정확한 값이 아니라 근사치다.
 */
import type { Transcript } from "./types";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

type Ctor = new () => SpeechRecognitionLike;

function recognitionCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: Ctor;
    webkitSpeechRecognition?: Ctor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function browserSttAvailable(): boolean {
  return recognitionCtor() !== null;
}

export interface BrowserRecognizer {
  /** 인식을 멈추고 전사 결과를 돌려준다 */
  stop(): Promise<Transcript>;
}

/**
 * 인식을 시작한다. 녹음 버튼을 누를 때 호출하고, 멈출 때 stop() 을 부른다.
 * 마이크 권한은 인식기가 직접 요청한다.
 */
export function startBrowserStt(): BrowserRecognizer {
  const Ctor = recognitionCtor();
  const startedAt = Date.now();

  // 인식기가 없으면 빈 전사를 돌려준다. 시험 흐름을 끊지 않는다.
  if (!Ctor) {
    return {
      stop: async () => emptyTranscript((Date.now() - startedAt) / 1000),
    };
  }

  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = false;

  /** 확정된 구간과 그 구간이 끝난 시각(초) */
  const chunks: { text: string; endedSec: number }[] = [];
  let ended = false;
  let failure: string | null = null;

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (!r.isFinal) continue;
      const text = r[0].transcript.trim();
      if (text) chunks.push({ text, endedSec: (Date.now() - startedAt) / 1000 });
    }
  };
  rec.onerror = (e) => {
    // no-speech 는 아무 말도 하지 않은 정상 상황이다
    if (e.error !== "no-speech" && e.error !== "aborted") failure = e.error;
  };
  rec.onend = () => { ended = true; };

  try {
    rec.start();
  } catch {
    // 이미 시작된 경우 등 — 전사는 비게 되지만 시험은 계속된다
  }

  return {
    stop: () =>
      new Promise<Transcript>((resolve) => {
        const finish = () => {
          const durationSec = (Date.now() - startedAt) / 1000;
          resolve(buildTranscript(chunks, durationSec, failure));
        };
        if (ended) { finish(); return; }
        rec.onend = finish;
        try { rec.stop(); } catch { finish(); }
        // 인식기가 onend 를 주지 않는 경우를 대비해 상한을 둔다
        setTimeout(() => { if (!ended) finish(); }, 3000);
      }),
  };
}

/**
 * 구간별 전사를 지표 계산이 기대하는 형태로 바꾼다.
 *
 * 단어 시각은 구간 안에서 균등 분배한다. 구간 내부의 짧은 멈춤은 잡지 못하지만,
 * 구간과 구간 사이의 긴 침묵은 그대로 남는다 — 지표에서 의미 있는 쪽이 그쪽이다.
 */
function buildTranscript(
  chunks: { text: string; endedSec: number }[],
  durationSec: number,
  failure: string | null,
): Transcript {
  const words: Transcript["words"] = [];
  let prevEnd = 0;

  for (const c of chunks) {
    const parts = c.text.split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    // 이 구간이 말해진 시간. 앞 구간이 끝난 뒤부터 이 구간이 확정된 시각까지 중
    // 실제 발화는 뒤쪽이라고 보고, 단어 수에 비례한 길이만 쓴다.
    const span = Math.max(0.3, Math.min(c.endedSec - prevEnd, parts.length * 0.45));
    const start = Math.max(prevEnd, c.endedSec - span);
    const per = span / parts.length;
    parts.forEach((w, i) => {
      words.push({ word: w, start: start + i * per, end: start + (i + 1) * per });
    });
    prevEnd = c.endedSec;
  }

  const text = chunks.map((c) => c.text).join(" ").trim();
  if (failure) console.warn("[stt] 브라우저 음성 인식 오류:", failure);
  return {
    text,
    words,
    // 브라우저 인식기는 언어 태그를 주지 않는다. en-US 로 돌리므로
    // 한국어 이탈은 탐지되지 않는다 (지표에서 0 으로 남는다).
    segments: text ? [{ text, start: 0, end: durationSec, language: "en" }] : [],
    durationSec,
  };
}

function emptyTranscript(durationSec: number): Transcript {
  return {
    text: "",
    words: [],
    segments: [],
    durationSec,
  };
}
