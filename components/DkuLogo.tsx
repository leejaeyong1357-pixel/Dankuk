/**
 * 단국대학교 로고.
 *
 * 공식 벡터 파일(ai/eps/svg)을 받으면 public/dku-logo.svg 로 넣고
 * 아래 IMAGE_LOGO 를 true 로 바꾸면 그 파일이 대신 쓰인다.
 * 그때까지는 동일한 구성(DKU 워드마크 + 궤도선 + 국·영문 교명)으로 그려 둔다.
 */
const IMAGE_LOGO = false;
const DKU_BLUE = "#1B4C9C";

export function DkuLogo({ className = "" }: { className?: string }) {
  if (IMAGE_LOGO) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/dku-logo.svg" alt="단국대학교" className={`h-9 w-auto ${className}`} />
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="80" height="34" viewBox="0 0 160 68" aria-label="DKU" role="img">
        {/* 글자 뒤를 지나 오른쪽으로 뻗어 올라가는 궤도선 */}
        <path
          d="M8 30 C8 12 44 6 82 12 C118 18 146 32 152 46"
          fill="none" stroke={DKU_BLUE} strokeWidth="6" strokeLinecap="round"
        />
        <path
          d="M120 34 L152 46 L128 54"
          fill="none" stroke={DKU_BLUE} strokeWidth="6"
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
          fill={DKU_BLUE} stroke="#ffffff" strokeWidth="7"
          paintOrder="stroke fill"
        >
          DKU
        </text>
      </svg>

      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight" style={{ color: DKU_BLUE }}>
          단국대학교
        </span>
        <span className="block text-[8.5px] font-bold tracking-[0.13em]" style={{ color: DKU_BLUE }}>
          DANKOOK UNIVERSITY
        </span>
      </span>
    </span>
  );
}
