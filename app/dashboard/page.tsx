"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { HomeCards } from "@/components/dashboard/HomeCards";
import { YoutubeGuides } from "@/components/YoutubeGuides";
import { BRAND } from "@/lib/brand";
import { daysUntil, loadProgress } from "@/lib/store";
import { fetchHistory } from "@/lib/sync";
import type { ExamResult } from "@/lib/types";

/**
 * 로그인하고 처음 보는 화면.
 *
 * 배너 · 카드 네 장 · 고득점 영상. 세 덩어리로 끝낸다.
 * 여기서 오늘 할 일이 정해져야 하므로 그 밖의 것은 두지 않는다.
 */
export default function Dashboard() {
  const [practiceDone, setPracticeDone] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    setPracticeDone(loadProgress().done.length);
    void fetchHistory().then((h) => {
      setResult(h.latest);
      setExamCount(h.count);
    });
  }, []);

  return (
    <AppShell>
      {(profile) => (
        <>
          <DashboardHero name={profile.name} targetGrade={profile.targetGrade} />

          <div className="mt-4">
            <HomeCards
              examDate={profile.examDate}
              dday={daysUntil(profile.examDate)}
              targetGrade={profile.targetGrade}
              result={result}
              examCount={examCount}
              practiceDone={practiceDone}
            />
          </div>

          {/* 화면 맨 아래 — 오픽 고득점 방법 영상 */}
          <div className="mt-8">
            <YoutubeGuides embedded />
          </div>

          {BRAND.footnote && (
            <p className="mt-8 text-center text-xs text-slate-400">{BRAND.footnote}</p>
          )}
        </>
      )}
    </AppShell>
  );
}
