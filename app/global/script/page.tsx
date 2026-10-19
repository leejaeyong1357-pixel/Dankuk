"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AnalyzingLoader } from "@/components/AnalyzingLoader";
import { PhraseLine, type HoverWord } from "@/components/global/PhraseLine";
import { describeAiError } from "@/lib/ai-provider";
import { playPrompt, stopAudio } from "@/lib/audio";
import { aiReady } from "@/lib/global/ai";
import { COUNTRIES } from "@/lib/global/content";
import { saveExpression } from "@/lib/global/store";
import { lookup } from "@/lib/dictionary";
import { mirror } from "@/lib/remote";
import { saveVocabEntry } from "@/lib/sync";
import { cachedWord, type Script, type ScriptInput, type WordInfo } from "@/lib/global/script-ai";
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
 * 만든 뒤에는 문장을 그 자리에서 바로 고친다 (따로 "수정 모드" 가 없다).
 * 고친 문장은 AI 가 다시 번역해 한국어 뜻을 맞춰 준다. 한국어로 쓰면 영어로 바꿔 준다.
 * 단어에 마우스를 올리면 오른쪽 사전 칸에 뜻·발음기호·한글 발음이 나온다.
 * 저장하면 템플릿이 되고, 상단 "템플릿" 메뉴에서 다시 불러온다 (?t=템플릿 id).
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
  const [error, setError] = useState<string | null>(null);
  /** 저장하지 않은 고침이 있는가 */
  const [dirty, setDirty] = useState(false);
  /** 다시 번역 중인 줄 */
  const [pending, setPending] = useState<string[]>([]);
  const [word, setWord] = useState<HoverWord | null>(null);
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
    if (script && dirty && !confirm("고친 내용이 새로 만든 스크립트로 바뀝니다. 계속할까요?")) return;
    setBusy(true);
    try {
      const { generateScript } = await import("@/lib/global/script-ai");
      setScript(await generateScript(form));
      setDirty(true);
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
    setDirty(false);
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
    setDirty(true);
  }

  /** 저장 — 불러온 템플릿이면 바로 덮어쓰고, 처음이면 이름부터 받는다 */
  function saveNow() {
    if (template) save(false);
    else setNaming(defaultName(form, countryKo));
  }

  /**
   * 고친 한 줄을 다시 번역해 넣는다.
   * key 는 화면에서 그 줄을 가리키는 이름, put 은 결과를 스크립트에 넣는 함수다.
   */
  async function retranslate(key: string, text: string, put: (s: Script, v: { en: string; ko: string }) => Script) {
    const clean = text.trim();
    if (!clean) return;
    // 일단 고친 글을 그대로 넣어 두고, 번역이 오면 바꾼다
    setScript((prev) => (prev ? put(prev, { en: clean, ko: "" }) : prev));
    setDirty(true);
    if (!aiReady()) {
      setError("AI 연결이 없어 고친 문장의 뜻을 다시 번역하지 못했습니다.");
      return;
    }
    setPending((p) => [...p, key]);
    try {
      const { translateLine } = await import("@/lib/global/script-ai");
      const v = await translateLine(clean, `${form.purpose} / ${form.musts}`);
      setScript((prev) => (prev ? put(prev, v) : prev));
    } catch (e) {
      setError(describeAiError(e));
    } finally {
      setPending((p) => p.filter((k) => k !== key));
    }
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(300px,34%)_1fr] xl:grid-cols-[300px_minmax(0,1fr)_280px]">
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
            <AnalyzingLoader title="스크립트를 만드는 중입니다" steps={STEPS} every={3000} note="보통 10~30초 걸립니다. 이 화면을 닫지 마세요." compact />
          ) : !script ? (
            <p className="py-16 text-center text-[15px] text-slate-400">
              왼쪽을 채우고 &lsquo;스크립트 만들기&rsquo;를 누르면 여기에 나옵니다.
            </p>
          ) : (
            <>
              {/* 도구 줄 */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <p className="text-[13px] text-slate-500">
                  문장을 누르면 바로 고칠 수 있어요. 단어에 마우스를 올리면 뜻과 발음이 나옵니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {template && (
                    <button
                      type="button"
                      onClick={() => setNaming(`${template.name} (사본)`)}
                      className="rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      다른 이름으로 저장
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveNow}
                    disabled={!dirty || pending.length > 0}
                    className="rounded-lg bg-dku-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {pending.length > 0 ? "번역 중…" : dirty ? "저장" : "저장됨"}
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
                      onKeyDown={(e) => e.key === "Enter" && save(!!template)}
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

              {(["opening", "body"] as const).map((sec) => (
                <Block
                  key={sec}
                  title={sec === "opening" ? "30초 오프닝" : "핵심 설명과 요청"}
                  sec={sec}
                  lines={script[sec]}
                  pending={pending}
                  onWord={setWord}
                  onEdit={(i, text) => retranslate(`${sec}-${i}`, text, (s, v) => ({ ...s, [sec]: s[sec].map((l, j) => (j === i ? v : l)) }))}
                  onChange={(v) => patch(sec, v)}
                />
              ))}
              <QaBlock
                items={script.qa}
                pending={pending}
                onWord={setWord}
                onEdit={(i, f, text) =>
                  retranslate(`qa-${i}-${f}`, text, (s, v) => ({
                    ...s,
                    qa: s.qa.map((x, j) => (j !== i ? x : f === "q" ? { ...x, q: v.en, qKo: v.ko } : { ...x, a: v.en, aKo: v.ko })),
                  }))
                }
                onChange={(v) => patch("qa", v)}
              />
              <Block
                title="마무리"
                sec="closing"
                lines={script.closing}
                pending={pending}
                onWord={setWord}
                onEdit={(i, text) => retranslate(`closing-${i}`, text, (s, v) => ({ ...s, closing: s.closing.map((l, j) => (j === i ? v : l)) }))}
                onChange={(v) => patch("closing", v)}
              />

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

        {/* 사전 — 넓은 화면에서 오른쪽에 붙어 따라 내려온다 */}
        <div className="hidden xl:block">
          <WordBox word={word} />
        </div>
      </div>
    </>
  );
}

type Line = { en: string; ko: string };

/**
 * 고칠 수 있는 한 줄.
 *
 * 평소에는 단어마다 마우스를 올릴 수 있는 문장으로 보이고, 문장 옆 ✎ 나 빈 곳을
 * 누르면 그 자리가 입력칸이 된다. Enter 또는 바깥을 누르면 끝나고, 바뀌었으면
 * 다시 번역한다. Esc 는 취소.
 */
function EditableLine({
  en,
  ko,
  prefix,
  bold = true,
  busy,
  onWord,
  onCommit,
}: {
  en: string;
  ko: string;
  prefix?: string;
  bold?: boolean;
  busy: boolean;
  onWord: (w: HoverWord | null) => void;
  onCommit: (text: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(en ? null : "");
  const done = useRef(false);

  function finish(save: boolean) {
    if (draft === null || done.current) return;
    done.current = true;
    const text = draft.trim();
    setDraft(null);
    // 빈 줄로 끝내면 그 줄을 지운다
    if (save && (text !== en.trim() || !text)) onCommit(text);
  }

  if (draft !== null) {
    return (
      <span className="block">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              finish(true);
            } else if (e.key === "Escape") finish(false);
          }}
          rows={1}
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          placeholder="영어로 고치세요. 한국어로 쓰면 영어로 바꿔 드립니다."
          aria-label="문장 고치기"
          className={`block w-full resize-none rounded-lg border border-dku-400 bg-white px-2.5 py-1.5 text-[15px] text-slate-900 outline-none ring-2 ring-dku-100 placeholder:font-normal placeholder:text-slate-300 ${bold ? "font-bold" : ""}`}
        />
        <span className="mt-1 block text-[11.5px] text-slate-400">Enter 로 저장 · Esc 로 취소 · 고치면 뜻을 다시 번역합니다</span>
      </span>
    );
  }

  return (
    <span className="group block">
      <span
        className={`block cursor-text text-[15px] ${bold ? "font-bold text-slate-900" : "text-slate-800"}`}
        onClick={(e) => {
          // 단어를 누르면 그 단어를 읽어 주고, 문장 빈 곳을 누르면 고친다
          if ((e.target as HTMLElement).getAttribute("role") === "button") return;
          done.current = false;
          setDraft(en);
        }}
      >
        {prefix && <span className="mr-1">{prefix}</span>}
        <PhraseLine text={en} ko={ko} onWord={onWord} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            done.current = false;
            setDraft(en);
          }}
          aria-label="이 문장 고치기"
          title="고치기"
          className="ml-1.5 inline-flex rounded p-1 align-middle text-slate-300 transition hover:bg-dku-50 hover:text-dku-600 group-hover:text-slate-400"
        >
          <PencilIcon />
        </button>
      </span>
      <span className="mt-0.5 block text-[13px] text-slate-500">
        {busy ? <span className="animate-pulse text-dku-600">뜻을 다시 번역하는 중…</span> : ko}
      </span>
    </span>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-[13px] font-bold text-slate-400 transition hover:text-dku-600"
    >
      ＋ {label}
    </button>
  );
}

