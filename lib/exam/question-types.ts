/** 난이도 — 학생이 시험 전 1~6 중 하나를 고른다 */
export const Difficulty = {
  LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3, LEVEL_4: 4, LEVEL_5: 5, LEVEL_6: 6,
} as const;
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5, 6];

/** 중간 난이도 재조정 선택 */
export type DifficultySelection = "EASIER" | "SIMILAR" | "HARDER";

/**
 * 문항이 요구하는 Speaking Function.
 * NORMAL / HARD 같은 모호한 타입은 쓰지 않는다.
 */
export type QuestionType =
  | "SELF_INTRODUCTION"
  | "DESCRIPTION_PLACE"
  | "DESCRIPTION_PERSON"
  | "DESCRIPTION_OBJECT"
  | "ROUTINE"
  | "PREFERENCE"
  | "PAST_EXPERIENCE"
  | "PAST_RECENT"
  | "PAST_MEMORABLE"
  | "FIRST_EXPERIENCE"
  | "CHANGE"
  | "COMPARE"
  | "CHANGE_COMPARE"
  | "ROLEPLAY_ASK"
  | "ROLEPLAY_INFORMATION"
  | "ROLEPLAY_PROBLEM"
  | "ROLEPLAY_SOLUTION"
  | "ROLEPLAY_PAST_EXPERIENCE"
  | "OPINION"
  | "ISSUE"
  | "CAUSE_EFFECT"
  | "ADVANTAGE_DISADVANTAGE"
  | "HYPOTHETICAL";

export const QUESTION_TYPE_KO: Record<QuestionType, string> = {
  SELF_INTRODUCTION: "자기소개",
  DESCRIPTION_PLACE: "장소 묘사",
  DESCRIPTION_PERSON: "인물 묘사",
  DESCRIPTION_OBJECT: "사물 묘사",
  ROUTINE: "습관·루틴",
  PREFERENCE: "선호",
  PAST_EXPERIENCE: "과거 경험",
  PAST_RECENT: "최근 경험",
  PAST_MEMORABLE: "기억에 남는 경험",
  FIRST_EXPERIENCE: "처음 경험",
  CHANGE: "변화",
  COMPARE: "비교",
  CHANGE_COMPARE: "변화·비교",
  ROLEPLAY_ASK: "롤플레이 · 질문하기",
  ROLEPLAY_INFORMATION: "롤플레이 · 정보 요청",
  ROLEPLAY_PROBLEM: "롤플레이 · 문제 상황",
  ROLEPLAY_SOLUTION: "롤플레이 · 대안 제시",
  ROLEPLAY_PAST_EXPERIENCE: "롤플레이 · 유사 경험",
  OPINION: "의견",
  ISSUE: "사회적 이슈",
  CAUSE_EFFECT: "원인과 결과",
  ADVANTAGE_DISADVANTAGE: "장단점",
  HYPOTHETICAL: "가정 상황",
};

/** Level Check 는 현재 난이도 수행 확인, Probe 는 한 단계 위 기능 확인 */
export type ProbeType = "LEVEL_CHECK" | "PROBE";

/**
 * 난이도별로 사용할 수 있는 Speaking Function.
 * 난이도가 오를수록 요구되는 기능 자체가 어려워진다. 어휘 난이도의 문제가 아니다.
 */
export const TYPES_BY_LEVEL: Record<DifficultyLevel, QuestionType[]> = {
  // 난이도 1 에도 시험 구조상 롤플레이 세트가 한 번 들어간다.
  // 다만 복잡한 정보 요청/해결책 제시는 제외하고 가장 단순한 형태만 허용한다.
  1: [
    "DESCRIPTION_PLACE", "DESCRIPTION_OBJECT", "PREFERENCE", "ROUTINE",
    "PAST_EXPERIENCE",
    "ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE",
  ],
  2: [
    "DESCRIPTION_PLACE", "DESCRIPTION_OBJECT", "PREFERENCE", "ROUTINE",
    "PAST_EXPERIENCE", "PAST_RECENT",
    "ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE",
  ],
  3: [
    "DESCRIPTION_PLACE", "DESCRIPTION_OBJECT", "DESCRIPTION_PERSON", "PREFERENCE",
    "ROUTINE", "PAST_EXPERIENCE", "PAST_RECENT", "PAST_MEMORABLE", "COMPARE",
    "ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE",
  ],
  4: [
    "DESCRIPTION_PLACE", "DESCRIPTION_OBJECT", "DESCRIPTION_PERSON", "PREFERENCE",
    "ROUTINE", "PAST_EXPERIENCE", "PAST_RECENT", "PAST_MEMORABLE", "FIRST_EXPERIENCE",
    "CHANGE", "COMPARE", "CHANGE_COMPARE",
    "ROLEPLAY_ASK", "ROLEPLAY_INFORMATION", "ROLEPLAY_PROBLEM", "ROLEPLAY_SOLUTION",
    "ROLEPLAY_PAST_EXPERIENCE",
  ],
  5: [
    "DESCRIPTION_PLACE", "DESCRIPTION_PERSON", "ROUTINE",
    "PAST_EXPERIENCE", "PAST_MEMORABLE", "FIRST_EXPERIENCE",
    "CHANGE", "COMPARE", "CHANGE_COMPARE",
    "ROLEPLAY_ASK", "ROLEPLAY_INFORMATION", "ROLEPLAY_PROBLEM", "ROLEPLAY_SOLUTION",
    "ROLEPLAY_PAST_EXPERIENCE",
    "OPINION", "CAUSE_EFFECT",
  ],
  6: [
    "DESCRIPTION_PERSON", "PAST_MEMORABLE",
    "CHANGE", "COMPARE", "CHANGE_COMPARE",
    "ROLEPLAY_ASK", "ROLEPLAY_INFORMATION", "ROLEPLAY_PROBLEM", "ROLEPLAY_SOLUTION",
    "ROLEPLAY_PAST_EXPERIENCE",
    "OPINION", "ISSUE", "CAUSE_EFFECT", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL",
  ],
};

/** 난이도 3 학생에게 추상적인 사회 이슈를 강제하지 않기 위한 상한 */
export const ABSTRACT_TYPES: QuestionType[] = [
  "ISSUE", "CAUSE_EFFECT", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL", "OPINION",
];

export function isTypeAllowed(type: QuestionType, level: DifficultyLevel): boolean {
  return type === "SELF_INTRODUCTION" || TYPES_BY_LEVEL[level].includes(type);
}

/** 해당 난이도에서 출제 가능한 기능 목록 */
export function allowedTypes(level: DifficultyLevel): QuestionType[] {
  return TYPES_BY_LEVEL[level];
}

/** 난이도 재조정 규칙 — 1 미만, 6 초과로 나가지 않는다 */
export function applySelection(
  initial: DifficultyLevel,
  selection: DifficultySelection,
): DifficultyLevel {
  const delta = selection === "EASIER" ? -1 : selection === "HARDER" ? 1 : 0;
  return Math.min(6, Math.max(1, initial + delta)) as DifficultyLevel;
}

/** "5-6" 형태의 조합 표기 */
export function comboLabel(initial: DifficultyLevel, second: DifficultyLevel): string {
  return `${initial}-${second}`;
}
