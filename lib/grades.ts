import type { Grade } from "./types";

/** OPIc 등급 순서 (낮은 순) */
export const GRADE_ORDER: Grade[] = [
  "NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL",
];

/** 성적표에 싣는 등급 설명문 */
export const GRADE_DESCRIPTION: Record<Grade, { name: string; ko: string }> = {
  NL: { name: "Novice Low", ko: "단어 수준의 대답이 가능한 단계입니다." },
  NM: { name: "Novice Mid", ko: "짧은 문장으로 간단히 대답할 수 있는 단계입니다." },
  NH: { name: "Novice High", ko: "일상적인 주제에 대해 간단한 문장을 만들 수 있는 단계입니다." },
  IL: { name: "Intermediate Low", ko: "익숙한 주제에 대해 문장을 이어서 말할 수 있는 단계입니다." },
  IM1: { name: "Intermediate Mid 1", ko: "다양한 주제에 대해 문단 수준으로 답변할 수 있는 단계입니다." },
  IM2: { name: "Intermediate Mid 2", ko: "구체적인 설명과 묘사가 가능하고 자연스러운 흐름을 유지하는 단계입니다." },
  IM3: { name: "Intermediate Mid 3", ko: "복잡한 주제에 대해서도 논리적으로 답변하는 단계입니다." },
  IH: { name: "Intermediate High", ko: "익숙하지 않거나 복잡한 상황에서도 사건을 설명하고 문제를 해결할 수 있는 단계입니다." },
  AL: { name: "Advanced Low", ko: "추상적인 주제까지 비교·논증하며 다문단으로 말할 수 있는 단계입니다." },
};

export function gradeIndex(g: Grade): number {
  return GRADE_ORDER.indexOf(g);
}

/** 목표 대비 달성 여부 */
export function meetsTarget(actual: Grade, target: Grade): boolean {
  return gradeIndex(actual) >= gradeIndex(target);
}

/** OPIc 성적 유효기간은 응시일로부터 2년 */
export function validUntil(takenAtIso: string): string {
  const d = new Date(takenAtIso);
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}
