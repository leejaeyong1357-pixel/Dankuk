import type { Transcript } from "./types";

/**
 * STT 어댑터 (SPEC §6.2).
 *
 * 기본 구현은 faster-whisper 를 감싼 FastAPI 마이크로서비스를 호출한다.
 * (services/stt/ 참고). STT_URL 이 없으면 목업으로 폴백해 화면 개발이 막히지 않게 한다.
 *
 * word timestamps 가 필수다 — 발화량·유창성 지표가 여기서 나온다.
 * 언어 태그도 필수다 — 한국어 이탈 탐지에 쓴다.
 */
export interface SttProvider {
  name: string;
  transcribe(audio: Buffer, mimeType: string): Promise<Transcript>;
}

export class FasterWhisperProvider implements SttProvider {
  name = "faster-whisper";
  constructor(private baseUrl: string) {}

  async transcribe(audio: Buffer, mimeType: string): Promise<Transcript> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), "answer.webm");

    const res = await fetch(`${this.baseUrl}/transcribe`, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error(`STT 서비스 오류 ${res.status}: ${await res.text()}`);
    }
    const raw = (await res.json()) as {
      text: string;
      duration: number;
      words: { word: string; start: number; end: number }[];
      segments: { text: string; start: number; end: number; language?: string }[];
    };
    return {
      text: raw.text ?? "",
      durationSec: raw.duration ?? 0,
      words: raw.words ?? [],
      segments: raw.segments ?? [],
    };
  }
}

export class MockSttProvider implements SttProvider {
  name = "mock";
  async transcribe(): Promise<Transcript> {
    const text =
      "Um, I usually go to the cafe near my house because it is very quiet. " +
      "I like to study there on weekends. Actually, last month I met my friend there and we talked for two hours.";
    const tokens = text.split(" ");
    const words = tokens.map((word, i) => ({
      word,
      start: Number((i * 0.42).toFixed(2)),
      end: Number((i * 0.42 + 0.35).toFixed(2)),
    }));
    const duration = words.length ? words[words.length - 1].end : 0;
    return {
      text,
      durationSec: duration,
      words,
      segments: [{ text, start: 0, end: duration, language: "en" }],
    };
  }
}

let cached: SttProvider | null = null;

export function getSttProvider(): SttProvider {
  if (cached) return cached;
  const url = process.env.STT_URL;
  cached = url ? new FasterWhisperProvider(url) : new MockSttProvider();
  return cached;
}
