"use client";

import { useEffect, useState } from "react";

/**
 * 대시보드 우측의 로드맵 카드.
 *
 * 확정된 일정이 아니라 구상안이다. 학생이 확정 공지로 오해하지 않도록
 * 카드에 그렇게 적어 둔다.
 */
const STAGES = [
  { num: 1, date: "1단계", title: "단국대 재학생 전용 OPIc AI 학습 서비스 공개", emoji: "🎉" },
  { num: 2, date: "2단계", title: "교내 응시 지원 및 학습 데이터 분석", emoji: "📊" },
  { num: 3, date: "3단계", title: "모바일 앱 개발", emoji: "📱" },
  { num: 4, date: "4단계", title: "개인 맞춤형 AI 영어 회화 비서", emoji: "🤖" },
  { num: 5, date: "최종 목표", title: "재학생 글로벌 역량 향상", emoji: "🏆" },
];

const STEP_PX = 64;

export function Roadmap() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % STAGES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-dku-700/15 bg-gradient-to-br from-dku-50 via-white to-red-50/40 p-5 shadow-sm md:p-6">
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-dku-500/10 blur-3xl" />

      <div className="relative">
        <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-dku-700">DKU OPIc ROADMAP</p>
        <h3 className="mb-1 text-lg font-black text-slate-900 md:text-xl">우리의 여정 🚀</h3>
        <p className="mb-4 text-[11px] text-slate-400">확정 일정이 아닌 구상안입니다.</p>

        <div className="relative pl-3">
          <div className="absolute bottom-3 left-[19px] top-3 w-[3px] rounded-full bg-gradient-to-b from-red-500/40 via-dku-500/30 to-dku-500/10" />

          {STAGES.map((s, i) => {
            const on = i === active;
            return (
              <div key={s.num} className="relative flex items-start gap-3" style={{ height: STEP_PX }}>
                <div
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${
                    on
                      ? "scale-110 bg-red-500 text-white shadow-lg shadow-red-500/40"
                      : "border-2 border-dku-400/50 bg-white text-dku-700"
                  }`}
                >
                  {s.num}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div
                    className={`text-[10px] font-black tracking-wider transition-colors ${
                      on ? "text-red-500" : "text-dku-600/70"
                    }`}
                  >
                    {s.date}
                  </div>
                  <div
                    className={`text-[13px] font-bold leading-snug transition-colors ${
                      on ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {s.emoji} {s.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
