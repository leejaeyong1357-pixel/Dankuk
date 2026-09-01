import questions from "@/data/questions.json";
import { TOPIC_BY_ID, ADHOC_TOPICS, TOPICS } from "./topics";
import type {
  DifficultyBand, Question, QuestionFunction, SelfAssessment, SurveyAnswer,
} from "./types";
import { SURVEY } from "./survey";

export const ALL_QUESTIONS = questions as Question[];

export function bandOf(level: SelfAssessment): DifficultyBand {
  if (level <= 2) return "1-2";
  if (level <= 4) return "3-4";
  return "5-6";
}

/** 난이도별 총 문항 수 — 1·2단계는 12문항, 3~6단계는 15문항 */
export function questionCount(level: SelfAssessment): 12 | 15 {
  return level <= 2 ? 12 : 15;
}

/** 설문 응답 → 활성 주제 id 목록 */
export function activeSurveyTopics(survey: SurveyAnswer): string[] {
  const answers = survey as unknown as Record<string, string | string[]>;
  const ids = new Set<string>();
  for (const q of SURVEY) {
    const raw = answers[q.key];
    if (!raw) continue;
    for (const label of Array.isArray(raw) ? raw : [raw]) {
      const opt = q.options.find((o) => o.label === label);
      if (opt?.topicId) ids.add(opt.topicId);
    }
  }
  return [...ids];
}

/** 시드 기반 셔플 — 같은 사용자·같은 회차면 같은 문제지가 나오도록 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(topicId: string, fn: QuestionFunction, band: DifficultyBand, rnd: () => number): Question | null {
  const exact = ALL_QUESTIONS.filter((q) => q.topicId === topicId && q.fn === fn && q.band === band);
  if (exact.length) return exact[Math.floor(rnd() * exact.length)];
  // 해당 밴드에 없으면 인접 밴드로 폴백
  const any = ALL_QUESTIONS.filter((q) => q.topicId === topicId && q.fn === fn);
  return any.length ? any[Math.floor(rnd() * any.length)] : null;
}

export interface ExamSlot {
  no: number;
  /** 화면 표시용 세트 라벨 */
  setLabel: string;
  question: Question;
}

/**
 * 모의고사 문제지 생성 (SPEC §2.5).
 *
 *  1      자기소개 (채점 제외)
 *  2-4    콤보 A
 *  5-7    콤보 B
 *  8-10   콤보 C
 *  11-13  롤플레이
 *  14-15  난이도 3·4 -> 롤플레이2 / 난이도 5·6 -> 어드밴스
 *
 * 콤보 3세트는 설문:돌발 = 2:1 비율로 배정하며 주제는 중복되지 않는다.
 */
