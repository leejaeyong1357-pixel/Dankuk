"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LEVEL_DESCRIPTION } from "@/components/LevelPicker";
import { CATEGORY_KO, CATEGORY_ORDER, CategoryIcon, GridIcon } from "@/components/study/TopicIcons";
import { selectedSurveyTopics } from "@/lib/exam/survey";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/exam/question-types";
import { loadProfile, loadProgress } from "@/lib/store";
import { fetchPracticeTopics } from "@/lib/sync";

type Tab = "survey" | "unexpected" | "roleplay";
type Sort = "default" | "count" | "name";

const TABS: { key: Tab; label: string; title: string; hint: string }[] = [
  { key: "survey", label: "설문 주제", title: "설문 주제", hint: "Background Survey에서 선택하는 주제입니다." },
  { key: "unexpected", label: "돌발 주제", title: "돌발 주제", hint: "설문과 관계없이 출제되는 주제입니다." },
  { key: "roleplay", label: "롤플레이", title: "롤플레이", hint: "질문하기 → 문제 상황 → 유사 경험 3문항 세트입니다." },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: "default", label: "기본순" },
  { key: "count", label: "문항 많은 순" },
  { key: "name", label: "이름순" },
];

const PER_PAGE = 9;

function toLevel(raw: string | null): DifficultyLevel | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? (n as DifficultyLevel) : null;
}

/** 유형별 AI 연습 — 실전 모드와 달리 문항 원문·사전·AI 첨삭을 모두 제공한다 */
export default function StudyIndexPage() {
  return (
    <Suspense fallback={null}>
      <StudyIndex />
    </Suspense>
  );
}

