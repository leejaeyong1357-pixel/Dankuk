"use client";

import { useState } from "react";

/**
 * 표지 오른쪽 사진.
 *
 * public/hero-student.jpg 를 놓으면 그 사진이 나온다. 아직 없으면 자리를
 * 비워 두지 않고 대신 그린 화면을 보여 준다 — 사진이 빠져도 표지가 무너지지 않는다.
 */
export function HeroPhoto() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-dku-100 via-white to-slate-100 shadow-xl ring-1 ring-slate-200">
      {!failed && (
        // 정적 배포라 next/image 최적화를 쓰지 않는다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/hero-student.jpg"
          alt="노트북 앞에서 영어로 말하고 있는 학생"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}

      {failed && <PlaceholderScene />}

      {/* 화면 위에 얹는 실시간 인식 카드 */}
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-[11px] font-bold text-red-600">실시간 음성 인식</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-900">
          I usually go to the park near my house
          <span className="text-slate-400"> on weekends with my family…</span>
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-dku-600 align-middle" />
        </p>
      </div>
    </div>
  );
}

/** 사진이 없을 때 대신 그리는 장면 */
function PlaceholderScene() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="학습 화면 예시">
      <rect width="400" height="300" fill="#eef4fd" />
      <circle cx="200" cy="108" r="40" fill="#1d4098" opacity="0.15" />
      <circle cx="200" cy="100" r="26" fill="#1d4098" opacity="0.5" />
      <path d="M150 190c0-30 22-52 50-52s50 22 50 52z" fill="#1d4098" opacity="0.4" />
      <rect x="120" y="196" width="160" height="10" rx="5" fill="#1d4098" opacity="0.25" />
      <rect x="132" y="206" width="136" height="42" rx="6" fill="#ffffff" opacity="0.8" />
      <rect x="146" y="220" width="70" height="6" rx="3" fill="#1d4098" opacity="0.3" />
      <rect x="146" y="232" width="104" height="6" rx="3" fill="#1d4098" opacity="0.18" />
    </svg>
  );
}
