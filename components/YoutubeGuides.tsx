"use client";

import { useEffect, useState } from "react";

/**
 * 첫 화면 아래 "오픽 고득점 방법!" 영상 모음.
 *
 * 우리가 만든 영상이 아니라 공개된 유튜브 영상을 소개하는 자리다.
 * 썸네일은 유튜브가 제공하는 주소를 그대로 쓰고, 재생도 유튜브 플레이어로 한다.
 */
interface Guide {
  id: string;
  title: string;
}

const GUIDES: Guide[] = [
  { id: "Jj8hzv-j5LE", title: "오픽, 어떤 시험인가요?" },
  { id: "ZVZjJAor15Y", title: "오픽 AL은 이렇게 답합니다." },
  { id: "1UKTLHUWh_Q", title: "2026년 오픽 이렇게 나옵니다." },
  { id: "cT3blUGhmRs", title: "오픽 독학 A to Z" },
];

export function YoutubeGuides({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState<Guide | null>(null);

  // 팝업이 떠 있는 동안은 Esc 로 닫고 뒤 화면이 스크롤되지 않게 한다
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <section className={embedded ? "" : "bg-slate-50 px-5 py-20 sm:px-6"}>
      <div className={embedded ? "" : "mx-auto max-w-6xl"}>
        <div className="border-b-2 border-slate-300 pb-4">
          <h2 className="hero-headline text-3xl text-slate-900 md:text-4xl">오픽 고득점 방법!</h2>
          <p className="mt-2 text-sm text-slate-500">
            시험을 처음 보는 사람이 먼저 보면 좋은 영상을 모았습니다.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setOpen(g)}
              className="group text-left"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-200 shadow-sm ring-1 ring-slate-200 transition group-hover:shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${g.id}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/30">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-lg text-red-600 shadow-lg">
                    ▶
                  </span>
                </span>
              </div>
              <p className="mt-3 font-bold leading-snug text-slate-900 group-hover:text-dku-700">
                {g.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 bg-white px-5 py-3">
              <p className="truncate font-bold text-slate-900">{open.title}</p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="닫기"
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${open.id}?autoplay=1&rel=0`}
                title={open.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <p className="bg-white px-5 py-3 text-xs text-slate-400">
              외부 채널이 공개한 영상입니다.{" "}
              <a
                href={`https://youtu.be/${open.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-dku-700 underline"
              >
                유튜브에서 보기 →
              </a>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
