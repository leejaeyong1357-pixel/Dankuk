"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { describeAiError } from "@/lib/ai-provider";
import { playPrompt, stopAudio } from "@/lib/audio";
import { aiReady } from "@/lib/global/ai";
import { COUNTRIES } from "@/lib/global/content";
import { saveExpression } from "@/lib/global/store";
import type { Script, ScriptInput } from "@/lib/global/script-ai";
import {
  defaultName,
  getTemplate,
  saveTemplate,
  startScriptPractice,
  type ScriptTemplate,
} from "@/lib/global/templates";

/**
 * 내 미팅에 맞춘 스크립트.
 *
 * 범용 예문은 실제 회의에서 쓰이지 않는다. 이름·직급·회의 목적을 받아
 * 그 회의에서 그대로 읽을 수 있는 말을 만든다.
 *
 * 확정되지 않은 날짜·수량은 지어내지 않고 [납기일] 같은 자리표시자로 남긴다.
 * 실제 회의 내용과 생성된 예시를 섞으면 업무에 그대로 사고가 난다.
 *
 * 만든 뒤에는 문장을 직접 고칠 수 있고, 템플릿으로 저장해 두었다가
 * 상단 "템플릿" 메뉴에서 다시 불러올 수 있다 (?t=템플릿 id).
 */
export default function ScriptPage() {
  return (
    <AppShell>
      {() => (
        // useSearchParams 는 정적 내보내기에서 Suspense 안에 있어야 한다
        <Suspense fallback={<p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>}>
          <ScriptBody />
        </Suspense>
      )}
    </AppShell>
  );
}

const EMPTY: ScriptInput = {
  name: "",
  title: "",
  team: "",
  counterpart: "PL",
  purpose: "",
  musts: "",
  level: "보통",
};

/** 만드는 동안 보여 줄 단계 — 실제 진행률이 아니라 기다리는 동안의 안내다 */
const STEPS = ["입력한 내용을 정리하는 중", "오프닝을 쓰는 중", "핵심 설명을 쓰는 중", "예상 질문을 고르는 중", "마무리를 다듬는 중"];

