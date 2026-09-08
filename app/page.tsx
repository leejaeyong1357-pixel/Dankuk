"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { currentAccount } from "@/lib/account";

/**
 * 첫 화면.
 *
 * 홍보용 소개 화면은 두지 않는다. 등록한 사람은 곧바로 대시보드로 가고,
 * 아직 등록하지 않은 사람에게만 등록하기 / 로그인 두 갈래를 보여 준다.
 */
export default function Entry() {
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

  // 로그인 여부를 확인하기 전에는 아무것도 그리지 않는다.
  // 잠깐이라도 이 화면이 보이면 쓰던 사람에게 로그아웃된 것처럼 보인다.
  if (!checked) return <main className="min-h-screen bg-slate-50" />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-dku-50/50 px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <DkuLogo />
        </div>

        <h1 className="hero-headline mt-8 text-3xl text-slate-900">
          OPIc, <span className="text-dku-700">AI가 끌어올린다.</span>
        </h1>
        <p className="mt-4 leading-relaxed text-slate-500">
          단국대 재학생 전용 OPIc 학습 플랫폼입니다.
          <br />
          등록하면 목표 등급 설정부터 바로 시작합니다.
        </p>

        <div className="mt-9 space-y-2.5">
          <Link
            href="/register"
            className="block rounded-2xl bg-dku-600 px-6 py-4 font-bold text-white shadow-md shadow-dku-600/25 transition hover:bg-dku-700"
          >
            등록하기 →
          </Link>
          <Link
            href="/login"
            className="block rounded-2xl border-2 border-dku-600 bg-white px-6 py-4 font-bold text-dku-700 transition hover:bg-dku-50"
          >
            로그인
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-7">
          {[
            ["10,632제", "유형별 실전 문항"],
            ["15문항", "실전 모의고사"],
            ["9등급", "NL ~ AL 판정"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-brand text-xl text-dku-700 sm:text-2xl">{n}</div>
              <div className="mt-1 text-[11px] text-slate-400">{l}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          AI 예상 등급이며 공식 OPIc 성적이 아닙니다.
          <br />
          <Link href="/admin" className="font-semibold underline">
            관리자
          </Link>
        </p>
      </div>
    </main>
  );
}
