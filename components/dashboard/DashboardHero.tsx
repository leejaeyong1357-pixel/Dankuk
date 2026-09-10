"use client";

import Link from "next/link";
import { ACTIVE, BRAND } from "@/lib/brand";
import { BrandLogo } from "@/components/BrandLogo";
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
      <div className="grid lg:grid-cols-[minmax(0,490px)_1fr]">
        {/* 왼쪽 — 인사와 목표 */}
        <div className="relative z-10 flex flex-col justify-center bg-white px-7 py-6 sm:px-8">
          <p className="text-sm font-bold text-slate-700">
            안녕하세요, <span className="text-slate-900">{name}님!</span> 👋
          </p>
          <h1 className="hero-headline mt-2.5 break-keep text-[25px] text-slate-900 sm:text-[28px]">
            목표 등급 <span className="text-dku-600">{targetGrade}</span>까지,
            <br />
            {BRAND.heroLine}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {BRAND.org} {BRAND.product}가
            <br />
            당신의 더 큰 가능성을 응원합니다.
          </p>
          <p className="mt-3 text-sm font-bold text-dku-700">
            <span aria-hidden>“</span> {BRAND.heroQuote} <span aria-hidden>”</span>
          </p>
          <Link
            href="/study"
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-dku-600 px-7 py-3.5 font-bold text-white shadow-md shadow-dku-600/25 transition hover:bg-dku-700"
          >
            오늘도 학습하기 <span aria-hidden>→</span>
          </Link>
        </div>

        {/* 오른쪽 — 캠퍼스 */}
        <div
          className="hero-photo relative min-h-[200px]"
          style={{ "--hero-aspect": BRAND.heroAspect } as React.CSSProperties}
        >
          {!noPhoto && (
            // 정적 배포라 next/image 최적화를 쓰지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={BRAND.heroImage}
              alt={`${BRAND.org} 학습 배너`}
              className="absolute inset-0 h-full w-full object-cover object-[58%_38%]"
              onError={() => setNoPhoto(true)}
            />
          )}

          {/* 사진을 못 받았을 때 대신 그리는 배경 */}
          {noPhoto && <CampusScene />}

          {/*
            문구가 사진에 박혀 있지 않은 브랜드는 여기서 문구를 그린다.
            사진을 잘라 붙이면 글자가 사진 해상도에 묶여 흐려진다.
            글자는 브라우저가 그려야 어느 크기에서도 또렷하다.
          */}
          {!BRAND.heroTextBaked && <HeroCaption />}

          {/* 왼쪽 흰 글씨판과 만나는 자리를 부드럽게 잇는다 */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}

/**
 * 배너에 얹는 문구와 카드.
 *
 * 시안의 배치를 그대로 따른다 — 왼쪽 위 손글씨 문구, 그 아래 영문 표어,
 * 오른쪽 아래 흰 카드. 위치를 % 로 잡아 배너가 커지든 작아지든 같은 자리에 온다.
 * 사진이 어두워 글자가 묻히지 않도록 왼쪽에 흰 장막을 깐다.
 */
