import type { SurveyCategory } from "./survey";

/**
 * 세부주제가 무엇을 가리키는가.
 *
 * 문형에 따라 받는 대명사가 달라진다. 사람이 아닌 것을 "What kind of person
 * are they?" 로 물으면 무엇을 답해야 할지 알 수 없으므로, 문형이 요구하는
 * 종류와 맞는 세부주제만 쓴다. activity 는 행위와 추상 개념을 함께 가리킨다.
 */
export type SubTopicKind = "person" | "place" | "thing" | "activity";

export interface Topic {
  id: string;
  ko: string;
  /** 문항 영문에 들어갈 명사구 */
  en: string;
  /**
   * 셀 수 있는 복수형. "두 개를 비교해 보세요" 같은 문형에 쓴다.
   * en 은 "your workplace" 처럼 한정사가 붙어 있어 "two different your
   * workplace" 가 되어 버리므로, 그런 문형에는 이 쪽을 쓴다.
   */
  plural: string;
  /** 설문 연동 주제면 카테고리, 돌발 주제면 "UNEXPECTED" */
  surveyCategory: SurveyCategory | "UNEXPECTED";
  /** 세부 주제 — 같은 topic 안에서 testlet 을 다양화하는 데 쓴다 */
  subTopics: { id: string; ko: string; en: string; kind: SubTopicKind }[];
  /** 롤플레이 상대. 없으면 롤플레이 testlet 을 만들지 않는다 */
  roleplay?: { en: string; ko: string };
  /** ISSUE / OPINION / CAUSE_EFFECT 같은 추상 기능을 얹을 수 있는 주제인가 */
  abstract?: boolean;
}

const T = (
  id: string, ko: string, en: string,
  surveyCategory: Topic["surveyCategory"],
  subTopics: [string, string, string, SubTopicKind][],
  opts: { roleplay?: [string, string]; abstract?: boolean; plural?: string } = {},
): Topic => ({
  id, ko, en, surveyCategory,
  plural: opts.plural ?? PLURALS[id] ?? en,
  subTopics: subTopics.map(([sid, sko, sen, kind]) => ({ id: sid, ko: sko, en: sen, kind })),
  roleplay: opts.roleplay ? { en: opts.roleplay[0], ko: opts.roleplay[1] } : undefined,
  abstract: opts.abstract,
});

/**
 * 주제별 셀 수 있는 복수형.
 *
 * en 이 이미 복수형인 주제(movies, parks 등)는 적지 않는다 — 그대로 쓴다.
 */
const PLURALS: Record<string, string> = {
  WORK_HOME: "days working from home",
  WORK_TEACHER: "classes you teach",
  LIFELONG_LEARNING: "courses",
  LANGUAGE_CLASS: "language classes",
  HOUSING_ROOMMATE: "places you share with roommates",
  BARRACKS: "barracks",
  BEACH: "beaches",
  DRAWING: "drawings you have made",
  WRITING: "pieces you have written",
  DANCING: "dances you know",
  INVESTING: "stocks you own",
  READING_TO_KIDS: "books you read to children",
  BASKETBALL: "basketball games",
  BASEBALL: "baseball games",
  SOCCER: "soccer games",
  FOOTBALL: "football games",
  RUGBY: "rugby games",
  ICE_HOCKEY: "ice hockey games",
  HOCKEY: "hockey games",
  CRICKET: "cricket matches",
  GOLF: "golf courses",
  VOLLEYBALL: "volleyball games",
  TENNIS: "tennis matches",
  BADMINTON: "badminton matches",
  TABLE_TENNIS: "table tennis matches",
  SWIMMING: "swimming pools",
  MOTORCYCLE: "motorcycles",
  SCUBA: "diving spots",
  SKI: "ski resorts",
  WATER_SKI: "water skiing trips",
  ICE_SKATING: "skating rinks",
  INLINE_SKATING: "skating paths",
  HORSEBACK: "riding trails",
  MARTIAL_ARTS: "martial arts",
  YOGA: "yoga classes",
  FISHING: "fishing trips",
  BOATING: "boat trips",
  GYMNASTICS: "gymnastics routines",
  DOMESTIC_BUSINESS_TRIP: "domestic business trips",
  OVERSEAS_BUSINESS_TRIP: "business trips abroad",
  WORK: "workplaces",
  SCHOOL: "schools",
  HOUSING_FAMILY: "homes",
  HOUSING_ALONE: "places to live alone",
  DORMITORY: "dormitories",
  APARTMENT: "apartments",
  HOUSE: "houses",
  INSTRUMENT: "musical instruments",
  PHOTO: "photos you have taken",
  WALKING: "walking routes",
  JOGGING: "jogging routes",
  GYM: "gyms",
  CYCLING: "cycling routes",
  HIKING: "hiking trails",
  DOMESTIC_TRAVEL: "trips inside the country",
  OVERSEAS_TRAVEL: "trips abroad",
  HOME_VACATION: "vacations spent at home",
  COOKING: "dishes you cook",
  READING: "books you have read",
  MUSIC: "kinds of music",
  SHOPPING: "places to shop",
  WEATHER: "seasons",
  HOLIDAY: "holidays",
  TRANSPORTATION: "ways of getting around",
  INTERNET: "websites",
  TECHNOLOGY: "devices",
  RECYCLING: "ways of sorting recycling",
  BANK: "banks",
  HOTEL: "hotels",
  APPOINTMENT: "appointments",
  PHONE: "phone calls",
  HEALTH: "ways of staying healthy",
  GEOGRAPHY: "cities",
  INDUSTRY: "industries",
  ENVIRONMENT: "environmental problems",
  SOCIAL_CHANGE: "changes in society",
  TV: "TV shows",
  GAME: "games",
  MOVIE: "movies",
  PERFORMANCE: "live performances",
  CONCERT: "concerts",
  PARK: "parks",
  CAFE: "cafes",
};

