import { prisma } from "./client";
import type { ExamAnswer, ExamGrade, ExamResult, TargetGrade, UserProfile } from "../types";
import type { DifficultyLevel, DifficultySelection } from "../exam/question-types";
import type { SurveyAnswers } from "../exam/survey";

/**
 * 서버측 데이터 접근을 한 곳에 모은다.
 * 화면·API 라우트는 Prisma 를 직접 호출하지 않는다.
 */

// ── User ───────────────────────────────────────────────────
export async function upsertUser(p: {
  email: string; name: string; targetGrade: TargetGrade; examDate: string;
}) {
  return prisma.user.upsert({
    where: { email: p.email },
    create: p,
    update: { name: p.name, targetGrade: p.targetGrade, examDate: p.examDate },
  });
}

export async function findUser(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function toProfile(u: {
  email: string; name: string; targetGrade: string; examDate: string; createdAt: Date;
}): UserProfile {
  return {
    email: u.email,
    name: u.name,
    targetGrade: u.targetGrade as TargetGrade,
    examDate: u.examDate,
    createdAt: u.createdAt.toISOString(),
  };
}

// ── Survey ─────────────────────────────────────────────────
export async function saveSurvey(userId: string, answers: SurveyAnswers, topics: string[]) {
  return prisma.surveyResponse.create({
    data: { userId, answers: JSON.stringify(answers), topics: JSON.stringify(topics) },
  });
}

export async function latestSurvey(userId: string) {
  const row = await prisma.surveyResponse.findFirst({
    where: { userId }, orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  return {
    id: row.id,
    answers: JSON.parse(row.answers) as SurveyAnswers,
    topics: JSON.parse(row.topics) as string[],
  };
}

// ── Exam ───────────────────────────────────────────────────
export async function createExam(p: {
  examId: string; userId: string; surveyResponseId?: string;
  initialDifficulty: DifficultyLevel; totalQuestions: number; startedAt: string;
}) {
  return prisma.exam.create({
    data: {
      id: p.examId,
      userId: p.userId,
      surveyResponseId: p.surveyResponseId,
      initialDifficulty: p.initialDifficulty,
      totalQuestions: p.totalQuestions,
      startedAt: new Date(p.startedAt),
    },
  });
}

export async function finishExam(p: {
  examId: string;
  secondDifficulty: DifficultyLevel;
  difficultySelection: DifficultySelection;
  finishedAt: string;
  elapsedSec: number;
  grade: ExamGrade;
  gradeProvider: string;
  testletIds: string[];
  questionIds: string[];
  answers: ExamAnswer[];
}) {
  return prisma.$transaction([
    prisma.exam.update({
      where: { id: p.examId },
      data: {
        secondDifficulty: p.secondDifficulty,
        difficultySelection: p.difficultySelection,
        finishedAt: new Date(p.finishedAt),
        elapsedSec: p.elapsedSec,
        grade: JSON.stringify(p.grade),
        gradeProvider: p.gradeProvider,
        testletIds: JSON.stringify(p.testletIds),
        questionIds: JSON.stringify(p.questionIds),
      },
    }),
    prisma.examAnswer.createMany({
      data: p.answers.map((a) => ({
        examId: p.examId,
        no: a.no,
        questionId: a.questionId,
        questionType: a.questionType,
        session: a.session,
        isWarmup: a.isWarmup,
        transcript: a.transcript,
        metrics: JSON.stringify(a.metrics),
      })),
      skipDuplicates: true,
    }),
  ]);
}

/** 중복 회피용 이력 — 최근 시험부터 */
export async function examHistory(userId: string, take = 10) {
  const rows = await prisma.exam.findMany({
    where: { userId, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take,
    select: { id: true, startedAt: true, testletIds: true, questionIds: true },
  });
  return rows.map((r) => ({
    examId: r.id,
    takenAt: r.startedAt.toISOString(),
    testletIds: JSON.parse(r.testletIds) as string[],
    questionIds: JSON.parse(r.questionIds) as string[],
  }));
}

export async function latestExamResult(userId: string): Promise<ExamResult | null> {
  const row = await prisma.exam.findFirst({
    where: { userId, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    include: { answers: { orderBy: { no: "asc" } } },
  });
  if (!row || !row.grade || !row.finishedAt) return null;
  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  return {
    examId: row.id,
    takenAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt.toISOString(),
    initialDifficulty: row.initialDifficulty as DifficultyLevel,
    secondDifficulty: (row.secondDifficulty ?? row.initialDifficulty) as DifficultyLevel,
    difficultySelection: (row.difficultySelection ?? "SIMILAR") as DifficultySelection,
    targetGrade: (user?.targetGrade ?? "IM2") as TargetGrade,
    elapsedSec: row.elapsedSec,
    answers: row.answers.map((a) => ({
      no: a.no,
      questionId: a.questionId,
      questionType: a.questionType,
      session: a.session as 1 | 2,
      isWarmup: a.isWarmup,
      transcript: a.transcript,
      metrics: JSON.parse(a.metrics),
    })),
    grade: JSON.parse(row.grade) as ExamGrade,
    provider: row.gradeProvider ?? "unknown",
  };
}

export async function examCount(userId: string) {
  return prisma.exam.count({ where: { userId, finishedAt: { not: null } } });
}

// ── Practice / Vocab ───────────────────────────────────────
export async function logPractice(p: {
  userId: string; questionId: string; transcript: string;
  metrics: unknown; feedback: unknown;
}) {
  return prisma.practiceLog.create({
    data: {
      userId: p.userId,
      questionId: p.questionId,
      transcript: p.transcript,
      metrics: JSON.stringify(p.metrics),
      feedback: p.feedback ? JSON.stringify(p.feedback) : null,
    },
  });
}

export async function practicedQuestionIds(userId: string) {
  const rows = await prisma.practiceLog.findMany({
    where: { userId }, select: { questionId: true }, distinct: ["questionId"],
  });
  return rows.map((r) => r.questionId);
}

export async function saveVocab(userId: string, en: string, ko: string, sourceQuestionId?: string) {
  return prisma.vocabEntry.upsert({
    where: { userId_en: { userId, en } },
    create: { userId, en, ko, sourceQuestionId },
    update: { ko },
  });
}

export async function listVocab(userId: string) {
  return prisma.vocabEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function deleteVocab(userId: string, en: string) {
  return prisma.vocabEntry.deleteMany({ where: { userId, en } });
}
