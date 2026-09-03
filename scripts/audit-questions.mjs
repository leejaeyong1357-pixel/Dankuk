/**
 * 문항 품질 검사.
 *
 * 문항 뱅크는 스크립트로 만들기 때문에 슬롯 치환이 어긋나면
 * 문법이 깨진 문장이 조용히 수천 개 섞인다. 학생은 문항을 듣기만 하므로
 * 어색한 한 문장이 곧 못 푸는 문항이 된다. 생성할 때마다 여기를 통과해야 한다.
 *
 *   npm run audit
 *
 * 검사 항목
 *   1. 문법 결함 — 관사 충돌, 대명사 불일치, 지시 대상 없는 지시어
 *   2. 유형 정합  — 사람 묘사인데 사물이 들어갔는가
 *   3. 다양성    — 주제×난이도마다 학생이 실제로 만나는 고유 문항 수
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANK = path.join(ROOT, "data", "testlets.json");

/**
 * 주제×난이도 한 칸에서 이만큼은 서로 다른 문항이 나와야 한다.
 *
 * 현재 최저값에 맞춰 두었다. 중앙값은 50 언저리이므로 목표치가 아니라
 * 회귀 감지선이다. 이 아래로 떨어지면 문형이 줄었거나 중복이 늘어난 것이다.
 */
const MIN_DISTINCT_PER_CELL = 20;

const testlets = JSON.parse(fs.readFileSync(BANK, "utf8"));
const questions = testlets.flatMap((t) =>
  t.questions.map((q) => ({ ...q, topic: t.topic, level: t.level, testletId: t.id })),
);

// ── 1. 문법 결함 ────────────────────────────────────────────
/** 사람을 가리킬 수 있는 명사구인지 */
const PERSON_WORDS =
  /\b(coworkers?|colleagues?|professors?|teachers?|instructors?|people|friends?|family|members?|players?|partners?|neighbou?rs?|classmates?|person|staff|someone|crew|team ?mates?|roommates?|actors?|artists?|singers?)\b|\bwho you\b/i;

const RULES = [
  {
    id: "article",
    label: "관사·한정사 충돌",
    why: "\"two different your workplace\" 처럼 한정사가 겹쳐 문장이 깨진다",
    test: (q) => /\b(a|an|another|other|two different|two|several|many)\s+(the|your|my|his|her|their)\b/i.test(q.promptText),
  },
  {
    id: "pronoun",
    label: "사람 대명사 불일치",
    why: "사물·장소를 they/who 로 받으면 무엇을 묻는지 알 수 없다",
    test: (q) =>
      /\b(what kind of person|who (are|is) they|they look like|relationship with them)\b/i.test(q.promptText) &&
      !PERSON_WORDS.test(q.promptText),
  },
  {
    id: "dangling",
    label: "지시 대상 없는 지시어",
    why: "testlet 첫 문항은 앞 문맥이 없어 this/it 이 가리킬 것이 없다",
    // 같은 testlet 의 두 번째 문항부터는 앞 문항이 주제를 세워 주므로
    // "How often do you do it?" 이 자연스럽다. 첫 문항만 문제다.
    // 같은 문장 안에 선행사가 있으면 정상이다 ("...your office ... think about it").
    // 선행사 없이 행위를 통째로 가리키는 this 만 잡는다.
    test: (q) =>
      q.testletOrder === 1 &&
      /\b(did|do|tried|enjoyed) this\b|\bthis activity\b/i.test(q.promptText),
  },
  {
    id: "leftover",
    label: "치환되지 않은 슬롯",
    why: "{sub} 같은 자리표시자가 그대로 남으면 그대로 읽힌다",
    test: (q) => /\{[a-zA-Z]+\}/.test(q.promptText) || /\{[a-zA-Z]+\}/.test(q.promptKo ?? ""),
  },
  {
    id: "double-space",
    label: "이중 공백·구두점 오류",
    why: "TTS 가 끊어 읽어 어색해진다",
    test: (q) => /\s{2,}|\s[,.?]|[,.?]{2,}/.test(q.promptText),
  },
];

const findings = new Map();
for (const rule of RULES) {
  const hit = questions.filter(rule.test);
  if (hit.length) findings.set(rule.id, { rule, hit });
}

// ── 1-b. 슬롯에 들어갈 문구 자체를 본다 ─────────────────────
// 렌더링된 문장만 보면 템플릿이 원래 쓴 절("what you know about other
// countries")까지 걸린다. 슬롯에 들어가는 값은 원본에서 직접 검사한다.
const { TOPICS } = await import("../lib/exam/topics.ts");
const slotProblems = [];
for (const topic of TOPICS) {
  for (const s of topic.subTopics) {
    if (/^(where|what|who|when|how|why)\b/i.test(s.en)) {
      slotProblems.push(`${s.id} — 명사구가 아님: "${s.en}"`);
    }
    if (/\b(it|them|this|that)\b/i.test(s.en)) {
      slotProblems.push(`${s.id} — 가리킬 대상이 없는 대명사: "${s.en}"`);
    }
  }
  if (/^(a|an|the|your|my|his|her|their)\s/i.test(topic.plural)) {
    slotProblems.push(`${topic.id} — plural 에 한정사가 붙어 있음: "${topic.plural}"`);
  }
}

