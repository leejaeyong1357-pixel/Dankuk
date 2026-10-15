"use client";

import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

/**
 * 공통 푸터.
 *
 * 시안 그대로 — 왼쪽에 로고와 서비스 이름, 오른쪽에 구호와 약관 줄.
 * 약관·개인정보·고객센터는 아직 문서가 없으므로 링크를 걸지 않고
 * 자리만 둔다. 없는 페이지로 보내면 그게 더 나쁘다.
 */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-6">
        <Link href="/dashboard" className="shrink-0" aria-label="메인으로">
          <BrandLogo />
        </Link>
        <span className="hidden h-4 w-px bg-slate-200 sm:block" />
        <span className="text-[14px] text-slate-500">Language Studio</span>

        <span className="ml-auto text-[13px] text-slate-400">
          People Drive Us. We Drive the World.
        </span>
        <span className="hidden h-4 w-px bg-slate-200 lg:block" />
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-400">
          {["이용약관", "개인정보처리방침", "고객센터"].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
