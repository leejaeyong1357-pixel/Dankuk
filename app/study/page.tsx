"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { bandOf, topicCounts, activeSurveyTopics } from "@/lib/exam-engine";
import { loadProgress } from "@/lib/store";
import { ALL_QUESTIONS } from "@/lib/exam-engine";

type Tab = "survey" | "adhoc" | "roleplay";

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: "survey", label: "설문 주제", hint: "내 Background Survey 응답에서 나오는 주제" },
  { key: "adhoc", label: "돌발 주제", hint: "설문과 무관하게 반드시 출제되는 주제" },
  { key: "roleplay", label: "롤플레이", hint: "질문하기 → 대안 제시 → 유사 경험 3문항 세트" },
];

export default function StudyIndex() {
  const [tab, setTab] = useState<Tab>("survey");
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(loadProgress().done), []);

  return (
    <AppShell>
      {(profile) => {
        const band = bandOf(profile.selfAssessment);
        const mine = new Set(activeSurveyTopics(profile.survey));
        const counts = topicCounts(band);

        const items = counts
          .filter(({ topic }) => {
            if (tab === "roleplay") return Boolean(topic.roleplay);
            if (tab === "survey") return topic.source === "survey";
            return topic.source === "adhoc";
          })
          .map(({ topic, count }) => {
            const ids = ALL_QUESTIONS.filter(
              (q) => q.topicId === topic.id && q.band === band &&
                (tab === "roleplay" ? q.fn.startsWith("rp_") : true),
            ).map((q) => q.id);
            const doneCount = ids.filter((id) => done.includes(id)).length;
            return { topic, count: tab === "roleplay" ? ids.length : count, doneCount };
          })
          .sort((a, b) => {
            if (tab === "survey") {
              const am = mine.has(a.topic.id) ? 0 : 1;
              const bm = mine.has(b.topic.id) ? 0 : 1;
              if (am !== bm) return am - bm;
            }
            return a.topic.ko.localeCompare(b.topic.ko, "ko");
          });

        return (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">유형별 학습</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              난이도 밴드 <strong className="text-dku-700">{band}</strong> · 목표 등급{" "}
              <strong className="text-dku-700">{profile.targetGrade}</strong> 기준으로 문항이 표시됩니다.
            </p>

            <div className="mt-6 flex gap-1 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    tab === t.key
                      ? "border-dku-600 text-dku-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-slate-500">
              {TABS.find((t) => t.key === tab)?.hint}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ topic, count, doneCount }) => (
                <Link
                  key={topic.id}
                  href={`/study/${topic.id}?mode=${tab}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-dku-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-extrabold text-slate-900">{topic.ko}</span>
                    <span className="shrink-0 text-xs font-bold text-slate-400">({count})</span>
                  </div>
                  {tab === "survey" && mine.has(topic.id) && (
                    <span className="mt-1.5 inline-block rounded bg-dku-50 px-1.5 py-0.5 text-[10px] font-extrabold text-dku-700">
                      내 설문 선택
                    </span>
                  )}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-dku-500"
                      style={{ width: `${count ? (doneCount / count) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {doneCount} / {count} 완료
                  </p>
                </Link>
              ))}
            </div>
          </>
        );
      }}
    </AppShell>
  );
}
