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
import { JOB_ES } from "./job-es";
import { JOB_HI } from "./job-hi";
import { JOB_PL } from "./job-pl";
import { JOB_PT } from "./job-pt";
import { JOB_ZH } from "./job-zh";

let done = false;

export function loadLanguages() {
  if (done) return;
  done = true;
  // 미팅·출장 표현 뒤에 직무별 표현을 잇는다
  registerLanguage("pl", [...PL, ...JOB_PL]);
  registerLanguage("zh", [...ZH, ...JOB_ZH]);
  registerLanguage("hi", [...HI, ...JOB_HI]);
  registerLanguage("pt", [...PT, ...JOB_PT]);
  registerLanguage("es", [...ES, ...JOB_ES]);
}
