"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { useRouter } from "next/navigation";
import { currentAccount, type Account } from "@/lib/account";

/**
 * 설정을 마친 뒤 대시보드로 넘어가기 전 화면.
 *
 * 실제로 준비할 것이 있어서 기다리는 것은 아니다. 설정한 값이 학습에
 * 반영된다는 것을 보여 주는 연출이다.
 */
const STEPS = [
  "프로필 분석 중…",
  "목표 등급에 맞춰 문항 난이도 조정 중…",
  "취약 유형 우선순위 계산 중…",
  "학습 환경 준비 완료",
];

const TOTAL_MS = 4200;

export default function Ready() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const a = currentAccount();
    if (!a || !a.targetGrade) { router.replace("/setup"); return; }
    setAccount(a);
  }, [router]);

  useEffect(() => {
    if (!account) return;
    const started = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - started) / TOTAL_MS) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(id);
        router.replace("/dashboard");
      }
    }, 80);
    return () => clearInterval(id);
  }, [account, router]);

  if (!account) return <div className="min-h-screen bg-slate-50" />;

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))];
  const leftSec = Math.max(0, Math.ceil((TOTAL_MS * (1 - pct / 100)) / 1000));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-dku-50/50 px-5">
      <div className="w-full max-w-md text-center">
        <p className="font-brand text-3xl text-dku-700">{BRAND.productShort}</p>
        <p className="mt-1 text-sm text-slate-400">by {BRAND.org}</p>

        <h1 className="mt-14 text-2xl font-extrabold leading-snug text-slate-900">
          <span className="text-dku-600">{account.name}</span>님께
          <br />
          맞춤 커스터마이징 중
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          목표 {account.targetGrade} 학습 환경을 준비하고 있습니다.
        </p>

        <div
          className="mt-10 h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-dku-700 to-dku-500 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">{step}</span>
          <span className="font-bold text-dku-600">{pct}%</span>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          {leftSec > 0 ? `약 ${leftSec}초 남음` : "곧 시작합니다"}
        </p>
      </div>
    </div>
  );
}
