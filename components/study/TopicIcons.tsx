/**
 * 주제별 아이콘.
 *
 * 카테고리 아이콘만 쓰면 운동 26종이 전부 같은 그림, 여가가 전부 같은 그림이
 * 된다. 카드가 수십 장 늘어서는 화면에서는 그림이 곧 이름표라, 주제마다
 * 다른 그림이 있어야 눈으로 먼저 찾는다.
 *
 * 주제 id 로 찾고, 없으면 카테고리 그림으로 돌아간다(새 주제를 넣어도 빈칸이
 * 되지 않는다). 선 두께와 크기는 한 벌로 맞춰 카드 안에서 따로 놀지 않게 한다.
 */
import type { ReactNode } from "react";

const S = {
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round",
  strokeLinejoin: "round", "aria-hidden": true,
} as const;

/** 선 아이콘 한 장 */
const I = (...d: ReactNode[]) => <svg {...S}>{d}</svg>;
const P = (dAttr: string, key?: string) => <path key={key ?? dAttr.slice(0, 8)} d={dAttr} />;
const C = (cx: number, cy: number, r: number, fill = false) => (
  <circle key={`c${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} fill={fill ? "currentColor" : "none"} />
);
const R = (x: number, y: number, w: number, h: number, rx = 2) => (
  <rect key={`r${x}-${y}`} x={x} y={y} width={w} height={h} rx={rx} />
);

export const CATEGORY_KO: Record<string, string> = {
  HOUSING: "주거",
  SPORTS: "운동",
  LEISURE: "여가",
  TRAVEL: "여행",
  HOBBY: "취미",
  WORK: "직업",
  STUDENT: "학업",
  COURSE: "학업",
  // 시험에서는 "돌발"로 불리지만 실제 내용은 날씨·교통·인터넷 같은 일상 주제다.
  // 학습 화면에서는 무엇을 연습하는지가 먼저라, 시험 용어 대신 내용으로 부른다.
  UNEXPECTED: "일상",
};

/** 사이드바에 세울 순서 */
export const CATEGORY_ORDER = [
  "HOUSING", "SPORTS", "LEISURE", "TRAVEL", "HOBBY", "WORK", "STUDENT", "UNEXPECTED",
];

// ── 주제별 그림 ────────────────────────────────────────────
const TOPIC_ICON: Record<string, ReactNode> = {
  // 직업·학업
  WORK: I(R(3, 7, 18, 13, 2.5), P("M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2")),
  SCHOOL: I(P("M3 20h18M5 20V9l7-5 7 5v11"), R(10, 13, 4, 7, 0.5)),
  WORK_HOME: I(P("M4 10l8-6 8 6"), R(7, 12, 10, 7, 1.5), P("M5 19h14")),
  WORK_TEACHER: I(P("M4 5h7v14H4z"), P("M13 5h7v14h-7z"), P("M17 2.5l2 2-4.5 4.5")),
  LIFELONG_LEARNING: I(P("M12 4l9 4.5-9 4.5-9-4.5z"), P("M6.5 10.5V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5.5")),
  LANGUAGE_CLASS: I(P("M3 6h11a2 2 0 012 2v4a2 2 0 01-2 2H8l-5 4z"), P("M18 9h3v8l-3-2")),

  // 주거
  HOUSING_FAMILY: I(P("M4 10.5l8-6 8 6V20H4z"), C(9.5, 14, 1.4), C(14.5, 14, 1.4), P("M7 19c0-1.6 1.1-2.6 2.5-2.6S12 17.4 12 19M12 19c0-1.6 1.1-2.6 2.5-2.6S17 17.4 17 19")),
  HOUSING_ALONE: I(P("M4 10.5l8-6 8 6V20H4z"), C(12, 13.5, 1.6), P("M9 19c0-1.8 1.4-3 3-3s3 1.2 3 3")),
  DORMITORY: I(P("M4 20V6M20 20V6"), P("M4 12h16M4 16h16"), P("M4 8h8M4 18h8")),
  APARTMENT: I(R(5, 3, 14, 18, 1.5), P("M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"), P("M10.5 21v-3h3v3")),
  HOUSE: I(P("M4 11l8-6 8 6v9H4z"), P("M10 20v-6h4v6")),
  HOUSING_ROOMMATE: I(P("M4 10.5l8-6 8 6V20H4z"), C(9.5, 13.5, 1.5), C(14.5, 13.5, 1.5), P("M7 19c0-1.5 1.1-2.5 2.5-2.5S12 17.5 12 19M12 19c0-1.5 1.1-2.5 2.5-2.5S17 17.5 17 19")),
  BARRACKS: I(P("M3 19h18"), P("M5 19V9l7-5 7 5v10"), P("M9 19v-5h6v5")),

  // 여가
  MOVIE: I(R(3, 8, 18, 12, 2), P("M3 8l3-4h12l-3 4"), P("M8 8l3-4M13 8l3-4")),
  PERFORMANCE: I(P("M3 4h18"), P("M5 4v16c3 0 4-3 4-7s-1-6-1-9"), P("M19 4v16c-3 0-4-3-4-7s1-6 1-9")),
  CONCERT: I(R(9.5, 3, 5, 9, 2.5), P("M6 11a6 6 0 0012 0"), P("M12 17v4M9 21h6")),
  PARK: I(P("M9 13a4 4 0 118 0"), P("M13 13v5"), P("M3 15h7M4 15v5M9 15v5"), P("M3 20h18")),
  CAFE: I(P("M4 8h12v6a4 4 0 01-4 4H8a4 4 0 01-4-4z"), P("M16 9h2a2.5 2.5 0 010 5h-2"), P("M6 4v1.5M10 4v1.5M14 4v1.5")),
  SHOPPING: I(P("M5 8h14l-1.2 11.2a1 1 0 01-1 .8H7.2a1 1 0 01-1-.8z"), P("M9 8V6a3 3 0 016 0v2")),
  TV: I(R(3, 6, 18, 11, 2), P("M8 21h8M12 17v4"), P("M8 3l4 3 4-3")),
  GAME: I(P("M7 10h10a4 4 0 014 4v1a3 3 0 01-5.3 1.9L14 15h-4l-1.7 1.9A3 3 0 013 15v-1a4 4 0 014-4z"), P("M7.5 12.5v2M6.5 13.5h2"), C(16, 13, 0.9, true), C(18, 15, 0.9, true)),
  BEACH: I(C(17, 7, 2.6), P("M3 17c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"), P("M3 21c1.5-1.2 3-1.2 4.5 0"), P("M4 13h8l-4-6z")),

  // 취미
  MUSIC: I(P("M4 15v-3a8 8 0 0116 0v3"), R(3, 14, 4, 6, 1.6), R(17, 14, 4, 6, 1.6)),
  INSTRUMENT: I(C(10, 16, 5), P("M13.5 12.5L19 7l2 2-5.5 5.5"), C(10, 16, 1.6)),
  READING: I(P("M12 7v13"), P("M12 7c-2-2-5-2.5-8-2v13c3-.5 6 0 8 2"), P("M12 7c2-2 5-2.5 8-2v13c-3-.5-6 0-8 2")),
  COOKING: I(P("M4 11h16v4a5 5 0 01-5 5H9a5 5 0 01-5-5z"), P("M20 12h1.5a1.5 1.5 0 010 3H20"), P("M9 7c0-1 1-1.5 1-2.5M13 7c0-1 1-1.5 1-2.5")),
  PHOTO: I(R(3, 7, 18, 13, 2.5), P("M9 7l1.5-3h3L15 7"), C(12, 13.5, 3.2)),
  DRAWING: I(P("M12 3a9 9 0 000 18c1 0 1.6-.7 1.6-1.5 0-.9-.8-1.4-.8-2.2 0-.8.7-1.3 1.5-1.3H16a5 5 0 005-5c0-4.4-4-8-9-8z"), C(8, 10, 1, true), C(12, 7.5, 1, true), C(16, 10.5, 1, true)),
  WRITING: I(P("M5 20h14"), P("M16.5 3.5l3 3L9 17l-4 1 1-4z")),
  DANCING: I(C(14, 4.5, 1.7), P("M14 7v5l-4 4-3 4M14 12l3 3 1 5M10 9l-3 1M14 9l4-1")),
  INVESTING: I(P("M4 19V9M9 19v-6M14 19v-9M19 19V5"), P("M3 21h18")),
  READING_TO_KIDS: I(P("M3 7c3-1 6-1 8 1v11c-2-2-5-2-8-1z"), P("M19 7c-2-.7-4-.7-5.5.3"), C(17.5, 13.5, 1.7), P("M14.5 20c0-1.8 1.3-3 3-3s3 1.2 3 3")),

  // 운동
  WALKING: I(P("M3 17c2.5.6 4.5-.4 6-2l2.5-2.6 3 1.6 5.5.6c1 .1 1.5.7 1.5 1.6v1.3H5"), P("M11.5 12.4l-1-3.4")),
  JOGGING: I(C(15, 4.5, 1.7), P("M8 21l3-5 3-2-1-4-3.5 2L7 15"), P("M14 10l3.5 2 1.5 5")),
  GYM: I(P("M3 10v4M6 8v8M18 8v8M21 10v4"), P("M6 12h12")),
  CYCLING: I(C(5.5, 16.5, 3.5), C(18.5, 16.5, 3.5), P("M5.5 16.5l4-7h5l4 7M9.5 9.5h5l-3 7")),
  HIKING: I(P("M3 19l6-9 4 5 2-2.5 6 6.5z"), C(16.5, 5.5, 2)),
  BASKETBALL: I(C(12, 12, 9), P("M3 12h18M12 3v18"), P("M5.5 5.5c4 4 9 4 13 0M5.5 18.5c4-4 9-4 13 0")),
  BASEBALL: I(C(9, 15, 4), P("M13 11l7-7 1.5 1.5-7 7"), P("M7 12.5c1.5 1 2 3 1.5 4.5M11 13c1.5 1 2 3 1.5 4.5")),
  SOCCER: I(C(12, 12, 9), P("M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z"), P("M12 3v4.5M4.5 9.5l4 .5M19.5 9.5l-4 .5M8 19l1.8-5M16 19l-1.8-5")),
  FOOTBALL: I(P("M4 12c0-4.5 3.5-8 8-8s8 3.5 8 8-3.5 8-8 8-8-3.5-8-8z"), P("M9 12h6M11 10v4M13 10v4")),
  RUGBY: I(P("M5 19c-2-5 1-12 7-13 3 4 3 11-1 13-2 1-4.5 1-6 0z"), P("M9 15l5-5M10.5 11.5l1.5 1.5M12 10l1.5 1.5")),
  ICE_HOCKEY: I(P("M4 5l10 12"), P("M14 17h5"), R(17, 18.5, 5, 2.5, 1.2)),
  HOCKEY: I(P("M5 4v10a4 4 0 004 4h4"), C(18, 18, 2.2)),
  CRICKET: I(P("M6 4l5 5-5 6-2-2z"), P("M14 10l5 5"), P("M16 20v-5M19 20v-5M13 20v-5")),
  GOLF: I(P("M9 19V4l8 5-8 4"), C(8, 20, 2), P("M18 20h3")),
  VOLLEYBALL: I(C(12, 12, 9), P("M12 3c-3 4-3 12 3 17M12 3c3 4 3 12-3 17"), P("M3.5 10c5 1 11 1 17-4")),
  TENNIS: I(P("M9 3.5c3.5 0 6 2.5 6 6s-2.5 6-6 6-6-2.5-6-6 2.5-6 6-6z"), P("M9 3.5v12M3 9.5h12"), P("M13 14l7 7")),
  BADMINTON: I(P("M9 15l-5 5"), C(13, 11, 4), P("M10 8l3-5 3 5M13 3v4")),
  TABLE_TENNIS: I(C(10, 10, 6), P("M14 14l6 6"), C(19, 7, 2)),
  SWIMMING: I(C(16, 6, 2)
    , P("M4 11l5-2 4 3 4-1"), P("M3 16c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"), P("M3 20c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0")),
  MOTORCYCLE: I(C(5, 17, 3.5), C(19, 17, 3.5), P("M5 17l4-5h5l2 5M9 12l-2-3h4"), P("M14 9h3")),
  SCUBA: I(P("M5 9h9a3 3 0 010 6H5z"), C(8, 12, 1.4), C(12, 12, 1.4), P("M17 9v10M20 9v10"), P("M14 19h8")),
  SKI: I(P("M4 19l10-12M8 19L18 7"), P("M3 21h18"), C(17, 4.5, 1.8)),
  WATER_SKI: I(P("M5 13l7-7 2 2-7 7z"), C(16, 6, 2), P("M3 18c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"), P("M3 21.5c1.5-1.2 3-1.2 4.5 0")),
  ICE_SKATING: I(P("M7 3v12M12 3v12"), P("M5 15h9l3 3"), P("M4 19h16")),
  INLINE_SKATING: I(P("M5 5v8h9l3 3H5"), C(7, 19, 1.8), C(13, 19, 1.8), C(18, 19, 1.8)),
  HORSEBACK: I(P("M4 20c0-5 3-8 7-8h3l3-4 3 1-1 4c0 4-2 7-6 7"), P("M14 12l-1 8"), C(18.5, 8.5, 0.8, true)),
  MARTIAL_ARTS: I(P("M7 10a4 4 0 014-4h2a4 4 0 014 4v4a4 4 0 01-4 4h-2a4 4 0 01-4-4z"), P("M7 12H5.5a2 2 0 010-4H7"), P("M8 18.5h8v2H8z")),
  YOGA: I(C(12, 4.5, 1.8), P("M12 7v6"), P("M12 13l-6 3 2 3M12 13l6 3-2 3"), P("M8 13h8")),
  FISHING: I(P("M4 6v6a4 4 0 004 4"), P("M14 16c3 0 6-1.5 7-4-1-2.5-4-4-7-4-2.5 0-4 1.5-4 4s1.5 4 4 4z"), C(12.5, 11, 0.8, true), P("M21 9l-2 3 2 3")),
  BOATING: I(P("M3 17h18l-2.5 4h-13z"), P("M12 3v11"), P("M12 5l6 9H12")),
  GYMNASTICS: I(C(12, 4, 1.8), P("M6 8h12"), P("M9 8v4a3 3 0 006 0V8"), P("M9 20l3-4 3 4")),

  // 여행
  DOMESTIC_TRAVEL: I(P("M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"), C(12, 10, 2.6)),
  OVERSEAS_TRAVEL: I(P("M3 15l7-2 4-8 2 1-2 6.5 5-1.4 1.5 2.4-6 2.5-1.5 5-1.8.4.3-4.2L4 18z")),
  HOME_VACATION: I(P("M4 11l8-6 8 6v9H4z"), C(12, 14, 2.4), P("M12 10v1M12 18v1M8.5 14H9M15 14h.5")),
  DOMESTIC_BUSINESS_TRIP: I(R(5, 3, 14, 13, 2.5), P("M5 10h14"), P("M8 20l-2 2M16 20l2 2"), C(8.5, 13, 0.9, true), C(15.5, 13, 0.9, true)),
  OVERSEAS_BUSINESS_TRIP: I(R(3, 11, 11, 9, 2), P("M6 11V9a2 2 0 012-2h1a2 2 0 012 2v2"), P("M15 9l3-5 1.5.7-1.5 4 4-1 .8 1.6-4.3 1.6")),

  // 일상
  WEATHER: I(C(8, 8, 3.2), P("M8 2.5v1.5M8 12v1.5M2.5 8H4M12 8h1.5M4.2 4.2l1 1M11.8 4.2l-1 1"), P("M10 19a3.5 3.5 0 01.6-7A5 5 0 0121 14.5a3 3 0 01-1 4.5z")),
  HOLIDAY: I(R(3, 5, 18, 16, 2.5), P("M3 10h18M8 3v4M16 3v4"), P("M12 13l1 2.2 2.4.3-1.7 1.7.4 2.3-2.1-1.1-2.1 1.1.4-2.3L8.6 15.5l2.4-.3z")),
  TRANSPORTATION: I(R(4, 4, 16, 13, 2.5), P("M4 11h16"), P("M7 21l2-3M17 21l-2-3"), C(8, 14, 1, true), C(16, 14, 1, true)),
  INTERNET: I(C(12, 12, 9), P("M3 12h18"), P("M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18")),
  TECHNOLOGY: I(R(7, 7, 10, 10, 2), P("M10 2.5v4M14 2.5v4M10 17.5v4M14 17.5v4M2.5 10h4M2.5 14h4M17.5 10h4M17.5 14h4")),
  RECYCLING: I(P("M8 6l2.5-3.5L13 6"), P("M10.5 2.5v6.5l-4 6"), P("M20 13l-1 4-4-1"), P("M19 17l-5.5-3.5"), P("M4 15l1 4h5")),
  BANK: I(P("M3 9l9-5 9 5"), P("M3 20h18"), P("M6 9v9M10 9v9M14 9v9M18 9v9")),
  HOTEL: I(P("M3 19V7"), P("M3 11h11a5 5 0 015 5v3"), P("M3 19h18"), C(7, 9.5, 2)),
  APPOINTMENT: I(R(3, 5, 18, 16, 2.5), P("M3 10h18M8 3v4M16 3v4"), P("M9 15l2.2 2.2L16 12.5")),
  PHONE: I(P("M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"), P("M10.5 18h3")),
  HEALTH: I(P("M20.5 9.5c0-2.8-2-4.7-4.4-4.7-1.7 0-3.2 1-4.1 2.4-.9-1.4-2.4-2.4-4.1-2.4C5.5 4.8 3.5 6.7 3.5 9.5c0 .6.1 1.1.2 1.6H8l1.5-2.5 2 5 1.7-3.5 1 1h6.1c.1-.5.2-1 .2-1.6z"), P("M4.4 13c1.6 3 5 5.5 7.6 7.2 2.6-1.7 6-4.2 7.6-7.2")),
  GEOGRAPHY: I(C(12, 12, 9), P("M3.5 9h17M3.5 15h17"), P("M12 3c-2.5 3-2.5 15 0 18M12 3c2.5 3 2.5 15 0 18")),
  INDUSTRY: I(P("M3 20V11l5 3V11l5 3V11l5 3V7h3v13z"), P("M18 4h3v3h-3z")),
  ENVIRONMENT: I(P("M5 19c0-8 5-13 15-14 1 9-3 15-10 15-2.5 0-5-.4-5-1z"), P("M9 19c1-4 3-7 7-9")),
  SOCIAL_CHANGE: I(C(8, 8, 2.6), C(16.5, 9.5, 2.1), P("M3 19c0-3 2.2-5 5-5s5 2 5 5"), P("M14 19c0-2.4 1.2-4 3-4s3 1.3 3 3.4")),
};

export function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "HOUSING":
      return TOPIC_ICON.HOUSE;
    case "SPORTS":
      return TOPIC_ICON.JOGGING;
    case "LEISURE":
      return TOPIC_ICON.MOVIE;
    case "TRAVEL":
      return TOPIC_ICON.OVERSEAS_TRAVEL;
    case "HOBBY":
      return TOPIC_ICON.DRAWING;
    case "WORK":
      return TOPIC_ICON.WORK;
    case "STUDENT":
    case "COURSE":
      return TOPIC_ICON.LIFELONG_LEARNING;
    default:
      return TOPIC_ICON.WEATHER;
  }
}

/**
 * 주제 카드의 그림.
 *
 * 주제에 맞는 그림이 있으면 그것을, 없으면 카테고리 그림을 쓴다.
 */
export function TopicIcon({ id, category }: { id: string; category: string }) {
  return <>{TOPIC_ICON[id] ?? <CategoryIcon category={category} />}</>;
}

/** 사이드바의 "전체 주제" 칸 */
export function GridIcon() {
  return (
    <svg {...S}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  );
}
