import type { DifficultyBand, SelfAssessment } from "./types";

/**
 * OPIc 난이도 표기 (SPEC §2.6).
 *
 * 실제 시험의 난이도는 하나의 숫자가 아니라 **두 번의 선택이 만드는 조합**이다.
 *   ① 자가평가에서 1~6단계를 고른다        -> initial
 *   ② 7번 문항 후 더 쉬운/비슷한/더 어려운  -> adjusted
 * 그래서 최종 난이도가 "3-3", "4-4", "5-6" 처럼 표기된다.
 *
 * 문제 세트 자체는 ①이 결정하고, ②는 남은 문항의 표현 수준만 조정한다.
 */
export interface Difficulty {
  initial: SelfAssessment;
  adjusted: SelfAssessment;
}

export type SecondChoiceValue = "easier" | "similar" | "harder";

const clamp = (n: number): SelfAssessment =>
  Math.min(6, Math.max(1, n)) as SelfAssessment;

/** 2차 선택을 적용한 난이도 */
export function applyChoice(initial: SelfAssessment, choice: SecondChoiceValue): Difficulty {
  const delta = choice === "easier" ? -1 : choice === "harder" ? 1 : 0;
  return { initial, adjusted: clamp(initial + delta) };
}

/** "5-6" 형태의 표기 */
export function difficultyLabel(d: Difficulty): string {
  return `${d.initial}-${d.adjusted}`;
}

/** 2차 선택 전 상태의 표기 — 아직 조정하지 않았으므로 n-n */
export function initialLabel(initial: SelfAssessment): string {
  return `${initial}-${initial}`;
}

/** 난이도 단계 -> 문항 뱅크 밴드 */
export function bandOfLevel(level: SelfAssessment): DifficultyBand {
  if (level <= 2) return "1-2";
  if (level <= 4) return "3-4";
  return "5-6";
}

/**
 * 문제 세트는 initial 이 결정한다.
 * adjusted 는 8번 이후 문항의 표현 수준만 한 칸 움직인다.
 */
export function setBand(d: Difficulty): DifficultyBand {
  return bandOfLevel(d.initial);
}
export function tailBand(d: Difficulty): DifficultyBand {
  return bandOfLevel(d.adjusted);
}

/** 난이도 1·2 는 12문항, 3~6 은 15문항 */
export function questionCountOf(initial: SelfAssessment): 12 | 15 {
  return initial <= 2 ? 12 : 15;
}

/** 학습 화면에서 고를 수 있는 난이도 조합 — 실제로 성립하는 것만 */
export const DIFFICULTY_OPTIONS: { value: string; d: Difficulty; hint: string }[] = (() => {
  const out: { value: string; d: Difficulty; hint: string }[] = [];
  for (let i = 1 as number; i <= 6; i++) {
    for (const delta of [-1, 0, 1]) {
      const adjusted = i + delta;
      if (adjusted < 1 || adjusted > 6) continue;
      const d = { initial: i as SelfAssessment, adjusted: adjusted as SelfAssessment };
      out.push({
        value: difficultyLabel(d),
        d,
        hint:
          delta === 0 ? "비슷한 질문 선택" : delta === 1 ? "더 어려운 질문 선택" : "더 쉬운 질문 선택",
      });
    }
  }
  return out;
})();

/** 목표 등급별로 흔히 권장되는 난이도 조합 */
export const RECOMMENDED_BY_TARGET: Record<string, string> = {
  IL: "2-2",
  IM2: "3-3",
  IM3: "4-4",
  IH: "5-5",
  AL: "6-6",
};
