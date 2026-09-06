/**
 * 실제 OPIc 오리엔테이션 상단의 단계 표시줄.
 *
 * 응시자는 지금 어느 단계에 있고 몇 단계가 남았는지를 늘 보고 있어야 한다.
 * 실전과 같은 화면에서 연습해야 시험장에서 화면 때문에 당황하지 않는다.
 */
export const EXAM_STEPS = [
  "Background Survey",
  "Self Assessment",
  "Pre-Test Setup",
  "Sample Question",
  "본 시험",
] as const;

export function ExamSteps({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <ol className="flex w-full overflow-hidden rounded-lg border border-slate-300 bg-white text-center">
      {EXAM_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const on = n === current;
        return (
          <li
            key={label}
            aria-current={on ? "step" : undefined}
            className={`flex-1 border-l border-slate-200 px-1.5 py-2 first:border-l-0 sm:px-3 ${
              on ? "bg-dku-700 text-white" : done ? "bg-slate-100 text-slate-500" : "text-slate-400"
            }`}
          >
            <span className="block text-[10px] font-bold sm:text-[11px]">Step {n}</span>
            <span
              className={`mt-0.5 block truncate text-[10px] sm:text-xs ${
                on ? "font-bold" : "font-semibold"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
