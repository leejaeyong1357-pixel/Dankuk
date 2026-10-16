"use client";

/**
 * 언어판 등록.
 *
 * 한 번만 부르면 된다. 아직 번역이 없는 언어는 등록하지 않고,
 * 화면이 "준비 중" 으로 알린다 — 영어를 그 나라 말인 척 보여 주지 않는다.
 */
import { registerLanguage } from "../translations";
import { ES } from "./es";
import { HI } from "./hi";
import { PL } from "./pl";
import { PT } from "./pt";
import { ZH } from "./zh";

let done = false;

export function loadLanguages() {
  if (done) return;
  done = true;
  registerLanguage("pl", PL);
  registerLanguage("zh", ZH);
  registerLanguage("hi", HI);
  registerLanguage("pt", PT);
  registerLanguage("es", ES);
}
