"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { FeedbackPreview } from "@/components/FeedbackPreview";
import { currentAccount } from "@/lib/account";

/**
 * 첫 화면.
 *
 * 등록한 사람은 여기 머무르지 않는다. 링크를 다시 열 때마다 소개 화면부터
 * 시작하면 쓰던 사람이 매번 처음으로 돌아간다.
 */
export default function Landing() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const a = currentAccount();
    if (a) {
      router.replace(a.targetGrade && a.examDate ? "/dashboard" : "/setup");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return <main className="min-h-screen bg-white" />;

  return (
    <main className="min-h-screen bg-white">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <header className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-5 sm:px-7">
        <BrandLogo />
        <span className="hidden h-5 w-px bg-slate-200 md:block" />
        <span className="hidden font-bold text-dku-700 md:block">OPIc Trainer</span>

        <nav className="ml-auto hidden items-center gap-8 lg:flex">
          {[
            ["서비스 소개", "#intro"],
            ["학습 방법", "#how"],
            ["자주 묻는 질문", "#faq"],
          ].map(([label, href]) => (
            <a key={label} href={href} className="font-semibold text-slate-600 transition hover:text-dku-700">
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 lg:ml-8">
          <Link href="/login" className="font-semibold text-slate-600 transition hover:text-dku-700">
            로그인
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-dku-600 px-5 py-2.5 font-bold text-white transition hover:bg-dku-700"
          >
            학습 시작하기
          </Link>
        </div>
      </header>

      {/* ── 표지 ─────────────────────────────────────────── */}
      <section className="px-5 sm:px-7">
        <div className={`relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-7 py-14 sm:px-12 ${BRAND.heroDark}`}>
          <WavePattern />

          <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 4l9 4.5-9 4.5-9-4.5z" />
                  <path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5l-5 2.5z" />
                </svg>
                {BRAND.landingBadge}
              </span>

              <h1 className="hero-headline mt-8 text-4xl text-white sm:text-5xl">
                생각은 또렷하게.
                <br />
                <span className="text-dku-300">영어는 자신 있게.</span>
              </h1>

              <p className="mt-7 leading-relaxed text-slate-300">
                한 번 말하고, 필요한 피드백만 확인하세요.
                <br />
                내 답변에서 시작하는 OPIc 맞춤 연습.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-dku-500 px-7 py-4 font-bold text-white transition hover:bg-dku-400"
                >
                  {BRAND.landingCta} <span aria-hidden>→</span>
                </Link>
                <a
                  href="#how"
                  className="rounded-xl border border-white/40 px-7 py-4 font-bold text-white transition hover:bg-white/10"
                >
                  학습 과정 살펴보기
                </a>
              </div>

              <p className="mt-5 text-sm text-slate-400">유형별 연습부터 실전 모의고사까지</p>
            </div>

            <div>
              <FeedbackPreview />
              <p className="mt-6 text-right font-brand text-sm italic leading-relaxed text-slate-400">
                {BRAND.motto[0]}
                <br />
                {BRAND.motto[1]}
              </p>
              <div className="ml-auto mt-2 h-px w-8 bg-slate-600" />
              <p className="mt-3 text-right text-sm leading-relaxed text-slate-400">
                {BRAND.heroScript[0]}
                <br />
                {BRAND.heroScript[1]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 오늘 필요한 연습 ─────────────────────────────── */}
      <section id="intro" className="mx-auto max-w-7xl px-5 py-20 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="hero-headline text-3xl text-slate-900 sm:text-4xl">
            말하기가 쌓이면, 실력이 보입니다.
          </h2>
          <p className="text-slate-500">오늘 필요한 연습을 선택하세요.</p>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-3">
          {[
            {
              no: "01",
              tag: "유형별 연습",
              icon: <ChatIcon />,
              tone: "bg-dku-50 text-dku-600",
              title: "익숙한 주제부터 차근차근",
              desc: ["집, 취미, 여행 등 주제별 질문으로", "말문을 열어요."],
              cta: "유형별 연습 보기",
              href: "/register",
            },
            {
              no: "02",
              tag: "실전 모의고사",
              icon: <HeadsetIcon />,
              tone: "bg-violet-50 text-violet-500",
              title: "시험처럼 말해 보는 경험",
              desc: ["여러 질문에 답하며", "실전 흐름을 익혀요."],
              cta: "모의고사 알아보기",
              href: "/register",
            },
            {
              no: "03",
              tag: "AI 피드백",
              icon: <ChartIcon />,
              tone: "bg-emerald-50 text-emerald-500",
              title: "내 답변에 맞는 다음 한 걸음",
              desc: ["답변 근거와 수준을 확인하고,", "다시 말하며 비교해요."],
              cta: "피드백 예시 보기",
              href: "/register",
            },
          ].map((c) => (
            <Link
              key={c.no}
              href={c.href}
              className="group flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-dku-400 hover:shadow-lg"
            >
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.tone}`}>
                {c.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-dku-600">
                  {c.no} · {c.tag}
                </span>
                <span className="mt-1.5 block text-xl font-extrabold text-slate-900">{c.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                  {c.desc[0]}
                  <br />
                  {c.desc[1]}
                </span>
                <span className="mt-4 block font-bold text-dku-600 group-hover:text-dku-800">
                  {c.cta} <span aria-hidden>→</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 학습 과정 ────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-7xl px-5 pb-20 sm:px-7">
        <div className="flex flex-wrap items-center gap-y-6 border-t border-slate-200 pt-10">
          {[
            [<FlagIcon key="f" />, "목표 설정", "나에게 맞는 목표를 정해요."],
            [<MicIcon key="m" />, "말하기 연습", "AI와 자유롭게 말해요."],
            [<ChartIcon key="c" />, "AI 분석", "내 답변을 분석해요."],
            [<RepeatIcon key="r" />, "다시 말하기", "피드백을 반영해 더 나아가요."],
          ].map(([icon, title, desc], i, arr) => (
            <div key={title as string} className="flex flex-1 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dku-50 text-dku-600">
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold text-slate-900">{title as string}</span>
                <span className="block text-sm text-slate-500">{desc as string}</span>
              </span>
              {i < arr.length - 1 && (
                <span className="mx-2 hidden shrink-0 text-slate-300 lg:block" aria-hidden>
                  ›
                </span>
              )}
            </div>
          ))}

          <p className="w-full shrink-0 text-sm leading-relaxed text-slate-400 lg:w-auto lg:text-right">
            AI 진단은 학습용 추정이며
            <br />
            공식 OPIc 성적이 아닙니다.
          </p>
        </div>
      </section>

      {/* ── 자주 묻는 질문 ───────────────────────────────── */}
      <section id="faq" className="bg-slate-50 px-5 py-20 sm:px-7">
        <div className="mx-auto max-w-3xl">
          <h2 className="hero-headline text-center text-3xl text-slate-900">자주 묻는 질문</h2>
          <dl className="mt-8 space-y-3">
            {[
              ["누가 쓸 수 있나요?", `${BRAND.memberFull}이면 누구나 쓸 수 있습니다. 이메일로 등록만 하면 바로 시작됩니다.`],
              ["내 답변은 어디에 저장되나요?", "학습 기록과 계정은 본인 기기의 브라우저에만 저장됩니다. 채점을 위해 답변 텍스트만 AI 채점 서버로 보내며, 이름·이메일은 함께 보내지 않습니다."],
              ["여기서 받은 등급이 실제 성적인가요?", "아닙니다. 학습용 추정이며 공식 OPIc 성적이 아닙니다. 한 문항의 답변만으로는 등급을 확정하지 않습니다."],
              ["마이크가 없어도 되나요?", "됩니다. 말하기 대신 직접 입력으로 답변할 수 있고, 인식된 문장을 그 자리에서 고쳐 쓸 수도 있습니다."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-slate-200 bg-white p-6">
                <dt className="font-extrabold text-slate-900">{q}</dt>
                <dd className="mt-2 leading-relaxed text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-8 sm:px-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <span>© {BRAND.org} · {BRAND.org} {BRAND.product}</span>
          <span className="flex items-center gap-4">
            AI 예상 등급이며 공식 OPIc 성적이 아닙니다.
            <Link href="/admin" className="underline">관리자</Link>
          </span>
        </div>
      </footer>
    </main>
  );
}

/** 표지 배경의 물결 */
function WavePattern() {
  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 text-dku-400 opacity-40"
      aria-hidden
    >
      {Array.from({ length: 14 }).map((_, i) => (
        <path
          key={i}
          d={`M${420 + i * 26} 0 C ${520 + i * 22} 110, ${340 + i * 24} 250, ${470 + i * 24} 400`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity={0.18 + (i % 5) * 0.09}
        />
      ))}
    </svg>
  );
}

const I = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round",
  strokeLinejoin: "round", "aria-hidden": true } as const;

function ChatIcon() {
  return <svg {...I} width="26" height="26"><path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.6" /></svg>;
}
function HeadsetIcon() {
  return <svg {...I} width="26" height="26"><path d="M4 14v-2a8 8 0 1116 0v2" /><rect x="2.5" y="13.5" width="4.5" height="6.5" rx="2.2" /><rect x="17" y="13.5" width="4.5" height="6.5" rx="2.2" /></svg>;
}
function ChartIcon() {
  return <svg {...I} width="24" height="24"><path d="M6 18V10M12 18V6M18 18v-5" /></svg>;
}
function FlagIcon() {
  return <svg {...I}><path d="M5 21V4M5 5h11l-2 3.5L16 12H5" /></svg>;
}
function MicIcon() {
  return <svg {...I}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>;
}
function RepeatIcon() {
  return <svg {...I}><path d="M4 10a6 6 0 016-6h7l-2.5-2.5M20 14a6 6 0 01-6 6H7l2.5 2.5" /></svg>;
}