function HeroCaption() {
  return (
    <>
      {/*
        시안은 왼쪽 위가 하늘이라 저절로 밝다. 공장 사진은 그렇지 않으므로
        글자가 앉는 왼쪽 위만 밝게 덮는다. 오른쪽은 사진 그대로 둔다.
      */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(118% 112% at 0% 0%, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0.55) 46%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0) 74%)",
        }}
      />

      {/* 손글씨 문구 — 살짝 기울여 손으로 쓴 느낌을 준다 */}
      <p
        className="absolute left-[5%] top-[13%] -rotate-[7deg] text-[clamp(15px,2.2cqw,26px)] font-extrabold leading-[1.45] text-dku-600 [text-shadow:0_1px_6px_rgba(255,255,255,0.95),0_0_2px_rgba(255,255,255,0.95)]"
        style={{ letterSpacing: "0.01em" }}
      >
        {BRAND.heroScript[0]}
        <br />
        {BRAND.heroScript[1]}
      </p>

      {/* 영문 표어 */}
      <div className="absolute left-[23%] top-[35%] hidden lg:block">
        <p className="text-[clamp(8px,1.05cqw,13px)] font-bold leading-[1.7] tracking-[0.16em] text-slate-700 [text-shadow:0_1px_6px_rgba(255,255,255,0.95),0_0_2px_rgba(255,255,255,0.95)]">
          {BRAND.motto[0]}
          <br />
          {BRAND.motto[1]}
        </p>
        <div className="mt-1.5 h-[2px] w-7 rounded-full bg-dku-500" />
      </div>

      {/* 오른쪽 아래 카드 */}
      <div className="absolute bottom-[8%] right-[3.5%] hidden w-[24%] min-w-[170px] rounded-2xl bg-white/95 p-[5%] shadow-lg shadow-slate-900/10 backdrop-blur-sm lg:block">
        <BrandLogo />
        <p className="mt-2.5 text-[clamp(11px,1.35cqw,15px)] font-bold leading-snug text-slate-800">
          {BRAND.heroCard[0]}
          <br />
          {BRAND.heroCard[1]}
        </p>
        <p className="mt-3 text-[clamp(8px,0.95cqw,11px)] font-bold leading-[1.6] tracking-[0.08em] text-slate-400">
          {BRAND.orgEn}
          <br />
          {BRAND.productTag}
        </p>
      </div>
    </>
  );
}

/**
 * 사진이 없을 때 대신 그리는 배경.
 *
 * 조직에 따라 그리는 장면이 다르다. 사진 파일을 넣으면 이 그림은 쓰이지 않는다.
 */
function CampusScene() {
  return ACTIVE === "hanwha" ? <ShipyardScene /> : <SchoolScene />;
}

/** 한화엔진 — 바다, 선박, 공장 */
function ShipyardScene() {
  return (
    <svg
      viewBox="0 0 600 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="hw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe4f7" />
          <stop offset="100%" stopColor="#f4ece6" />
        </linearGradient>
      </defs>
      <rect width="600" height="300" fill="url(#hw-sky)" />
      <circle cx="120" cy="54" r="24" fill="#fff" opacity="0.7" />
      <circle cx="146" cy="54" r="18" fill="#fff" opacity="0.7" />

      {/* 뒤편 공장동과 크레인 */}
      <rect x="330" y="112" width="200" height="120" fill="#eceef1" />
      <rect x="330" y="112" width="200" height="12" fill="#dfe3e8" />
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={342 + c * 23}
            y={134 + r * 22}
            width="14"
            height="14"
            rx="2"
            fill="#b9c4d2"
            opacity={0.5 + ((r + c) % 3) * 0.14}
          />
        )),
      )}
      {[250, 560].map((x) => (
        <g key={x} stroke="#f06021" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d={`M${x} 232 V96`} />
          <path d={`M${x - 46} 100 H${x + 30}`} />
          <path d={`M${x - 30} 100 V126`} />
        </g>
      ))}

      {/* 바다 */}
      <rect x="0" y="232" width="600" height="68" fill="#9fc4de" />
      <path d="M0 244 Q40 238 80 244 T160 244 T240 244 T320 244 T400 244 T480 244 T560 244 T640 244"
            stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.5" />

      {/* 선박 */}
      <g>
        <path d="M40 232 H250 L232 258 H58 Z" fill="#2f4a63" />
        <rect x="70" y="200" width="120" height="32" fill="#e8edf2" />
        <rect x="196" y="188" width="42" height="44" fill="#f2f5f8" />
        {[80, 104, 128, 152, 176].map((x) => (
          <rect key={x} x={x} y={206} width="18" height="20" rx="2" fill="#f06021" opacity="0.85" />
        ))}
      </g>
    </svg>
  );
}

/** 단국대학교 — 하늘, 건물, 나무 */

function SchoolScene() {
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
