"use client";

/**
 * 문항 음성 재생 — 화면 전체에서 한 번에 하나만 소리가 난다.
 *
 * 재생 버튼을 두 번 누르면 앞의 소리가 계속 나면서 겹쳐 들리던 문제가 있었다.
 * 시험에서는 음성이 곧 문제이므로 겹쳐 들리면 문제를 놓친다.
 * 모든 재생을 여기로 모아, 새로 재생할 때 항상 앞의 것을 먼저 끊는다.
 *
 * 소리를 내는 곳은 전부 이 파일을 거쳐야 한다. new Audio(...).play() 를
 * 직접 부르면 여기서 붙잡지 못해 멈출 수가 없다 — 내 목소리 듣기가 그랬다.
 * 문항 음성은 playPrompt, 녹음한 내 목소리는 playClip 을 쓴다.
 */
let current: HTMLAudioElement | null = null;

/** 지금 재생 중인 소리가 멈출 때 알려 줄 곳 (버튼 상태를 되돌리기 위해) */
let currentOnState: ((speaking: boolean) => void) | null = null;

/** 재생 중인 음성과 브라우저 음성을 모두 멈춘다 */
export function stopAudio() {
  // 만드는 중인 음성(OpenAI)이 뒤늦게 도착해도 틀지 않게 한다
  playSeq += 1;
  if (current) {
    current.pause();
    current.currentTime = 0;
    current.onplay = null;
    current.onended = null;
    current.onerror = null;
    current = null;
  }
  // 멈춘 쪽 버튼이 "재생 중" 으로 남지 않게 되돌려 준다
  if (currentOnState) {
    const notify = currentOnState;
    currentOnState = null;
    notify(false);
  }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

/**
 * 녹음한 소리를 틀어 준다 (마이크 점검, 내 답변 듣기).
 *
 * 문항 음성과 같은 자리를 쓰므로 둘이 겹쳐 나지 않는다.
 */
export function playClip(url: string, onState?: (speaking: boolean) => void) {
  if (typeof window === "undefined") return;
  stopAudio();

  const el = new Audio(url);
  current = el;
  currentOnState = onState ?? null;
  const done = () => {
    if (current === el) { current = null; currentOnState = null; }
    onState?.(false);
  };
  el.onplay = () => onState?.(true);
  el.onended = done;
  el.onerror = done;
  void el.play().catch(done);
}

/**
 * 문항을 읽어 준다. 사전 생성 음성이 있으면 그것을, 없으면 브라우저 음성을 쓴다.
 * onState 는 소리가 나기 시작/끝날 때 불린다.
 */
/**
 * 브라우저 음성이 읽을 언어 코드.
 *
 * 중국어 문장을 en-US 로 읽히면 글자를 하나씩 더듬는 소리가 난다.
 * 그 언어 목소리가 기기에 없으면 브라우저가 알아서 가까운 것을 고른다.
 */
const BCP47: Record<string, string> = {
  en: "en-US",
  pl: "pl-PL",
  zh: "zh-CN",
  hi: "hi-IN",
  pt: "pt-BR",
  es: "es-MX",
};

/**
 * 브라우저 음성 중 가장 사람 같은 것을 고른다.
 *
 * 기본 목소리(Windows 의 David·Zira 같은 옛 음성)는 낮고 기계적이라 회의 말투가
 * 나지 않는다. Edge 의 "Natural"·"Online" 음성, Chrome 의 Google 음성, Safari 의
 * Premium·Enhanced 음성이 훨씬 사람 같으므로 그쪽을 먼저 쓴다.
 */
let voices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  const load = () => { voices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.addEventListener?.("voiceschanged", load);
}

/** 밝고 또렷한 회의 말투로 들리는 이름들 (Edge·Windows 신경망 음성, macOS) */
const WARM = /\b(Ava|Andrew|Emma|Brian|Jenny|Aria|Michelle|Christopher|Eric|Samantha|Allison|Evan|Joelle|Nathan)\b/;

export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const tag = (BCP47[lang] ?? "en-US").toLowerCase();
  const base = tag.split("-")[0];
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const vl = v.lang.toLowerCase().replace("_", "-");
    if (!vl.startsWith(base)) continue;
    let score = vl === tag ? 20 : 0;
    if (/natural|neural/i.test(v.name)) score += 100;
    if (/premium|enhanced/i.test(v.name)) score += 80;
    if (/online/i.test(v.name)) score += 40;
    if (/google/i.test(v.name)) score += 35;
    if (WARM.test(v.name)) score += 10;
    if (/david|zira|mark|hazel|desktop|espeak/i.test(v.name)) score -= 30;
    if (score > bestScore) { best = v; bestScore = score; }
  }
  return best;
}