export function buildExam(
  survey: SurveyAnswer,
  level: SelfAssessment,
  seed = Date.now(),
): ExamSlot[] {
  const rnd = mulberry32(seed);
  const band = bandOf(level);
  const total = questionCount(level);
  const slots: ExamSlot[] = [];
  const used = new Set<string>();

  const surveyPool = shuffle(
    activeSurveyTopics(survey).filter((id) => TOPIC_BY_ID.has(id)),
    rnd,
  );
  const adhocPool = shuffle(ADHOC_TOPICS.map((t) => t.id), rnd);

  const take = (pool: string[]) => {
    while (pool.length) {
      const id = pool.shift()!;
      if (!used.has(id)) {
        used.add(id);
        return id;
      }
    }
    return null;
  };

  // 1번 — 자기소개
  const intro = ALL_QUESTIONS.find((q) => q.kind === "intro" && q.band === band);
  if (intro) slots.push({ no: 1, setLabel: "자기소개", question: intro });

  // 콤보 3세트: 설문 / 돌발 / 설문 (2:1)
  const comboSources: ("survey" | "adhoc")[] = ["survey", "adhoc", "survey"];
  const comboCount = total === 12 ? 2 : 3;
  let no = 2;
  for (let i = 0; i < comboCount; i++) {
    const wantSurvey = comboSources[i] === "survey";
    const topicId =
      (wantSurvey ? take(surveyPool) : take(adhocPool)) ??
      take(wantSurvey ? adhocPool : surveyPool);
    if (!topicId) break;
    const topic = TOPIC_BY_ID.get(topicId)!;

    // 난이도 5·6 에서는 두 번째 문항을 비교로 치환할 수 있다
    const fns: QuestionFunction[] =
      band === "5-6" && topic.advanced && rnd() < 0.4
        ? ["describe", "compare", "experience"]
        : ["describe", "habit", "experience"];

    for (const fn of fns) {
      const q = pick(topicId, fn, band, rnd) ?? pick(topicId, "describe", band, rnd);
      if (q) slots.push({ no: no++, setLabel: `콤보 ${i + 1} · ${topic.ko}`, question: q });
    }
  }

  // 롤플레이 3문항
  const rpBand: DifficultyBand = band === "1-2" ? "3-4" : band;
  const rpCandidates = shuffle(
    TOPICS.filter((t) => t.roleplay && !used.has(t.id)).map((t) => t.id),
    rnd,
  );
  const rpTopicId = rpCandidates[0];
  if (rpTopicId) {
    used.add(rpTopicId);
    const topic = TOPIC_BY_ID.get(rpTopicId)!;
    for (const fn of ["rp_ask", "rp_solve", "rp_relate"] as QuestionFunction[]) {
      const q = pick(rpTopicId, fn, rpBand, rnd);
      if (q) slots.push({ no: no++, setLabel: `롤플레이 · ${topic.ko}`, question: q });
    }
  }

  // 14·15번 — 난이도에 따라 갈린다
  if (total === 15) {
    if (band === "5-6") {
      const advTopicId = shuffle(
        TOPICS.filter((t) => t.advanced && !used.has(t.id)).map((t) => t.id),
        rnd,
      )[0];
      if (advTopicId) {
        const topic = TOPIC_BY_ID.get(advTopicId)!;
        for (const fn of ["compare", "issue"] as QuestionFunction[]) {
          const q = pick(advTopicId, fn, "5-6", rnd);
          if (q) slots.push({ no: no++, setLabel: `어드밴스 · ${topic.ko}`, question: q });
        }
      }
    } else {
      // 롤플레이 2세트: 설문 주제 묘사 + 상대에게 질문하기
      const rp2 = shuffle(
        TOPICS.filter((t) => t.roleplay && !used.has(t.id)).map((t) => t.id),
        rnd,
      )[0];
      if (rp2) {
        const topic = TOPIC_BY_ID.get(rp2)!;
        const d = pick(rp2, "describe", band, rnd);
        const a = pick(rp2, "rp_ask", "3-4", rnd);
        if (d) slots.push({ no: no++, setLabel: `롤플레이 2 · ${topic.ko}`, question: d });
        if (a) slots.push({ no: no++, setLabel: `롤플레이 2 · ${topic.ko}`, question: a });
      }
    }
  }

  return slots.slice(0, total);
}

/** 학습 모드용 — 유형별 문항 목록 */
export function studyQuestions(topicId: string, band: DifficultyBand): Question[] {
  const order: QuestionFunction[] = [
    "describe", "habit", "experience", "compare", "issue",
    "rp_ask", "rp_solve", "rp_relate",
  ];
  return ALL_QUESTIONS
    .filter((q) => q.topicId === topicId && q.band === band)
    .sort((a, b) => order.indexOf(a.fn) - order.indexOf(b.fn));
}

/** 학습 모드 좌측 목록 — 주제별 보유 문항 수 */
export function topicCounts(band: DifficultyBand) {
  return TOPICS.map((t) => ({
    topic: t,
    count: ALL_QUESTIONS.filter((q) => q.topicId === t.id && q.band === band).length,
  })).filter((x) => x.count > 0);
}
