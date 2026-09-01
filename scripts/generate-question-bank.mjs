/**
 * 문항 뱅크 생성기 (SPEC §7).
 * 주제 × 기능 × 난이도밴드 조합으로 문항을 만들어 data/questions.json 에 쓴다.
 *
 * 실행: npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import { COMBO, ROLEPLAY, INTRO } from "./templates.mjs";

// lib/topics.ts 를 파싱해서 주제 목록을 가져온다 (빌드 의존성 없이 단순 추출)
const topicsSrc = fs.readFileSync("lib/topics.ts", "utf8");

/** TOPICS 배열 블록을 중괄호 깊이로 스캔해 항목 단위로 잘라낸다 */
function extractTopicEntries(src) {
  const start = src.indexOf("export const TOPICS");
  // "Topic[]" 의 대괄호를 잡지 않도록 "= [" 를 기준으로 찾는다
  const arrOpen = src.indexOf("= [", start) + 2;
  const entries = [];
  let depth = 0, buf = "";
  for (let i = arrOpen + 1; i < src.length; i++) {
    const c = src[i];
    if (c === "]" && depth === 0) break;
    if (c === "{") depth++;
    if (depth > 0) buf += c;
    if (c === "}") {
      depth--;
      if (depth === 0) { entries.push(buf); buf = ""; }
    }
  }
  return entries;
}

const TOPICS = [];
for (const e of extractTopicEntries(topicsSrc)) {
  const id = /id:\s*"([^"]+)"/.exec(e);
  const ko = /\bko:\s*"([^"]+)"/.exec(e);
  const en = /\ben:\s*"([^"]+)"/.exec(e);
  const source = /source:\s*"(survey|adhoc)"/.exec(e);
  if (!id || !ko || !en || !source) continue;
  const rp = /counterpart:\s*"([^"]+)",\s*counterpartKo:\s*"([^"]+)",\s*situationKo:\s*"([^"]+)"/.exec(e);
  TOPICS.push({
    id: id[1], ko: ko[1], en: en[1], source: source[1],
    advanced: /advanced:\s*true/.test(e),
    roleplay: rp ? { counterpart: rp[1], counterpartKo: rp[2], situationKo: rp[3] } : null,
  });
}

const BANDS = ["1-2", "3-4", "5-6"];

/** 한글 받침 유무에 따라 조사를 고른다 (은행"과" / 카페"와") */
function hasFinalConsonant(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false; // 한글 음절이 아니면 받침 없음 취급
  return (c - 0xac00) % 28 !== 0;
}
function josa(word, marker) {
  const pairs = {
    "와": ["와", "과"], "과": ["와", "과"],
    "를": ["를", "을"], "을": ["를", "을"],
    "는": ["는", "은"], "은": ["는", "은"],
    "가": ["가", "이"], "이": ["가", "이"],
  };
  if (marker === "로" || marker === "으로") {
    const c = word.charCodeAt(word.length - 1);
    const jong = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0;
    return jong === 0 || jong === 8 ? "로" : "으로"; // 받침 없음 또는 ㄹ받침 -> "로"
  }
  const pair = pairs[marker];
  if (!pair) return marker;
  return hasFinalConsonant(word) ? pair[1] : pair[0];
}

/** {ko} / {cpKo} 뒤에 붙은 조사를 받침에 맞춰 교정하며 치환한다 */
function fillKo(str, word, token) {
  const re = new RegExp(`\\{${token}\\}(으로|와|과|를|을|는|은|가|이|로)?`, "g");
  return str.replace(re, (_, marker) => word + (marker ? josa(word, marker) : ""));
}

function fill(str, t) {
  let out = str.replaceAll("{en}", t.en);
  out = out.replaceAll("{cp}", t.roleplay ? t.roleplay.counterpart : "them");
  out = fillKo(out, t.ko, "ko");
  out = fillKo(out, t.roleplay ? t.roleplay.counterpartKo : "상대", "cpKo");
  return out;
}

