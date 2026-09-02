/**
 * Exam Engine 시나리오 검증 (TEST A ~ E).
 * 실행: npm run verify
 */
import { generateFirstSession, generateSecondSession, allSlots } from "../lib/exam/generator.ts";
import { EXAM_CONFIG } from "../lib/exam/config.ts";
import { applySelection, TYPES_BY_LEVEL } from "../lib/exam/question-types.ts";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) { console.log(`   ✓ ${msg}`); }
  else { console.log(`   ✗ ${msg}`); failures++; }
};

const SURVEY = ["MOVIE", "PARK", "MUSIC", "JOGGING", "DOMESTIC_TRAVEL", "CAFE", "SCHOOL", "DORMITORY"];

function runExam(initial, selection, { history = [], seed = 12345 } = {}) {
  const first = generateFirstSession({
    selectedSurveyTopics: SURVEY, initialDifficulty: initial, history, seed,
  });
  const full = generateSecondSession({
    plan: first, selection, selectedSurveyTopics: SURVEY, history, seed,
  });
  return { plan: full, slots: allSlots(full) };
}

function describe(slots) {
  return slots.map((s) =>
    `${String(s.no).padStart(2)} S${s.session} ${s.testletKind.padEnd(8)} ${s.question.questionType.padEnd(26)} ${s.question.probeType.padEnd(11)} ${s.topicKo}`,
  ).join("\n");
}

function checkCommon(label, initial, selection, expectedCombo) {
  console.log(`\n── ${label} ──────────────────────────────`);
  const { plan, slots } = runExam(initial, selection);
  console.log(describe(slots));

  const expectedTotal = initial <= 2 ? EXAM_CONFIG.low : EXAM_CONFIG.standard;
  ok(slots.length === expectedTotal, `문항 수 ${slots.length} === ${expectedTotal}`);
  ok(plan.firstSession.length === EXAM_CONFIG.firstSessionTarget,
    `1st Session ${plan.firstSession.length}문항`);
  ok(plan.initialDifficulty === initial, `initialDifficulty = ${initial}`);
  ok(plan.secondDifficulty === applySelection(initial, selection),
    `secondDifficulty = ${plan.secondDifficulty}`);
  ok(plan.difficultySelection === selection, `difficultySelection = ${selection}`);
  ok(`${plan.initialDifficulty}-${plan.secondDifficulty}` === expectedCombo,
    `조합 ${plan.initialDifficulty}-${plan.secondDifficulty} === ${expectedCombo}`);

  ok(slots[0].question.questionType === "SELF_INTRODUCTION" && slots[0].isWarmup,
    "Q1 = SELF_INTRODUCTION (isWarmup)");

  // testlet 이 흩어지지 않고 연속 출제되는지
  const runs = [];
  for (const s of slots) {
    const last = runs[runs.length - 1];
    if (last && last.id === s.testletId) last.count++;
    else runs.push({ id: s.testletId, count: 1 });
  }
  const ids = runs.map((r) => r.id);
  ok(new Set(ids).size === ids.length, "같은 testlet 문항이 연속으로 출제됨 (분산되지 않음)");

  // 한 시험 안에서 문항 중복이 없는지
  const qids = slots.map((s) => s.question.id);
  ok(new Set(qids).size === qids.length, "시험 내 문항 중복 없음");

  // 롤플레이 3문항이 같은 그룹으로 묶였는지
  const rp = slots.filter((s) => s.question.isRoleplay);
  if (rp.length) {
    const groups = new Set(rp.map((s) => s.question.roleplayGroupId));
    ok(groups.size === 1 && rp.length === 3, `롤플레이 3문항이 같은 rolePlayGroupId (${rp.length}문항)`);
    const nos = rp.map((s) => s.no);
    ok(nos[2] - nos[0] === 2, `롤플레이가 연속 배치 (Q${nos[0]}~Q${nos[2]})`);
  }

  // 모든 문항 타입이 해당 난이도에서 허용된 것인지
  const level = plan.secondDifficulty;
  const bad = slots.filter((s) =>
    s.session === 2 &&
    !s.isWarmup &&
    !TYPES_BY_LEVEL[level].includes(s.question.questionType));
  ok(bad.length === 0,
    `2nd Session 문항 타입이 난이도 ${level} 허용 범위 내 (위반 ${bad.length}건)`);

  // Level Check / Probe 가 섞여 있는지
  const probes = slots.filter((s) => s.question.probeType === "PROBE").length;
  if (initial >= 3) ok(probes > 0 && probes < slots.length, `Level Check 와 Probe 혼합 (Probe ${probes}문항)`);

  return { plan, slots };
}

