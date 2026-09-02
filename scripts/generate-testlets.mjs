/**
 * Testlet 뱅크 생성기.
 *
 * OPIc 의 출제 단위는 문항 하나가 아니라 같은 주제로 묶인 2~3문항 세트(testlet)다.
 * 여기서 topic x subTopic x 난이도 x 기능 조합으로 testlet 을 만들어
 * data/testlets.json 에 쓴다.
 *
 * 실행: npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import { PROMPTS } from "./prompt-templates.mjs";

// ── lib/exam/topics.ts 파싱 ────────────────────────────────
const src = fs.readFileSync("lib/exam/topics.ts", "utf8");

function extractCalls(text) {
  const start = text.indexOf("export const TOPICS");
  const open = text.indexOf("= [", start) + 2;
  const out = [];
  let depth = 0, buf = "";
  for (let i = open + 1; i < text.length; i++) {
    const c = text[i];
    if (c === "]" && depth === 0) break;
    if (c === "(") depth++;
    if (depth > 0) buf += c;
    if (c === ")") {
      depth--;
      if (depth === 0) { out.push(buf); buf = ""; }
    }
  }
  return out;
}

const TOPICS = [];
for (const call of extractCalls(src)) {
  const head = /^\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/.exec(call);
  if (!head) continue;
  const [, id, ko, en, surveyCategory] = head;
  const subTopics = [...call.matchAll(/\["([A-Z_0-9]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)]
    .map((m) => ({ id: m[1], ko: m[2], en: m[3] }));
  const rp = /roleplay:\s*\["([^"]+)",\s*"([^"]+)"\]/.exec(call);
  TOPICS.push({
    id, ko, en, surveyCategory, subTopics,
    roleplay: rp ? { en: rp[1], ko: rp[2] } : null,
    abstract: /abstract:\s*true/.test(call),
  });
}

// ── 난이도별 testlet 구성 ──────────────────────────────────
const tierOf = (level) => (level <= 2 ? "low" : level <= 4 ? "mid" : "high");

/**
 * 콤보 testlet 의 기능 조합.
 * 난이도가 오를수록 요구되는 Speaking Function 자체가 어려워진다.
 */
