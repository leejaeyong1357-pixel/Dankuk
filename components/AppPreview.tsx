import { BRAND } from "@/lib/brand";

/**
 * 첫 화면 오른쪽의 앱 미리보기 그림.
 *
 * 실제 화면을 찍어 붙이면 화면을 고칠 때마다 그림이 어긋난다.
 * 무엇을 하는 서비스인지만 전하면 되므로 그려서 넣는다.
 */
export function AppPreview() {
  return (
    <div className="relative">
      {/* 뒤에 깔리는 원 */}
      <div className="pointer-events-none absolute -left-6 top-16 h-40 w-40 rounded-full bg-dku-100/70 blur-md" />

      <div className="relative rounded-[28px] bg-white p-5 shadow-2xl shadow-dku-900/10 ring-1 ring-slate-200/70">
        {/* 미리보기 헤더 */}
        <div className="flex items-center justify-between">
          <span className="font-brand text-sm text-dku-700">{BRAND.org}</span>
          <span className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            {BRAND.productShort}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
              </svg>
            </span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[86px_1fr] gap-3">
          {/* 왼쪽 메뉴 */}
          <ul className="space-y-1.5">
            {["홈", "학습하기", "모의고사", "학습 리포트", "마이페이지"].map((m, i) => (
              <li
                key={m}
                className={`rounded-lg px-2.5 py-2 text-[11px] font-bold ${
                  i === 0 ? "bg-dku-50 text-dku-700" : "text-slate-400"
                }`}
              >
                {m}
              </li>
            ))}
          </ul>

          {/* 오른쪽 본문 */}
          <div className="rounded-2xl bg-slate-50/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500">나의 목표 등급</span>
              <span className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold leading-tight text-dku-600 shadow-sm">
                AI와 함께하는
                <br />더 나은 오늘 ✦
              </span>
            </div>

            <div className="mt-2 flex items-end gap-3">
              <span className="font-brand text-5xl leading-none text-dku-600">IH</span>
              <Waveform className="mb-1 h-9 flex-1 text-dku-300" />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              매일 한 걸음, 목표에 더 가까이
            </p>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dku-600 text-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
                  <path d="M5 11a7 7 0 0014 0M12 18v3" />
                </svg>
              </span>
              <span className="text-[11px] text-slate-400">지금, 당신의 이야기를 말해보세요.</span>
              <span className="ml-auto text-slate-300" aria-hidden>›</span>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 아래 말풍선 */}
      <div className="absolute -bottom-6 -right-4 w-40 rounded-2xl bg-white p-3.5 shadow-xl ring-1 ring-slate-200/70">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-dku-50 text-dku-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-slate-700">
          실전과 같은
          <br />
          AI 피드백으로
          <br />더 자연스럽게
        </p>
      </div>

      {/* 말풍선과 겹치지 않도록 오른쪽을 비워 둔다 */}
      <p className="mt-12 pr-44 text-right font-brand text-sm italic leading-relaxed text-dku-300">
        Better English
        <br />A Brighter Tomorrow
      </p>
    </div>
  );
}

/** 목소리 파형 */
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
