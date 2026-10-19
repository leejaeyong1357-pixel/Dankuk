"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { activeModel, activeProvider } from "@/lib/ai-provider";
import {
  ADMIN_ID,
  adminCreateAccount,
  adminSetPassword,
  allAccounts,
  isAdmin,
  removeAccount,
} from "@/lib/account";
import { scenarioById } from "@/lib/global/content";
import { allSessions } from "@/lib/global/store";
import { loadResults } from "@/lib/exam/session";
import { apiGet } from "@/lib/remote";
import { clearUsage, usageSummary, type UsageSummary } from "@/lib/usage";
import type { ExamResult } from "@/lib/types";

/**
 * 관리자 화면.
 *
 * 관리자로 로그인해도 학습자와 같은 화면만 보이던 것을 바꿨다.
 * 여기서는 누가 등록했는지, 어디까지 학습했는지, 결과가 어땠는지를 본다.
 *
 * 서버(D1)가 붙어 있으면 전 직원 현황을 본다. 없으면 이 기기에 쌓인 것만
 * 보이며, 화면에도 어느 쪽인지 그대로 적는다.
 * 없는 숫자를 그럴듯하게 만들어 내지 않는다.
 */

/**
 * 한 사람의 현황.
 *
 * 서버가 있으면 숫자 칸이 채워져 오고, 없으면 이 기기의 계정 정보만 들어 있다.
 * 비어 있는 칸은 "0" 이 아니라 "—" 로 둔다 — 0 과 모름은 다르다.
 */
interface Person {
  email: string;
  name: string;
  role?: string;
  targetGrade?: string;
  examDate?: string;
  createdAt: string;
  lastActiveAt?: string;
  /** 아래는 서버가 있을 때만 */
  exams?: number;
  lastGrade?: string;
  lastExamAt?: string;
  globals?: number;
  globalsDone?: number;
  studied?: number;
  /** 로그인 횟수와 마지막 로그인 */
  logins?: number;
  lastLoginAt?: string;
  /** 화면을 연 날 수 / 학습 기록을 올린 날 수 (한국 날짜) */
  visitDays?: number;
  studyDays?: number;
  /** 마지막으로 화면을 연 때 */
  lastSeenAt?: string;
  ai?: { calls: number; inputTokens: number; outputTokens: number; reasoningTokens: number };
}
export default function AdminPage() {
  return <AppShell>{() => <AdminBody />}</AppShell>;
}

type Tab = "people" | "learning" | "ai";

