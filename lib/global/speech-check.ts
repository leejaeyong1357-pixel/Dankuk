"use client";

/**
 * 따라 말하기 확인.
 *
 * 음성인식 결과(텍스트)만으로는 정밀한 발음 점수를 만들 수 없다.
 * 소리의 높낮이도 길이도 모르기 때문이다. 그래서 점수를 지어내지 않고,
 * **인식기가 실제로 무엇으로 알아들었는지**만 단어 단위로 보여 준다.
 *
 * 이것만으로도 학습자에게는 충분히 쓸모가 있다 — 내가 한 말이 상대에게
 * 어떻게 들렸는지가 곧 통했는지 여부이기 때문이다.
 */

export type WordMark = "ok" | "miss" | "extra";

export interface SpeechCheck {
  /** 목표 문장의 단어마다 — 들렸는가 */
  target: { word: string; mark: WordMark }[];
  /** 인식기가 더 들은 말 */
  extras: string[];
  /** 목표 단어 중 들린 비율 (0~1). 점수가 아니라 참고용 */
  heard: number;
  /** 아무것도 인식되지 않았는가 */
  empty: boolean;
}

function norm(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * 목표 문장과 인식 결과를 맞춰 본다.
 *
 * 순서를 지키며 짝을 찾는다(최장 공통 부분수열). 한 단어를 흘렸다고
 * 뒤가 전부 어긋나 버리면 화면이 거짓말을 하게 된다.
 */
export function checkSpeech(target: string, heardText: string): SpeechCheck {
  const t = norm(target);
  const h = norm(heardText);

  if (h.length === 0) {
    return { target: t.map((w) => ({ word: w, mark: "miss" })), extras: [], heard: 0, empty: true };
  }

  // LCS 표
  const dp: number[][] = Array.from({ length: t.length + 1 }, () => Array(h.length + 1).fill(0));
  for (let i = 1; i <= t.length; i++) {
    for (let j = 1; j <= h.length; j++) {
      dp[i][j] = t[i - 1] === h[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matchedT = new Set<number>();
  const matchedH = new Set<number>();
  let i = t.length;
  let j = h.length;
  while (i > 0 && j > 0) {
    if (t[i - 1] === h[j - 1]) {
      matchedT.add(i - 1);
      matchedH.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }

  const marks = t.map((w, k) => ({ word: w, mark: (matchedT.has(k) ? "ok" : "miss") as WordMark }));
  const extras = h.filter((_, k) => !matchedH.has(k));

  return {
    target: marks,
    extras,
    heard: t.length ? matchedT.size / t.length : 0,
    empty: false,
  };
}

/** 결과를 한 줄로 — 숫자를 앞세우지 않는다 */
export function speechSummary(c: SpeechCheck): string {
  if (c.empty) return "소리가 잡히지 않았습니다. 마이크를 확인하고 다시 말해 보세요.";
  const missed = c.target.filter((w) => w.mark === "miss").map((w) => w.word);
  if (missed.length === 0) return "말한 그대로 전부 알아들었습니다.";
  if (missed.length <= 2)
    return `대부분 전달됐습니다. ${missed.map((w) => `"${w}"`).join(", ")} 만 또렷하게 한 번 더 해보세요.`;
  return `${missed.length}개 단어가 전달되지 않았습니다. 천천히, 끝 자음을 살려 다시 말해 보세요.`;
}
