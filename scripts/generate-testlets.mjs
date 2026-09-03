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
import { createHash } from "node:crypto";
import { PROMPTS } from "./prompt-templates.mjs";
import { VARIANTS } from "./prompt-variants.mjs";
import { EXTRA_VARIANTS } from "./prompt-variants-extra.mjs";

/** 기본 문형과 변형을 합친다 */
const ALL_PROMPTS = {};
for (const src of [PROMPTS, VARIANTS, EXTRA_VARIANTS]) {
  for (const [type, tiers] of Object.entries(src)) {
    ALL_PROMPTS[type] ??= {};
    for (const [tier, list] of Object.entries(tiers)) {
      ALL_PROMPTS[type][tier] = [...(ALL_PROMPTS[type][tier] ?? []), ...list];
    }
  }
}

/**
 * 주제·난이도별 목표 문항 수.
 * testlet 은 min~max 3개 난이도에 걸치므로, 학생이 한 난이도에서 실제로 보게 되는
 * 문항 수는 authored(L-1) + authored(L) + authored(L+1) 이다.
 * 20 이면 난이도당 60문항 이상이 확보된다.
 */
const TARGET_PER_LEVEL = 20;
/** 난이도 1·6 은 인접 난이도가 한쪽뿐이라 더 많이 만들어야 같은 노출량이 나온다 */
const TARGET_EDGE = 34;

// ── 주제 ───────────────────────────────────────────────────
// 예전에는 topics.ts 를 정규식으로 다시 파싱했다. 자료 구조가 바뀌면
// 오류 없이 0개를 읽고 빈 뱅크를 만들어 버려서, 실제로 import 한다.
// (--import ./scripts/register-ts.mjs 로 실행한다. package.json 참고)
const { TOPICS } = await import("../lib/exam/topics.ts");

