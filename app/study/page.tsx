"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LevelChips } from "@/components/LevelPicker";
import { practiceTopics, TESTLETS } from "@/lib/exam/repository";
import { selectedSurveyTopics } from "@/lib/exam/survey";
import type { DifficultyLevel } from "@/lib/exam/question-types";
import { loadProgress } from "@/lib/store";

type Tab = "survey" | "unexpected" | "roleplay";

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: "survey", label: "설문 주제", hint: "Background Survey 에서 고를 수 있는 주제" },
  { key: "unexpected", label: "돌발 주제", hint: "설문과 무관하게 출제되는 주제" },
  { key: "roleplay", label: "롤플레이", hint: "질문하기 → 문제 상황 → 유사 경험 3문항 세트" },
];

/** 문제별 AI 연습 — 실전 모드와 달리 문항 텍스트·사전·AI 첨삭을 모두 제공한다 */
export default function StudyIndex() {
  const [tab, setTab] = useState<Tab>("survey");
  const [done, setDone] = useState<string[]>([]);
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  useEffect(() => setDone(loadProgress().done), []);

  return (
    <AppShell>
      {(profile) => {
        const lv: DifficultyLevel = level ?? profile.lastDifficulty ?? 3;
        const mine = new Set(
          profile.lastSurvey ? selectedSurveyTopics(profile.lastSurvey) : [],
        );
        const roleplayTopics = new Set(
          TESTLETS.filter((t) => t.isRoleplay && lv >= t.minDifficulty && lv <= t.maxDifficulty)
            .map((t) => t.topic),
        );

        const items = practiceTopics(lv)
          .filter((t) => {
            if (tab === "roleplay") return roleplayTopics.has(t.topic);
            if (tab === "survey") return t.category !== "UNEXPECTED";
            return t.category === "UNEXPECTED";
          })
          .sort((a, b) => {
            if (tab === "survey") {
              const am = mine.has(a.topic) ? 0 : 1;
              const bm = mine.has(b.topic) ? 0 : 1;
              if (am !== bm) return am - bm;
            }
            return a.topicKo.localeCompare(b.topicKo, "ko");
          });

        return (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">문제별 AI 연습</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              실전 모의고사와 달리 여기서는 문항 원문·사전·AI 첨삭이 모두 제공됩니다.
              목표 등급 <strong className="text-dku-700">{profile.targetGrade}</strong> 기준으로 피드백이 맞춰집니다.
            </p>

            <div className="mt-4">
              <LevelChips value={lv} onChange={setLevel} />
            </div>

            <div className="mt-6 flex gap-1 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    tab === t.key ? "border-dku-600 text-dku-700" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-slate-500">{TABS.find((t) => t.key === tab)?.hint}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => {
                const doneCount = 0; // 상세 화면에서 문항 단위로 집계한다
                return (
                  <Link
                    key={t.topic}
                    href={`/study/${t.topic}?level=${lv}&mode=${tab}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-dku-300 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base font-extrabold text-slate-900">{t.topicKo}</span>
                      <span className="shrink-0 text-xs font-bold text-slate-400">({t.count})</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        {t.category}
                      </span>
                      {mine.has(t.topic) && (
                        <span className="rounded bg-dku-50 px-1.5 py-0.5 text-[10px] font-extrabold text-dku-700">
                          내 설문 선택
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400">
                      {done.filter((id) => id.startsWith(`${t.topic}-`)).length + doneCount} / {t.count} 완료
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        );
      }}
    </AppShell>
  );
}
