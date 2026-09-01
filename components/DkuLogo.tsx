/**
 * 단국대학교 로고 자리.
 *
 * 공식 로고 파일(SVG/PNG)을 받으면 public/dku-logo.svg 로 넣고
 * 이 컴포넌트를 <img src="/dku-logo.svg" /> 로 교체하면 된다.
 * 지금은 동일한 비율·색을 쓰는 워드마크로 대체해 둔다.
 */
export function DkuLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <circle cx="17" cy="17" r="16" fill="#12357c" />
        <path d="M10 9h5.6c4.6 0 7.4 3 7.4 8s-2.8 8-7.4 8H10V9zm4 3.2v9.6h1.4c2.6 0 4.2-1.8 4.2-4.8s-1.6-4.8-4.2-4.8H14z" fill="#fff" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight text-dku-800">
          단국대학교
        </span>
        <span className="block text-[9px] font-semibold tracking-[0.14em] text-dku-600">
          DANKOOK UNIVERSITY
        </span>
      </span>
    </span>
  );
}