function StudyIndex() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("survey");
  const [category, setCategory] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("default");
  const [page, setPage] = useState(1);
  const [done, setDone] = useState<string[]>([]);
  const [level, setLevel] = useState<DifficultyLevel | null>(toLevel(params.get("level")));
  const [catalog, setCatalog] = useState<{
    topics: { topic: string; topicKo: string; category: string; count: number }[];
    roleplayTopics: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => setDone(loadProgress().done), []);

  // 문항 뱅크는 화면 밖에 있다. 난이도가 바뀌면 목록을 다시 받아온다.
  const effectiveLevel = level ?? loadProfile()?.lastDifficulty ?? 3;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPracticeTopics(effectiveLevel).then((res) => {
      if (cancelled) return;
      if (res) setCatalog({ topics: res.topics, roleplayTopics: res.roleplayTopics });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [effectiveLevel]);

  // 탭·카테고리·검색이 바뀌면 첫 쪽으로 돌아간다
  useEffect(() => { setPage(1); }, [tab, category, query, sort, effectiveLevel]);

  return (
    <AppShell>
      {(profile) => {
        const lv: DifficultyLevel = level ?? profile.lastDifficulty ?? 3;
        const mine = new Set(profile.lastSurvey ? selectedSurveyTopics(profile.lastSurvey) : []);
        const roleplay = new Set(catalog?.roleplayTopics ?? []);
        const all = catalog?.topics ?? [];

        const inTab = all.filter((t) => {
          if (tab === "roleplay") return roleplay.has(t.topic);
          if (tab === "survey") return t.category !== "UNEXPECTED";
          return t.category === "UNEXPECTED";
        });

        // 사이드바는 지금 탭에 실제로 있는 카테고리만 세운다
        const counts = new Map<string, number>();
        for (const t of inTab) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
        const cats = CATEGORY_ORDER.filter((c) => counts.has(c));

        const q = query.trim().toLowerCase();
        const items = inTab
          .filter((t) => category === "ALL" || t.category === category)
          .filter((t) => !q || t.topicKo.toLowerCase().includes(q) || t.topic.toLowerCase().includes(q))
          .sort((a, b) => {
            if (sort === "count") return b.count - a.count;
            if (sort === "name") return a.topicKo.localeCompare(b.topicKo, "ko");
            // 기본순 — 내 설문에서 고른 주제를 먼저
            const am = mine.has(a.topic) ? 0 : 1;
            const bm = mine.has(b.topic) ? 0 : 1;
            if (am !== bm) return am - bm;
            return a.topicKo.localeCompare(b.topicKo, "ko");
          });

        const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
        const shown = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        const meta = TABS.find((t) => t.key === tab)!;

        return (
          <>
            <nav className="text-xs font-semibold text-slate-400">
              <Link href="/dashboard" className="hover:text-slate-600">홈</Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-600">유형별 연습</span>
            </nav>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="hero-headline text-3xl text-slate-900 sm:text-4xl">유형별 AI 연습</h1>
              <span className="rounded-full border-2 border-dku-600 px-3.5 py-1.5 text-sm font-extrabold text-dku-700">
                목표 등급 {profile.targetGrade}
              </span>
            </div>
            <p className="mt-2 text-slate-500">주제별로 연습하고, AI 피드백으로 답변을 완성하세요.</p>

            {/* 난이도 */}
            <section className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl bg-dku-50 px-5 py-5 sm:px-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-dku-600 shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
                  <circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900">나에게 맞는 난이도</p>
                <p className="mt-0.5 text-sm text-slate-500">난이도를 선택하고 연습을 시작하세요.</p>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-slate-500">난이도</span>
                <div className="flex gap-2">
                  {DIFFICULTY_LEVELS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLevel(n)}
                      aria-pressed={n === lv}
                      className={`h-10 w-10 rounded-lg text-sm font-extrabold transition ${
                        n === lv
                          ? "bg-dku-700 text-white shadow-sm"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-dku-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="hidden h-6 w-px bg-dku-200 lg:block" />
                <span className="text-sm font-bold text-dku-700">
                  {lv}단계 · {LEVEL_DESCRIPTION[lv].summary}
                </span>
              </div>
            </section>

            {/* 탭 */}
            <div className="mt-7 flex gap-2 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setTab(t.key); setCategory("ALL"); }}
                  className={`-mb-px border-b-[3px] px-5 py-3 text-[15px] font-bold transition ${
                    tab === t.key
                      ? "border-dku-600 text-dku-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[232px_1fr]">
              {/* 카테고리 */}
              <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
                <p className="px-2 pb-3 text-base font-extrabold text-slate-900">주제 카테고리</p>
                <ul className="space-y-1">
                  <li>
                    <CatButton
                      active={category === "ALL"}
                      onClick={() => setCategory("ALL")}
                      icon={<GridIcon />}
                      label="전체 주제"
                    />
                  </li>
                  {cats.map((c) => (
                    <li key={c}>
                      <CatButton
                        active={category === c}
                        onClick={() => setCategory(c)}
                        icon={<CategoryIcon category={c} />}
                        label={CATEGORY_KO[c] ?? c}
                      />
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="min-w-0">
                {/* 검색과 정렬 */}
                <div className="flex flex-wrap gap-3">
                  <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
                    </svg>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="연습할 주제를 검색하세요."
                      className="min-w-0 flex-1 text-sm outline-none placeholder:text-slate-400"
                    />
                  </label>

                  <label className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M7 4v16M7 4L4 7M7 4l3 3M17 20V4M17 20l3-3M17 20l-3-3" />
                    </svg>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as Sort)}
                      className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    >
                      {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <h2 className="mt-7 text-xl font-extrabold text-slate-900">{meta.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{meta.hint}</p>

                {loading ? (
                  <p className="mt-6 text-sm text-slate-400">문항을 불러오는 중…</p>
                ) : shown.length === 0 ? (
                  <p className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">
                    조건에 맞는 주제가 없습니다.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {shown.map((t) => (
                      <TopicCard
                        key={t.topic}
                        topic={t}
                        level={lv}
                        tab={tab}
                        mine={mine.has(t.topic)}
                        doneCount={done.filter((id) => id.startsWith(`${t.topic}-`)).length}
                      />
                    ))}
                  </div>
                )}

                {pages > 1 && (
                  <Pagination page={page} pages={pages} onChange={setPage} />
                )}
              </div>
            </div>
          </>
        );
      }}
    </AppShell>
  );
}

function CatButton({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
        active ? "bg-dku-50 text-dku-700" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span className={active ? "text-dku-600" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function TopicCard({
  topic, level, tab, mine, doneCount,
}: {
  topic: { topic: string; topicKo: string; category: string; count: number };
  level: DifficultyLevel;
  tab: Tab;
  mine: boolean;
  doneCount: number;
}) {
  const pct = topic.count ? Math.round((doneCount / topic.count) * 100) : 0;
  return (
    <Link
      href={`/study/${topic.topic}?level=${level}&mode=${tab}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-dku-500 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dku-50 text-dku-600">
          <CategoryIcon category={topic.category} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400">
            {CATEGORY_KO[topic.category] ?? topic.category}
            {mine && <span className="ml-1.5 text-dku-600">· 내 설문</span>}
          </p>
          <p className="mt-0.5 truncate text-lg font-extrabold text-slate-900">{topic.topicKo}</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-sm font-semibold text-slate-500">{topic.count}문항</span>
        <span className="text-xs font-bold text-slate-400">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-dku-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{doneCount} / {topic.count} 완료</span>
        <span className="text-sm font-bold text-dku-600 group-hover:text-dku-800">
          연습 시작 <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

function Pagination({
  page, pages, onChange,
}: {
  page: number; pages: number; onChange: (p: number) => void;
}) {
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="쪽 이동">
      {Array.from({ length: pages }).map((_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`h-9 w-9 rounded-lg text-sm font-bold transition ${
              n === page ? "bg-dku-700 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-dku-300"
            }`}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="다음 쪽"
        className="h-9 w-9 rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition hover:ring-dku-300 disabled:text-slate-300"
      >
        ›
      </button>
    </nav>
  );
}
