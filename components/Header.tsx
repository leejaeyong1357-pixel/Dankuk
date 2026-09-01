"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DkuLogo } from "./DkuLogo";
import type { UserProfile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/study", label: "유형별 학습" },
  { href: "/mock", label: "모의고사" },
  { href: "/vocab", label: "단어장" },
];

export function Header({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/dashboard" className="shrink-0">
          <DkuLogo />
        </Link>
        <span className="hidden h-5 w-px bg-slate-200 sm:block" />
        <span className="hidden shrink-0 text-sm font-bold text-dku-700 sm:block">
          OPIc Trainer
        </span>

        <nav className="ml-auto flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-dku-50 text-dku-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          {profile && (
            <span className="ml-3 flex items-center gap-2 rounded-full border border-dku-200 bg-dku-50 px-3 py-1.5">
              <span className="text-xs font-bold text-dku-700">목표 {profile.targetGrade}</span>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
