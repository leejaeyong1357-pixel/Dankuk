import type { QuestionFunction } from "./types";

export interface Topic {
  id: string;
  ko: string;
  /** Ava 질문문 안에서 쓰이는 영어 명사구 */
  en: string;
  /** 설문 연동 주제 / 돌발 주제 */
  source: "survey" | "adhoc";
  /** 롤플레이 출제가 가능한가 — 상대(점원/친구/직원)가 존재하는 주제만 */
  roleplay?: {
    /** 전화/방문 상대 (영어 문항용) */
    counterpart: string;
    /** 전화/방문 상대 (한글 번역용) */
    counterpartKo: string;
    /** 롤플레이 상황 요약 (한글) */
    situationKo: string;
  };
  /** 어드밴스(비교·이슈) 출제가 가능한가 — 추상 확장이 되는 주제만 */
  advanced?: boolean;
}

export const TOPICS: Topic[] = [
  // ── 설문 연동 주제 ────────────────────────────────
  { id: "movie", ko: "영화보기", en: "movies", source: "survey", advanced: true,
    roleplay: { counterpart: "a movie theater", counterpartKo: "영화관", situationKo: "영화관에 상영 시간과 좌석을 문의하는 상황" } },
  { id: "park", ko: "공원가기", en: "parks", source: "survey", advanced: true },
  { id: "music", ko: "음악감상", en: "music", source: "survey", advanced: true,
    roleplay: { counterpart: "a music store", counterpartKo: "음반 매장", situationKo: "음반 매장에 재고를 문의하는 상황" } },
  { id: "concert", ko: "콘서트보기", en: "concerts", source: "survey", advanced: true,
    roleplay: { counterpart: "a ticket office", counterpartKo: "매표소", situationKo: "콘서트 티켓을 예매하는 상황" } },
  { id: "performance", ko: "공연보기", en: "live performances", source: "survey", advanced: true },
  { id: "museum", ko: "박물관가기", en: "museums", source: "survey" },
  { id: "camping", ko: "캠핑하기", en: "camping", source: "survey" },
  { id: "beach", ko: "해변가기", en: "the beach", source: "survey" },
  { id: "bar", ko: "술집/바", en: "bars", source: "survey", advanced: true },
  { id: "sports_watch", ko: "스포츠 관람", en: "watching sports", source: "survey" },
  { id: "sports_play", ko: "운동하기", en: "playing sports", source: "survey" },
  { id: "swimming", ko: "수영", en: "swimming", source: "survey" },
  { id: "cycling", ko: "자전거", en: "cycling", source: "survey" },
  { id: "jogging", ko: "조깅", en: "jogging", source: "survey" },
  { id: "walking", ko: "걷기", en: "walking", source: "survey" },
  { id: "yoga", ko: "요가", en: "yoga", source: "survey" },
  { id: "hiking", ko: "하이킹/트레킹", en: "hiking", source: "survey" },
  { id: "fishing", ko: "낚시", en: "fishing", source: "survey" },
  { id: "gym", ko: "헬스", en: "working out at the gym", source: "survey" },
  { id: "reading", ko: "독서", en: "reading", source: "survey", advanced: true,
    roleplay: { counterpart: "a library", counterpartKo: "도서관", situationKo: "도서관에 대출과 이용 방법을 문의하는 상황" } },
  { id: "instrument", ko: "악기 연주", en: "playing an instrument", source: "survey" },
  { id: "dance", ko: "춤추기", en: "dancing", source: "survey" },
  { id: "writing", ko: "글쓰기", en: "writing", source: "survey" },
  { id: "drawing", ko: "그림 그리기", en: "drawing", source: "survey" },
  { id: "cooking", ko: "요리하기", en: "cooking", source: "survey", advanced: true },
  { id: "pet", ko: "애완동물", en: "pets", source: "survey" },
  { id: "home", ko: "집", en: "your home", source: "survey", advanced: true },
  { id: "dorm", ko: "기숙사", en: "your dormitory", source: "survey" },
  { id: "school", ko: "학교/수업", en: "your school", source: "survey", advanced: true },
  { id: "work", ko: "직장", en: "your workplace", source: "survey", advanced: true },
  { id: "domestic_travel", ko: "국내여행", en: "domestic trips", source: "survey", advanced: true,
    roleplay: { counterpart: "a travel agency", counterpartKo: "여행사", situationKo: "여행사에 국내 여행 상품을 문의하는 상황" } },
  { id: "overseas_travel", ko: "해외여행", en: "trips abroad", source: "survey", advanced: true,
    roleplay: { counterpart: "a travel agency", counterpartKo: "여행사", situationKo: "여행사에 해외 여행 일정을 문의하는 상황" } },
  { id: "home_vacation", ko: "집에서 보내는 휴가", en: "staying home on vacation", source: "survey" },
  { id: "business_trip", ko: "출장", en: "business trips", source: "survey", advanced: true },

  // ── 돌발 주제 (설문과 무관하게 출제) ──────────────
  { id: "bank", ko: "은행", en: "banks", source: "adhoc", advanced: true,
    roleplay: { counterpart: "a bank", counterpartKo: "은행", situationKo: "은행에 계좌 개설을 문의하는 상황" } },
  { id: "weather", ko: "날씨/계절", en: "the weather and seasons", source: "adhoc", advanced: true },
  { id: "hotel", ko: "호텔", en: "hotels", source: "adhoc",
    roleplay: { counterpart: "a hotel", counterpartKo: "호텔", situationKo: "호텔에 객실을 예약하는 상황" } },
  { id: "holiday", ko: "명절/휴일", en: "holidays", source: "adhoc", advanced: true },
  { id: "appointment", ko: "약속", en: "appointments", source: "adhoc" },
  { id: "gathering", ko: "모임", en: "gatherings", source: "adhoc", advanced: true },
  { id: "industry", ko: "산업", en: "industries in your country", source: "adhoc", advanced: true },
  { id: "health", ko: "건강", en: "health", source: "adhoc", advanced: true,
    roleplay: { counterpart: "a clinic", counterpartKo: "병원", situationKo: "병원에 진료 예약을 문의하는 상황" } },
  { id: "restaurant", ko: "식당/외식", en: "restaurants", source: "adhoc", advanced: true,
    roleplay: { counterpart: "a restaurant", counterpartKo: "식당", situationKo: "식당에 자리를 예약하는 상황" } },
  { id: "cafe", ko: "카페", en: "cafes", source: "adhoc", advanced: true,
    roleplay: { counterpart: "a cafe", counterpartKo: "카페", situationKo: "새로 생긴 카페에 메뉴와 주문 방법을 문의하는 상황" } },
  { id: "transport", ko: "교통수단", en: "public transportation", source: "adhoc", advanced: true },
  { id: "recycling", ko: "재활용", en: "recycling", source: "adhoc", advanced: true },
  { id: "internet", ko: "인터넷", en: "the Internet", source: "adhoc", advanced: true },
  { id: "technology", ko: "기술", en: "technology", source: "adhoc", advanced: true },
  { id: "device", ko: "전자기기", en: "electronic devices", source: "adhoc",
    roleplay: { counterpart: "an electronics store", counterpartKo: "전자기기 매장", situationKo: "전자기기를 구매하기 위해 문의하는 상황" } },
  { id: "shopping", ko: "쇼핑", en: "shopping", source: "adhoc", advanced: true,
    roleplay: { counterpart: "a store", counterpartKo: "매장", situationKo: "매장에 상품을 문의하는 상황" } },
  { id: "neighborhood", ko: "동네", en: "your neighborhood", source: "adhoc", advanced: true },
  { id: "family_friend", ko: "가족/친구", en: "your family and friends", source: "adhoc", advanced: true,
    roleplay: { counterpart: "a friend", counterpartKo: "친구", situationKo: "친구에게 부탁하기 위해 연락하는 상황" } },
  { id: "country", ko: "나라", en: "your country", source: "adhoc", advanced: true },
  { id: "job_hunting", ko: "구직 활동", en: "looking for a job", source: "adhoc", advanced: true },
  { id: "phone", ko: "전화 통화", en: "phone calls", source: "adhoc" },
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export const ADHOC_TOPICS = TOPICS.filter((t) => t.source === "adhoc");
export const ROLEPLAY_TOPICS = TOPICS.filter((t) => t.roleplay);
export const ADVANCED_TOPICS = TOPICS.filter((t) => t.advanced);

/** 콤보 세트의 기능 축 (SPEC §2.2) */
export const COMBO_FUNCTIONS: QuestionFunction[] = ["describe", "habit", "experience"];
/** 난이도 5·6 콤보에서 습관/경험을 치환할 수 있는 고난도 축 */
export const COMBO_FUNCTIONS_HIGH: QuestionFunction[] = ["describe", "compare", "experience"];
/** 롤플레이 고정 시퀀스 (SPEC §2.3) */
export const ROLEPLAY_FUNCTIONS: QuestionFunction[] = ["rp_ask", "rp_solve", "rp_relate"];
/** 어드밴스 2문항 (SPEC §2.4) */
export const ADVANCED_FUNCTIONS: QuestionFunction[] = ["compare", "issue"];
