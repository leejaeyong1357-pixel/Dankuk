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

/**
 * Meta Muse Voice Transcribe (Meta Model API).
 *
 * 오픈 웨이트가 공개되지 않아 자체 호스팅 경로가 없다. API 전용이다.
 * 대신 GPU 서버가 필요 없고, 문장 중간 코드스위칭을 다루므로
 * 한국어 이탈 탐지에 유리하다. 비용은 분당 과금이다.
 */
export class MuseVoiceProvider implements SttProvider {
  name = "muse-voice-transcribe";
  constructor(
    private apiKey: string,
    private baseUrl = process.env.MUSE_API_URL ?? "https://api.meta.ai/v1",
    private model = process.env.MUSE_MODEL ?? "muse-voice-transcribe-1.0",
  ) {}

  async transcribe(audio: Buffer, mimeType: string): Promise<Transcript> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), "answer.webm");
    form.append("model", this.model);
    form.append("timestamp_granularities", "word");

    const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Muse Voice 오류 ${res.status}: ${await res.text()}`);

    const raw = (await res.json()) as {
      text?: string;
      duration?: number;
      words?: { word: string; start: number; end: number }[];
      segments?: { text: string; start: number; end: number; language?: string }[];
    };
    const words = raw.words ?? [];
    return {
      text: raw.text ?? "",
      durationSec: raw.duration ?? (words.length ? words[words.length - 1].end : 0),
      words,
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

/**
 * STT_PROVIDER 로 고른다.
 *   faster-whisper (기본) — 자체 호스팅, GPU 필요, 종량 비용 0
 *   muse             — Meta Model API, GPU 불필요, 분당 과금
 *   mock             — 개발용
 * 설정이 없으면 STT_URL 유무로 판단하고, 그것도 없으면 목업으로 폴백한다.
 */
export function getSttProvider(): SttProvider {
  if (cached) return cached;

  const provider = (process.env.STT_PROVIDER ?? "").toLowerCase();
  const museKey = process.env.MUSE_API_KEY;
  const url = process.env.STT_URL;

  if (provider === "muse" || (!provider && !url && museKey)) {
    if (!museKey) throw new Error("MUSE_API_KEY 가 필요합니다.");
    cached = new MuseVoiceProvider(museKey);
  } else if (provider === "mock") {
    cached = new MockSttProvider();
  } else if (url) {
    cached = new FasterWhisperProvider(url);
  } else {
    cached = new MockSttProvider();
  }
  return cached;
}
