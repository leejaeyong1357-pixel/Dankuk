"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { AppPreview } from "@/components/AppPreview";
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

  // 로그인 여부를 확인하기 전에는 아무것도 그리지 않는다
  if (!checked) return <main className="min-h-screen bg-slate-50" />;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-dku-50/50">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        <DkuLogo />
        <span className="font-brand text-lg text-slate-900">DKU OPIc</span>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-dku-50 px-4 py-2 text-sm font-bold text-dku-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 4l9 4.5-9 4.5-9-4.5z" />
                <path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5l-5 2.5z" />
              </svg>
              단국대학교 재학생 전용
            </span>

            <h1 className="hero-headline mt-7 text-5xl text-slate-900 sm:text-6xl">
              OPIc, <span className="text-dku-600">AI가</span>
              <br />
              끌어올린다.
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              목표 설정부터 실전 연습까지
              <br />
              나에게 맞춘 AI 영어 말하기 학습
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-2xl bg-dku-600 px-9 py-4 text-lg font-bold text-white shadow-lg shadow-dku-600/25 transition hover:bg-dku-700"
              >
                무료로 시작하기 <span aria-hidden>→</span>
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border-2 border-dku-600 bg-white px-9 py-4 text-lg font-bold text-dku-700 transition hover:bg-dku-50"
              >
                로그인
              </Link>
            </div>
          </div>

          <AppPreview />
        </div>

        {/* 숫자 세 가지 */}
        <div className="mt-20 grid gap-6 border-t border-slate-200 pt-12 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          {[
            [<BookIcon key="b" />, "10,632제", "유형별 실전 문항"],
            [<PaperIcon key="p" />, "15문항", "실전 모의고사"],
            [<ChartIcon key="c" />, "9등급", "NL ~ AL AI 평가"],
          ].map(([icon, n, l]) => (
            <div key={l as string} className="flex items-center justify-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dku-50 text-dku-600">
                {icon}
              </span>
              <span>
                <span className="block font-brand text-3xl text-dku-700">{n as string}</span>
                <span className="mt-0.5 block text-sm text-slate-400">{l as string}</span>
              </span>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-slate-400">
          AI 예상 등급이며 공식 OPIc 성적이 아닙니다.
          <br />
          <Link href="/admin" className="mt-1 inline-block underline">
            관리자
          </Link>
        </p>
      </section>
    </main>
  );
}

const I = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round",
  strokeLinejoin: "round", "aria-hidden": true } as const;

function BookIcon() {
  return <svg {...I}><path d="M4 5.5A2.5 2.5 0 016.5 3H19v15H6.5A2.5 2.5 0 004 20.5z" /><path d="M4 18.5V5.5" /></svg>;
}
function PaperIcon() {
  return <svg {...I}><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>;
}
function ChartIcon() {
  return <svg {...I}><path d="M6 18V10M12 18V6M18 18v-5" /></svg>;
}