/**
 * OpenAI 음성 — 키가 있으면 브라우저 음성 대신 쓴다.
 *
 * 회의실에서 동료가 말하듯 밝고 자연스러운 톤으로 읽게 한다. 같은 문장은 한 번만
 * 만들어 이 탭에 두고 다시 쓴다. 실패하면 조용히 브라우저 음성으로 돌아간다.
 */
const TTS_STYLE =
  "Speak like a friendly, confident colleague in a business meeting. Natural conversational pace, " +
  "warm and upbeat but professional, clear articulation, light natural intonation. Not robotic, not flat, not sleepy.";
const ttsCache = new Map<string, string>();

async function openAiSpeech(text: string, lang: string, rate = 1): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim();
  if (!key) return null;
  const id = `${lang}:${rate}:${text}`;
  const hit = ttsCache.get(id);
  if (hit) return hit;
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true, timeout: 20_000, maxRetries: 0 });
    const res = await client.audio.speech.create({
      model: process.env.NEXT_PUBLIC_OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
      voice: (process.env.NEXT_PUBLIC_OPENAI_TTS_VOICE?.trim() || "coral") as "coral",
      input: text,
      instructions: rate < 1 ? `${TTS_STYLE} Speak slowly and clearly so a learner can follow each word.` : TTS_STYLE,
      response_format: "mp3",
    });
    const url = URL.createObjectURL(await res.blob());
    ttsCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}

/** 지금 재생 요청 번호 — 음성을 만드는 사이 다른 걸 누르면 앞의 것은 버린다 */
let playSeq = 0;

export function playPrompt(
  text: string,
  audioUrl?: string | null,
  onState?: (speaking: boolean) => void,
  lang = "en",
  /** 1 보다 작으면 천천히 — 따라 말하기용 */
  rate = 1,
) {
  if (typeof window === "undefined") return;
  stopAudio();

  currentOnState = onState ?? null;
  const seq = ++playSeq;

  const browserVoice = () => {
    if (!window.speechSynthesis) { onState?.(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang] ?? "en-US";
    const v = pickVoice(lang);
    if (v) u.voice = v;
    // 0.95 로 늦추면 처지고 졸린 소리가 난다. 보통 속도·높이 그대로 둔다
    u.rate = rate;
    u.pitch = 1;
    u.onstart = () => onState?.(true);
    u.onend = () => onState?.(false);
    u.onerror = () => onState?.(false);
    window.speechSynthesis.speak(u);
  };

  // 사전 생성 음성이 없으면 OpenAI 음성을 먼저, 안 되면 브라우저 음성
  const fallback = () => {
    void openAiSpeech(text, lang, rate).then((url) => {
      if (seq !== playSeq) return;
      if (url) play(url, browserVoice);
      else browserVoice();
    });
  };

  if (!audioUrl) { fallback(); return; }
  play(audioUrl, fallback);

  function play(src: string, onFail: () => void) {
    const el = new Audio(src);
    current = el;
    el.onplay = () => onState?.(true);
    el.onended = () => {
      if (current === el) { current = null; currentOnState = null; }
      onState?.(false);
    };
    el.onerror = () => { if (current === el) current = null; onFail(); };
    void el.play().catch(() => { if (current === el) current = null; onFail(); });
  }
}
