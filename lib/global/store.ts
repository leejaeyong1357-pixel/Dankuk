"use client";

/**
 * 오늘의 글로벌 — 선택과 세션 보관.
 *
 * 선택값과 연습 기록은 이 기기에 쓴 뒤 서버에도 올린다 (lib/remote.ts).
 * OPIc 성적과는 섞지 않는다 — 저장 키부터 분리해 둔다.
 */
import { mirror } from "@/lib/remote";
import { currentAccount } from "@/lib/account";
import {
  COUNTRIES,
  KIND_KO,
  LANG_BY_COUNTRY,
  SCENARIOS,
  languagesFor,
  scenariosOf,
  type GlobalKind,
  type LangCode,
  type Scenario,
} from "./content";

const PREF_KEY = "sl-global:pref";
const SESSION_KEY = "sl-global:sessions";
const SAVED_KEY = "sl-global:saved";

export interface GlobalPref {
  country: keyof typeof LANG_BY_COUNTRY;
  kind: GlobalKind;
  lang: LangCode;
}

const DEFAULT_PREF: GlobalPref = { country: "PL", kind: "meeting", lang: "pl" };

/**
 * 저장해 둔 선택값.
 *
 * 나라 목록은 바뀐다 (멕시코가 빠지고 미국이 들어온 적이 있다). 예전에 고른
 * 나라가 지금 목록에 없으면 기본값으로 되돌린다 — 그러지 않으면 지도에
 * 아무 나라도 켜지지 않고, 그 나라의 말을 찾지 못해 화면이 비어 보인다.
 */
export function loadPref(): GlobalPref {
  if (typeof window === "undefined") return DEFAULT_PREF;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    const saved = raw ? { ...DEFAULT_PREF, ...(JSON.parse(raw) as Partial<GlobalPref>) } : DEFAULT_PREF;
    if (!COUNTRIES.some((c) => c.code === saved.country)) return DEFAULT_PREF;
    if (!(saved.kind in KIND_KO)) saved.kind = DEFAULT_PREF.kind;
    // 그 나라에서 고를 수 없는 말이 남아 있으면 그 나라의 말로 맞춘다
    if (!languagesFor(saved.country).some((l) => l.code === saved.lang)) {
      return { ...saved, lang: LANG_BY_COUNTRY[saved.country] };
    }
    return saved;
  } catch {
    return DEFAULT_PREF;
  }
}

export function savePref(p: GlobalPref) {
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(p));
    mirror(PREF_KEY);
  } catch {
    /* 저장에 실패해도 이번 화면은 그대로 쓴다 */
  }
}

/** 이 기기 기준 오늘 날짜 (YYYY-MM-DD). 서버 시간대에 기대지 않는다 */
export function localDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}


function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * 오늘의 한 상황.
 *
 * 같은 계정·같은 날·같은 맥락이면 몇 번을 새로고침해도 같은 것이 나오고,
 * 날이 바뀌면 다른 것이 나온다. 매일 열었을 때 고르는 수고 없이
 * 5분을 쓰게 하려는 장치다.
 *
 * 더 하고 싶은 사람은 상황별 연습에서 60가지를 직접 고른다 — 막지 않는다.
 */
export function todayScenario(pref: GlobalPref, day = localDay()): Scenario {
  const list = scenariosOf(pref.kind);
  if (list.length === 0) return SCENARIOS[0];
  // 나라마다 따로 뽑으면 같은 날 두 나라에 같은 문장이 나올 수 있다.
  // 그날의 순서를 한 번 섞어 두고 나라 순번대로 하나씩 나눠 주면 겹치지 않는다
  // (상황이 나라 수보다 많은 한).
  const order = shuffled(list.length, hash(`${currentAccount()?.email ?? "guest"}|${day}|${pref.kind}`));
  const slot = Math.max(0, COUNTRIES.findIndex((c) => c.code === pref.country));
  return list[order[slot % order.length]];
}

