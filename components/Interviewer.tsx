"use client";

/**
 * 모의고사 면접관.
 *
 * 실제 OPIc 화면은 사각 액자 안에 면접관 반신 일러스트를 보여 준다.
 * 학생이 시험장에서 마주할 화면과 같은 구도로 연습해야 실전에서 덜 당황하므로
 * 프레임·구도·크기를 맞춘다.
 *
 * 다만 실제 시험의 캐릭터 그림과 상표는 그대로 옮기지 않는다.
 * 같은 형식의 자체 캐릭터(Ariel)이며, 역할은 정해진 문항을 순서대로
 * 읽어주는 것이다. 학생의 답을 이해해 대화를 잇는 챗봇이 아니다.
 */
export function Interviewer({
  speaking,
  name = "Ariel",
  caption,
  size = "md",
}: {
  speaking: boolean;
  name?: string;
  /** 액자 아래 보조 문구. 없으면 표시하지 않는다 */
  caption?: string;
  /** lg = 시작 화면, md = 문항 진행 중 */
  size?: "md" | "lg";
}) {
  const w = size === "lg" ? 208 : 148;
  const h = Math.round(w * 0.9);

  return (
    <div className="flex flex-col items-center">
      <div
        className="overflow-hidden border-2 border-slate-300 bg-white shadow-sm"
        style={{ width: w, height: h }}
      >
        <svg viewBox="0 0 200 180" width={w} height={h} aria-label={`면접관 ${name}`} role="img">
          {/* 배경 — 실내 벽면과 문틀 */}
          <rect width="200" height="180" fill="#b7c0b1" />
          <rect x="116" y="0" width="84" height="180" fill="#9aa596" />
          <rect x="124" y="10" width="68" height="104" fill="#7f8c7b" />

          {/* 목 */}
          <path d="M87 104h26v34H87z" fill="#e3b492" />
          {/* 어깨·재킷 — 액자 아래를 가득 채워야 인물이 떠 보이지 않는다 */}
          <path d="M18 180c5-27 28-42 82-42s77 15 82 42z" fill="#2e3340" />
          {/* 셔츠 */}
          <path d="M80 141l20 21 20-21 9 5-29 34h-1l-28-34z" fill="#f7f9fb" />
          {/* 재킷 깃 */}
          <path d="M80 141l20 21-9 18-19-34z" fill="#3a4050" />
          <path d="M120 141l-20 21 9 18 19-34z" fill="#3a4050" />

          {/* 머리카락 — 하나로 이어진 덩어리가 어깨까지 내려온다 */}
          <path
            d="M64 152c-5-28-5-52-2-70C67 46 80 32 100 32s33 14 38 50c3 18 3 42-2 70l-16-2c5-26 6-48 4-64-3-24-11-34-24-34s-21 10-24 34c-2 16-1 38 4 64z"
            fill="#573822"
          />

          {/* 얼굴 */}
          <ellipse cx="100" cy="82" rx="27" ry="32" fill="#f2c9a8" />
          {/* 귀 */}
          <ellipse cx="74" cy="84" rx="5" ry="8" fill="#e3b492" />
          <ellipse cx="126" cy="84" rx="5" ry="8" fill="#e3b492" />

          {/* 앞머리 — 이마를 비스듬히 덮는다 */}
          <path d="M73 72c3-24 14-34 27-34s24 10 27 34c-5-16-14-22-27-22-9 0-14 3-19 9-3 4-6 8-8 13z" fill="#482f1c" />

          {/* 눈썹 */}
          <path d="M84 72q7-4 14 0" stroke="#482f1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M102 72q7-4 14 0" stroke="#482f1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* 눈 */}
          <ellipse cx="91" cy="82" rx="4.4" ry="4.8" fill="#ffffff" />
          <ellipse cx="109" cy="82" rx="4.4" ry="4.8" fill="#ffffff" />
          <circle cx="91" cy="82" r="2.6" fill="#3b2a1e" />
          <circle cx="109" cy="82" r="2.6" fill="#3b2a1e" />
          {/* 코 */}
          <path d="M100 86v8l-4 2" stroke="#d59f7d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* 입 — 문항을 읽을 때 열린다 */}
          {speaking ? (
            <ellipse cx="100" cy="103" rx="5.5" ry="4.5" fill="#a8524d" />
          ) : (
            <path d="M93 102q7 4.5 14 0" stroke="#a8524d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          )}
          {/* 볼 */}
          <ellipse cx="82" cy="93" rx="5" ry="3.2" fill="#eba98c" opacity="0.45" />
          <ellipse cx="118" cy="93" rx="5" ry="3.2" fill="#eba98c" opacity="0.45" />
        </svg>
      </div>

      {caption && (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {speaking ? "문항을 읽는 중…" : caption}
        </p>
      )}
    </div>
  );
}
