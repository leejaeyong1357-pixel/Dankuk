/**
 * 안내 상자 — 옅은 바탕에 작은 제목.
 *
 * 왼쪽 색 막대는 쓰지 않는다 (흔한 AI 생성 화면처럼 보인다는 의견).
 *
 * 화면마다 테두리·둥근 모서리·배경이 제각각이면 무엇이 중요한 말인지
 * 구분이 안 된다. 강조해야 할 문장은 전부 이 한 가지 모양으로 통일한다.
 */
const TONE = {
  indigo: "border-indigo-500 bg-indigo-50 text-indigo-700",
  blue: "border-dku-600 bg-dku-50 text-dku-700",
  amber: "border-amber-500 bg-amber-50 text-amber-700",
  red: "border-red-500 bg-red-50 text-red-600",
  slate: "border-slate-400 bg-slate-50 text-slate-500",
} as const;

export function Callout({
  label,
  tone = "indigo",
  children,
  className = "",
}: {
  /** 상자 맨 위 작은 제목. 없으면 본문만 나온다 */
  label?: string;
  tone?: keyof typeof TONE;
  children: React.ReactNode;
  className?: string;
}) {
  const [, bg, text] = TONE[tone].split(" ");
  return (
    <div className={`rounded-xl ${bg} px-4 py-3.5 ${className}`}>
      {label && <p className={`text-xs font-bold ${text}`}>{label}</p>}
      <div className={`text-sm leading-relaxed text-slate-800 ${label ? "mt-1" : ""}`}>
        {children}
      </div>
    </div>
  );
}
