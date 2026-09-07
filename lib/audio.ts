"use client";

/**
 * 문항 음성 재생 — 화면 전체에서 한 번에 하나만 소리가 난다.
 *
 * 재생 버튼을 두 번 누르면 앞의 소리가 계속 나면서 겹쳐 들리던 문제가 있었다.
 * 시험에서는 음성이 곧 문제이므로 겹쳐 들리면 문제를 놓친다.
 * 모든 재생을 여기로 모아, 새로 재생할 때 항상 앞의 것을 먼저 끊는다.
 */
let current: HTMLAudioElement | null = null;

/** 재생 중인 음성과 브라우저 음성을 모두 멈춘다 */
export function stopAudio() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current.onended = null;
    current.onerror = null;
    current = null;
  }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

/**
 * 문항을 읽어 준다. 사전 생성 음성이 있으면 그것을, 없으면 브라우저 음성을 쓴다.
 * onState 는 소리가 나기 시작/끝날 때 불린다.
 */
export function playPrompt(
  text: string,
  audioUrl?: string | null,
  onState?: (speaking: boolean) => void,
) {
  if (typeof window === "undefined") return;
  stopAudio();

  const fallback = () => {
    if (!window.speechSynthesis) { onState?.(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    u.onstart = () => onState?.(true);
    u.onend = () => onState?.(false);
    u.onerror = () => onState?.(false);
    window.speechSynthesis.speak(u);
  };

  if (!audioUrl) { fallback(); return; }

  const el = new Audio(audioUrl);
  current = el;
  el.onplay = () => onState?.(true);
  el.onended = () => { onState?.(false); if (current === el) current = null; };
  el.onerror = () => { if (current === el) current = null; fallback(); };
  void el.play().catch(() => { if (current === el) current = null; fallback(); });
}