if (!TOPICS?.length) {
  console.error("lib/exam/topics.ts 에서 주제를 읽지 못했습니다.");
  process.exit(1);
}
for (const t of TOPICS) {
  if (!t.subTopics?.length) {
    console.error(`주제 ${t.id} 에 세부주제가 없습니다.`);
    process.exit(1);
  }
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
    ["DESCRIPTION_PLACE", "ROUTINE", "PREFERENCE"],
    ["DESCRIPTION_OBJECT", "PREFERENCE", "ROUTINE"],
  ],
  2: [
    ["DESCRIPTION_PLACE", "ROUTINE", "PAST_EXPERIENCE"],
    ["DESCRIPTION_OBJECT", "PREFERENCE", "PAST_EXPERIENCE"],
    ["DESCRIPTION_PLACE", "PREFERENCE", "PAST_RECENT"],
    ["DESCRIPTION_OBJECT", "ROUTINE", "PAST_RECENT"],
  ],
  3: [
    ["DESCRIPTION_PLACE", "ROUTINE", "PAST_MEMORABLE"],
    ["DESCRIPTION_OBJECT", "PREFERENCE", "PAST_EXPERIENCE"],
    ["DESCRIPTION_PLACE", "PAST_RECENT", "COMPARE"],
    ["DESCRIPTION_PERSON", "ROUTINE", "PAST_EXPERIENCE"],
    ["DESCRIPTION_PLACE", "PREFERENCE", "PAST_MEMORABLE"],
  ],
  4: [
    ["DESCRIPTION_PLACE", "ROUTINE", "PAST_MEMORABLE"],
    ["DESCRIPTION_PLACE", "CHANGE", "PAST_MEMORABLE"],
    ["DESCRIPTION_PERSON", "FIRST_EXPERIENCE", "CHANGE_COMPARE"],
    ["DESCRIPTION_OBJECT", "ROUTINE", "COMPARE"],
    ["DESCRIPTION_PLACE", "PAST_RECENT", "CHANGE"],
  ],
  5: [
    ["DESCRIPTION_PLACE", "CHANGE", "PAST_MEMORABLE"],
    ["ROUTINE", "COMPARE", "PAST_MEMORABLE"],
    ["DESCRIPTION_PERSON", "CHANGE_COMPARE", "OPINION"],
    ["DESCRIPTION_PLACE", "FIRST_EXPERIENCE", "CHANGE_COMPARE"],
    ["ROUTINE", "PAST_MEMORABLE", "COMPARE"],
  ],
  6: [
    // 추상 기능이 붙는 조합 — abstract 주제에만 적용된다
    ["CHANGE", "COMPARE", "ISSUE"],
    ["PAST_MEMORABLE", "CAUSE_EFFECT", "OPINION"],
    ["CHANGE_COMPARE", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL"],
    // 추상 기능 없이도 난이도 6 수준을 요구하는 조합 — 모든 주제에 쓸 수 있다
    ["CHANGE", "COMPARE", "PAST_MEMORABLE"],
    ["CHANGE_COMPARE", "PAST_MEMORABLE", "COMPARE"],
    ["DESCRIPTION_PERSON", "CHANGE", "CHANGE_COMPARE"],
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
    .replaceAll("{plural}", topic.plural)
    .replaceAll("{sub}", sub.en)
    .replaceAll("{cp}", topic.roleplay ? topic.roleplay.en : "them");
  let ko = fillKo(tpl.ko, "ko", topic.ko);
  ko = fillKo(ko, "subKo", sub.ko);
  ko = fillKo(ko, "cpKo", topic.roleplay ? topic.roleplay.ko : "상대");
  let mission = fillKo(tpl.mission, "ko", topic.ko);
  mission = fillKo(mission, "subKo", sub.ko);
  return { en, ko, mission };
}

/**
 * 문형이 요구하는 세부주제 종류.
 *
 * "What kind of person are they?" 에 "내 방"이 들어가면 답할 수 없다.
 * 여기 적힌 유형은 맞는 종류의 세부주제로만 출제한다.
 * 적지 않은 유형은 어떤 세부주제든 받는다.
 */
const REQUIRES_KIND = {
  DESCRIPTION_PERSON: ["person"],
  DESCRIPTION_PLACE: ["place"],
  DESCRIPTION_OBJECT: ["thing"],
};

/** 이 유형에 쓸 수 있는 세부주제. 맞는 것이 없으면 빈 배열 */
function subTopicsFor(type, topic) {
  const kinds = REQUIRES_KIND[type];
  if (!kinds) return topic.subTopics;
  return topic.subTopics.filter((s) => kinds.includes(s.kind));
}

function promptsFor(type, level) {
  const byTier = ALL_PROMPTS[type];
  if (!byTier) return [];
  const tier = tierOf(level);
  return byTier[tier] ?? byTier.mid ?? byTier.high ?? byTier.low ?? [];
}

function promptFor(type, level, topic, sub, variant = 0) {
  const list = promptsFor(type, level);
  if (list.length === 0) return null;
  return render(list[variant % list.length], topic, sub);
}

// ── 생성 ───────────────────────────────────────────────────
const testlets = [];
let tid = 0;
/** 같은 문항 조합이 중복 생성되지 않게 서명을 기록한다 */
const seenSignatures = new Set();
/** 주제×난이도 칸마다 이미 쓴 문장. 같은 칸 안에서는 반복하지 않는다 */
const usedInCell = new Map();

function addTestlet({ topic, level, shape, kind, subOffset, variant = 0 }) {
  const usable = shape.every((type) => {
    if (ABSTRACT.has(type) && !topic.abstract) return false;
    // 문형이 요구하는 종류의 세부주제가 이 주제에 없으면 만들지 않는다.
    // 억지로 채우면 사물을 사람처럼 묻는 문항이 나온다.
    if (subTopicsFor(type, topic).length === 0) return false;
    return promptsFor(type, level).length > 0;
  });
  if (!usable) return false;

  const testletId = `${topic.id}-T${String(++tid).padStart(4, "0")}`;
  const roleplayGroupId = kind === "ROLEPLAY" ? `${testletId}-RP` : null;
  const questions = [];

  shape.forEach((type, i) => {
    const pool = subTopicsFor(type, topic);
    const sub = pool[(subOffset + i) % pool.length];
    const p = promptFor(type, level, topic, sub, variant + i * 5);
    if (!p) return;
    questions.push({
      // 내용 기반 id. 문항 뱅크를 다시 만들어도 같은 문장이면 id 가 유지되므로
      // 이미 생성해 둔 음성 파일이 무효화되지 않는다.
      id: `${topic.id}-${type}-${createHash("sha1").update(p.en).digest("hex").slice(0, 8)}`,
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

  if (questions.length !== shape.length) { tid--; return false; }

  // 같은 조합에서 같은 문장이 다시 나오면 새 testlet 을 만들지 않는다
  const signature = questions.map((q) => q.id).join("|");
  if (seenSignatures.has(signature)) { tid--; return false; }

  // 한 주제·난이도 안에서는 같은 문장을 두 번 내보내지 않는다.
  // 연습 목록을 훑는 학생에게 같은 문항이 다시 나오면 문항 수가
  // 아무리 많아도 학습량은 늘지 않는다.
  const cell = `${topic.id}|${level}`;
  const used = usedInCell.get(cell) ?? new Set();
  if (questions.some((q) => used.has(q.promptText))) { tid--; return false; }

  seenSignatures.add(signature);
  for (const q of questions) used.add(q.promptText);
  usedInCell.set(cell, used);

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
  return true;
}

for (const topic of TOPICS) {
  for (let level = 1; level <= 6; level++) {
    // shape x subTopic 오프셋 x 문형 변형 조합을 돌며 목표 개수까지 채운다.
    // 난이도 1·6 은 인접 난이도가 한쪽뿐이라 더 많이 만들어야 노출량이 같아진다.
    const target = level === 1 || level === 6 ? TARGET_EDGE : TARGET_PER_LEVEL;
    const plans = [];
    for (let variant = 0; variant < 8; variant++) {
      for (let off = 0; off < topic.subTopics.length; off++) {
        for (const shape of COMBO_SHAPES[level] ?? []) {
          plans.push({ kind: "COMBO", shape, subOffset: off, variant });
        }
        if (topic.roleplay) {
          for (const shape of ROLEPLAY_SHAPES[level] ?? []) {
            plans.push({ kind: "ROLEPLAY", shape, subOffset: off, variant });
          }
        }
        for (const shape of CLOSING_SHAPES[level] ?? []) {
          plans.push({ kind: "CLOSING", shape, subOffset: off, variant });
        }
      }
    }

    let authored = 0;
    for (const plan of plans) {
      if (authored >= target) break;
      if (addTestlet({ topic, level, ...plan })) authored += plan.shape.length;
    }
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