function ScriptBody() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState<ScriptInput>(EMPTY);
  const [script, setScript] = useState<Script | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  /** 지금 화면이 어느 템플릿에서 왔는가 — 저장하면 그 템플릿을 고친다 */
  const [template, setTemplate] = useState<ScriptTemplate | null>(null);
  const [naming, setNaming] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ?t= 로 들어오면 그 템플릿을 불러온다
  useEffect(() => {
    const id = params.get("t");
    if (!id) return;
    const t = getTemplate(id);
    if (!t) {
      setError("그 템플릿을 찾지 못했습니다. 지워졌거나 다른 기기에서 만든 것일 수 있습니다.");
      return;
    }
    setTemplate(t);
    setForm({ ...EMPTY, ...t.input });
    setScript(t.script);
  }, [params]);

  useEffect(() => () => stopAudio(), []);

  // 만드는 동안 흐른 시간 — 멈춘 것이 아니라는 것을 보여 준다
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const countryKo = COUNTRIES.find((c) => c.code === form.counterpart)?.ko;

  async function make() {
    setError(null);
    setNotice(null);
    if (!form.name.trim() || !form.purpose.trim()) {
      setError("이름과 회의 목적은 입력해 주세요. 빈 값은 추측하지 않습니다.");
      return;
    }
    if (!aiReady()) {
      setError("AI 연결이 없어 스크립트를 만들 수 없습니다.");
      return;
    }
    if (script && editing && !confirm("고친 내용이 새로 만든 스크립트로 바뀝니다. 계속할까요?")) return;
    setBusy(true);
    setEditing(false);
    try {
      const { generateScript } = await import("@/lib/global/script-ai");
      setScript(await generateScript(form));
    } catch (e) {
      setError(describeAiError(e));
    } finally {
      setBusy(false);
    }
  }

  function save(asNew: boolean) {
    if (!script) return;
    const name = (naming ?? "").trim() || template?.name || defaultName(form, countryKo);
    const saved = saveTemplate({ id: asNew ? undefined : template?.id, name, input: form, script });
    setTemplate(saved);
    setNaming(null);
    setEditing(false);
    setNotice(asNew || !template ? `"${saved.name}" 템플릿으로 저장했습니다.` : `"${saved.name}" 템플릿을 고쳐 저장했습니다.`);
  }

  function rehearse() {
    if (!script) return;
    const s = startScriptPractice(form, script, template?.id);
    router.push(`/global/practice/?s=${s.id}`);
  }

  /** 스크립트의 한 덩어리를 고친다 */
  function patch<K extends keyof Script>(key: K, value: Script[K]) {
    setScript((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <>
      <div className="min-w-0">
        <Link href="/global/" className="text-[13px] font-bold text-dku-600">
          ← 오늘의 글로벌
        </Link>
        <h1 className="hero-headline mt-1.5 text-[28px] text-slate-900">
          {template ? template.name : "내 미팅에 맞춘 스크립트"}
        </h1>
        <p className="mt-1 text-[15px] text-slate-500">
          {template
            ? "저장해 둔 템플릿입니다. 고친 뒤 저장하면 이 템플릿이 바뀝니다."
            : "이름, 직급, 회의 목적을 알려주시면 그 회의에서 그대로 쓸 말을 만들어 드립니다."}
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
          <Link href="/templates/" className="font-bold text-emerald-900 underline underline-offset-2">
            템플릿 보기 →
          </Link>
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(320px,38%)_1fr]">
        {/* 입력 */}
        <fieldset disabled={busy} className="min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-6 disabled:opacity-60">
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
            className="mt-5 w-full rounded-xl bg-dku-600 px-5 py-4 text-[16px] font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {busy ? "만드는 중…" : script ? "이 내용으로 다시 만들기 →" : "스크립트 만들기 →"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
            입력하지 않은 값은 추측하지 않습니다. 확정되지 않은 날짜·수량은
            [납기일] 같은 자리표시자로 남습니다.
          </p>
        </fieldset>

        {/* 결과 */}
        <section className="relative min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-6">
          {busy ? (
            <Making elapsed={elapsed} />
          ) : !script ? (
            <p className="py-16 text-center text-[15px] text-slate-400">
              왼쪽을 채우고 &lsquo;스크립트 만들기&rsquo;를 누르면 여기에 나옵니다.
            </p>
          ) : (
            <>
              {/* 도구 줄 */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <p className="text-[13px] text-slate-500">
                  {editing ? "문장을 눌러 바로 고치세요. 다 고치면 저장하세요." : "그대로 읽어도 되고, 고쳐 써도 됩니다."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className={`rounded-lg px-3.5 py-2 text-[13px] font-bold transition ${
                      editing ? "bg-slate-800 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {editing ? "수정 끝내기" : "✎ 직접 수정"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNaming(template?.name ?? defaultName(form, countryKo))}
                    className="rounded-lg border border-dku-200 bg-dku-50 px-3.5 py-2 text-[13px] font-bold text-dku-700 transition hover:bg-dku-100"
                  >
                    {template ? "템플릿 저장" : "템플릿으로 저장"}
                  </button>
                </div>
              </div>

              {naming !== null && (
                <div className="mb-5 rounded-xl border border-dku-200 bg-dku-50 px-4 py-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-bold text-slate-700">템플릿 이름</span>
                    <input
                      autoFocus
                      value={naming}
                      onChange={(e) => setNaming(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && save(false)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-dku-500"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => save(false)}
                      className="rounded-lg bg-dku-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-dku-700"
                    >
                      {template ? "이 템플릿에 덮어쓰기" : "저장"}
                    </button>
                    {template && (
                      <button
                        type="button"
                        onClick={() => save(true)}
                        className="rounded-lg border border-dku-300 bg-white px-4 py-2 text-[13px] font-bold text-dku-700 transition hover:bg-dku-50"
                      >
                        새 템플릿으로 저장
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNaming(null)}
                      className="px-2 py-2 text-[13px] text-slate-500"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <Block title="30초 오프닝" lines={script.opening} editing={editing} onChange={(v) => patch("opening", v)} />
              <Block title="핵심 설명과 요청" lines={script.body} editing={editing} onChange={(v) => patch("body", v)} />
              <QaBlock items={script.qa} editing={editing} onChange={(v) => patch("qa", v)} />
              <Block title="마무리" lines={script.closing} editing={editing} onChange={(v) => patch("closing", v)} />

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

/** 만드는 중 화면 */
function Making({ elapsed }: { elapsed: number }) {
  const step = Math.min(STEPS.length - 1, Math.floor(elapsed / 3));
  return (
    <div className="flex flex-col items-center py-16 text-center" role="status" aria-live="polite">
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-dku-100 border-t-dku-600" />
        <span className="text-[13px] font-bold text-dku-700">{elapsed}초</span>
      </span>
      <p className="mt-6 text-[18px] font-bold text-slate-900">스크립트를 만드는 중입니다</p>
      <p className="mt-1.5 text-[14px] text-slate-500">{STEPS[step]}…</p>
      <ul className="mt-6 space-y-1.5 text-left">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 text-[13px] ${i < step ? "text-slate-400" : i === step ? "font-bold text-dku-700" : "text-slate-300"}`}>
            <span className="w-4 text-center">{i < step ? "✓" : i === step ? "•" : ""}</span>
            {s}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[12px] text-slate-400">보통 10~30초 걸립니다. 이 화면을 닫지 마세요.</p>
    </div>
  );
}

type Line = { en: string; ko: string };

function Block({
  title,
  lines,
  editing,
  onChange,
}: {
  title: string;
  lines: Line[];
  editing: boolean;
  onChange: (v: Line[]) => void;
}) {
  const set = (i: number, p: Partial<Line>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...p } : l)));
  return (
    <>
      <p className="mt-6 text-[13px] font-bold tracking-wide text-dku-600 first:mt-0">{title}</p>
      <ul className="mt-2 space-y-2">
        {lines.map((l, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
            {!editing && <SpeakButton text={l.en} />}
            <span className="min-w-0 flex-1">
              {editing ? (
                <>
                  <TextBox value={l.en} onChange={(v) => set(i, { en: v })} label="영어 문장" bold />
                  <TextBox value={l.ko} onChange={(v) => set(i, { ko: v })} label="한국어 뜻" />
                </>
              ) : (
                <>
                  <span className="block text-[15px] font-bold text-slate-900">{l.en}</span>
                  <span className="mt-0.5 block text-[13px] text-slate-500">{l.ko}</span>
                </>
              )}
            </span>
            {editing ? (
              <button
                type="button"
                onClick={() => onChange(lines.filter((_, j) => j !== i))}
                aria-label="이 문장 지우기"
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-bold text-red-600 transition hover:bg-red-50"
              >
                지우기
              </button>
            ) : (
              <button
                type="button"
                onClick={() => saveExpression({ en: l.en, ko: l.ko, scenarioId: "script", lang: "en" })}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50"
              >
                담기
              </button>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <button
          type="button"
          onClick={() => onChange([...lines, { en: "", ko: "" }])}
          className="mt-2 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-[13px] font-bold text-slate-500 transition hover:border-dku-400 hover:text-dku-700"
        >
          ＋ 문장 추가
        </button>
      )}
    </>
  );
}

type Qa = Script["qa"][number];

function QaBlock({ items, editing, onChange }: { items: Qa[]; editing: boolean; onChange: (v: Qa[]) => void }) {
  const set = (i: number, p: Partial<Qa>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <>
      <p className="mt-6 text-[13px] font-bold tracking-wide text-dku-600">예상 질문과 답</p>
      <ul className="mt-2 space-y-3">
        {items.map((x, i) => (
          <li key={i} className="rounded-xl border border-slate-200 px-4 py-4">
            {editing ? (
              <>
                <TextBox value={x.q} onChange={(v) => set(i, { q: v })} label="질문 (영어)" bold />
                <TextBox value={x.qKo} onChange={(v) => set(i, { qKo: v })} label="질문 뜻" />
                <TextBox value={x.a} onChange={(v) => set(i, { a: v })} label="답 (영어)" bold />
                <TextBox value={x.aKo} onChange={(v) => set(i, { aKo: v })} label="답 뜻" />
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="mt-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-bold text-red-600 transition hover:bg-red-50"
                >
                  이 질문 지우기
                </button>
              </>
            ) : (
              <>
                <p className="flex items-start gap-2 text-[15px] font-bold text-slate-900">
                  <SpeakButton text={x.q} small />
                  <span>Q. {x.q}</span>
                </p>
                <p className="mt-0.5 pl-9 text-[13px] text-slate-500">{x.qKo}</p>
                <p className="mt-2.5 flex items-start gap-2 text-[15px] text-slate-800">
                  <SpeakButton text={x.a} small />
                  <span>A. {x.a}</span>
                </p>
                <p className="mt-0.5 pl-9 text-[13px] text-slate-500">{x.aKo}</p>
              </>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <button
          type="button"
          onClick={() => onChange([...items, { q: "", qKo: "", a: "", aKo: "" }])}
          className="mt-2 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-[13px] font-bold text-slate-500 transition hover:border-dku-400 hover:text-dku-700"
        >
          ＋ 질문 추가
        </button>
      )}
    </>
  );
}

/** 고치는 칸 — 내용 길이에 맞춰 높이가 늘어난다 */
function TextBox({
  value,
  onChange,
  label,
  bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  bold?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      placeholder={label}
      rows={1}
      ref={(el) => {
        if (el) {
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }
      }}
      className={`mb-1.5 block w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition placeholder:text-slate-300 focus:border-dku-500 focus:bg-white ${
        bold ? "text-[15px] font-bold text-slate-900" : "text-[13px] text-slate-600"
      }`}
    />
  );
}

function SpeakButton({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => playPrompt(text)}
      aria-label={`${text} 듣기`}
      className={`shrink-0 rounded-lg bg-dku-50 text-dku-600 transition hover:bg-dku-100 ${small ? "p-1.5" : "p-2"}`}
    >
      <svg width={small ? 14 : 18} height={small ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9v6h4l5 4V5L8 9z" />
        <path d="M16.5 8.5a5 5 0 010 7" />
      </svg>
    </button>
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
