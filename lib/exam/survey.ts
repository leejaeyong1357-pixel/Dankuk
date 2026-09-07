/**
 * Background Survey — 시험 전 사전 설문.
 *
 * 문항과 선택지는 실제 OPIc 의 Background Survey 를 그대로 따른다.
 * 여기서 고른 항목이 eligible topic pool 을 만들고, 그 풀에서 testlet 을 조립한다.
 */

export type SurveyCategory =
  | "WORK" | "STUDENT" | "COURSE" | "HOUSING"
  | "LEISURE" | "HOBBY" | "SPORTS" | "TRAVEL";

export interface SurveyItem {
  /** 화면 라벨 */
  label: string;
  /** 연결되는 topic id. 없으면 출제 풀에 들어가지 않는다 (예: "운동을 전혀 하지 않음") */
  topic?: string;
}

export interface SurveySection {
  category: SurveyCategory;
  title: string;
  prompt: string;
  /** 최소 선택 수 */
  min: number;
  multiple: boolean;
  /** 실제 시험처럼 두 열로 늘어놓을지 (선택지가 많은 문항) */
  wide?: boolean;
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
      { label: "사업/회사", topic: "WORK" },
      { label: "재택근무/재택사업", topic: "WORK_HOME" },
      { label: "교사/교육자", topic: "WORK_TEACHER" },
      { label: "일 경험 없음" },
    ],
  },
  {
    category: "STUDENT",
    title: "학생 여부",
    prompt: "현재 귀하는 학생이십니까?",
    min: 1,
    multiple: false,
    items: [
      { label: "예", topic: "SCHOOL" },
      { label: "아니요" },
    ],
  },
  {
    category: "COURSE",
    title: "수강 여부",
    prompt: "최근 어떤 강의를 수강했습니까?",
    min: 1,
    multiple: false,
    items: [
      { label: "학위 과정 수업", topic: "SCHOOL" },
      { label: "평생 학습", topic: "LIFELONG_LEARNING" },
      { label: "어학 수업", topic: "LANGUAGE_CLASS" },
      { label: "수강 후 5년 이상 지남" },
    ],
  },
  {
    category: "HOUSING",
    title: "거주",
    prompt: "현재 귀하는 어디에 살고 계십니까?",
    min: 1,
    multiple: false,
    items: [
      { label: "개인 주택이나 아파트에 홀로 거주", topic: "HOUSING_ALONE" },
      { label: "친구나 룸메이트와 함께 주택이나 아파트에 거주", topic: "HOUSING_ROOMMATE" },
      { label: "가족(배우자/자녀/기타 가족)과 함께 주택이나 아파트에 거주", topic: "HOUSING_FAMILY" },
      { label: "학교 기숙사", topic: "DORMITORY" },
      { label: "군대 막사", topic: "BARRACKS" },
    ],
  },
  {
    category: "LEISURE",
    title: "여가 활동",
    prompt: "귀하는 여가 활동으로 주로 무엇을 하십니까? (두 개 이상 선택)",
    min: 2,
    multiple: true,
    wide: true,
    items: [
      { label: "영화 보기", topic: "MOVIE" },
      { label: "공연 보기", topic: "PERFORMANCE" },
      { label: "콘서트 보기", topic: "CONCERT" },
      { label: "공원 가기", topic: "PARK" },
      { label: "쇼핑하기", topic: "SHOPPING" },
      { label: "카페/커피 전문점 가기", topic: "CAFE" },
      { label: "해변 가기", topic: "BEACH" },
      { label: "게임하기", topic: "GAME" },
    ],
  },
  {
    category: "HOBBY",
    title: "취미·관심사",
    prompt: "귀하의 취미나 관심사는 무엇입니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    wide: true,
    items: [
      { label: "음악 감상하기", topic: "MUSIC" },
      { label: "독서", topic: "READING" },
      { label: "요리하기", topic: "COOKING" },
      { label: "사진 촬영하기", topic: "PHOTO" },
      { label: "그림 그리기", topic: "DRAWING" },
      { label: "악기 연주하기", topic: "INSTRUMENT" },
      { label: "글쓰기", topic: "WRITING" },
      { label: "춤추기", topic: "DANCING" },
      { label: "주식 투자", topic: "INVESTING" },
      { label: "아이에게 책 읽어주기", topic: "READING_TO_KIDS" },
    ],
  },
  {
    category: "SPORTS",
    title: "운동",
    prompt: "귀하는 주로 어떤 운동을 즐기십니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    wide: true,
    items: [
      { label: "농구", topic: "BASKETBALL" },
      { label: "야구/소프트볼", topic: "BASEBALL" },
      { label: "축구", topic: "SOCCER" },
      { label: "미식축구", topic: "FOOTBALL" },
      { label: "럭비", topic: "RUGBY" },
      { label: "아이스하키", topic: "ICE_HOCKEY" },
      { label: "하키", topic: "HOCKEY" },
      { label: "크리켓", topic: "CRICKET" },
      { label: "골프", topic: "GOLF" },
      { label: "배구", topic: "VOLLEYBALL" },
      { label: "테니스", topic: "TENNIS" },
      { label: "배드민턴", topic: "BADMINTON" },
      { label: "탁구", topic: "TABLE_TENNIS" },
      { label: "수영", topic: "SWIMMING" },
      { label: "자전거", topic: "CYCLING" },
      { label: "오토바이", topic: "MOTORCYCLE" },
      { label: "스쿠버다이빙/스노클", topic: "SCUBA" },
      { label: "스키/스노우보드", topic: "SKI" },
      { label: "수상 스키", topic: "WATER_SKI" },
      { label: "아이스 스케이트", topic: "ICE_SKATING" },
      { label: "인라인 스케이트", topic: "INLINE_SKATING" },
      { label: "승마", topic: "HORSEBACK" },
      { label: "조깅", topic: "JOGGING" },
      { label: "걷기", topic: "WALKING" },
      { label: "격투기", topic: "MARTIAL_ARTS" },
      { label: "요가", topic: "YOGA" },
      { label: "하이킹/트레킹", topic: "HIKING" },
      { label: "낚시", topic: "FISHING" },
      { label: "보트 타기", topic: "BOATING" },
      { label: "헬스", topic: "GYM" },
      { label: "체조", topic: "GYMNASTICS" },
      { label: "운동을 전혀 하지 않음" },
    ],
  },
  {
    category: "TRAVEL",
    title: "여행",
    prompt: "귀하는 어떤 휴가나 출장을 다녀온 경험이 있습니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    wide: true,
    items: [
      { label: "국내출장", topic: "DOMESTIC_BUSINESS_TRIP" },
      { label: "해외출장", topic: "OVERSEAS_BUSINESS_TRIP" },
      { label: "집에서 보내는 휴가", topic: "HOME_VACATION" },
      { label: "국내 여행", topic: "DOMESTIC_TRAVEL" },
      { label: "해외 여행", topic: "OVERSEAS_TRAVEL" },
    ],
  },
];

