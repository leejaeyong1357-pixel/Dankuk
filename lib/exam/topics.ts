import type { SurveyCategory } from "./survey";

export interface Topic {
  id: string;
  ko: string;
  /** 문항 영문에 들어갈 명사구 */
  en: string;
  /** 설문 연동 주제면 카테고리, 돌발 주제면 "UNEXPECTED" */
  surveyCategory: SurveyCategory | "UNEXPECTED";
  /** 세부 주제 — 같은 topic 안에서 testlet 을 다양화하는 데 쓴다 */
  subTopics: { id: string; ko: string; en: string }[];
  /** 롤플레이 상대. 없으면 롤플레이 testlet 을 만들지 않는다 */
  roleplay?: { en: string; ko: string };
  /** ISSUE / OPINION / CAUSE_EFFECT 같은 추상 기능을 얹을 수 있는 주제인가 */
  abstract?: boolean;
}

const T = (
  id: string, ko: string, en: string,
  surveyCategory: Topic["surveyCategory"],
  subTopics: [string, string, string][],
  opts: { roleplay?: [string, string]; abstract?: boolean } = {},
): Topic => ({
  id, ko, en, surveyCategory,
  subTopics: subTopics.map(([sid, sko, sen]) => ({ id: sid, ko: sko, en: sen })),
  roleplay: opts.roleplay ? { en: opts.roleplay[0], ko: opts.roleplay[1] } : undefined,
  abstract: opts.abstract,
});