export const TOPICS: Topic[] = [
  // ── WORK / SCHOOL / HOUSING ──────────────────────────────
  T("WORK", "직장", "your workplace", "WORK", [
    ["WORK_OFFICE", "사무실", "your office", "place"],
    ["WORK_COLLEAGUE", "직장 동료", "your coworkers", "person"],
    ["WORK_PROJECT", "맡은 업무", "the projects you work on", "activity"],
  ], { abstract: true }),
  T("SCHOOL", "학교·수업", "your school", "STUDENT", [
    ["SCHOOL_CAMPUS", "캠퍼스", "your campus", "place"],
    ["SCHOOL_CLASS", "수업", "the classes you take", "activity"],
    ["SCHOOL_PROFESSOR", "교수님", "one of your professors", "person"],
  ], { abstract: true }),
  T("WORK_HOME", "재택근무", "working from home", "WORK", [
    ["WH_SPACE", "일하는 공간", "the space where you work at home", "place"],
    ["WH_ROUTINE", "하루 일과", "your daily work routine", "activity"],
    ["WH_TOOL", "쓰는 장비", "the equipment you use to work", "thing"],
  ], { abstract: true }),
  T("WORK_TEACHER", "교사·교육 일", "your work as a teacher", "WORK", [
    ["WT_CLASS", "가르치는 수업", "the classes you teach", "activity"],
    ["WT_STUDENT", "학생들", "your students", "person"],
    ["WT_SCHOOL", "일하는 학교", "the school where you work", "place"],
  ], { abstract: true }),
  T("LIFELONG_LEARNING", "평생 학습", "the courses you take for self-development", "COURSE", [
    ["LL_COURSE", "듣는 강좌", "the course you are taking", "activity"],
    ["LL_PLACE", "배우는 곳", "the place where you take the course", "place"],
    ["LL_REASON", "배우는 이유", "the reason you started learning", "activity"],
  ], { abstract: true }),
  T("LANGUAGE_CLASS", "어학 수업", "your language class", "COURSE", [
    ["LC_TEACHER", "선생님", "your language teacher", "person"],
    ["LC_LESSON", "수업 방식", "the way the class is run", "activity"],
    ["LC_MATERIAL", "쓰는 교재", "the materials you use", "thing"],
  ], { abstract: true }),
  T("HOUSING_FAMILY", "가족과 사는 집", "the home you share with your family", "HOUSING", [
    ["HF_ROOM", "내 방", "your own room", "place"],
    ["HF_LIVING", "거실", "your living room", "place"],
    ["HF_FAMILY", "가족", "the people you live with", "person"],
  ]),
  T("HOUSING_ALONE", "혼자 사는 집", "the place you live alone", "HOUSING", [
    ["HA_ROOM", "내 방", "your room", "place"],
    ["HA_KITCHEN", "부엌", "your kitchen", "place"],
    ["HA_CHORE", "집안일", "the housework you do", "activity"],
  ]),
  T("DORMITORY", "기숙사", "your dormitory", "HOUSING", [
    ["DORM_ROOM", "기숙사 방", "your dorm room", "place"],
    ["DORM_ROOMMATE", "룸메이트", "your roommate", "person"],
    ["DORM_FACILITY", "기숙사 시설", "the dorm facilities", "place"],
  ]),
  T("APARTMENT", "아파트", "your apartment", "UNEXPECTED", [
    ["APT_LAYOUT", "구조", "the layout of your apartment", "place"],
    ["APT_NEIGHBOR", "이웃", "your neighbors", "person"],
    ["APT_BUILDING", "건물 시설", "the building facilities", "place"],
  ]),
  T("HOUSE", "주택", "your house", "UNEXPECTED", [
    ["HOUSE_YARD", "마당", "your yard", "place"],
    ["HOUSE_ROOM", "방", "the rooms in your house", "place"],
    ["HOUSE_REPAIR", "집 관리", "taking care of your house", "activity"],
  ]),

  T("HOUSING_ROOMMATE", "룸메이트와 사는 집", "the place you share with your roommate", "HOUSING", [
    ["HR_ROOM", "내 방", "your room", "place"],
    ["HR_MATE", "룸메이트", "your roommate", "person"],
    ["HR_RULE", "함께 사는 규칙", "the rules you share at home", "activity"],
  ]),
  T("BARRACKS", "군대 막사", "the barracks where you live", "HOUSING", [
    ["BR_ROOM", "생활관", "your living quarters", "place"],
    ["BR_MATE", "같이 지내는 사람", "the people you live with", "person"],
    ["BR_ROUTINE", "하루 일과", "your daily routine there", "activity"],
  ]),
  // ── LEISURE ──────────────────────────────────────────────
  T("MOVIE", "영화", "movies", "LEISURE", [
    ["MOVIE_THEATER", "영화관", "the movie theater you go to", "place"],
    ["MOVIE_GENRE", "좋아하는 장르", "the kinds of movies you like", "thing"],
    ["MOVIE_ACTOR", "좋아하는 배우", "an actor you like", "person"],
  ], { roleplay: ["a movie theater", "영화관"], abstract: true }),
  T("PERFORMANCE", "공연", "live performances", "LEISURE", [
    ["PERF_VENUE", "공연장", "the venue you go to", "place"],
    ["PERF_KIND", "공연 종류", "the kinds of performances you watch", "thing"],
    ["PERF_COMPANION", "함께 가는 사람", "the people you go with", "person"],
  ], { roleplay: ["a box office", "매표소"], abstract: true }),
  T("CONCERT", "콘서트", "concerts", "LEISURE", [
    ["CON_VENUE", "콘서트장", "the concert hall you go to", "place"],
    ["CON_ARTIST", "좋아하는 가수", "an artist you like", "person"],
    ["CON_TICKET", "티켓 예매", "getting concert tickets", "activity"],
  ], { roleplay: ["a ticket office", "매표소"], abstract: true }),
  T("PARK", "공원", "parks", "LEISURE", [
    ["PARK_NEAR", "동네 공원", "the park near your home", "place"],
    ["PARK_ACTIVITY", "공원에서 하는 활동", "the things you do at the park", "activity"],
    ["PARK_FACILITY", "공원 시설", "the facilities in the park", "place"],
  ], { abstract: true }),
  T("CAFE", "카페", "cafes", "LEISURE", [
    ["CAFE_FAVORITE", "자주 가는 카페", "the cafe you go to often", "place"],
    ["CAFE_ORDER", "주문하는 메뉴", "the drink you usually order", "thing"],
    ["CAFE_ATMOSPHERE", "카페 분위기", "the atmosphere of the cafe", "place"],
  ], { roleplay: ["a cafe", "카페"], abstract: true }),
  T("SHOPPING", "쇼핑", "shopping", "LEISURE", [
    ["SHOP_PLACE", "쇼핑하는 곳", "the place you go shopping", "place"],
    ["SHOP_ITEM", "주로 사는 것", "the things you usually buy", "thing"],
    ["SHOP_ONLINE", "온라인 쇼핑", "shopping online", "activity"],
  ], { roleplay: ["a store", "매장"], abstract: true }),
  T("TV", "TV·영상 시청", "TV shows and videos", "UNEXPECTED", [
    ["TV_PROGRAM", "즐겨 보는 프로그램", "the shows you watch", "thing"],
    ["TV_DEVICE", "보는 기기", "the device you watch shows on", "thing"],
    ["TV_HABIT", "시청 습관", "the time of day you watch", "activity"],
  ], { abstract: true }),
  T("GAME", "게임", "games", "LEISURE", [
    ["GAME_FAVORITE", "좋아하는 게임", "the game you play most", "thing"],
    ["GAME_DEVICE", "게임 기기", "the device you play on", "thing"],
    ["GAME_FRIEND", "함께하는 사람", "the people you play with", "person"],
  ], { abstract: true }),

  T("BEACH", "해변", "the beach", "LEISURE", [
    ["BEA_PLACE", "가는 해변", "the beach you go to", "place"],
    ["BEA_ACT", "해변에서 하는 일", "the things you do at the beach", "activity"],
    ["BEA_COMPANION", "함께 가는 사람", "the people you go to the beach with", "person"],
  ]),
  // ── HOBBY ────────────────────────────────────────────────
  T("MUSIC", "음악 감상", "music", "HOBBY", [
    ["MUSIC_GENRE", "좋아하는 장르", "the music you listen to", "thing"],
    ["MUSIC_ARTIST", "좋아하는 가수", "your favorite singer", "person"],
    ["MUSIC_WHEN", "듣는 상황", "the times you listen to music", "activity"],
  ], { roleplay: ["a music store", "음반 매장"], abstract: true }),
  T("INSTRUMENT", "악기 연주", "playing an instrument", "HOBBY", [
    ["INST_KIND", "연주하는 악기", "the instrument you play", "thing"],
    ["INST_PRACTICE", "연습", "the way you practice", "activity"],
    ["INST_START", "시작한 계기", "the way you started playing", "activity"],
  ]),
  T("READING", "독서", "reading", "HOBBY", [
    ["READ_GENRE", "좋아하는 책", "the books you like", "thing"],
    ["READ_WHERE", "읽는 장소", "the place where you read", "place"],
    ["READ_HABIT", "독서 습관", "your reading habits", "activity"],
  ], { roleplay: ["a library", "도서관"], abstract: true }),
  T("COOKING", "요리", "cooking", "HOBBY", [
    ["COOK_DISH", "자주 만드는 요리", "the dish you cook most", "thing"],
    ["COOK_PROCESS", "요리 과정", "the way you cook your favorite dish", "activity"],
    ["COOK_KITCHEN", "부엌", "your kitchen", "place"],
  ], { abstract: true }),
  T("PHOTO", "사진 촬영", "taking photos", "HOBBY", [
    ["PHOTO_SUBJECT", "찍는 대상", "the things you take pictures of", "thing"],
    ["PHOTO_GEAR", "사용하는 장비", "the camera you use", "thing"],
    ["PHOTO_PLACE", "촬영 장소", "the places where you take photos", "place"],
  ]),

  T("DRAWING", "그림 그리기", "drawing", "HOBBY", [
    ["DR_SUBJECT", "그리는 것", "the things you draw", "thing"],
    ["DR_TOOL", "쓰는 도구", "the tools you draw with", "thing"],
    ["DR_PLACE", "그리는 곳", "the place where you draw", "place"],
  ]),
  T("WRITING", "글쓰기", "writing", "HOBBY", [
    ["WR_KIND", "쓰는 글", "the kind of writing you do", "activity"],
    ["WR_WHEN", "쓰는 시간", "the time of day you write", "activity"],
    ["WR_PLACE", "쓰는 곳", "the place where you write", "place"],
  ], { abstract: true }),
  T("DANCING", "춤추기", "dancing", "HOBBY", [
    ["DA_STYLE", "추는 춤", "the kind of dance you do", "activity"],
    ["DA_PLACE", "춤추는 곳", "the place where you dance", "place"],
    ["DA_PEOPLE", "함께 추는 사람", "the people you dance with", "person"],
  ]),
  T("INVESTING", "주식 투자", "investing in stocks", "HOBBY", [
    ["IN_START", "시작한 계기", "the way you started investing", "activity"],
    ["IN_TOOL", "쓰는 앱", "the app you use to invest", "thing"],
    ["IN_ROUTINE", "확인하는 습관", "the way you check the market", "activity"],
  ], { abstract: true }),
  T("READING_TO_KIDS", "아이에게 책 읽어주기", "reading books to children", "HOBBY", [
    ["RK_BOOK", "읽어주는 책", "the books you read to your child", "thing"],
    ["RK_TIME", "읽어주는 시간", "the time of day you read to your child", "activity"],
    ["RK_CHILD", "아이", "the child you read to", "person"],
  ]),
  // ── SPORTS ───────────────────────────────────────────────
  T("WALKING", "걷기", "walking", "SPORTS", [
    ["WALK_ROUTE", "걷는 코스", "the route you walk", "place"],
    ["WALK_WHEN", "걷는 시간", "the time of day you go walking", "activity"],
    ["WALK_COMPANION", "함께 걷는 사람", "the people you walk with", "person"],
  ]),
  T("JOGGING", "조깅", "jogging", "SPORTS", [
    ["JOG_ROUTE", "조깅 코스", "the route you jog", "place"],
    ["JOG_GEAR", "조깅 장비", "the gear you use", "thing"],
    ["JOG_ROUTINE", "조깅 루틴", "your jogging routine", "activity"],
  ]),
  T("GYM", "헬스", "working out at the gym", "SPORTS", [
    ["GYM_PLACE", "다니는 헬스장", "the gym you go to", "place"],
    ["GYM_ROUTINE", "운동 루틴", "your workout routine", "activity"],
    ["GYM_EQUIP", "사용하는 기구", "the equipment you use", "thing"],
  ], { roleplay: ["a gym", "헬스장"] }),
  T("CYCLING", "자전거", "cycling", "SPORTS", [
    ["CYC_ROUTE", "자전거 코스", "the route you ride", "place"],
    ["CYC_BIKE", "자전거", "your bicycle", "thing"],
    ["CYC_WHEN", "타는 시간", "the time of day you go cycling", "activity"],
  ]),
  T("HIKING", "하이킹", "hiking", "SPORTS", [
    ["HIKE_MOUNTAIN", "가는 산", "the mountain you hike", "place"],
    ["HIKE_PREP", "준비물", "the things you bring on a hike", "activity"],
    ["HIKE_COMPANION", "함께 가는 사람", "the people you hike with", "person"],
  ]),

  T("BASKETBALL", "농구", "basketball", "SPORTS", [
    ["BSK_PLACE", "하는 곳", "the court where you play", "place"],
    ["BSK_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["BSK_GEAR", "장비", "the gear you use", "thing"],
  ]),
  T("BASEBALL", "야구·소프트볼", "baseball", "SPORTS", [
    ["BSB_PLACE", "하는 곳", "the field where you play", "place"],
    ["BSB_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["BSB_GEAR", "장비", "your glove and bat", "thing"],
  ]),
  T("SOCCER", "축구", "soccer", "SPORTS", [
    ["SOC_PLACE", "하는 곳", "the field where you play", "place"],
    ["SOC_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["SOC_GEAR", "장비", "your soccer shoes", "thing"],
  ]),
  T("FOOTBALL", "미식축구", "football", "SPORTS", [
    ["FTB_PLACE", "하는 곳", "the field where you play", "place"],
    ["FTB_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["FTB_GEAR", "장비", "the gear you wear", "thing"],
  ]),
  T("RUGBY", "럭비", "rugby", "SPORTS", [
    ["RGB_PLACE", "하는 곳", "the field where you play", "place"],
    ["RGB_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["RGB_GEAR", "장비", "the gear you wear", "thing"],
  ]),
  T("ICE_HOCKEY", "아이스하키", "ice hockey", "SPORTS", [
    ["IHK_PLACE", "하는 곳", "the rink where you play", "place"],
    ["IHK_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["IHK_GEAR", "장비", "your skates and stick", "thing"],
  ]),
  T("HOCKEY", "하키", "hockey", "SPORTS", [
    ["HKY_PLACE", "하는 곳", "the field where you play", "place"],
    ["HKY_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["HKY_GEAR", "장비", "your stick", "thing"],
  ]),
  T("CRICKET", "크리켓", "cricket", "SPORTS", [
    ["CRK_PLACE", "하는 곳", "the ground where you play", "place"],
    ["CRK_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["CRK_GEAR", "장비", "your bat", "thing"],
  ]),
  T("GOLF", "골프", "golf", "SPORTS", [
    ["GLF_PLACE", "하는 곳", "the course where you play", "place"],
    ["GLF_PEOPLE", "함께 하는 사람", "the people you play with", "person"],
    ["GLF_GEAR", "장비", "your clubs", "thing"],
  ]),
  T("VOLLEYBALL", "배구", "volleyball", "SPORTS", [
    ["VOL_PLACE", "하는 곳", "the court where you play", "place"],
    ["VOL_PEOPLE", "함께 하는 사람", "your teammates", "person"],
    ["VOL_GEAR", "장비", "the ball you use", "thing"],
  ]),
  T("TENNIS", "테니스", "tennis", "SPORTS", [
    ["TEN_PLACE", "하는 곳", "the court where you play", "place"],
    ["TEN_PEOPLE", "함께 하는 사람", "the people you play with", "person"],
    ["TEN_GEAR", "장비", "your racket", "thing"],
  ]),
  T("BADMINTON", "배드민턴", "badminton", "SPORTS", [
    ["BAD_PLACE", "하는 곳", "the court where you play", "place"],
    ["BAD_PEOPLE", "함께 하는 사람", "the people you play with", "person"],
    ["BAD_GEAR", "장비", "your racket", "thing"],
  ]),
  T("TABLE_TENNIS", "탁구", "table tennis", "SPORTS", [
    ["TTB_PLACE", "하는 곳", "the place where you play", "place"],
    ["TTB_PEOPLE", "함께 하는 사람", "the people you play with", "person"],
    ["TTB_GEAR", "장비", "your paddle", "thing"],
  ]),
  T("SWIMMING", "수영", "swimming", "SPORTS", [
    ["SWM_PLACE", "하는 곳", "the pool where you swim", "place"],
    ["SWM_PEOPLE", "함께 하는 사람", "the people you swim with", "person"],
    ["SWM_GEAR", "장비", "the gear you use", "thing"],
  ]),
  T("MOTORCYCLE", "오토바이", "riding a motorcycle", "SPORTS", [
    ["MTC_PLACE", "하는 곳", "the roads you ride on", "place"],
    ["MTC_PEOPLE", "함께 하는 사람", "the people you ride with", "person"],
    ["MTC_GEAR", "장비", "your motorcycle", "thing"],
  ]),
  T("SCUBA", "스쿠버다이빙", "scuba diving", "SPORTS", [
    ["SCB_PLACE", "하는 곳", "the places where you dive", "place"],
    ["SCB_PEOPLE", "함께 하는 사람", "the people you dive with", "person"],
    ["SCB_GEAR", "장비", "your diving gear", "thing"],
  ]),
  T("SKI", "스키·스노보드", "skiing and snowboarding", "SPORTS", [
    ["SKI_PLACE", "하는 곳", "the resort where you go", "place"],
    ["SKI_PEOPLE", "함께 하는 사람", "the people you go with", "person"],
    ["SKI_GEAR", "장비", "your skis or board", "thing"],
  ]),
  T("WATER_SKI", "수상 스키", "water skiing", "SPORTS", [
    ["WSK_PLACE", "하는 곳", "the lake where you go", "place"],
    ["WSK_PEOPLE", "함께 하는 사람", "the people you go with", "person"],
    ["WSK_GEAR", "장비", "your gear", "thing"],
  ]),
  T("ICE_SKATING", "아이스 스케이트", "ice skating", "SPORTS", [
    ["ISK_PLACE", "하는 곳", "the rink where you skate", "place"],
    ["ISK_PEOPLE", "함께 하는 사람", "the people you skate with", "person"],
    ["ISK_GEAR", "장비", "your skates", "thing"],
  ]),
  T("INLINE_SKATING", "인라인 스케이트", "inline skating", "SPORTS", [
    ["INL_PLACE", "하는 곳", "the path where you skate", "place"],
    ["INL_PEOPLE", "함께 하는 사람", "the people you skate with", "person"],
    ["INL_GEAR", "장비", "your skates", "thing"],
  ]),
  T("HORSEBACK", "승마", "horseback riding", "SPORTS", [
    ["HRS_PLACE", "하는 곳", "the place where you ride", "place"],
    ["HRS_PEOPLE", "함께 하는 사람", "the people you ride with", "person"],
    ["HRS_GEAR", "장비", "the gear you wear", "thing"],
  ]),
  T("MARTIAL_ARTS", "격투기", "martial arts", "SPORTS", [
    ["MRT_PLACE", "하는 곳", "the gym where you train", "place"],
    ["MRT_PEOPLE", "함께 하는 사람", "the people you train with", "person"],
    ["MRT_GEAR", "장비", "the gear you use", "thing"],
  ]),
  T("YOGA", "요가", "yoga", "SPORTS", [
    ["YOG_PLACE", "하는 곳", "the studio where you practice", "place"],
    ["YOG_PEOPLE", "함께 하는 사람", "the people you practice with", "person"],
    ["YOG_GEAR", "장비", "your mat", "thing"],
  ]),
  T("FISHING", "낚시", "fishing", "SPORTS", [
    ["FSH_PLACE", "하는 곳", "the place where you fish", "place"],
    ["FSH_PEOPLE", "함께 하는 사람", "the people you fish with", "person"],
    ["FSH_GEAR", "장비", "your fishing gear", "thing"],
  ]),
  T("BOATING", "보트 타기", "boating", "SPORTS", [
    ["BOT_PLACE", "하는 곳", "the place where you go boating", "place"],
    ["BOT_PEOPLE", "함께 하는 사람", "the people you go with", "person"],
    ["BOT_GEAR", "장비", "the boat you use", "thing"],
  ]),
  T("GYMNASTICS", "체조", "gymnastics", "SPORTS", [
    ["GYM2_PLACE", "하는 곳", "the gym where you train", "place"],
    ["GYM2_PEOPLE", "함께 하는 사람", "the people you train with", "person"],
    ["GYM2_GEAR", "장비", "the equipment you use", "thing"],
  ]),
  // ── TRAVEL ───────────────────────────────────────────────
  T("DOMESTIC_TRAVEL", "국내여행", "domestic trips", "TRAVEL", [
    ["DT_PLACE", "가는 여행지", "the places you visit", "place"],
    ["DT_PREP", "여행 준비", "the way you prepare for a trip", "activity"],
    ["DT_TRANSPORT", "이동 수단", "the way you travel there", "activity"],
  ], { roleplay: ["a travel agency", "여행사"], abstract: true }),
  T("OVERSEAS_TRAVEL", "해외여행", "trips abroad", "TRAVEL", [
    ["OT_COUNTRY", "가본 나라", "the countries you have visited", "place"],
    ["OT_PREP", "여행 준비", "the way you prepare for a trip abroad", "activity"],
    ["OT_PACK", "짐 싸기", "the things you pack", "thing"],
  ], { roleplay: ["a travel agency", "여행사"], abstract: true }),
  T("HOME_VACATION", "집에서 보내는 휴가", "staying home on vacation", "TRAVEL", [
    ["HV_ACTIVITY", "하는 일", "the things you do at home", "activity"],
    ["HV_SPACE", "머무는 공간", "the place where you spend your time", "place"],
    ["HV_FOOD", "먹는 것", "the food you eat at home", "thing"],
  ]),

  T("DOMESTIC_BUSINESS_TRIP", "국내출장", "domestic business trips", "TRAVEL", [
    ["DB_PLACE", "가는 도시", "the cities you travel to for work", "place"],
    ["DB_WORK", "출장에서 하는 일", "the work you do on the trip", "activity"],
    ["DB_STAY", "묵는 곳", "the place where you stay", "place"],
  ], { roleplay: ["a hotel", "호텔"], abstract: true }),
  T("OVERSEAS_BUSINESS_TRIP", "해외출장", "business trips abroad", "TRAVEL", [
    ["OB_COUNTRY", "가는 나라", "the countries you travel to for work", "place"],
    ["OB_PREP", "출장 준비", "the way you prepare for the trip", "activity"],
    ["OB_MEET", "만나는 사람", "the people you meet there", "person"],
  ], { roleplay: ["an airline", "항공사"], abstract: true }),
  // ── UNEXPECTED (돌발) ────────────────────────────────────
  T("WEATHER", "날씨·계절", "the weather and seasons", "UNEXPECTED", [
    ["WEA_SEASON", "계절", "the seasons in your country", "activity"],
    ["WEA_TODAY", "요즘 날씨", "the weather these days", "activity"],
    ["WEA_CLOTHES", "날씨와 옷차림", "the clothes you wear in each season", "thing"],
  ], { abstract: true }),
  T("HOLIDAY", "명절·휴일", "holidays", "UNEXPECTED", [
    ["HOL_BIG", "큰 명절", "the biggest holiday in your country", "activity"],
    ["HOL_FOOD", "명절 음식", "the food people eat on holidays", "thing"],
    ["HOL_FAMILY", "명절에 만나는 사람", "the people you spend holidays with", "person"],
  ], { abstract: true }),
  T("TRANSPORTATION", "교통수단", "public transportation", "UNEXPECTED", [
    ["TR_SUBWAY", "지하철", "the subway", "thing"],
    ["TR_BUS", "버스", "the bus", "thing"],
    ["TR_COMMUTE", "통근·통학", "your commute", "activity"],
  ], { roleplay: ["a transit information desk", "교통 안내 센터"], abstract: true }),
  T("INTERNET", "인터넷", "the Internet", "UNEXPECTED", [
    ["INT_SITE", "자주 쓰는 사이트", "the websites you use", "thing"],
    ["INT_HABIT", "인터넷 사용 습관", "the way you use the Internet", "activity"],
    ["INT_DEVICE", "사용하는 기기", "the device you use", "thing"],
  ], { abstract: true }),
  T("TECHNOLOGY", "기술", "technology", "UNEXPECTED", [
    ["TECH_DEVICE", "쓰는 기기", "the devices you use", "thing"],
    ["TECH_APP", "자주 쓰는 앱", "the apps you use", "thing"],
    ["TECH_CHANGE", "기술의 변화", "the changes in technology", "activity"],
  ], { roleplay: ["an electronics store", "전자기기 매장"], abstract: true }),
  T("RECYCLING", "재활용", "recycling", "UNEXPECTED", [
    ["REC_HOW", "분리수거 방법", "the way you sort your recycling", "activity"],
    ["REC_PLACE", "배출 장소", "the place where you take your recycling", "place"],
    ["REC_RULE", "재활용 규칙", "the recycling rules where you live", "activity"],
  ], { abstract: true }),
  T("BANK", "은행", "banks", "UNEXPECTED", [
    ["BANK_BRANCH", "은행 지점", "the bank you use", "place"],
    ["BANK_TASK", "은행에서 하는 일", "the things you do at the bank", "activity"],
    ["BANK_APP", "모바일 뱅킹", "mobile banking", "thing"],
  ], { roleplay: ["a bank", "은행"], abstract: true }),
  T("HOTEL", "호텔", "hotels", "UNEXPECTED", [
    ["HOTEL_ROOM", "객실", "hotel rooms", "place"],
    ["HOTEL_CHECKIN", "체크인 절차", "checking into a hotel", "activity"],
    ["HOTEL_CHOICE", "호텔 고르는 기준", "the way you choose a hotel", "activity"],
  ], { roleplay: ["a hotel", "호텔"], abstract: true }),
  T("APPOINTMENT", "약속", "appointments", "UNEXPECTED", [
    ["APP_KIND", "주로 하는 약속", "the kinds of appointments you make", "activity"],
    ["APP_HOW", "약속 잡는 방법", "the way you make plans", "activity"],
    ["APP_PLACE", "약속 장소", "the place where you usually meet", "place"],
  ], { roleplay: ["a friend", "친구"] }),
  T("PHONE", "전화 통화", "phone calls", "UNEXPECTED", [
    ["PH_WHO", "통화하는 사람", "the people you call", "person"],
    ["PH_WHEN", "통화하는 상황", "the times you make calls", "activity"],
    ["PH_DEVICE", "쓰는 휴대폰", "the phone you use", "thing"],
  ], { abstract: true }),
  T("HEALTH", "건강", "health", "UNEXPECTED", [
    ["HEA_HABIT", "건강 습관", "the things you do to stay healthy", "activity"],
    ["HEA_FOOD", "건강한 음식", "the food you eat to stay healthy", "thing"],
    ["HEA_CLINIC", "병원", "the clinic you go to", "place"],
  ], { roleplay: ["a clinic", "병원"], abstract: true }),
  T("GEOGRAPHY", "지역·나라", "the area you live in", "UNEXPECTED", [
    ["GEO_NEIGHBOR", "동네", "your neighborhood", "place"],
    ["GEO_CITY", "사는 도시", "your city", "place"],
    ["GEO_LANDMARK", "유명한 장소", "a well-known place near you", "place"],
  ], { abstract: true }),
  T("INDUSTRY", "산업", "industries in your country", "UNEXPECTED", [
    ["IND_MAJOR", "주요 산업", "the major industries", "activity"],
    ["IND_COMPANY", "잘 알려진 회사", "a well-known company", "thing"],
    ["IND_PRODUCT", "그 회사의 제품", "its products or services", "thing"],
  ], { abstract: true }),
  T("ENVIRONMENT", "환경", "the environment", "UNEXPECTED", [
    ["ENV_PROBLEM", "환경 문제", "environmental problems", "activity"],
    ["ENV_EFFORT", "환경을 위한 행동", "the things people do for the environment", "activity"],
    ["ENV_POLICY", "환경 정책", "environmental policies", "activity"],
  ], { abstract: true }),
  T("SOCIAL_CHANGE", "사회 변화", "changes in society", "UNEXPECTED", [
    ["SOC_LIFE", "생활의 변화", "the changes in daily life", "activity"],
    ["SOC_WORK", "일하는 방식의 변화", "the changes in the way people work", "activity"],
    ["SOC_GEN", "세대 차이", "differences between generations", "activity"],
  ], { abstract: true }),
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));
export const UNEXPECTED_TOPICS = TOPICS.filter((t) => t.surveyCategory === "UNEXPECTED");
export const SURVEY_TOPICS = TOPICS.filter((t) => t.surveyCategory !== "UNEXPECTED");
export const ROLEPLAY_TOPICS = TOPICS.filter((t) => t.roleplay);
