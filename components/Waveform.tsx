/**
 * 목소리 파형.
 *
 * 소개 화면에 있던 앱 미리보기 그림과 함께 있던 조각이다.
 * 소개 화면을 없앤 뒤에도 회원가입 화면에서 계속 쓰인다.
 */
export function Waveform({ className = "" }: { className?: string }) {
  const bars = [8, 16, 26, 14, 32, 22, 38, 18, 30, 12, 22, 9];
  return (
    <svg viewBox="0 0 120 40" className={className} preserveAspectRatio="none" aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 10 + 2}
          y={(40 - h) / 2}
          width="5"
          height={h}
          rx="2.5"
          fill="currentColor"
          opacity={0.45 + (i % 4) * 0.18}
        />
      ))}
    </svg>
  );
}
