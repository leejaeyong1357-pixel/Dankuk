"use client";

/**
 * 모의고사 화면 틀.
 *
 * 실제 OPIc 은 문항마다 같은 자리에 같은 제목줄과 주황색 진행 버튼이 있다.
 * 학생이 시험장에서 처음 보는 화면이 낯설지 않도록 그 배치를 맞춘다.
 * (모의고사 전용 — 유형별 학습은 우리 UI 를 그대로 쓴다)
 */

/** 상단 제목줄 — 스피커 아이콘 + 시험명 */
export function ExamTitle() {
  return (
    <div className="flex items-center justify-center gap-2 pb-1">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="text-dku-700">
        <path
          d="M4 9v6h4l5 4V5L8 9H4z"
          fill="currentColor"
        />
        <path
          d="M16 8.5a4.5 4.5 0 010 7M18.5 6a8 8 0 010 12"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <h1 className="text-center text-lg font-extrabold tracking-tight text-dku-700 sm:text-xl">
        Oral Proficiency Interview - computer (OPIc)
      </h1>
    </div>
  );
}

/**
 * 진행 버튼 — 실제 시험과 같은 주황색.
 * 파란 계열 UI 안에서 "다음으로 넘어가는 곳"이 한눈에 구분된다.
 */
export function NextButton({
  children = "Next",
  onClick,
  disabled,
  full,
}: {
  children?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md bg-[#f3701b] px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#dd6114] disabled:bg-slate-300 ${
        full ? "w-full py-3.5 text-base" : ""
      }`}
    >
      {children} <span aria-hidden="true">›</span>
    </button>
  );
}

/** 화면 하단 표기 — 실제 시험의 주관사 로고 자리 */
export function ExamFooter() {
  return (
    <p className="mt-8 text-right text-[11px] font-semibold text-slate-300">
      단국대 OPIc 트레이너 · AI 모의고사
    </p>
  );
}
