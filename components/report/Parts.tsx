"use client";

import type { ReactNode } from "react";

/**
 * 리포트를 이루는 부품들.
 *
 * 연습 결과지와 모의고사 채점표가 같은 얼굴을 하도록 한곳에 둔다.
 * 시안의 규칙은 단순하다 — 옅은 파란 바탕 위에 흰 카드,
 * 카드마다 아이콘 + 제목 + 오른쪽 보조 설명, 안쪽은 표 아니면 세 칸.
 */

/** 리포트 바탕 — 흰 화면 위에 올려도 리포트처럼 보이게 한다 */
export function ReportFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[20px] bg-[#eef3fb] px-4 py-5 sm:px-7 sm:py-7">
      {children}
    </div>
  );
}

/** 카드 — 리포트의 한 단락 */
export function Card({
  icon,
  title,
  hint,
  aside,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl bg-white px-5 py-5 first:mt-0 sm:px-7 sm:py-6">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-dku-50 text-dku-600">
          {icon}
        </span>
        <h3 className="text-[19px] font-bold text-slate-900">{title}</h3>
        {hint && <span className="text-[15px] text-slate-400">{hint}</span>}
        {aside && <span className="ml-auto text-[13px] text-slate-400">{aside}</span>}
      </header>
      {children}
    </section>
  );
}

/** 01 / 02 / 03 번호표 */
export function StepNo({ no }: { no: number }) {
  return (
    <span className="flex h-[22px] shrink-0 items-center rounded-md bg-dku-100/80 px-2 text-[12px] font-bold tabular-nums text-dku-700">
      {String(no).padStart(2, "0")}
    </span>
  );
}

/** 왼쪽 라벨 · 오른쪽 값 표 */
export function LabelTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-4 overflow-hidden rounded-xl border border-slate-200">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`grid grid-cols-[minmax(96px,34%)_1fr] ${i > 0 ? "border-t border-slate-200" : ""}`}
        >
          <dt className="bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-600">{k}</dt>
          <dd className="px-4 py-3 text-[14px] leading-relaxed text-slate-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const ICON = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconDoc = () => (
  <svg {...ICON}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);
export const IconPen = () => (
  <svg {...ICON}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);
export const IconChat = () => (
  <svg {...ICON}>
    <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" />
  </svg>
);
export const IconBook = () => (
  <svg {...ICON}>
    <path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z" />
    <path d="M8 7h7M8 11h7" />
  </svg>
);
export const IconTarget = () => (
  <svg {...ICON}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>
);
export const IconInfo = () => (
  <svg {...ICON} width={14} height={14}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