// ── 1-c. 사전 커버리지 ──────────────────────────────────────
// 우측 사전은 모르는 단어를 짚어 보라고 만든 기능이다. 짚었는데 아무것도
// 안 뜨면 기능 자체를 믿을 수 없게 되므로, 문항에 나오는 단어는 모두 덮는다.
const { lookup } = await import("../lib/dictionary.ts");
const usedWords = new Set();
for (const q of questions) {
  for (const w of q.promptText.toLowerCase().match(/[a-z']+/g) ?? []) usedWords.add(w);
}
const uncovered = [...usedWords].filter((w) => !lookup(w));

// ── 2. 다양성 ───────────────────────────────────────────────
// 학생이 실제로 보는 단위로 센다.
// 연습 화면은 testlet 의 min~max 난이도 범위로 거르므로(questionsForPractice),
// 난이도 3 을 고르면 2·3·4 로 만든 testlet 이 함께 나온다.
const cells = new Map();
for (const t of testlets) {
  for (let level = t.minDifficulty; level <= t.maxDifficulty; level++) {
    const key = `${t.topic}|${level}`;
    if (!cells.has(key)) cells.set(key, []);
    for (const q of t.questions) cells.get(key).push(q.promptText);
  }
}

const cellRows = [...cells]
  .map(([key, texts]) => ({
    key,
    total: texts.length,
    distinct: new Set(texts).size,
  }))
  // 자기소개는 문항이 하나뿐인 것이 정상이다
  .filter((r) => !r.key.startsWith("SELF|"));

const thin = cellRows.filter((r) => r.distinct < MIN_DISTINCT_PER_CELL);
const allTexts = questions.map((q) => q.promptText);
const distinctAll = new Set(allTexts).size;

// ── 출력 ────────────────────────────────────────────────────
const pct = (n, d) => `${((100 * n) / d).toFixed(1)}%`;
console.log(`문항 ${questions.length}개 / 고유 문장 ${distinctAll}개 (중복 ${pct(questions.length - distinctAll, questions.length)})\n`);

console.log("── 문법·정합 ──────────────────────────────");
if (!findings.size && !slotProblems.length) {
  console.log("   결함 없음");
}
if (slotProblems.length) {
  console.log(`   ✗ 슬롯 문구 ${slotProblems.length}건 — lib/exam/topics.ts`);
  for (const p of slotProblems.slice(0, 5)) console.log(`     · ${p}`);
  if (slotProblems.length > 5) console.log(`     · 그 외 ${slotProblems.length - 5}건`);
}
if (findings.size) {
  for (const { rule, hit } of findings.values()) {
    const samples = [...new Set(hit.map((q) => q.promptText))];
    console.log(`   ✗ ${rule.label} — ${hit.length}문항 / 고유 문형 ${samples.length}`);
    console.log(`     ${rule.why}`);
    for (const s of samples.slice(0, 3)) console.log(`     · ${s}`);
  }
}

console.log("\n── 사전 커버리지 ──────────────────────────");
if (uncovered.length) {
  console.log(`   ✗ 문항 단어 ${usedWords.size}개 중 ${uncovered.length}개가 사전에 없습니다`);
  console.log(`     ${uncovered.slice(0, 15).join(" ")}${uncovered.length > 15 ? " …" : ""}`);
} else {
  console.log(`   문항 단어 ${usedWords.size}개 전부 사전에 있습니다`);
}

console.log("\n── 다양성 ─────────────────────────────────");
const distincts = cellRows.map((r) => r.distinct).sort((a, b) => a - b);
const median = distincts[Math.floor(distincts.length / 2)];
console.log(`   주제×난이도 ${cellRows.length}칸`);
console.log(`   칸마다 고유 문항  최소 ${distincts[0]} / 중앙값 ${median} / 최대 ${distincts.at(-1)}`);
console.log(`   기준(${MIN_DISTINCT_PER_CELL}개) 미달 ${thin.length}칸`);
for (const r of thin.slice(0, 5)) {
  console.log(`     · ${r.key} — ${r.total}문항이지만 고유 ${r.distinct}`);
}
if (thin.length > 5) console.log(`     · 그 외 ${thin.length - 5}칸`);

const failed =
  findings.size > 0 || slotProblems.length > 0 || uncovered.length > 0 || thin.length > 0;
console.log(`\n${failed ? "미달" : "통과"}`);
process.exit(failed ? 1 : 0);