function AdminBody() {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("people");
  const [rows, setRows] = useState<Person[]>([]);
  /** 서버에서 받아 온 전 직원 현황인가 */
  const [server, setServer] = useState(false);

  const refresh = useCallback(async () => {
    const r = await apiGet<{ ok?: boolean; people?: Person[] }>("/api/admin");
    if (r?.ok && r.people) {
      setServer(true);
      setRows(r.people);
      return;
    }
    // 서버가 없거나 답하지 않으면 이 기기에 쌓인 것만 보여 준다
    setServer(false);
    setRows(allAccounts());
  }, []);

  useEffect(() => {
    const admin = isAdmin();
    setOk(admin);
    if (admin) void refresh();
    else router.replace("/dashboard");
  }, [router, refresh]);

  if (ok === null) return <p className="py-20 text-center text-sm text-slate-400">확인 중…</p>;
  if (!ok) return null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-bold tracking-[0.16em] text-dku-500">ADMIN</p>
          <h1 className="hero-headline mt-1.5 text-[28px] text-slate-900">관리자 화면</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            등록자와 학습 현황을 봅니다. 학습자 화면으로는 위 메뉴에서 돌아갑니다.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-bold text-slate-600 transition hover:bg-slate-50"
        >
          학습자 화면으로 →
        </Link>
      </div>

      {server ? (
        <p className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-[13px] leading-relaxed text-emerald-900">
          서버 저장소에 연결되어 <strong className="font-bold">전 직원 현황</strong>을 보고 있습니다.
          어느 PC에서 학습했든 계정 기준으로 합쳐집니다.
        </p>
      ) : (
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
          서버 저장소가 연결되지 않아 <strong className="font-bold">이 기기에 쌓인 기록만</strong>{" "}
          보입니다. 다른 PC에서 학습한 내용은 여기에 나오지 않습니다. Cloudflare Pages 설정에서
          D1 을 <code className="rounded bg-amber-100 px-1">DB</code> 라는 이름으로 붙이면 전 직원
          현황이 한곳에 모입니다.
        </p>
      )}

      <nav className="mt-6 flex gap-1 border-b border-slate-200">
        {(
          [
            ["people", "등록자"],
            ["learning", "학습 현황"],
            ["ai", "AI · 비용"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[15px] font-bold transition ${
              tab === k
                ? "border-dku-600 text-dku-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "people" && <People rows={rows} server={server} onChange={refresh} />}
      {tab === "learning" && <Learning rows={rows} server={server} />}
      {tab === "ai" && <AiTab rows={rows} server={server} />}
    </>
  );
}

// ── 등록자 ───────────────────────────────────────────────
function People({
  rows,
  server,
  onChange,
}: {
  rows: Person[];
  server: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setMsg(null);
    const r = await adminCreateAccount(form);
    if (!r.ok) { setMsg(r.error); return; }
    setForm({ email: "", name: "", password: "" });
    setAdding(false);
    onChange();
  }

  async function setPassword(email: string) {
    const err = await adminSetPassword(email, pw);
    setMsg(err ?? `${email} 비밀번호를 바꿨습니다.`);
    if (!err) { setPwFor(null); setPw(""); onChange(); }
  }

  async function drop(email: string) {
    const where = server
      ? "서버에서 지웁니다. 그동안의 학습 기록도 함께 사라지며 되돌릴 수 없습니다."
      : "이 기기에서 지웁니다.";
    if (!confirm(`${email} 등록을 ${where}\n계속할까요?`)) return;
    const err = await removeAccount(email);
    if (err) { setMsg(err); return; }
    onChange();
  }

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[19px] font-bold text-slate-900">등록자 {rows.length}명</p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
        >
          {adding ? "닫기" : "＋ 계정 만들기"}
        </button>
      </div>

      {msg && (
        <p className="mt-3 rounded-xl border-l-4 border-dku-500 bg-dku-50 px-4 py-3 text-[14px] font-semibold text-dku-800">
          {msg}
        </p>
      )}

      {adding && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input label="아이디(이메일)" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="이름" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="비밀번호(6자 이상)" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
          <button
            type="button"
            onClick={create}
            className="self-end rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
          >
            만들기
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[13px] font-bold text-slate-500">
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">아이디</th>
              <th className="px-4 py-3">목표 · 시험일</th>
              <th className="px-4 py-3">등록일</th>
              {server && <th className="px-4 py-3">학습</th>}
              <th className="px-4 py-3">최근 학습</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.email} className="border-t border-slate-200 align-top">
                <td className="px-4 py-3.5 text-[15px] font-bold text-slate-900">
                  {a.name}
                  {(a.role === "admin" || a.email === ADMIN_ID) && (
                    <span className="ml-2 rounded bg-dku-100 px-1.5 py-0.5 text-[11px] font-bold text-dku-700">
                      관리자
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-[14px] text-slate-600">{a.email}</td>
                <td className="px-4 py-3.5 text-[14px] text-slate-600">
                  {a.targetGrade ? `${a.targetGrade} · ${a.examDate ?? "-"}` : "설정 전"}
                </td>
                <td className="px-4 py-3.5 text-[14px] text-slate-500">{fmt(a.createdAt)}</td>
                {server && (
                  <td className="px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">
                    문항 {a.studied ?? 0} · 모의고사 {a.exams ?? 0}회 · 글로벌 {a.globalsDone ?? 0}회
                    <br />
                    <span className="text-slate-400">
                      로그인 {a.logins ?? 0}회 · 학습한 날 {a.studyDays ?? 0}일 · 마지막 접속 {fmtTime(a.lastSeenAt ?? a.lastLoginAt)}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3.5 text-[14px] text-slate-500">{fmt(a.lastActiveAt)}</td>
                <td className="px-4 py-3.5">
                  {pwFor === a.email ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <input
                        type="password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="새 비밀번호"
                        className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={() => setPassword(a.email)}
                        className="rounded-lg bg-dku-600 px-3 py-1.5 text-[12px] font-bold text-white"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPwFor(null); setPw(""); }}
                        className="text-[12px] text-slate-400"
                      >
                        취소
                      </button>
                    </span>
                  ) : (
                    <span className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => { setPwFor(a.email); setPw(""); setMsg(null); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        비밀번호 변경
                      </button>
                      {a.role !== "admin" && a.email !== ADMIN_ID && (
                        <button
                          type="button"
                          onClick={() => drop(a.email)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-red-600 transition hover:bg-red-50"
                        >
                          삭제
                        </button>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
        비밀번호는 해시로만 저장됩니다. 관리자도 원문을 볼 수 없고, 새로 지정만 할 수 있습니다.
        {server && " 비밀번호를 바꾸면 그 사람이 쓰던 로그인은 모두 끊깁니다."}
      </p>
    </section>
  );
}

// ── 학습 현황 ────────────────────────────────────────────
function Learning({ rows, server }: { rows: Person[]; server: boolean }) {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [globals, setGlobals] = useState<ReturnType<typeof allSessions>>([]);

  useEffect(() => {
    setExams(loadResults());
    setGlobals(allSessions());
  }, []);

  const doneGlobals = globals.filter((g) => g.doneAt);
  const sum = (pick: (p: Person) => number | undefined) =>
    rows.reduce((n, p) => n + (pick(p) ?? 0), 0);

  return (
    <section className="mt-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="등록자" value={`${rows.length}명`} />
        <Stat
          label={server ? "모의고사 응시(전체)" : "모의고사 응시(이 기기)"}
          value={`${server ? sum((p) => p.exams) : exams.length}회`}
        />
        <Stat
          label={server ? "글로벌 연습(전체)" : "글로벌 연습(이 기기)"}
          value={`${server ? sum((p) => p.globalsDone) : doneGlobals.length}회`}
        />
        <Stat
          label="최근 학습"
          value={fmt(
            [...rows.map((r) => r.lastActiveAt).filter(Boolean)].sort().slice(-1)[0] as string | undefined,
          )}
        />
      </div>

      {server && (
        <>
          <p className="mt-7 text-[19px] font-bold text-slate-900">사람별 진도</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[13px] font-bold text-slate-500">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">목표</th>
                  <th className="px-4 py-3">접속</th>
                  <th className="px-4 py-3">학습 문항</th>
                  <th className="px-4 py-3">모의고사</th>
                  <th className="px-4 py-3">최근 예상 등급</th>
                  <th className="px-4 py-3">글로벌 연습</th>
                  <th className="px-4 py-3">최근 학습</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.email} className="border-t border-slate-200">
                    <td className="px-4 py-3.5 text-[15px] font-bold text-slate-900">
                      {p.name}
                      <br />
                      <span className="text-[13px] font-normal text-slate-400">{p.email}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-slate-600">{p.targetGrade ?? "—"}</td>
                    <td className="px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">
                      로그인 {p.logins ?? 0}회 · 학습한 날 {p.studyDays ?? 0}일
                      <br />
                      <span className="text-slate-400">마지막 접속 {fmtTime(p.lastSeenAt ?? p.lastLoginAt)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-slate-600">{p.studied ?? 0}</td>
                    <td className="px-4 py-3.5 text-[14px] text-slate-600">{p.exams ?? 0}회</td>
                    <td className="px-4 py-3.5 text-[15px] font-bold text-dku-700">
                      {p.lastGrade ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-slate-600">
                      {p.globalsDone ?? 0}회
                      {(p.globals ?? 0) > (p.globalsDone ?? 0) && (
                        <span className="text-slate-400"> (진행 중 {(p.globals ?? 0) - (p.globalsDone ?? 0)})</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-slate-500">{fmt(p.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-slate-400">
            아래 두 표는 지금 이 기기에 남아 있는 상세 기록입니다. 사람별 합계는 위 표를 보세요.
          </p>
        </>
      )}

      <p className="mt-7 text-[19px] font-bold text-slate-900">
        모의고사 결과{server && <span className="text-slate-400"> (이 기기)</span>}
      </p>
      {exams.length === 0 ? (
        <p className="mt-2 text-[15px] text-slate-400">이 기기에 응시 기록이 없습니다.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[13px] font-bold text-slate-500">
                <th className="px-4 py-3">응시일</th>
                <th className="px-4 py-3">예상 등급</th>
                <th className="px-4 py-3">목표</th>
                <th className="px-4 py-3">문항</th>
                <th className="px-4 py-3">소요</th>
                <th className="px-4 py-3">채점</th>
              </tr>
            </thead>
            <tbody>
              {[...exams].reverse().map((r) => (
                <tr key={r.examId} className="border-t border-slate-200">
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">{r.takenAt.slice(0, 10)}</td>
                  <td className="px-4 py-3.5 text-[15px] font-bold text-dku-700">{r.grade.grade}</td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">{r.targetGrade}</td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">{r.answers.length}문항</td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">
                    {Math.floor(r.elapsedSec / 60)}분
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-slate-500">
                    {r.provider === "failed" ? "실패(지표)" : r.provider === "metrics" ? "지표" : r.provider}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-7 text-[19px] font-bold text-slate-900">
        글로벌 연습 기록{server && <span className="text-slate-400"> (이 기기)</span>}
      </p>
      {doneGlobals.length === 0 ? (
        <p className="mt-2 text-[15px] text-slate-400">이 기기에 연습 기록이 없습니다.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[13px] font-bold text-slate-500">
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">상황</th>
                <th className="px-4 py-3">국가 · 언어</th>
                <th className="px-4 py-3">발화</th>
                <th className="px-4 py-3">코칭</th>
              </tr>
            </thead>
            <tbody>
              {[...doneGlobals].reverse().map((g) => (
                <tr key={g.id} className="border-t border-slate-200">
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">{g.doneAt?.slice(0, 10)}</td>
                  <td className="px-4 py-3.5 text-[15px] font-bold text-slate-900">
                    {scenarioById(g.scenarioId)?.title ?? (g.script ? `스크립트 · ${g.script.title}` : g.scenarioId)}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">
                    {g.country} · {g.lang}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">
                    {g.turns.filter((t) => t.role === "user").length}회
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-slate-500">
                    {g.coaching ? "받음" : "없음"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── AI · 비용 ────────────────────────────────────────────
function AiTab({ rows, server }: { rows: Person[]; server: boolean }) {
  const [provider, setProvider] = useState<string | null>(null);
  const [u, setU] = useState<UsageSummary | null>(null);

  useEffect(() => {
    setProvider(activeProvider());
    setU(usageSummary());
  }, []);

  if (!provider || !u) return null;
  const on = provider !== "metrics";
  const n = (v: number) => v.toLocaleString("ko-KR");

  /** 서버가 있으면 전 직원 합계도 함께 보여 준다 */
  const all = rows.reduce(
    (acc, p) => ({
      calls: acc.calls + (p.ai?.calls ?? 0),
      inputTokens: acc.inputTokens + (p.ai?.inputTokens ?? 0),
      outputTokens: acc.outputTokens + (p.ai?.outputTokens ?? 0),
      reasoningTokens: acc.reasoningTokens + (p.ai?.reasoningTokens ?? 0),
    }),
    { calls: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
  );

  return (
    <section className="mt-6">
      <p
        className={`rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed ${
          on ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <strong className="font-bold">AI 채점 {on ? "켜짐" : "꺼짐"}</strong>{" "}
        {on
          ? `— ${provider === "openai" ? "OpenAI" : "Claude"} · ${activeModel()} 로 채점합니다.`
          : "— 이 빌드에 키가 들어 있지 않아 지표 기반으로만 채점합니다. 배포판 환경변수에 NEXT_PUBLIC_ANTHROPIC_API_KEY 를 넣은 뒤 다시 빌드해야 반영됩니다."}
      </p>

      {server && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <p className="flex flex-wrap items-center gap-2">
            <strong className="text-[17px] font-bold text-slate-900">전 직원 AI 호출</strong>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[14px] font-bold text-slate-700">
              {n(all.calls)}회
            </span>
          </p>
          {all.calls === 0 ? (
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
              아직 아무도 부르지 않았습니다 —{" "}
              <strong className="font-bold">요금이 나간 것이 없습니다.</strong>
            </p>
          ) : (
            <>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-3">
                <Row label="입력 토큰" value={n(all.inputTokens)} />
                <Row label="출력 토큰" value={n(all.outputTokens)} />
                <Row label="└ 생각한 토큰" value={n(all.reasoningTokens)} />
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
                많이 부른 순: {[...rows]
                  .filter((p) => (p.ai?.calls ?? 0) > 0)
                  .sort((a, b) => (b.ai?.calls ?? 0) - (a.ai?.calls ?? 0))
                  .slice(0, 5)
                  .map((p) => `${p.name} ${n(p.ai?.calls ?? 0)}회`)
                  .join(" · ")}
                <br />
                실제 청구액은 제공사 대시보드의 Usage 를 보셔야 합니다 — 이것은 참고용 사본입니다.
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-5">
        <p className="flex flex-wrap items-center gap-2">
          <strong className="text-[17px] font-bold text-slate-900">이 브라우저에서 부른 AI 호출</strong>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[14px] font-bold text-slate-700">
            {n(u.calls)}회
          </span>
          {u.calls > 0 && (
            <button
              type="button"
              onClick={() => { clearUsage(); setU(usageSummary()); }}
              className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50"
            >
              기록 지우기
            </button>
          )}
        </p>

        {u.calls === 0 ? (
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
            아직 한 번도 부르지 않았습니다 — <strong className="font-bold">요금이 나간 것이 없습니다.</strong>
          </p>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-3">
              <Row label="입력 토큰" value={n(u.inputTokens)} />
              <Row label="출력 토큰" value={n(u.outputTokens)} />
              <Row label="└ 생각한 토큰" value={n(u.reasoningTokens)} />
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
              모델 {u.models.join(", ")} · 마지막 호출{" "}
              {u.lastAt ? new Date(u.lastAt).toLocaleString("ko-KR") : "-"}
              <br />
              이 기록은 이 브라우저에만 쌓입니다. 실제 청구액은 제공사 대시보드의 Usage 를 보셔야 합니다.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

// ── 부품 ─────────────────────────────────────────────────
function Input({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition focus:border-dku-500"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className="mt-1.5 text-[24px] font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-bold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

/** 날짜와 시각 — "누가 언제 들어왔는가" 를 볼 때 */
function fmtTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
