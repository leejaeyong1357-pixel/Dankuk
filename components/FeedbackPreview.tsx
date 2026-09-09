/**
 * 표지 오른쪽의 학습 화면 예시.
 *
 * 실제 화면을 찍어 붙이면 화면을 고칠 때마다 그림이 어긋난다.
 * 무엇을 하는 서비스인지만 전하면 되므로 그려서 넣고, 예시라고 적어 둔다.
 */
export function FeedbackPreview() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-slate-950/30 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-dku-600">AI FEEDBACK</p>
          <p className="mt-0.5 text-lg font-extrabold text-slate-900">학습 화면 예시</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          <span aria-hidden>ⓘ</span> 이는 예시 화면입니다.
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dku-50 text-dku-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M4 11l8-6 8 6v8a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
            <path d="M10 20v-6h4v6" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-bold text-slate-900">내 방을 소개해 볼까요?</p>
          <p className="mt-0.5 text-sm text-slate-500">지금, 아래 주제에 맞춰 영어로 말해보세요.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-dku-50/70 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dku-600 text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5l12 7-12 7z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-800">
            My room is small, but it gets a lot of sunlight.
          </p>
          <Waves className="mt-1.5 h-4 w-full text-dku-400" />
        </div>
        <span className="shrink-0 text-xs text-slate-400">00:12</span>
      </div>

      <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-extrabold text-slate-900">
        이번 답변의 핵심 피드백
      </p>
      <ul className="mt-2.5 space-y-2">
        <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
            ✓
          </span>
          <span className="text-sm text-slate-700">방의 특징을 구체적으로 설명했어요.</span>
        </li>
        <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dku-600 text-xs font-black text-white">
            →
          </span>
          <span className="text-sm text-slate-700">가구의 위치를 덧붙여 보세요.</span>
        </li>
      </ul>

      <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-dku-600 px-5 py-3.5 font-bold text-white">
        <span aria-hidden>🎤</span> 피드백 적용해서 다시 말하기
      </p>
    </div>
  );
}

/** 목소리 파형 */
function Waves({ className = "" }: { className?: string }) {
  const bars = [5, 11, 7, 14, 9, 16, 6, 12, 8, 15, 5, 10, 13, 7, 11, 6, 9, 4];
  return (
    <svg viewBox="0 0 180 18" className={className} preserveAspectRatio="none" aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 10 + 2}
          y={(18 - h) / 2}
          width="3"
          height={h}
          rx="1.5"
          fill="currentColor"
          opacity={0.5 + (i % 3) * 0.2}
        />
      ))}
    </svg>
  );
}
