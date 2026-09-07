"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * 대시보드 상단 배너.
 *
 * 로그인하고 처음 보는 화면이라 여기서 오늘 할 일이 정해진다.
 * 왼쪽은 이름과 목표, 오른쪽은 캠퍼스 사진. 사진은 public/dashboard-hero.jpg 를
 * 놓으면 그대로 나오고, 없으면 대신 그린 하늘·건물 배경이 나온다.
 */
export function DashboardHero({
  name,
  targetGrade,
}: {
  name: string;
  targetGrade: string;
}) {
  const [noPhoto, setNoPhoto] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid lg:grid-cols-[minmax(0,400px)_1fr]">
        {/* 왼쪽 — 인사와 목표 */}
        <div className="relative z-10 flex flex-col justify-center bg-white px-7 py-6 sm:px-8">
          <p className="text-sm font-bold text-slate-700">
            안녕하세요, <span className="text-slate-900">{name}님!</span> 👋
          </p>
          <h1 className="hero-headline mt-2.5 text-[26px] text-slate-900 sm:text-[30px]">
            목표 등급 <span className="text-dku-600">{targetGrade}</span>까지,
            <br />
            가장 빠른 학습 루트
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            단국대학교 OPIc Trainer가
            <br />
            당신의 더 큰 가능성을 응원합니다.
          </p>
          <p className="mt-3 text-sm font-bold text-dku-700">
            <span aria-hidden>“</span> 지금의 노력이, 더 큰 기회를 만듭니다. <span aria-hidden>”</span>
          </p>
          <Link
            href="/study"
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-dku-600 px-7 py-3.5 font-bold text-white shadow-md shadow-dku-600/25 transition hover:bg-dku-700"
          >
            오늘도 학습하기 <span aria-hidden>→</span>
          </Link>
        </div>

        {/* 오른쪽 — 캠퍼스 */}
        <div className="relative min-h-[200px] lg:aspect-[1095/466]">
          {!noPhoto && (
            // 정적 배포라 next/image 최적화를 쓰지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/dashboard-hero.jpg"
              alt="단국대학교 캠퍼스에서 영어로 말하고 있는 학생"
              className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
              onError={() => setNoPhoto(true)}
            />
          )}

          {/* 사진에 이미 문구와 카드가 들어 있으므로, 없을 때만 대신 그린다 */}
          {noPhoto && (
            <>
              <CampusScene />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent lg:via-white/10" />

              <p className="absolute left-6 top-8 max-w-[220px] text-sm font-bold leading-relaxed text-dku-800">
                오늘의 연습이
                <br />더 밝은 세상을 만듭니다.
              </p>
              <p className="absolute left-6 top-[104px] text-[10px] font-bold tracking-[0.18em] text-dku-700/60">
                DANKOOK UNIVERSITY
                <br />A BRIGHTER TOMORROW
              </p>

              <div className="absolute bottom-6 right-6 hidden w-56 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur sm:block">
                <p className="text-lg" aria-hidden>🎓</p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-slate-800">
                  단국대학교와 함께,
                  <br />
                  당신의 가능성은 더 멀리.
                </p>
                <div className="mt-3 h-px w-8 bg-dku-300" />
                <p className="mt-2 text-[10px] font-bold tracking-wider text-slate-400">
                  DANKOOK UNIVERSITY
                  <br />
                  OPIc TRAINER
                </p>
              </div>
            </>
          )}

          {/* 왼쪽 흰 글씨판과 만나는 자리를 부드럽게 잇는다 */}
          {!noPhoto && (
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
          )}
        </div>
      </div>
    </section>
  );
}

/** 사진이 없을 때 대신 그리는 캠퍼스 배경 */
function CampusScene() {
  return (
    <svg
      viewBox="0 0 600 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bcdcf7" />
          <stop offset="100%" stopColor="#eaf4fd" />
        </linearGradient>
      </defs>
      <rect width="600" height="300" fill="url(#sky)" />
      <circle cx="120" cy="52" r="26" fill="#fff" opacity="0.75" />
      <circle cx="148" cy="52" r="20" fill="#fff" opacity="0.75" />
      <circle cx="470" cy="40" r="22" fill="#fff" opacity="0.6" />
      {/* 건물 */}
      <rect x="330" y="96" width="180" height="150" fill="#f1f5f9" />
      <rect x="330" y="96" width="180" height="16" fill="#dbe6f3" />
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 7 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={342 + c * 24}
            y={124 + r * 24}
            width="15"
            height="15"
            rx="2"
            fill="#9fc0e6"
            opacity={0.55 + ((r + c) % 3) * 0.12}
          />
        )),
      )}
      {/* 나무와 잔디 */}
      <rect x="0" y="246" width="600" height="54" fill="#cfe6c8" />
      {[40, 110, 190, 262, 540].map((x, i) => (
        <g key={x}>
          <rect x={x + 8} y={218} width="6" height="30" fill="#a9835f" />
          <circle cx={x + 11} cy={206} r={22 - (i % 3) * 3} fill="#8cc084" />
        </g>
      ))}
    </svg>
  );
}
