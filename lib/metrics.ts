import type { DeterministicMetrics, Transcript } from "./types";

/**
 * LLM 없이 계산되는 채점 지표 (SPEC §4.3).
 * 결정적이라 같은 답변에는 항상 같은 값이 나온다. 비용 0.
 */

/**
 * 명백한 간투사만 센다.
 * "like" / "well" / "actually" 는 정상적인 동사·부사·연결어로도 쓰여
 * 문맥 없이 세면 올바른 발화를 필러로 오탐한다. 과소 집계가 오탐보다 낫다.
 */
const FILLER_WORDS = new Set(["um", "uh", "eh", "ah", "er", "hmm", "mm", "uhm", "umm"]);
/** 구 단위 필러는 오탐 위험이 낮아 그대로 센다 */
const FILLER_PHRASES = ["you know", "i mean", "kind of", "sort of"];

/**
 * 등급을 가르는 연결어 — 있고 없고가 Text Type 준거에 직결된다.
 * "actually" / "anyway" 같은 담화 표지는 논리 연결어가 아니므로 제외한다.
 */
const CONNECTORS = new Set([
  "because", "so", "but", "however", "although", "though", "while", "whereas",
  "therefore", "also", "besides", "moreover", "then", "after", "before",
  "finally", "first", "second", "next", "since", "when", "if", "unless",
  "instead", "for example", "such as", "in addition",
  "on the other hand", "as a result", "that's why",
]);

/** 불규칙 과거형 — 규칙형(-ed)은 별도 처리 */
const IRREGULAR_PAST = new Set([
  "was", "were", "had", "did", "went", "saw", "took", "got", "made", "came",
  "said", "told", "gave", "found", "thought", "felt", "knew", "left", "met",
  "put", "ran", "sat", "spent", "stood", "won", "wrote", "bought", "brought",
  "caught", "chose", "drove", "ate", "fell", "flew", "forgot", "heard", "kept",
  "let", "lost", "paid", "read", "rode", "sang", "slept", "spoke", "swam",
  "taught", "understood", "woke", "wore",
]);

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []);
}

export function computeMetrics(t: Transcript): DeterministicMetrics {
  const w = words(t.text);
  const wordCount = w.length;
  const durationSec = Math.max(t.durationSec, 0.001);
  const lower = t.text.toLowerCase();

  // 필러 — 간투사와 구 단위 관용구를 함께 센다
  let fillerCount = w.filter((x) => FILLER_WORDS.has(x)).length;
  for (const phrase of FILLER_PHRASES) {
    fillerCount += (lower.match(new RegExp(`\\b${phrase}\\b`, "g")) ?? []).length;
  }

  // 연결어
  const distinct = new Set<string>();
  for (const c of CONNECTORS) {
    if (c.includes(" ")) {
      if (lower.includes(c)) distinct.add(c);
    } else if (w.includes(c)) {
      distinct.add(c);
    }
  }
  const connectorCount = w.filter((x) => CONNECTORS.has(x)).length;

  // 어휘 다양성 (type-token ratio)
  const typeTokenRatio = wordCount ? new Set(w).size / wordCount : 0;

  // 침묵 구간 — 단어 사이 간격
  let longestPauseSec = 0;
  let pauseOverTwoSec = 0;
  for (let i = 1; i < t.words.length; i++) {
    const gap = t.words[i].start - t.words[i - 1].end;
    if (gap > longestPauseSec) longestPauseSec = gap;
    if (gap >= 2) pauseOverTwoSec++;
  }

  // 과거시제 동사 — 경험 문항에서 시제 통제를 봤는지 판단
  const pastTenseVerbCount =
    w.filter((x) => IRREGULAR_PAST.has(x)).length +
    w.filter((x) => /^[a-z]{3,}ed$/.test(x)).length;

  // 한국어 이탈 — Whisper 가 ko 로 태깅한 구간의 길이 합
  const koreanSpilloverSec = t.segments
    .filter((s) => s.language === "ko")
    .reduce((sum, s) => sum + (s.end - s.start), 0);

  return {
    durationSec: Number(durationSec.toFixed(1)),
    wordCount,
    wpm: Number(((wordCount / durationSec) * 60).toFixed(1)),
    fillerCount,
    fillerRate: wordCount ? Number((fillerCount / wordCount).toFixed(3)) : 0,
    connectorCount,
    distinctConnectors: [...distinct],
    typeTokenRatio: Number(typeTokenRatio.toFixed(3)),
    longestPauseSec: Number(longestPauseSec.toFixed(1)),
    pauseOverTwoSec,
    pastTenseVerbCount,
    koreanSpilloverSec: Number(koreanSpilloverSec.toFixed(1)),
    koreanSpillover: koreanSpilloverSec > 0.5,
  };
}

/** 목표 등급별 권장 발화량 — 피드백에서 "부족/충분"을 판정하는 기준 */
export const TARGET_PROFILE: Record<string, { minSec: number; minWords: number; minConnectors: number }> = {
  IL:  { minSec: 30, minWords: 45,  minConnectors: 2 },
  IM2: { minSec: 45, minWords: 80,  minConnectors: 4 },
  IM3: { minSec: 60, minWords: 110, minConnectors: 5 },
  IH:  { minSec: 75, minWords: 150, minConnectors: 7 },
  AL:  { minSec: 90, minWords: 190, minConnectors: 9 },
};

/** 지표만으로 목표 대비 부족한 점을 뽑는다 (LLM 호출 전에 이미 확정되는 부분) */
export function gapsFromMetrics(m: DeterministicMetrics, target: string): string[] {
  const p = TARGET_PROFILE[target] ?? TARGET_PROFILE.IM2;
  const gaps: string[] = [];
  if (m.durationSec < p.minSec)
    gaps.push(`발화 시간 ${m.durationSec}초 — 목표 ${target} 권장 ${p.minSec}초 이상`);
  if (m.wordCount < p.minWords)
    gaps.push(`단어 수 ${m.wordCount}개 — 목표 ${target} 권장 ${p.minWords}개 이상`);
  if (m.distinctConnectors.length < p.minConnectors)
    gaps.push(`연결어 ${m.distinctConnectors.length}종 — 목표 ${target} 권장 ${p.minConnectors}종 이상`);
  if (m.fillerRate > 0.08)
    gaps.push(`필러 비율 ${(m.fillerRate * 100).toFixed(1)}% — 8% 미만 권장`);
  if (m.pauseOverTwoSec >= 3)
    gaps.push(`2초 이상 침묵 ${m.pauseOverTwoSec}회 — 유창성 감점 요인`);
  if (m.koreanSpillover)
    gaps.push(`한국어 발화 ${m.koreanSpilloverSec}초 감지 — OPIc 은 한국어 사용을 감점합니다`);
  return gaps;
}
