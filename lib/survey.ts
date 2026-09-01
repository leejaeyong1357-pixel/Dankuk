/**
 * Background Survey — 실제 OPIc 사전 설문과 동일한 구성.
 * 이 응답이 개인별 출제 문항 풀을 결정한다 (SPEC §2.5).
 */

export interface SurveyOption {
  /** 화면에 보이는 한글 라벨 */
  label: string;
  /** 연결되는 주제 id (topics.ts). 없으면 출제에 쓰이지 않음 */
  topicId?: string;
}

export interface SurveyQuestion {
  key: string;
  part: 1 | 2 | 3 | 4;
  prompt: string;
  /** 최소 선택 개수. 1이면 단일 선택 */
  min: number;
  multiple: boolean;
  options: SurveyOption[];
}

export const SURVEY: SurveyQuestion[] = [
  {
    key: "occupation",
    part: 1,
    prompt: "현재 귀하는 어느 분야에 종사하고 계십니까?",
    min: 1,
    multiple: false,
    options: [
      { label: "사업/회사", topicId: "work" },
      { label: "재택근무/재택사업", topicId: "work" },
      { label: "교사/교육자", topicId: "work" },
      { label: "일 경험 없음" },
    ],
  },
  {
    key: "isStudent",
    part: 2,
    prompt: "현재 당신은 학생입니까?",
    min: 1,
    multiple: false,
    options: [
      { label: "예", topicId: "school" },
      { label: "아니요" },
    ],
  },
  {
    key: "recentCourse",
    part: 2,
    prompt: "최근 어떤 강의를 수강했습니까?",
    min: 1,
    multiple: false,
    options: [
      { label: "학위 과정 수업", topicId: "school" },
      { label: "전문 기술 향상을 위한 평생 학습", topicId: "school" },
      { label: "어학수업", topicId: "school" },
      { label: "수강 후 5년 이상 지남" },
    ],
  },
  {
    key: "residence",
    part: 3,
    prompt: "현재 귀하는 어디에 살고 계십니까?",
    min: 1,
    multiple: false,
    options: [
      { label: "개인주택이나 아파트에 홀로 거주", topicId: "home" },
      { label: "친구나 룸메이트와 함께 주택이나 아파트에 거주", topicId: "home" },
      { label: "가족(배우자/자녀/기타 가족 일원)과 함께 주택이나 아파트에 거주", topicId: "home" },
      { label: "학교 기숙사", topicId: "dorm" },
      { label: "군대 막사", topicId: "home" },
    ],
  },
  {
    key: "leisure",
    part: 4,
    prompt: "귀하는 여가 활동으로 주로 무엇을 하십니까? (두 개 이상 선택)",
    min: 2,
    multiple: true,
    options: [
      { label: "영화보기", topicId: "movie" },
      { label: "클럽/나이트클럽 가기", topicId: "bar" },
      { label: "공연보기", topicId: "performance" },
      { label: "콘서트보기", topicId: "concert" },
      { label: "박물관가기", topicId: "museum" },
      { label: "공원가기", topicId: "park" },
      { label: "캠핑하기", topicId: "camping" },
      { label: "해변가기", topicId: "beach" },
      { label: "스포츠 관람", topicId: "sports_watch" },
      { label: "주거 개선", topicId: "home" },
    ],
  },
  {
    key: "hobbies",
    part: 4,
    prompt: "귀하의 취미나 관심사는 무엇입니까? (한 개 이상 선택)",
    min: 1,
    multiple: true,
    options: [
      { label: "아이에게 책 읽어주기", topicId: "reading" },
      { label: "음악 감상하기", topicId: "music" },
      { label: "악기 연주하기", topicId: "instrument" },
      { label: "혼자 노래부르거나 합창하기", topicId: "music" },
      { label: "춤추기", topicId: "dance" },
      { label: "글쓰기(편지, 단문, 시 등)", topicId: "writing" },
      { label: "그림 그리기", topicId: "drawing" },
      { label: "요리하기", topicId: "cooking" },
      { label: "애완동물 기르기", topicId: "pet" },
    ],
  },
  {
    key: "sports",
    part: 4,
    prompt: "귀하는 주로 어떤 운동을 즐기십니까? (한개 이상 선택)",
    min: 1,
    multiple: true,
    options: [
      { label: "농구", topicId: "sports_play" },
      { label: "야구/소프트볼", topicId: "sports_play" },
      { label: "축구", topicId: "sports_play" },
      { label: "미식축구", topicId: "sports_play" },
      { label: "하키", topicId: "sports_play" },
      { label: "크리켓", topicId: "sports_play" },
      { label: "골프", topicId: "sports_play" },
      { label: "배구", topicId: "sports_play" },
      { label: "테니스", topicId: "sports_play" },
      { label: "배드민턴", topicId: "sports_play" },
      { label: "탁구", topicId: "sports_play" },
      { label: "수영", topicId: "swimming" },
      { label: "자전거", topicId: "cycling" },
      { label: "스키/스노우보드", topicId: "sports_play" },
      { label: "아이스 스케이트", topicId: "sports_play" },
      { label: "조깅", topicId: "jogging" },
      { label: "걷기", topicId: "walking" },
      { label: "요가", topicId: "yoga" },
      { label: "하이킹/트레킹", topicId: "hiking" },
      { label: "낚시", topicId: "fishing" },
      { label: "헬스", topicId: "gym" },
      { label: "운동을 전혀 하지 않음" },
    ],
  },
  {
    key: "travel",
    part: 4,
    prompt: "귀하는 어떤 휴가나 출장을 다녀온 경험이 있습니까? (한개 이상 선택)",
    min: 1,
    multiple: true,
    options: [
      { label: "국내출장", topicId: "business_trip" },
      { label: "해외출장", topicId: "business_trip" },
      { label: "집에서 보내는 휴가", topicId: "home_vacation" },
      { label: "국내 여행", topicId: "domestic_travel" },
      { label: "해외 여행", topicId: "overseas_travel" },
    ],
  },
];

/** 설문 응답에서 활성 주제 id 집합을 뽑는다 */
export function surveyTopicIds(answers: Record<string, string | string[]>): string[] {
  const ids = new Set<string>();
  for (const q of SURVEY) {
    const raw = answers[q.key];
    if (!raw) continue;
    const picked = Array.isArray(raw) ? raw : [raw];
    for (const label of picked) {
      const opt = q.options.find((o) => o.label === label);
      if (opt?.topicId) ids.add(opt.topicId);
    }
  }
  return [...ids];
}