// ── TEST A ─────────────────────────────────────────────────
checkCommon("TEST A  난이도 3 -> 비슷함 -> 3-3", 3, "SIMILAR", "3-3");

// ── TEST B ─────────────────────────────────────────────────
{
  const { slots } = checkCommon("TEST B  난이도 5 -> 어려움 -> 5-6", 5, "HARDER", "5-6");
  const ADVANCED = new Set([
    "ISSUE", "CAUSE_EFFECT", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL",
    "OPINION", "CHANGE_COMPARE", "COMPARE", "CHANGE",
    "ROLEPLAY_INFORMATION", "ROLEPLAY_SOLUTION",
  ]);
  const late = slots.filter((s) => s.session === 2);
  const advanced = late.filter((s) => ADVANCED.has(s.question.questionType));
  ok(advanced.length >= 3,
    `후반부에 상위 Function ${advanced.length}문항 (Compare/Change/Issue/Advanced Role Play 등)`);

  // 5-4 와 비교해 실제로 난이도가 올라갔는지
  const easier = runExam(5, "EASIER").slots.filter((s) => s.session === 2);
  const easierAdv = easier.filter((s) => ADVANCED.has(s.question.questionType)).length;
  ok(advanced.length >= easierAdv,
    `5-6 상위 Function(${advanced.length}) >= 5-4 상위 Function(${easierAdv})`);
}

// ── TEST C ─────────────────────────────────────────────────
checkCommon("TEST C  난이도 6 -> 어려움 -> 6-6 유지", 6, "HARDER", "6-6");

// ── TEST D ─────────────────────────────────────────────────
{
  const { slots } = checkCommon("TEST D  난이도 1 -> 쉬움 -> 1-1 유지", 1, "EASIER", "1-1");
  const abstract = slots.filter((s) =>
    ["ISSUE", "CAUSE_EFFECT", "ADVANTAGE_DISADVANTAGE", "HYPOTHETICAL", "OPINION"]
      .includes(s.question.questionType));
  ok(abstract.length === 0, `난이도 1 시험에 추상 기능 문항 없음 (${abstract.length}건)`);
}

// ── TEST E ─────────────────────────────────────────────────
console.log("\n── TEST E  동일 학생 2회 응시 시 중복 회피 ──────────");
{
  const first = runExam(4, "SIMILAR", { seed: 999 });
  const history = [{
    examId: first.plan.examId,
    takenAt: new Date().toISOString(),
    testletIds: first.plan.usedTestletIds,
    questionIds: first.slots.map((s) => s.question.id),
  }];
  const second = runExam(4, "SIMILAR", { history, seed: 4242 });

  const a = new Set(first.plan.usedTestletIds.filter((id) => id !== "SELF-INTRO"));
  const b = second.plan.usedTestletIds.filter((id) => id !== "SELF-INTRO");
  const overlap = b.filter((id) => a.has(id));
  console.log(`   1회차 testlet: ${[...a].join(", ")}`);
  console.log(`   2회차 testlet: ${b.join(", ")}`);
  ok(overlap.length === 0, `2회차에 1회차 testlet 재등장 없음 (겹침 ${overlap.length}건)`);

  const qa = new Set(first.slots.map((s) => s.question.id));
  const qOverlap = second.slots.filter((s) => qa.has(s.question.id) && !s.isWarmup);
  ok(qOverlap.length === 0, `문항 중복 없음 (겹침 ${qOverlap.length}건)`);
}

// ── 출제 실패 방지 (fallback) ──────────────────────────────
console.log("\n── 극단 조건: 설문 주제 1개 + 두꺼운 이력 ─────────");
{
  const thin = generateFirstSession({
    selectedSurveyTopics: ["MOVIE"], initialDifficulty: 5, history: [], seed: 7,
  });
  const full = generateSecondSession({
    plan: thin, selection: "HARDER", selectedSurveyTopics: ["MOVIE"], history: [], seed: 7,
  });
  const s = allSlots(full);
  ok(s.length === EXAM_CONFIG.standard, `설문 주제가 1개여도 ${s.length}문항 생성 (fallback 동작)`);
}

console.log(
  failures === 0
    ? "\n전체 통과\n"
    : `\n실패 ${failures}건\n`,
);
process.exit(failures === 0 ? 0 : 1);
