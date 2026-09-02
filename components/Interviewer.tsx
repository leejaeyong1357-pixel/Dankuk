"use client";

/**
 * 우리 서비스의 AI 면접관 캐릭터.
 *
 * 실제 OPIc 의 캐릭터를 복제하거나 상표를 그대로 쓰지 않는다.
 * 역할은 정해진 문항을 순서대로 읽어주는 가상 면접관이며,
 * 학생의 답을 이해해 자유 대화를 이어가는 챗봇이 아니다.
 */
export function Interviewer({
  speaking,
  name = "Ariel",
  caption,
}: {
  speaking: boolean;
  name?: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-full bg-dku-400/30 transition ${
            speaking ? "animate-ping" : "opacity-0"
          }`}
        />
        <svg width="132" height="132" viewBox="0 0 132 132" className="relative" aria-hidden="true">
          {/* 어깨가 원 밖으로 삐져나오지 않도록 전체를 원으로 잘라낸다 */}
          <defs>
            <clipPath id="interviewer-clip">
              <circle cx="66" cy="66" r="63" />
            </clipPath>
          </defs>
          <circle cx="66" cy="66" r="64" fill="#eef4fd" stroke="#b9d0f5" strokeWidth="2" />
          <g clipPath="url(#interviewer-clip)">
          {/* 머리카락 뒤쪽 */}
          <path d="M28 70c0-24 17-42 38-42s38 18 38 42c0 10-2 18-5 24H33c-3-6-5-14-5-24z" fill="#3b3550" />
          {/* 얼굴 */}
          <ellipse cx="66" cy="70" rx="25" ry="29" fill="#f6ddc9" />
          {/* 앞머리 */}
          <path d="M41 62c2-18 12-27 25-27s23 9 25 27c-8-9-15-12-25-12s-17 3-25 12z" fill="#3b3550" />
          {/* 눈 */}
          <ellipse cx="56" cy="68" rx="3.2" ry="4" fill="#2b2740" />
          <ellipse cx="76" cy="68" rx="3.2" ry="4" fill="#2b2740" />
          {/* 입 — 말할 때 열린다 */}
          {speaking ? (
            <ellipse cx="66" cy="84" rx="6" ry="5" fill="#c2665f" />
          ) : (
            <path d="M60 84q6 4 12 0" stroke="#c2665f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          )}
          {/* 어깨 */}
          <path d="M26 134c5-20 18-31 40-31s35 11 40 31z" fill="#1d4098" />
          </g>
        </svg>
      </div>

      <p className="mt-3 text-sm font-extrabold text-slate-800">{name}</p>
      <p className="text-xs text-slate-400">
        {speaking ? "문항을 읽는 중…" : caption ?? "AI 면접관"}
      </p>
    </div>
  );
}
