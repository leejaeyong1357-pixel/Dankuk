/**
 * 주제 카테고리 아이콘과 이름.
 *
 * 카드가 수십 장 늘어서므로 글자보다 모양으로 먼저 구분된다.
 * 설문 카테고리 코드를 화면에 그대로 내보내지 않기 위한 이름표이기도 하다.
 */
const S = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round",
  strokeLinejoin: "round", "aria-hidden": true } as const;

export const CATEGORY_KO: Record<string, string> = {
  HOUSING: "주거",
  SPORTS: "운동",
  LEISURE: "여가",
  TRAVEL: "여행",
  HOBBY: "취미",
  WORK: "직업",
  STUDENT: "학업",
  COURSE: "학업",
  UNEXPECTED: "돌발",
};

/** 사이드바에 세울 순서 */
export const CATEGORY_ORDER = ["HOUSING", "SPORTS", "LEISURE", "TRAVEL", "HOBBY", "WORK", "STUDENT"];

export function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "HOUSING":
      return <svg {...S}><path d="M4 11l8-6 8 6v8a1 1 0 01-1 1H5a1 1 0 01-1-1z" /><path d="M10 20v-6h4v6" /></svg>;
    case "SPORTS":
      return <svg {...S}><circle cx="15" cy="4.5" r="1.6" /><path d="M8 21l2.5-5 3-2-1-4-3 2-2 3M13.5 14l3.5 2 1 5" /></svg>;
    case "LEISURE":
      return <svg {...S}><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>;
    case "TRAVEL":
      return <svg {...S}><path d="M3 15l7-2 4-8 2 1-2 6.5 5-1.4 1.5 2.4-6 2.5-1.5 5-1.8.4.3-4.2L4 18z" /></svg>;
    case "HOBBY":
      return <svg {...S}><path d="M12 3a9 9 0 000 18c1 0 1.6-.7 1.6-1.5 0-.9-.8-1.4-.8-2.2 0-.8.7-1.3 1.5-1.3H16a5 5 0 005-5c0-4.4-4-8-9-8z" /><circle cx="8" cy="10" r="1" fill="currentColor" /><circle cx="12" cy="7.5" r="1" fill="currentColor" /><circle cx="16" cy="10" r="1" fill="currentColor" /></svg>;
    case "WORK":
      return <svg {...S}><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" /></svg>;
    case "STUDENT":
    case "COURSE":
      return <svg {...S}><path d="M12 4l9 4.5-9 4.5-9-4.5z" /><path d="M6.5 10.5V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5.5" /></svg>;
    default:
      return <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>;
  }
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