export const TOPICS: Topic[] = [
  // ── WORK / SCHOOL / HOUSING ──────────────────────────────
  T("WORK", "직장", "your workplace", "WORK", [
    ["WORK_OFFICE", "사무실", "your office"],
    ["WORK_COLLEAGUE", "직장 동료", "your coworkers"],
    ["WORK_PROJECT", "맡은 업무", "the projects you work on"],
  ], { abstract: true }),
  T("SCHOOL", "학교·수업", "your school", "SCHOOL", [
    ["SCHOOL_CAMPUS", "캠퍼스", "your campus"],
    ["SCHOOL_CLASS", "수업", "the classes you take"],
    ["SCHOOL_PROFESSOR", "교수님", "one of your professors"],
  ], { abstract: true }),
  T("HOUSING_FAMILY", "가족과 사는 집", "the home you share with your family", "HOUSING", [
    ["HF_ROOM", "내 방", "your own room"],
    ["HF_LIVING", "거실", "your living room"],
    ["HF_FAMILY", "가족", "the people you live with"],
  ]),
  T("HOUSING_ALONE", "혼자 사는 집", "the place you live alone", "HOUSING", [
    ["HA_ROOM", "내 방", "your room"],
    ["HA_KITCHEN", "부엌", "your kitchen"],
    ["HA_CHORE", "집안일", "the housework you do"],
  ]),
  T("DORMITORY", "기숙사", "your dormitory", "HOUSING", [
    ["DORM_ROOM", "기숙사 방", "your dorm room"],
    ["DORM_ROOMMATE", "룸메이트", "your roommate"],
    ["DORM_FACILITY", "기숙사 시설", "the dorm facilities"],
  ]),
  T("APARTMENT", "아파트", "your apartment", "HOUSING", [
    ["APT_LAYOUT", "구조", "the layout of your apartment"],
    ["APT_NEIGHBOR", "이웃", "your neighbors"],
    ["APT_BUILDING", "건물 시설", "the building facilities"],
  ]),
  T("HOUSE", "주택", "your house", "HOUSING", [
    ["HOUSE_YARD", "마당", "your yard"],
    ["HOUSE_ROOM", "방", "the rooms in your house"],
    ["HOUSE_REPAIR", "집 관리", "taking care of your house"],
  ]),

  // ── LEISURE ──────────────────────────────────────────────
  T("MOVIE", "영화", "movies", "LEISURE", [
    ["MOVIE_THEATER", "영화관", "the movie theater you go to"],
    ["MOVIE_GENRE", "좋아하는 장르", "the kinds of movies you like"],
    ["MOVIE_ACTOR", "좋아하는 배우", "an actor you like"],
  ], { roleplay: ["a movie theater", "영화관"], abstract: true }),
  T("PERFORMANCE", "공연", "live performances", "LEISURE", [
    ["PERF_VENUE", "공연장", "the venue you go to"],
    ["PERF_KIND", "공연 종류", "the kinds of performances you watch"],
    ["PERF_COMPANION", "함께 가는 사람", "the people you go with"],
  ], { roleplay: ["a box office", "매표소"], abstract: true }),
  T("CONCERT", "콘서트", "concerts", "LEISURE", [
    ["CON_VENUE", "콘서트장", "the concert hall you go to"],
    ["CON_ARTIST", "좋아하는 가수", "an artist you like"],
    ["CON_TICKET", "티켓 예매", "getting concert tickets"],
  ], { roleplay: ["a ticket office", "매표소"], abstract: true }),
  T("PARK", "공원", "parks", "LEISURE", [
    ["PARK_NEAR", "동네 공원", "the park near your home"],
    ["PARK_ACTIVITY", "공원에서 하는 활동", "what you do at the park"],
    ["PARK_FACILITY", "공원 시설", "the facilities in the park"],
  ], { abstract: true }),
  T("CAFE", "카페", "cafes", "LEISURE", [
    ["CAFE_FAVORITE", "자주 가는 카페", "the cafe you go to often"],
    ["CAFE_ORDER", "주문하는 메뉴", "what you usually order"],
    ["CAFE_ATMOSPHERE", "카페 분위기", "the atmosphere of the cafe"],
  ], { roleplay: ["a cafe", "카페"], abstract: true }),
  T("SHOPPING", "쇼핑", "shopping", "LEISURE", [
    ["SHOP_PLACE", "쇼핑하는 곳", "the place you go shopping"],
    ["SHOP_ITEM", "주로 사는 것", "the things you usually buy"],
    ["SHOP_ONLINE", "온라인 쇼핑", "shopping online"],
  ], { roleplay: ["a store", "매장"], abstract: true }),
  T("TV", "TV·영상 시청", "TV shows and videos", "LEISURE", [
    ["TV_PROGRAM", "즐겨 보는 프로그램", "the shows you watch"],
    ["TV_DEVICE", "보는 기기", "what you watch them on"],
    ["TV_HABIT", "시청 습관", "when you usually watch"],
  ], { abstract: true }),
  T("GAME", "게임", "games", "LEISURE", [
    ["GAME_FAVORITE", "좋아하는 게임", "the game you play most"],
    ["GAME_DEVICE", "게임 기기", "the device you play on"],
    ["GAME_FRIEND", "함께하는 사람", "the people you play with"],
  ], { abstract: true }),

  // ── HOBBY ────────────────────────────────────────────────
  T("MUSIC", "음악 감상", "music", "HOBBY", [
    ["MUSIC_GENRE", "좋아하는 장르", "the music you listen to"],
    ["MUSIC_ARTIST", "좋아하는 가수", "your favorite singer"],
    ["MUSIC_WHEN", "듣는 상황", "when and where you listen"],
  ], { roleplay: ["a music store", "음반 매장"], abstract: true }),
  T("INSTRUMENT", "악기 연주", "playing an instrument", "HOBBY", [
    ["INST_KIND", "연주하는 악기", "the instrument you play"],
    ["INST_PRACTICE", "연습", "how you practice"],
    ["INST_START", "시작한 계기", "how you started"],
  ]),
  T("READING", "독서", "reading", "HOBBY", [
    ["READ_GENRE", "좋아하는 책", "the books you like"],
    ["READ_WHERE", "읽는 장소", "where you read"],
    ["READ_HABIT", "독서 습관", "your reading habits"],
  ], { roleplay: ["a library", "도서관"], abstract: true }),
  T("COOKING", "요리", "cooking", "HOBBY", [
    ["COOK_DISH", "자주 만드는 요리", "the dish you cook most"],
    ["COOK_PROCESS", "요리 과정", "how you cook it"],
    ["COOK_KITCHEN", "부엌", "your kitchen"],
  ], { abstract: true }),
  T("PHOTO", "사진 촬영", "taking photos", "HOBBY", [
    ["PHOTO_SUBJECT", "찍는 대상", "what you take pictures of"],
    ["PHOTO_GEAR", "사용하는 장비", "the camera you use"],
    ["PHOTO_PLACE", "촬영 장소", "where you take photos"],
  ]),

  // ── SPORTS ───────────────────────────────────────────────
  T("WALKING", "걷기", "walking", "SPORTS", [
    ["WALK_ROUTE", "걷는 코스", "the route you walk"],
    ["WALK_WHEN", "걷는 시간", "when you go walking"],
    ["WALK_COMPANION", "함께 걷는 사람", "who you walk with"],
  ]),
  T("JOGGING", "조깅", "jogging", "SPORTS", [
    ["JOG_ROUTE", "조깅 코스", "the route you jog"],
    ["JOG_GEAR", "조깅 장비", "the gear you use"],
    ["JOG_ROUTINE", "조깅 루틴", "your jogging routine"],
  ]),
  T("GYM", "헬스", "working out at the gym", "SPORTS", [
    ["GYM_PLACE", "다니는 헬스장", "the gym you go to"],
    ["GYM_ROUTINE", "운동 루틴", "your workout routine"],
    ["GYM_EQUIP", "사용하는 기구", "the equipment you use"],
  ], { roleplay: ["a gym", "헬스장"] }),
  T("CYCLING", "자전거", "cycling", "SPORTS", [
    ["CYC_ROUTE", "자전거 코스", "the route you ride"],
    ["CYC_BIKE", "자전거", "your bicycle"],
    ["CYC_WHEN", "타는 시간", "when you go cycling"],
  ]),
  T("HIKING", "하이킹", "hiking", "SPORTS", [
    ["HIKE_MOUNTAIN", "가는 산", "the mountain you hike"],
    ["HIKE_PREP", "준비물", "what you bring"],
    ["HIKE_COMPANION", "함께 가는 사람", "who you hike with"],
  ]),

  // ── TRAVEL ───────────────────────────────────────────────
  T("DOMESTIC_TRAVEL", "국내여행", "domestic trips", "TRAVEL", [
    ["DT_PLACE", "가는 여행지", "the places you visit"],
    ["DT_PREP", "여행 준비", "how you prepare"],
    ["DT_TRANSPORT", "이동 수단", "how you get there"],
  ], { roleplay: ["a travel agency", "여행사"], abstract: true }),
  T("OVERSEAS_TRAVEL", "해외여행", "trips abroad", "TRAVEL", [
    ["OT_COUNTRY", "가본 나라", "the countries you have visited"],
    ["OT_PREP", "여행 준비", "how you prepare for a trip abroad"],
    ["OT_PACK", "짐 싸기", "what you pack"],
  ], { roleplay: ["a travel agency", "여행사"], abstract: true }),
  T("HOME_VACATION", "집에서 보내는 휴가", "staying home on vacation", "TRAVEL", [
    ["HV_ACTIVITY", "하는 일", "what you do at home"],
    ["HV_SPACE", "머무는 공간", "where you spend your time"],
    ["HV_FOOD", "먹는 것", "what you eat"],
  ]),

  // ── UNEXPECTED (돌발) ────────────────────────────────────
  T("WEATHER", "날씨·계절", "the weather and seasons", "UNEXPECTED", [
    ["WEA_SEASON", "계절", "the seasons in your country"],
    ["WEA_TODAY", "요즘 날씨", "the weather these days"],
    ["WEA_CLOTHES", "날씨와 옷차림", "what you wear in each season"],
  ], { abstract: true }),
  T("HOLIDAY", "명절·휴일", "holidays", "UNEXPECTED", [
    ["HOL_BIG", "큰 명절", "the biggest holiday in your country"],
    ["HOL_FOOD", "명절 음식", "the food people eat on holidays"],
    ["HOL_FAMILY", "명절에 만나는 사람", "who you spend holidays with"],
  ], { abstract: true }),
  T("TRANSPORTATION", "교통수단", "public transportation", "UNEXPECTED", [
    ["TR_SUBWAY", "지하철", "the subway"],
    ["TR_BUS", "버스", "the bus"],
    ["TR_COMMUTE", "통근·통학", "your commute"],
  ], { roleplay: ["a transit information desk", "교통 안내 센터"], abstract: true }),
  T("INTERNET", "인터넷", "the Internet", "UNEXPECTED", [
    ["INT_SITE", "자주 쓰는 사이트", "the websites you use"],
    ["INT_HABIT", "인터넷 사용 습관", "how you use the Internet"],
    ["INT_DEVICE", "사용하는 기기", "the device you use"],
  ], { abstract: true }),
  T("TECHNOLOGY", "기술", "technology", "UNEXPECTED", [
    ["TECH_DEVICE", "쓰는 기기", "the devices you use"],
    ["TECH_APP", "자주 쓰는 앱", "the apps you use"],
    ["TECH_CHANGE", "기술의 변화", "how technology has changed"],
  ], { roleplay: ["an electronics store", "전자기기 매장"], abstract: true }),
  T("RECYCLING", "재활용", "recycling", "UNEXPECTED", [
    ["REC_HOW", "분리수거 방법", "how you sort your recycling"],
    ["REC_PLACE", "배출 장소", "where you take it"],
    ["REC_RULE", "재활용 규칙", "the recycling rules where you live"],
  ], { abstract: true }),
  T("BANK", "은행", "banks", "UNEXPECTED", [
    ["BANK_BRANCH", "은행 지점", "the bank you use"],
    ["BANK_TASK", "은행에서 하는 일", "what you do at the bank"],
    ["BANK_APP", "모바일 뱅킹", "mobile banking"],
  ], { roleplay: ["a bank", "은행"], abstract: true }),
  T("HOTEL", "호텔", "hotels", "UNEXPECTED", [
    ["HOTEL_ROOM", "객실", "hotel rooms"],
    ["HOTEL_CHECKIN", "체크인 절차", "checking into a hotel"],
    ["HOTEL_CHOICE", "호텔 고르는 기준", "how you choose a hotel"],
  ], { roleplay: ["a hotel", "호텔"], abstract: true }),
  T("APPOINTMENT", "약속", "appointments", "UNEXPECTED", [
    ["APP_KIND", "주로 하는 약속", "the kinds of appointments you make"],
    ["APP_HOW", "약속 잡는 방법", "how you make plans"],
    ["APP_PLACE", "약속 장소", "where you usually meet"],
  ], { roleplay: ["a friend", "친구"] }),
  T("PHONE", "전화 통화", "phone calls", "UNEXPECTED", [
    ["PH_WHO", "통화하는 사람", "who you call"],
    ["PH_WHEN", "통화하는 상황", "when you make calls"],
    ["PH_DEVICE", "쓰는 휴대폰", "the phone you use"],
  ], { abstract: true }),
  T("HEALTH", "건강", "health", "UNEXPECTED", [
    ["HEA_HABIT", "건강 습관", "what you do to stay healthy"],
    ["HEA_FOOD", "건강한 음식", "the food you eat to stay healthy"],
    ["HEA_CLINIC", "병원", "the clinic you go to"],
  ], { roleplay: ["a clinic", "병원"], abstract: true }),
  T("GEOGRAPHY", "지역·나라", "the area you live in", "UNEXPECTED", [
    ["GEO_NEIGHBOR", "동네", "your neighborhood"],
    ["GEO_CITY", "사는 도시", "your city"],
    ["GEO_LANDMARK", "유명한 장소", "a well-known place near you"],
  ], { abstract: true }),
  T("INDUSTRY", "산업", "industries in your country", "UNEXPECTED", [
    ["IND_MAJOR", "주요 산업", "the major industries"],
    ["IND_COMPANY", "잘 알려진 회사", "a well-known company"],
    ["IND_PRODUCT", "그 회사의 제품", "its products or services"],
  ], { abstract: true }),
  T("ENVIRONMENT", "환경", "the environment", "UNEXPECTED", [
    ["ENV_PROBLEM", "환경 문제", "environmental problems"],
    ["ENV_EFFORT", "환경을 위한 행동", "what people do for the environment"],
    ["ENV_POLICY", "환경 정책", "environmental policies"],
  ], { abstract: true }),
  T("SOCIAL_CHANGE", "사회 변화", "changes in society", "UNEXPECTED", [
    ["SOC_LIFE", "생활의 변화", "how daily life has changed"],
    ["SOC_WORK", "일하는 방식의 변화", "how the way people work has changed"],
    ["SOC_GEN", "세대 차이", "differences between generations"],
  ], { abstract: true }),
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));
export const UNEXPECTED_TOPICS = TOPICS.filter((t) => t.surveyCategory === "UNEXPECTED");
export const SURVEY_TOPICS = TOPICS.filter((t) => t.surveyCategory !== "UNEXPECTED");
export const ROLEPLAY_TOPICS = TOPICS.filter((t) => t.roleplay);
