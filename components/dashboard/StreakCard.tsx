"use client";

/**
 * 연속 학습 카드.
 *
 * 연속 일수가 늘수록 불꽃이 커진다. 매일 한 문제라도 열게 만드는 장치이므로
 * 숫자를 크게 보여 준다.
 */
const LEVELS = [
  { min: 0, label: "불씨", size: "text-4xl", tint: "from-slate-100 to-slate-50" },
  { min: 1, label: "작은 불꽃", size: "text-5xl", tint: "from-amber-100 to-orange-50" },
  { min: 3, label: "타오르는 중", size: "text-6xl", tint: "from-orange-100 to-red-50" },
  { min: 7, label: "활활", size: "text-7xl", tint: "from-red-100 to-orange-50" },
  { min: 14, label: "꺼지지 않는 불", size: "text-7xl", tint: "from-red-200 to-amber-50" },
];

export function StreakCard({ streak, done }: { streak: number; done: number }) {
  const lv = [...LEVELS].reverse().find((l) => streak >= l.min) ?? LEVELS[0];

  return (
    <div
      className={`flex h-full items-center gap-5 rounded-3xl border border-slate-200 bg-gradient-to-br ${lv.tint} p-5 md:p-6`}
    >
      <div className={`${lv.size} animate-float leading-none`} aria-hidden>
        🔥
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.2em] text-red-500">STREAK</p>
        <p className="mt-1 text-2xl font-black leading-none text-slate-900">
          연속 {streak}일
          <span className="ml-2 align-middle text-xs font-bold text-slate-500">{lv.label}</span>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          지금까지 <strong className="font-black text-red-600">{done}</strong>문항 연습했습니다.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {streak === 0 ? "오늘 한 문제로 불을 붙여 보세요." : "오늘도 한 문제만 더."}
        </p>
      </div>
    </div>
  );
}
