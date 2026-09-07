"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { currentAccount } from "@/lib/account";
import { HeroPhoto } from "@/components/HeroPhoto";
import { YoutubeGuides } from "@/components/YoutubeGuides";

/**
 * 첫 화면.
 *
 * 이미 로그인한 사람은 여기 머무르지 않는다. 링크를 다시 열 때마다
 * 등록부터 시작하면 쓰던 사람이 매번 처음으로 돌아간다.
 */
export default function Landing() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const a = currentAccount();
    if (a) {
      router.replace(a.targetGrade && a.examDate ? "/dashboard" : "/setup");
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 로그인 여부를 확인하기 전에는 아무것도 그리지 않는다.
  // 잠깐이라도 첫 화면이 보이면 쓰던 사람에게 로그아웃된 것처럼 보인다.
  if (!checked) return <main className="min-h-screen bg-white" />;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all ${
          scrolled ? "bg-white/95 shadow-sm backdrop-blur" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <DkuLogo />
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="rounded-full bg-dku-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-dku-700"
            >
              등록하기
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:border-dku-700 hover:text-dku-700"
            >
              로그인 →
            </Link>
          </div>
        </div>
      </header>

      {/* ── 표지 ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-dku-50 px-5 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="animate-fadeup text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              단국대 재학생 전용 · OPIc 학습 플랫폼
            </div>
            <h1 className="hero-headline mb-6 text-5xl text-slate-900 md:text-7xl">
              OPIc, AI가 끌어올린다.
              <br />
              <span className="text-dku-700">DKU OPIc</span>.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500 md:text-xl">
              자기소개부터 롤플레이·고난도까지.
              <br />
              AI 채점, 음성 인식, 맞춤 모범답안으로
              <br />
              <span className="font-bold text-slate-900">IM2 에서 IH 로</span>.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-dku-700 px-8 py-4 font-bold text-white transition-all hover:bg-dku-800 hover:shadow-xl"
              >
                등록하고 시작하기 →
              </Link>
              <Link
                href="/login"
                className="rounded-full border-2 border-dku-700 px-8 py-4 font-bold text-dku-700 transition-colors hover:bg-dku-700 hover:text-white"
              >
                로그인
              </Link>
              <a
                href="#features"
                className="rounded-full border-2 border-slate-300 px-8 py-4 font-bold text-slate-700 transition-colors hover:border-dku-700 hover:text-dku-700"
              >
                알아보기
              </a>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-6">
              {[
                ["5,651제", "유형별 실전 문항"],
                ["15문항", "실전 모의고사"],
                ["9등급", "NL ~ AL 판정"],
              ].map(([n, l]) => (
                <div key={l} className="text-center">
                  <div className="font-brand text-2xl text-dku-700 sm:text-3xl md:text-4xl">{n}</div>
                  <div className="mt-1 text-[11px] text-slate-400 sm:text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── 실전 스피킹 연습 ─────────────────────────────── */}
      <section className="bg-white px-5 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-dku-700">실전 스피킹 연습</p>
            <h2 className="hero-headline mt-3 text-3xl text-slate-900 md:text-4xl">
              말하면 바로 글이 되고,
              <br />
              AI가 그 자리에서 고쳐 줍니다.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              녹음해서 보내고 기다리는 방식이 아닙니다.
              <br />
              말하는 즉시 화면에 문장이 쌓이고, 답변을 마치면
              <br />
              발화량·유창성·문법·어휘를 한 번에 진단합니다.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                ["🎙", "실시간 음성 인식", "말하는 대로 화면에 바로 나타납니다."],
                ["📖", "단어에 마우스만", "모르는 단어 위에 올리면 그 자리에 뜻이 뜹니다."],
                ["⭐", "목표 등급 모범답안", "IL~AL 중 내 목표에 맞춘 답안을 만들어 줍니다."],
              ].map(([icon, t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="text-xl">{icon}</span>
                  <span>
                    <span className="block font-bold text-slate-900">{t}</span>
                    <span className="block text-sm text-slate-500">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <HeroPhoto />
        </div>
      </section>

      {/* ── 기능 ─────────────────────────────────────────── */}
      <section id="features" className="bg-white px-5 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-bold text-red-600">FEATURES</div>
            <h2 className="hero-headline text-4xl text-slate-900 md:text-5xl">
              DKU OPIc 의 기능
            </h2>
            <p className="mt-3 text-slate-500">학습부터 채점까지, 한 화면에서 끝내세요.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { t: "실제 시험 구조 그대로", d: "Background Survey → 난이도 → Testlet → 중간 재조정까지. 문제를 무작위로 뿌리지 않습니다.", emoji: "🎯" },
              { t: "음성 인식 답변", d: "말하면 바로 텍스트로. 발화량·속도·침묵을 자동으로 계산합니다.", emoji: "🎤" },
              { t: "단어 사전", d: "모르는 단어를 짚으면 우측에 뜻이 뜹니다. 학습 흐름이 끊기지 않습니다.", emoji: "📖" },
              { t: "맞춤 모범답안", d: "목표 등급(IL~AL)에 맞춘 답안. 너무 어렵지도, 쉽지도 않게.", emoji: "⭐" },
              { t: "실전 모의고사", d: "실제 OPIc 과 같은 15문항. 40분 타이머, 문항당 2회 청취.", emoji: "⏱️" },
              { t: "AI 예상 등급", d: "ACTFL 4대 준거로 NL~AL 판정. Score Report 와 세부진단서까지.", emoji: "📊" },
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-2xl border border-slate-200 p-6 transition-all hover:border-dku-700 hover:shadow-lg"
              >
                <div className="mb-3 text-3xl">{f.emoji}</div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{f.t}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 브랜드 스토리 ────────────────────────────────── */}
      <section className="bg-dku-700 px-5 py-24 text-white sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 text-sm font-bold tracking-wider text-red-300">BRAND STORY</div>
          <h2 className="hero-headline mb-8 text-4xl md:text-5xl">
            한국 사람들은 왜 영어를
            <br />
            몇 십년씩 배워도 말하기를 어려워할까?
          </h2>
          <p className="text-base leading-relaxed text-dku-100 md:text-lg">
            읽고 쓰는 건 되는데, 막상 입을 열면 한 문장에서 멈춥니다.
            <br />
            OPIc 은 정답을 맞히는 시험이 아니라, 얼마나 길게 자연스럽게
            <br />
            말할 수 있는지를 보는 시험입니다.
            <br />
            <br />
            <span className="font-bold text-white">DKU OPIc</span> 은 그 순간을 위해 만들어졌습니다.
            <br />
            언제 어디서든 실전처럼 말하고, AI가 바로 진단합니다.
          </p>
        </div>
      </section>

      <YoutubeGuides />

      {/* ── 마무리 ───────────────────────────────────────── */}
      <section className="bg-white px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="hero-headline mb-6 text-4xl text-slate-900 md:text-5xl">준비되셨나요?</h2>
          <p className="mb-8 text-lg text-slate-500">
            처음이라면 <b>등록하기</b>, 이미 등록했다면 <b>로그인</b>.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-block rounded-full bg-red-600 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-red-700 hover:shadow-xl"
            >
              등록하기 →
            </Link>
            <Link
              href="/login"
              className="inline-block rounded-full border-2 border-slate-900 px-10 py-4 text-lg font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 text-xs text-slate-400 md:flex-row md:items-center">
          <span>© 단국대학교 · DKU OPIc</span>
          <span className="flex items-center gap-3">
            AI 예상 등급이며 공식 OPIc 성적이 아닙니다.
            <Link href="/admin" className="font-semibold text-slate-400 hover:text-slate-600">
              관리자
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
