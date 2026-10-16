"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { activeModel, activeProvider } from "@/lib/ai-provider";
import {
  ADMIN_ID,
  adminCreateAccount,
  adminSetPassword,
  allAccounts,
  isAdmin,
  removeAccount,
  updateAccount,
  type Account,
} from "@/lib/account";
import { scenarioById } from "@/lib/global/content";
import { allSessions } from "@/lib/global/store";
import { loadResults } from "@/lib/exam/session";
import { clearUsage, usageSummary, type UsageSummary } from "@/lib/usage";
import type { ExamResult } from "@/lib/types";

/**
 * 관리자 화면.
 *
 * 관리자로 로그인해도 학습자와 같은 화면만 보이던 것을 바꿨다.
 * 여기서는 누가 등록했는지, 어디까지 학습했는지, 결과가 어땠는지를 본다.
 *
 * 서버가 없는 정적 배포라, 보이는 것은 **이 기기에 쌓인 기록**뿐이다.
 * 전 직원 현황을 한곳에서 보려면 서버(DB)가 있어야 한다 — 화면에도 그렇게 적어 둔다.
 * 없는 숫자를 그럴듯하게 만들어 내지 않는다.
 */
export default function AdminPage() {
  return <AppShell>{() => <AdminBody />}</AppShell>;
}

type Tab = "people" | "learning" | "ai";

function AdminBody() {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("people");
  const [rows, setRows] = useState<Account[]>([]);

  useEffect(() => {
    const admin = isAdmin();
    setOk(admin);
    if (admin) setRows(allAccounts());
    else router.replace("/dashboard");
  }, [router]);

  if (ok === null) return <p className="py-20 text-center text-sm text-slate-400">확인 중…</p>;
  if (!ok) return null;

  const refresh = () => setRows(allAccounts());

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

      <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
        서버가 없는 배포라 <strong className="font-bold">이 기기에 쌓인 기록만</strong> 보입니다.
        다른 PC에서 학습한 내용은 여기에 나오지 않습니다. 전 직원 현황을 한곳에서 보려면
        서버(DB)를 붙여야 합니다.
      </p>

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

      {tab === "people" && <People rows={rows} onChange={refresh} />}
      {tab === "learning" && <Learning rows={rows} />}
      {tab === "ai" && <AiTab />}
    </>
  );
}

// ── 등록자 ───────────────────────────────────────────────
function People({ rows, onChange }: { rows: Account[]; onChange: () => void }) {
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

  function drop(email: string) {
    if (!confirm(`${email} 등록을 이 기기에서 지웁니다. 계속할까요?`)) return;
    removeAccount(email);
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
              <th className="px-4 py-3">최근 학습</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.email} className="border-t border-slate-200 align-top">
                <td className="px-4 py-3.5 text-[15px] font-bold text-slate-900">
                  {a.name}
                  {a.email === ADMIN_ID && (
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
                      {a.email !== ADMIN_ID && (
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
      </p>
    </section>
  );
}

// ── 학습 현황 ────────────────────────────────────────────
function Learning({ rows }: { rows: Account[] }) {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [globals, setGlobals] = useState<ReturnType<typeof allSessions>>([]);

  useEffect(() => {
    setExams(loadResults());
    setGlobals(allSessions());
  }, []);

  const doneGlobals = globals.filter((g) => g.doneAt);

  return (
    <section className="mt-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="등록자" value={`${rows.length}명`} />
        <Stat label="모의고사 응시" value={`${exams.length}회`} />
        <Stat label="글로벌 연습" value={`${doneGlobals.length}회`} />
        <Stat
          label="최근 학습"
          value={fmt(
            [...rows.map((r) => r.lastActiveAt).filter(Boolean)].sort().slice(-1)[0] as string | undefined,
          )}
        />
      </div>

      <p className="mt-7 text-[19px] font-bold text-slate-900">모의고사 결과</p>
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

      <p className="mt-7 text-[19px] font-bold text-slate-900">글로벌 연습 기록</p>
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
                    {scenarioById(g.scenarioId)?.title ?? g.scenarioId}
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
function AiTab() {
  const [provider, setProvider] = useState<string | null>(null);
  const [u, setU] = useState<UsageSummary | null>(null);

  useEffect(() => {
    setProvider(activeProvider());
    setU(usageSummary());
  }, []);

  if (!provider || !u) return null;
  const on = provider !== "metrics";
  const n = (v: number) => v.toLocaleString("ko-KR");

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

function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
