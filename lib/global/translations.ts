/**
 * 상황 표현의 다른 언어판.
 *
 * 콘텐츠는 영어로 한 벌 쓰고, 나라별 언어는 여기에 모아 둔다.
 * 키는 영어 원문이다 — 문장이 바뀌면 번역이 따라오지 않는 것이 즉시 드러나야
 * 하기 때문이다. 없으면 영어로 되돌리고, 화면에 "아직 준비 중"이라고 밝힌다.
 *
 * read 는 한글 발음 표기다. 중국어·힌디어처럼 글자를 못 읽는 말에서는
 * 이것이 없으면 들어도 따라 할 수가 없다.
 */
import type { LangCode } from "./content";

export interface Localized {
  text: string;
  /** 한글 발음 */
  read: string;
}

/** [영어 원문, 번역, 한글 발음] */
export type Row = [string, string, string];

const TABLES: Partial<Record<LangCode, Map<string, Localized>>> = {};

export function registerLanguage(code: LangCode, rows: Row[]) {
  TABLES[code] = new Map(rows.map(([en, text, read]) => [en, { text, read }]));
}

/** 그 언어로 된 문장. 아직 없으면 null — 지어내지 않는다 */
export function localized(code: LangCode, en: string): Localized | null {
  if (code === "en") return { text: en, read: "" };
  return TABLES[code]?.get(en) ?? null;
}

/** 이 언어가 얼마나 채워져 있는가 — 화면에 "준비 중" 을 띄울 근거 */
export function coverage(code: LangCode): number {
  if (code === "en") return 1;
  return TABLES[code]?.size ?? 0;
}
