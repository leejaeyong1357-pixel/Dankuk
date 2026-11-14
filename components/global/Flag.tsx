/**
 * 국기 — 그림으로 직접 그린다.
 *
 * 전에는 국기 이모지(🇰🇷)를 썼다. macOS·iOS 에서는 제대로 보이지만
 * **Windows 에는 국기 글꼴이 아예 없어** 회사 PC 에서는 "KR" 같은 글자 두 개로
 * 나온다. 이모지로는 어느 기기에서 어떻게 보일지 보장할 수가 없다.
 *
 * 그래서 여섯 나라와 대한민국만 SVG 로 직접 그려 둔다. 어느 기기에서도 같다.
 * 작게 쓰이므로 세부 문양은 알아볼 수 있는 선까지만 그린다 — 공식 도안이 아니다.
 */

/** 꼭짓점 다섯 개짜리 별 */
function star(cx: number, cy: number, r: number, rot = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = ((rot + i * 36) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.382;
    pts.push(`${(cx + Math.cos(rad) * rr).toFixed(2)},${(cy + Math.sin(rad) * rr).toFixed(2)}`);
  }
  return pts.join(" ");
}

export type FlagCode = "MX" | "BR" | "PL" | "IN" | "CN" | "AU" | "KR" | "RU" | "CZ" | "DE" | "SK" | "UZ" | "US";

