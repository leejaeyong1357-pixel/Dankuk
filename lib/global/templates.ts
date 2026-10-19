"use client";

/**
 * 스크립트 템플릿 — 만든 스크립트를 이름 붙여 저장해 두는 곳.
 *
 * 같은 회의를 매주 하는 사람이 많다. 한 번 만든 스크립트를 날짜·수량만 고쳐
 * 다시 쓰게 하려는 것이다. 입력값(이름·목적…)과 스크립트를 함께 저장하므로
 * 불러오면 왼쪽 입력칸까지 그대로 채워진다.
 *
 * 이 기기에 먼저 쓰고 서버(D1)에도 올린다 (lib/remote.ts). 서버가 붙어 있으면
 * 다른 PC 에서 로그인해도 같은 템플릿이 보인다.
 */
import { mirror } from "@/lib/remote";
import type { Script, ScriptInput } from "./script-ai";
import { SCRIPT_SCENARIO_ID, createSession, loadPref, type GlobalSession } from "./store";

const KEY = "sl-global:templates";

export interface ScriptTemplate {
  id: string;
  name: string;
  input: ScriptInput;
  script: Script;
  createdAt: string;
  updatedAt: string;
}

export function allTemplates(): ScriptTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ScriptTemplate[]) : [];
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function write(list: ScriptTemplate[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  mirror(KEY);
}

export function getTemplate(id: string): ScriptTemplate | null {
  return allTemplates().find((t) => t.id === id) ?? null;
}

/** 새로 저장하거나(id 없음) 같은 id 를 덮어쓴다. 저장된 것을 돌려준다 */
export function saveTemplate(t: {
  id?: string;
  name: string;
  input: ScriptInput;
  script: Script;
}): ScriptTemplate {
  const now = new Date().toISOString();
  const list = allTemplates();
  const prev = t.id ? list.find((x) => x.id === t.id) : undefined;
  const saved: ScriptTemplate = {
    id: prev?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: t.name.trim() || t.input.purpose || "이름 없는 스크립트",
    input: t.input,
    script: t.script,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  write([saved, ...list.filter((x) => x.id !== saved.id)]);
  return saved;
}

export function removeTemplate(id: string) {
  write(allTemplates().filter((t) => t.id !== id));
}

/** 템플릿 이름을 지을 때 쓰는 기본값 — 목적 · 상대 */
export function defaultName(input: ScriptInput, countryKo?: string): string {
  return [input.purpose.trim(), countryKo].filter(Boolean).join(" · ") || "새 스크립트";
}

/**
 * 스크립트로 연습을 시작한다.
 *
 * 연습 화면은 "듣기 → 따라 말하기 → 역할 연습" 을 미리 만든 상황 위에서 돈다.
 * 스크립트의 오프닝·본문·마무리 문장을 그 상황의 표현 자리에 넣고, 입력한
 * 회의 정보는 AI 상대역이 참고할 맥락으로 넘긴다.
 */
export function startScriptPractice(input: ScriptInput, script: Script, templateId?: string): GlobalSession {
  const phrases = [...script.opening, ...script.body, ...script.closing].filter((l) => l.en.trim());
  const ctx = [
    `발표자: ${input.name} (${input.title || "직급 미입력"}, ${input.team || "부서 미입력"})`,
    `회의 목적: ${input.purpose}`,
    input.musts ? `꼭 전달할 내용: ${input.musts}` : "",
    `스크립트:\n${phrases.map((p) => `- ${p.en}`).join("\n")}`,
    script.qa.length ? `예상 질문:\n${script.qa.map((x) => `- ${x.q}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return createSession({
    scenarioId: SCRIPT_SCENARIO_ID,
    pref: { ...loadPref(), kind: "meeting" },
    // 스크립트는 영어로 만들어진다
    lang: "en",
    scriptContext: ctx,
    script: {
      title: input.purpose || "내 스크립트",
      subtitle: [input.name, input.title, input.team].filter(Boolean).join(" · ") || "내 미팅 스크립트",
      phrases,
      templateId,
    },
  });
}