export type SurveyAnswers = Record<SurveyCategory, string[]>;

export function emptyAnswers(): SurveyAnswers {
  return {
    WORK: [], STUDENT: [], COURSE: [], HOUSING: [],
    LEISURE: [], HOBBY: [], SPORTS: [], TRAVEL: [],
  };
}

/**
 * "국롤 조합" — 출제 주제가 서로 겹치고 할 말이 많아, 준비 범위를 좁힐 수 있는 조합.
 *
 * 실제로 많이 쓰이는 선택이라 시연에서 이걸 눌러 한 번에 채운다.
 * 라벨은 위 SURVEY_SECTIONS 의 라벨과 정확히 같아야 한다 (아래 테스트로 확인).
 */
export const PRESET_ANSWERS: SurveyAnswers = {
  WORK: ["일 경험 없음"],
  STUDENT: ["아니요"],
  COURSE: ["수강 후 5년 이상 지남"],
  HOUSING: ["개인 주택이나 아파트에 홀로 거주"],
  LEISURE: ["영화 보기", "공연 보기", "콘서트 보기", "공원 가기", "쇼핑하기"],
  HOBBY: ["음악 감상하기", "독서", "요리하기"],
  SPORTS: ["조깅", "걷기", "운동을 전혀 하지 않음"],
  TRAVEL: ["해외 여행", "국내 여행", "집에서 보내는 휴가"],
};

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
