"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { describeAiError } from "@/lib/ai-provider";
import { playPrompt, stopAudio } from "@/lib/audio";
import { aiReady } from "@/lib/global/ai";
import { COUNTRIES } from "@/lib/global/content";
import { createSession, loadPref, saveExpression } from "@/lib/global/store";
import type { Script } from "@/lib/global/script-ai";

/**
 * 내 미팅에 맞춘 스크립트.
 *
 * 범용 예문은 실제 회의에서 쓰이지 않는다. 이름·직급·회의 목적을 받아
 * 그 회의에서 그대로 읽을 수 있는 말을 만든다.
 *
 * 확정되지 않은 날짜·수량은 지어내지 않고 [납기일] 같은 자리표시자로 남긴다.
 * 실제 회의 내용과 생성된 예시를 섞으면 업무에 그대로 사고가 난다.
 */


export default function ScriptPage() {
  return <AppShell>{() => <ScriptBody />}</AppShell>;
}

function ScriptBody() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    title: "",
    team: "",
    counterpart: "PL",
    purpose: "",
    musts: "",
    level: "보통",
  });
  const [script, setScript] = useState<Script | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stopAudio(), []);

  async function make() {
    setError(null);
    if (!form.name.trim() || !form.purpose.trim()) {
      setError("이름과 회의 목적은 입력해 주세요. 빈 값은 추측하지 않습니다.");
      return;
    }
    if (!aiReady()) {
      setError("AI 연결이 없어 스크립트를 만들 수 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const { generateScript } = await import("@/lib/global/script-ai");
      setScript(await generateScript(form));
    } catch (e) {
      setError(describeAiError(e));
    } finally {
      setBusy(false);
    }
  }

  function rehearse() {
    if (!script) return;
    const pref = loadPref();
    const ctx = [
      `발표자: ${form.name} (${form.title || "직급 미입력"}, ${form.team || "부서 미입력"})`,
      `회의 목적: ${form.purpose}`,
      form.musts ? `꼭 전달할 내용: ${form.musts}` : "",
      `오프닝: ${script.opening.map((l) => l.en).join(" ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    const s = createSession({ scenarioId: "m-opening", pref, scriptContext: ctx });
    router.push(`/global/practice/?s=${s.id}`);
  }

  return (
    <>
      <div className="min-w-0">
        <Link href="/global/" className="text-[13px] font-bold text-dku-600">
          ← 오늘의 글로벌
        </Link>
        <h1 className="hero-headline mt-1.5 text-[28px] text-slate-900">내 미팅에 맞춘 스크립트</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          이름, 직급, 회의 목적을 알려주시면 그 회의에서 그대로 쓸 말을 만들어 드립니다.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(320px,38%)_1fr]">
        {/* 입력 */}
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6">
          <Field label="이름" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="박지원" />
          <Field label="직급" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="팀장" />
          <Field label="부서 · 역할" value={form.team} onChange={(v) => setForm({ ...form, team: v })} placeholder="품질팀" />

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[14px] font-bold text-slate-800">상대 국가</span>
            <select
              value={form.counterpart}
              onChange={(e) => setForm({ ...form, counterpart: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px]"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.ko}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="회의 목적"
            value={form.purpose}
            onChange={(v) => setForm({ ...form, purpose: v })}
            placeholder="납기 일정 조정"
          />

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[14px] font-bold text-slate-800">꼭 전달할 내용</span>
            <textarea
              value={form.musts}
              onChange={(e) => setForm({ ...form, musts: e.target.value })}
              rows={3}
              placeholder="2차 물량 2주 지연, 절반은 원래 날짜 출하 가능"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-dku-500"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[14px] font-bold text-slate-800">표현 난이도</span>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px]"
            >
              {["쉽게", "보통", "격식 있게"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={make}
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-dku-600 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {busy ? "만드는 중…" : "스크립트 만들기 →"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
            입력하지 않은 값은 추측하지 않습니다. 확정되지 않은 날짜·수량은
            [납기일] 같은 자리표시자로 남습니다.
          </p>
        </section>

        {/* 결과 */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-6">
          {!script ? (
            <p className="py-16 text-center text-[15px] text-slate-400">
              왼쪽을 채우고 &lsquo;스크립트 만들기&rsquo;를 누르면 여기에 나옵니다.
            </p>
          ) : (
            <>
              <Block title="30초 오프닝" lines={script.opening} scenarioId="m-opening" />
              <Block title="핵심 설명과 요청" lines={script.body} scenarioId="m-agenda" />

              <p className="mt-6 text-[13px] font-bold tracking-wide text-dku-600">예상 질문과 답</p>
              <ul className="mt-2 space-y-3">
                {script.qa.map((x, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 px-4 py-4">
                    <p className="text-[15px] font-bold text-slate-900">Q. {x.q}</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">{x.qKo}</p>
                    <p className="mt-2.5 text-[15px] text-slate-800">A. {x.a}</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">{x.aKo}</p>
                  </li>
                ))}
              </ul>

              <Block title="마무리" lines={script.closing} scenarioId="m-closing" />

              <button
                type="button"
                onClick={rehearse}
                className="mt-6 w-full rounded-xl bg-dku-600 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-700"
              >
                이 스크립트로 연습하기 →
              </button>
              <p className="mt-3 text-[12px] text-slate-400">
                생성된 예시입니다. 실제 회의 내용과 섞이지 않도록 수치와 날짜는 직접 확인해 주세요.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Block({
  title,
  lines,
  scenarioId,
}: {
  title: string;
  lines: { en: string; ko: string }[];
  scenarioId: string;
}) {
  return (
    <>
      <p className="mt-6 text-[13px] font-bold tracking-wide text-dku-600 first:mt-0">{title}</p>
      <ul className="mt-2 space-y-2">
        {lines.map((l, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
            <button
              type="button"
              onClick={() => playPrompt(l.en)}
              aria-label={`${l.en} 듣기`}
              className="shrink-0 rounded-lg bg-dku-50 p-2 text-dku-600 transition hover:bg-dku-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 9v6h4l5 4V5L8 9z" />
                <path d="M16.5 8.5a5 5 0 010 7" />
              </svg>
            </button>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-slate-900">{l.en}</span>
              <span className="mt-0.5 block text-[13px] text-slate-500">{l.ko}</span>
            </span>
            <button
              type="button"
              onClick={() => saveExpression({ en: l.en, ko: l.ko, scenarioId, lang: "en" })}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50"
            >
              담기
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-1.5 block text-[14px] font-bold text-slate-800">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-300 focus:border-dku-500"
      />
    </label>
  );
}