const COMBO_SHAPES = {
  1: [
    ["DESCRIPTION_PLACE", "PREFERENCE", "ROUTINE"],
    ["DESCRIPTION_OBJECT", "ROUTINE", "PREFERENCE"],
  ],
  2: [
    ["DESCRIPTION_PLACE", "ROUTINE", "PAST_EXPERIENCE"],
    ["DESCRIPTION_OBJECT", "PREFERENCE", "PAST_EXPERIENCE"],
  ],
  3: [
    ["DESCRIPTION_PLACE", "ROUTINE", "PAST_MEMORABLE"],
    ["DESCRIPTION_OBJECT", "PREFERENCE", "PAST_EXPERIENCE"],
    ["DESCRIPTION_PLACE", "PAST_RECENT", "COMPARE"],
  ],
  4: [
    ["DESCRIPTION_PLACE", "ROUTINE", "PAST_MEMORABLE"],
    ["DESCRIPTION_PLACE", "CHANGE", "PAST_MEMORABLE"],
    ["DESCRIPTION_PERSON", "FIRST_EXPERIENCE", "CHANGE_COMPARE"],
  ],
  5: [
    ["DESCRIPTION_PLACE", "CHANGE", "PAST_MEMORABLE"],
    ["ROUTINE", "COMPARE", "PAST_MEMORABLE"],
    ["DESCRIPTION_PERSON", "CHANGE_COMPARE", "OPINION"],
  ],
  6: [
    ["CHANGE", "COMPARE", "ISSUE"],
    ["PAST_MEMORABLE", "CAUSE_EFFECT", "OPINION"],
    ["CHANGE_COMPARE", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL"],
  ],
};

/** 롤플레이 testlet — 항상 3문항이 하나의 rolePlayGroup 을 이룬다 */
const ROLEPLAY_SHAPES = {
  1: null,
  2: [["ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE"]],
  3: [["ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE"]],
  4: [
    ["ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE"],
    ["ROLEPLAY_INFORMATION", "ROLEPLAY_SOLUTION", "ROLEPLAY_PAST_EXPERIENCE"],
  ],
  5: [
    ["ROLEPLAY_INFORMATION", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE"],
    ["ROLEPLAY_ASK", "ROLEPLAY_SOLUTION", "ROLEPLAY_PAST_EXPERIENCE"],
  ],
  6: [
    ["ROLEPLAY_INFORMATION", "ROLEPLAY_SOLUTION", "ROLEPLAY_PAST_EXPERIENCE"],
    ["ROLEPLAY_ASK", "ROLEPLAY_PROBLEM", "ROLEPLAY_PAST_EXPERIENCE"],
  ],
};

/**
 * 시험 마지막 2문항(Q14~15)에 쓰는 상위 기능 세트.
 * 난이도 3 학생에게 추상적인 사회 이슈를 강제하지 않는다.
 */
const CLOSING_SHAPES = {
  1: [["PREFERENCE", "DESCRIPTION_OBJECT"]],
  2: [["PREFERENCE", "PAST_EXPERIENCE"]],
  3: [["COMPARE", "PREFERENCE"]],
  4: [["CHANGE_COMPARE", "OPINION"], ["COMPARE", "CHANGE"]],
  5: [["CHANGE_COMPARE", "OPINION"], ["COMPARE", "CAUSE_EFFECT"]],
  6: [["ISSUE", "CAUSE_EFFECT"], ["ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL"]],
};

/** 추상 기능은 abstract 주제에만 붙인다 */
const ABSTRACT = new Set(["ISSUE", "CAUSE_EFFECT", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL", "OPINION"]);

// ── 한글 조사 교정 ─────────────────────────────────────────
function hasFinal(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
function josa(word, marker) {
  const pairs = {
    "와": ["와", "과"], "과": ["와", "과"], "를": ["를", "을"], "을": ["를", "을"],
    "는": ["는", "은"], "은": ["는", "은"], "가": ["가", "이"], "이": ["가", "이"],
  };
  if (marker === "로" || marker === "으로") {
    const c = word.charCodeAt(word.length - 1);
    const j = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0;
    return j === 0 || j === 8 ? "로" : "으로";
  }
  const p = pairs[marker];
  return p ? (hasFinal(word) ? p[1] : p[0]) : marker;
}
function fillKo(str, token, word) {
  const re = new RegExp(`\\{${token}\\}(으로|와|과|를|을|는|은|가|이|로)?`, "g");
  return str.replace(re, (_, m) => word + (m ? josa(word, m) : ""));
}

function render(tpl, topic, sub) {
  let en = tpl.en
    .replaceAll("{en}", topic.en)
    .replaceAll("{sub}", sub.en)
    .replaceAll("{cp}", topic.roleplay ? topic.roleplay.en : "them");
  let ko = fillKo(tpl.ko, "ko", topic.ko);
  ko = fillKo(ko, "subKo", sub.ko);
  ko = fillKo(ko, "cpKo", topic.roleplay ? topic.roleplay.ko : "상대");
  let mission = fillKo(tpl.mission, "ko", topic.ko);
  mission = fillKo(mission, "subKo", sub.ko);
  return { en, ko, mission };
}

function promptFor(type, level, topic, sub) {
  const byTier = PROMPTS[type];
  if (!byTier) return null;
  const tier = tierOf(level);
  const list = byTier[tier] ?? byTier.mid ?? byTier.high ?? byTier.low;
  if (!list || list.length === 0) return null;
  const tpl = list[0];
  return render(tpl, topic, sub);
}

// ── 생성 ───────────────────────────────────────────────────
const testlets = [];
let tid = 0, qid = 0;

function addTestlet({ topic, level, shape, kind, subOffset }) {
  const usable = shape.every((type) => {
    if (ABSTRACT.has(type) && !topic.abstract) return false;
    return Boolean(PROMPTS[type]);
  });
  if (!usable) return;

  const testletId = `${topic.id}-T${String(++tid).padStart(4, "0")}`;
  const roleplayGroupId = kind === "ROLEPLAY" ? `${testletId}-RP` : null;
  const questions = [];

  shape.forEach((type, i) => {
    const sub = topic.subTopics[(subOffset + i) % topic.subTopics.length];
    const p = promptFor(type, level, topic, sub);
    if (!p) return;
    questions.push({
      id: `${topic.id}-${type}-${String(++qid).padStart(5, "0")}`,
      topic: topic.id,
      subTopic: sub.id,
      subTopicKo: sub.ko,
      surveyCategory: topic.surveyCategory,
      promptText: p.en,
      promptTextKo: p.ko,
      missionKo: p.mission,
      promptAudio: null,
      questionType: type,
      minDifficulty: Math.max(1, level - 1),
      maxDifficulty: Math.min(6, level + 1),
      targetLevel: level <= 2 ? "IL" : level <= 3 ? "IM2" : level <= 4 ? "IM3" : level === 5 ? "IH" : "AL",
      testletId,
      testletOrder: i + 1,
      // 앞 문항은 현재 난이도 수행 확인, 마지막 문항은 한 단계 위 기능 확인
      probeType: i === shape.length - 1 && level >= 3 ? "PROBE" : "LEVEL_CHECK",
      isRoleplay: kind === "ROLEPLAY",
      roleplayGroupId,
      isUnexpected: topic.surveyCategory === "UNEXPECTED",
      sourceType: "GENERATED",
      frequencyWeight: 1,
    });
  });

  if (questions.length !== shape.length) { tid--; return; }

  testlets.push({
    id: testletId,
    kind,
    topic: topic.id,
    topicKo: topic.ko,
    surveyCategory: topic.surveyCategory,
    isUnexpected: topic.surveyCategory === "UNEXPECTED",
    isRoleplay: kind === "ROLEPLAY",
    roleplayGroupId,
    level,
    minDifficulty: Math.max(1, level - 1),
    maxDifficulty: Math.min(6, level + 1),
    createdAt: "2026-09-01",
    questions,
  });
}

for (const topic of TOPICS) {
  for (let level = 1; level <= 6; level++) {
    (COMBO_SHAPES[level] ?? []).forEach((shape, i) =>
      addTestlet({ topic, level, shape, kind: "COMBO", subOffset: i }));

    if (topic.roleplay) {
      (ROLEPLAY_SHAPES[level] ?? []).forEach((shape, i) =>
        addTestlet({ topic, level, shape, kind: "ROLEPLAY", subOffset: i }));
    }

    (CLOSING_SHAPES[level] ?? []).forEach((shape, i) =>
      addTestlet({ topic, level, shape, kind: "CLOSING", subOffset: i + 1 }));
  }
}

// 자기소개는 topic 없는 단일 문항 testlet
const intro = PROMPTS.SELF_INTRODUCTION.mid[0];
testlets.push({
  id: "SELF-INTRO",
  kind: "INTRO",
  topic: "SELF",
  topicKo: "자기소개",
  surveyCategory: "UNEXPECTED",
  isUnexpected: false,
  isRoleplay: false,
  roleplayGroupId: null,
  level: 0,
  minDifficulty: 1,
  maxDifficulty: 6,
  createdAt: "2026-09-01",
  questions: [{
    id: "SELF-INTRO-001",
    topic: "SELF",
    subTopic: "SELF",
    subTopicKo: "자기소개",
    surveyCategory: "UNEXPECTED",
    promptText: intro.en,
    promptTextKo: intro.ko,
    missionKo: intro.mission,
    promptAudio: null,
    questionType: "SELF_INTRODUCTION",
    minDifficulty: 1,
    maxDifficulty: 6,
    targetLevel: "IL",
    testletId: "SELF-INTRO",
    testletOrder: 1,
    probeType: "LEVEL_CHECK",
    isRoleplay: false,
    roleplayGroupId: null,
    isUnexpected: false,
    sourceType: "GENERATED",
    frequencyWeight: 1,
  }],
});

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(path.join("data", "testlets.json"), JSON.stringify(testlets, null, 2));

const q = testlets.flatMap((t) => t.questions);
const count = (arr, k) => arr.reduce((a, x) => ((a[x[k]] = (a[x[k]] ?? 0) + 1), a), {});
console.log(`testlet ${testlets.length}개 / 문항 ${q.length}개 / 주제 ${TOPICS.length}종`);
console.log("kind :", count(testlets, "kind"));
console.log("level:", count(testlets, "level"));
console.log("type :", Object.keys(count(q, "questionType")).length, "종");
console.log("probe:", count(q, "probeType"));