const DRAW: Record<FlagCode, React.ReactNode> = {
  // 멕시코 — 초록/흰색/빨강 세로 삼색
  MX: (
    <>
      <rect width="10" height="20" fill="#006847" />
      <rect x="10" width="10" height="20" fill="#ffffff" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
      <ellipse cx="15" cy="10" rx="2.6" ry="2.2" fill="#9a6a3a" />
      <ellipse cx="15" cy="11.4" rx="3.2" ry="1" fill="#3f7d3f" />
    </>
  ),
  // 브라질 — 초록 바탕, 노란 마름모, 파란 원
  BR: (
    <>
      <rect width="30" height="20" fill="#009739" />
      <polygon points="15,2.4 27.2,10 15,17.6 2.8,10" fill="#FEDD00" />
      <circle cx="15" cy="10" r="4.3" fill="#012169" />
      <path d="M10.9 8.6 Q15 11.6 19.1 8.6 L19.1 9.9 Q15 12.9 10.9 9.9 Z" fill="#ffffff" />
    </>
  ),
  // 폴란드 — 흰색 위, 빨강 아래
  PL: (
    <>
      <rect width="30" height="10" fill="#ffffff" />
      <rect y="10" width="30" height="10" fill="#DC143C" />
    </>
  ),
  // 러시아 — 흰색/파랑/빨강 가로 삼색
  RU: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
      <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
    </>
  ),
  // 체코 — 흰색/빨강 가로 두 띠, 왼쪽 파란 삼각형
  CZ: (
    <>
      <rect width="30" height="10" fill="#ffffff" />
      <rect y="10" width="30" height="10" fill="#D7141A" />
      <polygon points="0,0 15,10 0,20" fill="#11457E" />
    </>
  ),
  // 독일 — 검정/빨강/금색 가로 삼색
  DE: (
    <>
      <rect width="30" height="6.67" fill="#000000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </>
  ),
  // 슬로바키아 — 흰색/파랑/빨강 가로 삼색, 왼쪽에 방패(이중 십자)
  SK: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect y="6.67" width="30" height="6.67" fill="#0B4EA2" />
      <rect y="13.33" width="30" height="6.67" fill="#EE1C25" />
      <path d="M6 5h7v6.2c0 2.6-1.6 4-3.5 4.8C7.6 15.2 6 13.800 6 11.200z" fill="#EE1C25" stroke="#ffffff" strokeWidth="0.7" />
      <path d="M9.500 6.300v7M8 8h3M7.600 9.800h3.800" stroke="#ffffff" strokeWidth="0.800" />
    </>
  ),
  // 우즈베키스탄 — 하늘색/흰색/초록 가로 띠, 사이에 가는 빨간 줄, 초승달
  UZ: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect width="30" height="6.300" fill="#0099B5" />
      <rect y="13.700" width="30" height="6.300" fill="#1EB53A" />
      <rect y="6.300" width="30" height="0.600" fill="#CE1126" />
      <rect y="13.100" width="30" height="0.600" fill="#CE1126" />
      <circle cx="5" cy="3.200" r="2" fill="#ffffff" />
      <circle cx="5.800" cy="3.200" r="2" fill="#0099B5" />
    </>
  ),
  // 미국 — 빨강·흰색 줄 13개, 왼쪽 위 남색 칸
  US: (
    <>
      <rect width="30" height="20" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#ffffff" />
      ))}
      <rect width="13" height={(7 * 20) / 13} fill="#3C3B6E" />
      {[2.200, 5.400, 8.600].map((y) =>
        [2.200, 5, 7.800, 10.600].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.650" fill="#ffffff" />),
      )}
    </>
  ),
  // 인도 — 주황/흰색/초록 가로 삼색, 가운데 남색 바퀴
  IN: (
    <>
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.66" fill="#ffffff" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.7" fill="none" stroke="#000080" strokeWidth="0.7" />
      <circle cx="15" cy="10" r="0.7" fill="#000080" />
    </>
  ),
  // 중국 — 빨강 바탕, 큰 별 하나와 작은 별 넷
  CN: (
    <>
      <rect width="30" height="20" fill="#EE1C25" />
      <polygon points={star(7.2, 6.4, 3.6)} fill="#FFDE00" />
      <polygon points={star(13.6, 2.9, 1.3)} fill="#FFDE00" />
      <polygon points={star(16.2, 5.6, 1.3)} fill="#FFDE00" />
      <polygon points={star(16.2, 9.3, 1.3)} fill="#FFDE00" />
      <polygon points={star(13.6, 12, 1.3)} fill="#FFDE00" />
    </>
  ),
  // 호주 — 남색 바탕, 좌상단 유니언잭, 연방별과 남십자성
  AU: (
    <>
      <rect width="30" height="20" fill="#00247D" />
      <g>
        <path d="M0 0 L15 10 M15 0 L0 10" stroke="#ffffff" strokeWidth="2.2" />
        <path d="M0 0 L15 10 M15 0 L0 10" stroke="#CF142B" strokeWidth="1" />
        <path d="M7.5 0 V10 M0 5 H15" stroke="#ffffff" strokeWidth="3.4" />
        <path d="M7.5 0 V10 M0 5 H15" stroke="#CF142B" strokeWidth="1.8" />
      </g>
      <polygon points={star(7.5, 15, 2.6)} fill="#ffffff" />
      <polygon points={star(22, 4.6, 1.5)} fill="#ffffff" />
      <polygon points={star(25.6, 9, 1.5)} fill="#ffffff" />
      <polygon points={star(21.4, 13.4, 1.5)} fill="#ffffff" />
      <polygon points={star(19.2, 8.6, 1.2)} fill="#ffffff" />
      <polygon points={star(24.2, 16.2, 1)} fill="#ffffff" />
    </>
  ),
  // 대한민국 — 흰 바탕, 태극과 네 괘
  KR: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <path d="M11 10 A4 4 0 0 1 19 10 A2 2 0 0 0 15 10 A2 2 0 0 1 11 10 Z" fill="#CD2E3A" />
      <path d="M19 10 A4 4 0 0 1 11 10 A2 2 0 0 1 15 10 A2 2 0 0 0 19 10 Z" fill="#0047A0" />
      <g fill="#000000">
        {/* 왼쪽 위 건, 오른쪽 아래 곤, 오른쪽 위 감, 왼쪽 아래 리 — 작게 줄여 막대만 */}
        <rect x="2.4" y="4.2" width="4.6" height="0.8" />
        <rect x="2.4" y="5.6" width="4.6" height="0.8" />
        <rect x="2.4" y="7" width="4.6" height="0.8" />
        <rect x="23" y="12.2" width="4.6" height="0.8" />
        <rect x="23" y="13.6" width="4.6" height="0.8" />
        <rect x="23" y="15" width="4.6" height="0.8" />
        <rect x="23" y="4.2" width="4.6" height="0.8" />
        <rect x="23" y="5.6" width="1.9" height="0.8" />
        <rect x="25.7" y="5.6" width="1.9" height="0.8" />
        <rect x="23" y="7" width="4.6" height="0.8" />
        <rect x="2.4" y="12.2" width="1.9" height="0.8" />
        <rect x="5.1" y="12.2" width="1.9" height="0.8" />
        <rect x="2.4" y="13.6" width="4.6" height="0.8" />
        <rect x="2.4" y="15" width="1.9" height="0.8" />
        <rect x="5.1" y="15" width="1.9" height="0.8" />
      </g>
    </>
  ),
};

export function Flag({
  code,
  className = "",
  style,
}: {
  code: FlagCode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 30 20"
      style={style}
      className={`shrink-0 rounded-[2px] ring-1 ring-slate-900/10 ${className}`}
      role="presentation"
      aria-hidden
    >
      {DRAW[code]}
    </svg>
  );
}
