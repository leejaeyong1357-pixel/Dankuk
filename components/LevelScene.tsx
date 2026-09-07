"use client";

import type { DifficultyLevel } from "@/lib/exam/question-types";

/**
 * 난이도에 따라 함께 바뀌는 그림.
 *
 * 1~6 은 숫자만 보면 무엇이 얼마나 어려워지는지 감이 오지 않는다.
 * 계단이 한 칸씩 높아지고, 말풍선이 한 줄에서 여러 줄로 늘어나고,
 * 색이 차차 짙어지는 것으로 "요구되는 말의 길이"를 눈에 보이게 한다.
 */
const TONE: Record<DifficultyLevel, { bg: string; bar: string; ink: string; label: string }> = {
  1: { bg: "#f1f5f9", bar: "#94a3b8", ink: "#475569", label: "단어 · 짧은 문장" },
  2: { bg: "#eef4fd", bar: "#8bb2ed", ink: "#2451ba", label: "문장으로 답하기" },
  3: { bg: "#e6effc", bar: "#5789e1", ink: "#1d4098", label: "문단으로 답하기" },
  4: { bg: "#ddeafb", bar: "#3468d4", ink: "#12357c", label: "상세 묘사 · 비교" },
  5: { bg: "#d4e3fa", bar: "#2451ba", ink: "#0b2a63", label: "확장 서술 · 의견" },
  6: { bg: "#c9dcf8", bar: "#12357c", ink: "#0b2a63", label: "추상 · 가정 상황" },
};

export function LevelScene({ level, className = "" }: { level: DifficultyLevel; className?: string }) {
  const t = TONE[level];
  // 말풍선 줄 수와 계단 높이가 난이도를 따라 늘어난다
  const lines = Math.min(5, level);
  const steps = [1, 2, 3, 4, 5, 6];

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`} style={{ background: t.bg }}>
      <svg viewBox="0 0 320 140" className="h-full w-full" role="img"
           aria-label={`난이도 ${level}단계 — ${t.label}`}>
        {/* 계단 — 지금 단계까지 차오른다 */}
        {steps.map((s, i) => {
          const h = 12 + s * 13;
          const on = s <= level;
          return (
            <rect
              key={s}
              x={14 + i * 26}
              y={128 - h}
              width={20}
              height={h}
              rx={4}
              fill={on ? t.bar : "#ffffff"}
              opacity={on ? 1 : 0.65}
              style={{ transition: "all .35s ease" }}
            />
          );
        })}

        {/* 말하는 사람 */}
        <circle cx="196" cy="52" r="13" fill={t.ink} opacity="0.85" />
        <path d="M177 92c0-11 8.5-19 19-19s19 8 19 19z" fill={t.ink} opacity="0.7" />

        {/* 말풍선 — 난이도가 오를수록 문장이 길어진다 */}
        <rect x="226" y={58 - lines * 9} width="82" height={14 + lines * 12} rx="8" fill="#fff" />
        {Array.from({ length: lines }).map((_, i) => (
          <rect
            key={i}
            x="234"
            y={66 - lines * 9 + i * 12}
            width={i === lines - 1 ? 40 : 66}
            height="6"
            rx="3"
            fill={t.bar}
            opacity={0.35 + i * 0.12}
          />
        ))}
        <path d="M232 74l-8 8 2-10z" fill="#fff" />

        {/* 지금 단계 */}
        <text x="14" y="20" fontSize="13" fontWeight="800" fill={t.ink}>
          {level}단계
        </text>
        <text x="52" y="20" fontSize="11" fontWeight="600" fill={t.ink} opacity="0.7">
          {t.label}
        </text>
      </svg>
    </div>
  );
}
