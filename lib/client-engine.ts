"use client";

/**
 * 브라우저에서 직접 도는 출제·채점.
 *
 * 서버 없이 정적 호스팅(Cloudflare Pages, Netlify 등)에 올려서
 * 언제 어디서든 접속되게 하기 위한 경로다. API 라우트를 부르지 않는다.
 *
 * 채점은 두 가지 중에서 고른다.
 *   1. 키 없음  — 지표 기반 채점. 아무것도 노출되지 않는다 (기본)
 *   2. 키 있음  — Claude 채점. 정적 사이트에 넣은 키는 브라우저에서 그대로
 *                보이므로, 한도를 건 임시 키만 쓰고 시연이 끝나면 폐기한다
 */
import { ensureBank } from "./exam/bank-browser";
import {
  practiceTopics as practiceTopicsOf,
  questionsForPractice,
  getTestlets,
  type Question,
} from "./exam/repository";
import { generateFirstSession, generateSecondSession, allSlots } from "./exam/generator";
import type { ExamPlan } from "./exam/types";
import type { DifficultyLevel, DifficultySelection } from "./exam/question-types";
import { loadHistory } from "./exam/history";
import { activeProvider, anthropicKey, openAiKey } from "./ai-provider";
import { computeMetrics } from "./metrics";
import { MetricExamGrader } from "./grade-exam";
import type { ExamAnswer, ExamGrade, TargetGrade, Transcript } from "./types";

/** 정적 배포에서는 서버가 없으므로 이 모듈이 유일한 경로다 */
export const STATIC_MODE = process.env.NEXT_PUBLIC_STATIC_MODE === "1";

// ── 출제 ───────────────────────────────────────────────────
export async function generateFirstSessionLocal(p: {
  selectedSurveyTopics: string[];
  initialDifficulty: DifficultyLevel;
}) {
  await ensureBank();
  const plan = generateFirstSession({
    selectedSurveyTopics: p.selectedSurveyTopics,
    initialDifficulty: p.initialDifficulty,
    history: loadHistory(),
  });
  return { plan, slots: allSlots(plan) };
}

export async function generateSecondSessionLocal(p: {
  plan: ExamPlan;
  selection: DifficultySelection;
  selectedSurveyTopics: string[];
}) {
  await ensureBank();
  const full = generateSecondSession({
    plan: p.plan,
    selection: p.selection,
    selectedSurveyTopics: p.selectedSurveyTopics,
    history: loadHistory(),
  });
  return { plan: full, slots: allSlots(full) };
}

// ── 연습 모드 ──────────────────────────────────────────────
export async function practiceTopicsLocal(level: DifficultyLevel) {
  await ensureBank();
  const roleplayTopics = [
    ...new Set(
      getTestlets()
        .filter((t) => t.isRoleplay && level >= t.minDifficulty && level <= t.maxDifficulty)
        .map((t) => t.topic),
    ),
  ];
  return { level, topics: practiceTopicsOf(level), roleplayTopics };
}

export async function practiceQuestionsLocal(topic: string, level: DifficultyLevel) {
  await ensureBank();
  return { level, questions: questionsForPractice(topic, level) as Question[] };
}

// ── 채점 ───────────────────────────────────────────────────
/**
 * 시험 전체 채점.
 * 키가 설정되어 있으면 Claude 를, 없으면 지표 기반 채점을 쓴다.
 */
export async function gradeExamLocal(input: {
  answers: ExamAnswer[];
  targetGrade: TargetGrade;
  initialDifficulty: DifficultyLevel;
  secondDifficulty: DifficultyLevel;
  difficultySelection: DifficultySelection;
}): Promise<{ grade: ExamGrade; provider: string }> {
  const provider = activeProvider();
  if (provider !== "metrics") {
    try {
      const grade = provider === "openai"
        ? await import("./grade-openai").then((m) => m.gradeWithOpenAiInBrowser(input, openAiKey()!))
        : await import("./grade-browser").then((m) => m.gradeWithClaudeInBrowser(input, anthropicKey()!));
      return { grade, provider };
    } catch (err) {
      // 채점이 실패해도 결과 화면은 나와야 한다. 지표 채점으로 내려간다.
      console.error("[grade] AI 채점 실패, 지표 채점으로 대체합니다:", err);
    }
  }
  return { grade: await new MetricExamGrader().grade(input), provider: "metrics" };
}

/** 전사 결과로 지표를 계산한다 (서버 /api/transcribe 대체) */
export function metricsFor(transcript: Transcript) {
  return computeMetrics(transcript);
}
