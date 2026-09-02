/**
 * Background Survey — 시험 전 사전 설문.
 * 여기서 고른 항목이 eligible topic pool 을 만들고, 그 풀에서 testlet 을 조립한다.
 */

export type SurveyCategory =
  | "WORK" | "SCHOOL" | "HOUSING" | "LEISURE" | "HOBBY" | "SPORTS" | "TRAVEL";

export interface SurveyItem {
  /** 화면 라벨 */
  label: string;
  /** 연결되는 topic id. 없으면 출제 풀에 들어가지 않는다 (예: "운동하지 않음") */
  topic?: string;
}

export interface SurveySection {
  category: SurveyCategory;
  title: string;
  prompt: string;
  /** 최소 선택 수 */
  min: number;
  multiple: boolean;
  items: SurveyItem[];
}

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    category: "WORK",
    title: "직업",
    prompt: "현재 귀하는 어느 분야에 종사하고 계십니까?",
    min: 1,
    multiple: false,
    items: [
      { label: "직장 경험 있음 — 사업/회사", topic: "WORK" },
      { label: "직장 경험 있음 — 재택근무/재택사업", topic: "WORK" },
      { label: "직장 경험 있음 — 교사/교육자", topic: "WORK" },
      { label: "직장 경험 없음" },
    ],
  },
  {
    category: "SCHOOL",
    title: "학업",
    prompt: "현재 학생이십니까? 최근 수강 경험을 선택해 주세요.",
    min: 1,
    multiple: false,
    items: [
      { label: "현재 학생 — 학위 과정 수강 중", topic: "SCHOOL" },
      { label: "현재 학생 — 어학 수업 수강 중", topic: "SCHOOL" },
      { label: "학생 아님 — 최근 수강 경험 있음", topic: "SCHOOL" },
      { label: "학생 아님 — 수강 후 5년 이상 지남" },
    ],
  },
  {
    category: "HOUSING",
    title: "거주",
    prompt: "현재 귀하는 어디에 살고 계십니까?",
    min: 1,
    multiple: false,
    items: [
      { label: "가족과 함께 거주", topic: "HOUSING_FAMILY" },
      { label: "혼자 거주", topic: "HOUSING_ALONE" },
      { label: "학교 기숙사", topic: "DORMITORY" },
      { label: "아파트", topic: "APARTMENT" },
      { label: "주택", topic: "HOUSE" },
    ],
  },
  {
    category: "LEISURE",
    title: "여가 활동",
    prompt: "귀하는 여가 활동으로 주로 무엇을 하십니까? (두 개 이상 선택)",
    min: 2,
    multiple: true,
    items: [
      { label: "영화 보기", topic: "MOVIE" },
      { label: "공연 보기", topic: "PERFORMANCE" },
      { label: "콘서트 보기", topic: "CONCERT" },
      { label: "공원 가기", topic: "PARK" },
      { label: "카페 가기", topic: "CAFE" },
      { label: "쇼핑하기", topic: "SHOPPING" },
      { label: "TV·영상 시청", topic: "TV" },
      { label: "게임하기", topic: "GAME" },
    ],
  },
  {
    category: "HOBBY",
    title: "취미·관심사",
    prompt: "귀하의 취미나 관심사는 무엇입니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    items: [
      { label: "음악 감상", topic: "MUSIC" },
      { label: "악기 연주", topic: "INSTRUMENT" },
      { label: "독서", topic: "READING" },
      { label: "요리하기", topic: "COOKING" },
      { label: "사진 촬영", topic: "PHOTO" },
    ],
  },
  {
    category: "SPORTS",
    title: "운동",
    prompt: "귀하는 주로 어떤 운동을 즐기십니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    items: [
      { label: "걷기", topic: "WALKING" },
      { label: "조깅", topic: "JOGGING" },
      { label: "헬스", topic: "GYM" },
      { label: "자전거", topic: "CYCLING" },
      { label: "하이킹·트레킹", topic: "HIKING" },
      { label: "운동을 하지 않음" },
    ],
  },
  {
    category: "TRAVEL",
    title: "여행",
    prompt: "귀하는 어떤 휴가나 출장을 다녀온 경험이 있습니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    items: [
      { label: "국내 여행", topic: "DOMESTIC_TRAVEL" },
      { label: "해외 여행", topic: "OVERSEAS_TRAVEL" },
      { label: "집에서 보내는 휴가", topic: "HOME_VACATION" },
    ],
  },
];

export type SurveyAnswers = Record<SurveyCategory, string[]>;

export function emptyAnswers(): SurveyAnswers {
  return {
    WORK: [], SCHOOL: [], HOUSING: [], LEISURE: [], HOBBY: [], SPORTS: [], TRAVEL: [],
  };
}

/** 설문 응답 -> 선택된 topic id 배열 */
export function selectedSurveyTopics(answers: SurveyAnswers): string[] {
  const out = new Set<string>();
  for (const section of SURVEY_SECTIONS) {
    for (const label of answers[section.category] ?? []) {
      const item = section.items.find((i) => i.label === label);
      if (item?.topic) out.add(item.topic);
    }
  }
  return [...out];
}

export function isSurveyComplete(answers: SurveyAnswers): boolean {
  return SURVEY_SECTIONS.every((s) => (answers[s.category] ?? []).length >= s.min);
}
