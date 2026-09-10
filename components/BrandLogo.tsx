import { ACTIVE, BRAND } from "@/lib/brand";

/**
 * 조직 로고.
 *
 * 공식 벡터 파일을 받으면 public/brand-logo.svg 로 넣고 아래 IMAGE_LOGO 를
 * true 로 바꾸면 그 파일이 대신 쓰인다. 그때까지는 같은 구성으로 그려 둔다.
 * 그린 마크는 자리를 잡아 두기 위한 것이고 공식 로고가 아니다.
 */
const IMAGE_LOGO = false;

/** 로그인 화면처럼 로고가 주인공인 자리에서는 "lg" 를 쓴다 */
export type LogoSize = "md" | "lg";

export function BrandLogo({
  className = "",
  size = "md",
  markOnly = false,
}: {
  className?: string;
  size?: LogoSize;
  /** 사명 없이 마크만. 좁은 카드 안처럼 자리가 없는 곳에서 쓴다 */
  markOnly?: boolean;
}) {
  if (IMAGE_LOGO) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand-logo.svg"
        alt={BRAND.org}
        className={`w-auto ${size === "lg" ? "h-14" : "h-9"} ${className}`}
      />
    );
  }
  return ACTIVE === "hanwha"
    ? <HanwhaMark className={className} size={size} markOnly={markOnly} />
    : <DkuMark className={className} size={size} markOnly={markOnly} />;
}

/**
 * 한화엔진 — 겹친 두 개의 타원 고리 + 국문 사명.
 *
 * 실제 마크는 같은 크기의 타원 고리 둘이 왼쪽 위·오른쪽 아래로 어긋나 겹친다.
 * 뒤쪽(오른쪽 아래)이 연한 주황, 앞쪽(왼쪽 위)이 진한 주황이다.
 */
function HanwhaMark({ className = "", size = "md", markOnly = false }: { className?: string; size?: LogoSize; markOnly?: boolean }) {
  const ORANGE = "#F0701E";
  const ORANGE_PALE = "#F9C0A0";
  const big = size === "lg";
  const px = big ? 54 : markOnly ? 30 : 36;
  return (
    <span className={`inline-flex items-center ${big ? "gap-3" : "gap-2"} ${className}`}>
      <svg width={px} height={px} viewBox="0 0 52 52" aria-label={BRAND.org} role="img" fill="none">
        <defs>
          {/* 두 고리가 아래쪽에서 엇갈려 지나가는 자리 */}
          <clipPath id="hanwha-mark-weave">
            <rect x="2" y="27" width="24" height="25" />
          </clipPath>
        </defs>
        {/* 뒤쪽 고리 — 오른쪽 아래, 연한 주황 */}
        <ellipse
          cx="30" cy="31" rx="16.5" ry="13.6"
          transform="rotate(-32 30 31)"
          stroke={ORANGE_PALE} strokeWidth="3.4"
        />
        {/* 앞쪽 고리 — 왼쪽 위, 진한 주황 */}
        <ellipse
          cx="21" cy="21" rx="16.5" ry="13.6"
          transform="rotate(-32 21 21)"
          stroke={ORANGE} strokeWidth="3.4"
        />
        {/* 아래쪽 교차점만 다시 그려 연한 고리가 위로 지나가게 한다 */}
        <g clipPath="url(#hanwha-mark-weave)">
          <ellipse
            cx="30" cy="31" rx="16.5" ry="13.6"
            transform="rotate(-32 30 31)"
            stroke={ORANGE_PALE} strokeWidth="3.4"
          />
        </g>
      </svg>
      {!markOnly && (
        <span className={`font-extrabold tracking-tight text-slate-900 ${big ? "text-[34px]" : "text-[17px]"}`}>
          {BRAND.org}
        </span>
      )}
    </span>
  );
}

/** 단국대학교 — DKU 워드마크 + 궤도선 + 국·영문 교명 */
function DkuMark({ className = "", size = "md", markOnly = false }: { className?: string; size?: LogoSize; markOnly?: boolean }) {
  const BLUE = "#1B4C9C";
  const big = size === "lg";
  return (
    <span className={`inline-flex items-center ${big ? "gap-3.5" : "gap-2.5"} ${className}`}>
      <svg width={big ? 122 : 80} height={big ? 52 : 34} viewBox="0 0 160 68" aria-label="DKU" role="img">
        <path
          d="M8 30 C8 12 44 6 82 12 C118 18 146 32 152 46"
          fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round"
        />
        <path
          d="M120 34 L152 46 L128 54"
          fill="none" stroke={BLUE} strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/*
          paint-order 로 흰 테두리를 먼저 칠해 궤도선이 글자 뒤로 지나가게 만든다.
          도형을 덮어 가리는 것보다 배경색에 의존하지 않아 안전하다.
        */}
        <text
          x="6" y="52"
          fontFamily="Arial Black, Arial, Helvetica, sans-serif"
          fontSize="44" fontWeight="900" fontStyle="italic" letterSpacing="-2"
          fill={BLUE} stroke="#ffffff" strokeWidth="7"
          paintOrder="stroke fill"
        >
          DKU
        </text>
      </svg>

      {!markOnly && (
      <span className="leading-tight">
        <span className={`block font-extrabold tracking-tight ${big ? "text-[23px]" : "text-[15px]"}`} style={{ color: BLUE }}>
          단국대학교
        </span>
        <span className={`block font-bold tracking-[0.13em] ${big ? "text-[13px]" : "text-[8.5px]"}`} style={{ color: BLUE }}>
          DANKOOK UNIVERSITY
        </span>
      </span>
      )}
    </span>
  );
}