// 사전을 읽어 문항별 glossary 를 구성 (뜻이 있는 단어만, 상위 8개)
const dictSrc = fs.readFileSync("lib/dictionary.ts", "utf8");
const DICT = {};
for (const dm of dictSrc.matchAll(/^\s{2}([a-z_]+):\s*"([^"]+)",/gm)) DICT[dm[1]] = dm[2];

const STOP = new Set(["a","an","the","of","to","in","on","at","and","or","is","are","am","was","were","be","it","i","you","your","do","does","did","that","this","for","as","with","from","not","no","yes","me","my","so"]);

function glossaryFor(en) {
  const seen = new Set();
  const out = [];
  for (const w of en.toLowerCase().match(/[a-z']+/g) ?? []) {
    if (STOP.has(w) || seen.has(w) || !DICT[w]) continue;
    seen.add(w);
    out.push({ en: w, ko: DICT[w] });
    if (out.length >= 8) break;
  }
  return out;
}

const questions = [];
let n = 0;
const push = (q) => questions.push({ id: `q${String(++n).padStart(4, "0")}`, ...q });

// 1) 자기소개 — 밴드마다 하나씩 (문구는 동일, 시험 시작 문항)
for (const band of BANDS) {
  push({
    kind: "intro", topicId: "self", fn: "intro", band,
    textEn: INTRO.en, textKo: INTRO.ko, missionKo: INTRO.mission,
    glossary: glossaryFor(INTRO.en),
  });
}

// 2) 콤보 문항 — 모든 주제 × describe/habit/experience (+ 5-6 은 compare/issue 추가)
for (const t of TOPICS) {
  const kind = t.source === "survey" ? "survey" : "adhoc";
  for (const band of BANDS) {
    for (const fn of ["describe", "habit", "experience"]) {
      for (const tpl of COMBO[fn][band] ?? []) {
        // "설문에서 ~라고 했습니다" 문구는 설문 연동 주제에만 쓴다.
        // 돌발 주제는 설문에 없으므로 그 문구가 붙으면 안 된다.
        if (tpl.surveyOnly && t.source !== "survey") continue;
        push({
          kind, topicId: t.id, fn, band,
          textEn: fill(tpl.en, t), textKo: fill(tpl.ko, t), missionKo: fill(tpl.mission, t),
          glossary: glossaryFor(fill(tpl.en, t)),
        });
      }
    }
    // 어드밴스 축은 advanced 주제에만
    if (!t.advanced) continue;
    for (const fn of ["compare", "issue"]) {
      for (const tpl of COMBO[fn][band] ?? []) {
        push({
          kind: "advanced", topicId: t.id, fn, band,
          textEn: fill(tpl.en, t), textKo: fill(tpl.ko, t), missionKo: fill(tpl.mission, t),
          glossary: glossaryFor(fill(tpl.en, t)),
        });
      }
    }
  }
}

// 3) 롤플레이 — roleplay 가능한 주제만, 3문항 시퀀스
for (const t of TOPICS) {
  if (!t.roleplay) continue;
  for (const band of ["3-4", "5-6"]) {
    for (const fn of ["rp_ask", "rp_solve", "rp_relate"]) {
      for (const tpl of ROLEPLAY[fn][band] ?? []) {
        push({
          kind: "roleplay", topicId: t.id, fn, band,
          textEn: fill(tpl.en, t), textKo: fill(tpl.ko, t), missionKo: fill(tpl.mission, t),
          glossary: glossaryFor(fill(tpl.en, t)),
        });
      }
    }
  }
}

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(path.join("data", "questions.json"), JSON.stringify(questions, null, 2));

const by = (k) => questions.reduce((a, q) => ((a[q[k]] = (a[q[k]] ?? 0) + 1), a), {});
console.log(`총 ${questions.length}문항 / 주제 ${TOPICS.length}종`);
console.log("kind:", by("kind"));
console.log("band:", by("band"));
console.log("fn  :", by("fn"));