function Block({
  title,
  sec,
  lines,
  pending,
  onWord,
  onEdit,
  onChange,
}: {
  title: string;
  sec: string;
  lines: Line[];
  pending: string[];
  onWord: (w: HoverWord | null) => void;
  onEdit: (i: number, text: string) => void;
  onChange: (v: Line[]) => void;
}) {
  return (
    <>
      <p className="mt-6 text-[13px] font-bold tracking-wide text-dku-600 first:mt-0">{title}</p>
      <ul className="mt-2 space-y-2">
        {lines.map((l, i) => (
          <li key={`${i}-${lines.length}`} className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
            <SpeakButton text={l.en} />
            <span className="min-w-0 flex-1">
              <EditableLine
                en={l.en}
                ko={l.ko}
                busy={pending.includes(`${sec}-${i}`)}
                onWord={onWord}
                onCommit={(text) => (text ? onEdit(i, text) : onChange(lines.filter((_, j) => j !== i)))}
              />
            </span>
            <button
              type="button"
              onClick={() => saveExpression({ en: l.en, ko: l.ko, scenarioId: "script", lang: "en" })}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50"
            >
              담기
            </button>
            <RemoveButton label="이 문장 지우기" onClick={() => onChange(lines.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <AddButton label="문장 추가" onClick={() => onChange([...lines, { en: "", ko: "" }])} />
    </>
  );
}

type Qa = Script["qa"][number];

function QaBlock({
  items,
  pending,
  onWord,
  onEdit,
  onChange,
}: {
  items: Qa[];
  pending: string[];
  onWord: (w: HoverWord | null) => void;
  onEdit: (i: number, field: "q" | "a", text: string) => void;
  onChange: (v: Qa[]) => void;
}) {
  return (
    <>
      <p className="mt-6 text-[13px] font-bold tracking-wide text-dku-600">예상 질문과 답</p>
      <ul className="mt-2 space-y-3">
        {items.map((x, i) => (
          <li key={`${i}-${items.length}`} className="flex items-start gap-2 rounded-xl border border-slate-200 px-4 py-4">
            <span className="min-w-0 flex-1">
              <span className="flex items-start gap-2">
                <SpeakButton text={x.q} small />
                <span className="min-w-0 flex-1">
                  <EditableLine en={x.q} ko={x.qKo} prefix="Q." busy={pending.includes(`qa-${i}-q`)} onWord={onWord} onCommit={(t) => t && onEdit(i, "q", t)} />
                </span>
              </span>
              <span className="mt-2.5 flex items-start gap-2">
                <SpeakButton text={x.a} small />
                <span className="min-w-0 flex-1">
                  <EditableLine en={x.a} ko={x.aKo} prefix="A." bold={false} busy={pending.includes(`qa-${i}-a`)} onWord={onWord} onCommit={(t) => t && onEdit(i, "a", t)} />
                </span>
              </span>
            </span>
            <RemoveButton label="이 질문 지우기" onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <AddButton label="질문 추가" onClick={() => onChange([...items, { q: "", qKo: "", a: "", aKo: "" }])} />
    </>
  );
}

/**
 * 오른쪽 사전 칸 — 단어에 마우스를 올리면 뜻·발음기호·한글 발음.
 *
 * 내장 낱말 사전에 있으면 바로, 없으면 AI 에게 한 번 묻고 이 기기에 저장해 둔다.
 * 마우스가 지나가기만 해도 묻지 않게 잠깐 머문 단어만 찾는다.
 */
function WordBox({ word }: { word: HoverWord | null }) {
  const [shown, setShown] = useState<HoverWord | null>(null);
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    // 마우스를 떼도 마지막 단어는 남겨 둔다 — 사전 칸으로 옮겨 가는 사이에 지워지지 않게
    if (!word) return;
    setShown(word);
    const hit = cachedWord(word.word);
    setInfo(hit);
    if (hit || !aiReady()) return;
    let off = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { wordInfo } = await import("@/lib/global/script-ai");
        const v = await wordInfo(word.word, word.ko ?? "");
        if (!off) setInfo(v);
      } catch {
        /* 못 찾으면 내장 사전 뜻만 보여 준다 */
      } finally {
        if (!off) setLoading(false);
      }
    }, 350);
    return () => {
      off = true;
      clearTimeout(t);
      setLoading(false);
    };
  }, [word]);

  const meaning = shown ? info?.meaning ?? lookup(shown.word) : null;

  function keep() {
    if (!shown || !meaning) return;
    const entry = { en: shown.word.toLowerCase(), ko: meaning };
    try {
      const raw = window.localStorage.getItem(VOCAB_KEY);
      const list: { en: string; ko: string }[] = raw ? JSON.parse(raw) : [];
      if (!list.some((x) => x.en === entry.en)) {
        list.push(entry);
        window.localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
        mirror(VOCAB_KEY);
      }
    } catch {
      /* 담지 못해도 학습은 이어진다 */
    }
    void saveVocabEntry(entry);
    setSaved((s) => [...s, entry.en]);
  }

  return (
    <aside className="sticky top-24 h-fit rounded-2xl border-2 border-dku-500 bg-white p-5">
      <p className="text-[13px] font-bold text-dku-700">사전</p>
      {shown ? (
        <>
          <div className="mt-3 flex items-start gap-2">
            <p className="min-w-0 break-all text-[24px] font-bold text-dku-700">{shown.word}</p>
            <button
              type="button"
              onClick={() => playPrompt(shown.word)}
              aria-label={`${shown.word} 듣기`}
              className="mt-1 shrink-0 rounded-lg bg-dku-50 p-1.5 text-dku-600 transition hover:bg-dku-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {info?.ipa && <p className="mt-0.5 text-[15px] text-slate-500">/{info.ipa.replace(/^\/|\/$/g, "")}/</p>}
          {meaning ? (
            <p className="mt-2 text-[16px] text-slate-800">{meaning}</p>
          ) : loading ? (
            <p className="mt-2 animate-pulse text-[14px] text-slate-400">찾는 중…</p>
          ) : (
            <p className="mt-2 text-[14px] text-slate-400">사전에 없는 단어입니다</p>
          )}
          {info?.read && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[12px] font-bold text-slate-400">한글 발음</p>
              <p className="mt-1 text-[15px] text-slate-700">[{info.read}]</p>
            </div>
          )}
          {meaning && (
            <button
              type="button"
              onClick={keep}
              disabled={saved.includes(shown.word.toLowerCase())}
              className="mt-4 rounded-lg border border-dku-200 px-3 py-1.5 text-[12px] font-bold text-dku-700 transition hover:bg-dku-50 disabled:border-slate-200 disabled:text-slate-400"
            >
              {saved.includes(shown.word.toLowerCase()) ? "단어장에 담았습니다" : "＋ 단어장에 담기"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
          스크립트의 단어에 마우스를 올리면 뜻과 발음기호가 여기에 나옵니다. 단어를 누르면 그 단어만 읽어 줍니다.
        </p>
      )}
    </aside>
  );
}

const VOCAB_KEY = "dku-opic:vocab";

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