/** 0..n-1 을 seed 로 섞은 순서 — 같은 seed 면 언제나 같은 순서 */
function shuffled(n: number, seed: number): number[] {
  const a = [...Array(n).keys()];
  let x = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    // xorshift32
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 연습 세션 ────────────────────────────────────────────
export type TurnRole = "user" | "partner";

export interface PracticeTurn {
  role: TurnRole;
  text: string;
  at: string;
}

export interface GlobalSession {
  id: string;
  scenarioId: string;
  country: string;
  kind: GlobalKind;
  lang: string;
  startedAt: string;
  /** 어디까지 왔는지 — 새로고침해도 이어서 한다 */
  step: "listen" | "say" | "roleplay" | "coaching";
  myLine: string;
  turns: PracticeTurn[];
  coaching: GlobalCoaching | null;
  /** 스크립트에서 넘어온 경우의 맥락 */
  scriptContext?: string;
  /**
   * 스크립트로 연습할 때, 그 스크립트 문장들.
   *
   * 미리 만든 60가지 상황에는 없는 연습이라 scenarioId 로는 찾을 수 없다.
   * 예전에는 "m-opening" 같은 없는 id 를 넘겨 연습 화면이 "상황 정보를 찾지
   * 못했습니다" 에서 멈췄다. 문장을 연습 기록 안에 직접 담아 두면 템플릿을
   * 지우거나 다른 기기에서 열어도 그대로 이어진다.
   */
  script?: ScriptPractice;
  doneAt?: string;
}

export interface ScriptPractice {
  title: string;
  subtitle: string;
  phrases: { en: string; ko: string }[];
  /** 저장해 둔 템플릿에서 왔으면 그 id */
  templateId?: string;
}

/** 스크립트 연습의 scenarioId — 미리 만든 상황 id(m01, t01 …)와 겹치지 않는다 */
export const SCRIPT_SCENARIO_ID = "script";

/** 점수가 아니라 다음 대화를 위한 도움 */
export interface GlobalCoaching {
  wellCommunicated: string[];
  suggestions: {
    dimension: "목적 달성" | "명확성" | "업무 어조" | "표현";
    original: string;
    alternative: string;
    reasonKo: string;
  }[];
  retryPrompt: string;
  exampleResponse: string;
}

export function allSessions(): GlobalSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as GlobalSession[]) : [];
  } catch {
    return [];
  }
}

function writeSessions(list: GlobalSession[]) {
  try {
    // 무한정 쌓지 않는다
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(list.slice(-40)));
    mirror(SESSION_KEY);
  } catch {
    /* 저장소가 가득 차도 진행 중인 연습은 화면에 남아 있다 */
  }
}

export function createSession(input: {
  scenarioId: string;
  pref: GlobalPref;
  scriptContext?: string;
  script?: ScriptPractice;
  /** 고른 언어 대신 쓸 말 — 스크립트는 영어로 만들어지므로 영어로 연습한다 */
  lang?: string;
}): GlobalSession {
  const s: GlobalSession = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    scenarioId: input.scenarioId,
    country: input.pref.country,
    kind: input.pref.kind,
    lang: input.lang ?? input.pref.lang,
    startedAt: new Date().toISOString(),
    step: "listen",
    myLine: "",
    turns: [],
    coaching: null,
    scriptContext: input.scriptContext,
    script: input.script,
  };
  writeSessions([...allSessions(), s]);
  return s;
}

export function getSession(id: string): GlobalSession | null {
  return allSessions().find((s) => s.id === id) ?? null;
}

export function updateSession(id: string, patch: Partial<GlobalSession>) {
  const list = allSessions();
  const i = list.findIndex((s) => s.id === id);
  if (i === -1) return;
  list[i] = { ...list[i], ...patch };
  writeSessions(list);
}

/** 오늘 이 상황을 이미 마쳤는가 — 권유용 표시일 뿐 이용을 막지 않는다 */
export function doneToday(scenarioId: string, day = localDay()): boolean {
  return allSessions().some(
    (s) => s.scenarioId === scenarioId && s.doneAt && s.doneAt.slice(0, 10) === day,
  );
}

// ── 나의 표현 ────────────────────────────────────────────
export interface SavedExpression {
  en: string;
  ko: string;
  /** 어느 상황에서 담았는지 */
  scenarioId: string;
  lang: string;
  at: string;
}

export function savedExpressions(): SavedExpression[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedExpression[]) : [];
  } catch {
    return [];
  }
}

export function saveExpression(e: Omit<SavedExpression, "at">) {
  const list = savedExpressions();
  if (list.some((x) => x.en === e.en)) return;
  try {
    window.localStorage.setItem(
      SAVED_KEY,
      JSON.stringify([...list, { ...e, at: new Date().toISOString() }].slice(-300)),
    );
    mirror(SAVED_KEY);
  } catch {
    /* 담지 못해도 연습은 이어진다 */
  }
}

export function removeExpression(en: string) {
  try {
    window.localStorage.setItem(
      SAVED_KEY,
      JSON.stringify(savedExpressions().filter((x) => x.en !== en)),
    );
    mirror(SAVED_KEY);
  } catch {
    /* 지우지 못해도 할 수 있는 것이 없다 */
  }
}
