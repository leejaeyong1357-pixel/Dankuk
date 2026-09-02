-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetGrade" TEXT NOT NULL,
    "examDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "topics" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "surveyResponseId" TEXT,
    "initialDifficulty" INTEGER NOT NULL,
    "secondDifficulty" INTEGER,
    "difficultySelection" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "elapsedSec" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT,
    "gradeProvider" TEXT,
    "testletIds" TEXT NOT NULL DEFAULT '[]',
    "questionIds" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "session" INTEGER NOT NULL,
    "isWarmup" BOOLEAN NOT NULL DEFAULT false,
    "transcript" TEXT NOT NULL DEFAULT '',
    "metrics" TEXT NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL DEFAULT '',
    "metrics" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "ko" TEXT NOT NULL,
    "sourceQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SurveyResponse_userId_createdAt_idx" ON "SurveyResponse"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Exam_userId_startedAt_idx" ON "Exam"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ExamAnswer_examId_idx" ON "ExamAnswer"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswer_examId_no_key" ON "ExamAnswer"("examId", "no");

-- CreateIndex
CREATE INDEX "PracticeLog_userId_createdAt_idx" ON "PracticeLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeLog_userId_questionId_idx" ON "PracticeLog"("userId", "questionId");

-- CreateIndex
CREATE INDEX "VocabEntry_userId_idx" ON "VocabEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VocabEntry_userId_en_key" ON "VocabEntry"("userId", "en");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_surveyResponseId_fkey" FOREIGN KEY ("surveyResponseId") REFERENCES "SurveyResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeLog" ADD CONSTRAINT "PracticeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabEntry" ADD CONSTRAINT "VocabEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
