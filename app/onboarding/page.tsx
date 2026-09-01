"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { SURVEY } from "@/lib/survey";
import { saveProfile } from "@/lib/store";
import type { SelfAssessment, SurveyAnswer, TargetGrade, UserProfile } from "@/lib/types";

const TARGET_GRADES: { value: TargetGrade; label: string; desc: string }[] = [
  { value: "IL",  label: "IL",  desc: "익숙한 주제를 문장으로 이어 말하기" },
  { value: "IM2", label: "IM2", desc: "구체적 묘사, 자연스러운 흐름 — 취업 최소선" },
  { value: "IM3", label: "IM3", desc: "복잡한 주제도 논리적으로 전개" },
  { value: "IH",  label: "IH",  desc: "낯선 상황·문제 해결까지 — 대기업 다수 기준" },
  { value: "AL",  label: "AL",  desc: "추상 주제 비교·논증, 다문단 발화" },
];

/** 자가평가 6단계 — 실제 시험의 난이도 선택과 동일한 취지 */
const SELF_ASSESSMENT: { level: SelfAssessment; text: string }[] = [
  { level: 1, text: "나는 10단어 이하의 단어로 말할 수 있습니다." },
  { level: 2, text: "나는 기본적인 물건, 색깔, 요일, 음식, 의류, 숫자 등을 말할 수 있습니다." },
  { level: 3, text: "나는 나 자신, 직장, 친숙한 사람과 장소, 일상에 대해 간단한 문장으로 말할 수 있습니다." },
  { level: 4, text: "나는 일상적인 대부분의 주제에 대해 문장을 연결해 자신 있게 말할 수 있습니다." },
  { level: 5, text: "나는 대부분의 주제에 대해 문단 수준으로 자세히 설명하고, 예상치 못한 상황도 다룰 수 있습니다." },
  { level: 6, text: "나는 친숙하지 않은 주제나 추상적인 주제도 논리적으로 근거를 들어 설명할 수 있습니다." },
];

type Step = 0 | 1 | 2 | 3;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetGrade, setTargetGrade] = useState<TargetGrade>("IH");
  const [examDate, setExamDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [level, setLevel] = useState<SelfAssessment>(4);

  const emailValid = /@dankook\.ac\.kr$/i.test(email.trim());
  const step0Ok = name.trim().length > 0 && emailValid && examDate.length === 10;

  const surveyByPart = useMemo(() => {
    const map = new Map<number, typeof SURVEY>();
    for (const q of SURVEY) map.set(q.part, [...(map.get(q.part) ?? []), q]);
    return map;
  }, []);

  const surveyOk = SURVEY.every((q) => {
    const v = answers[q.key];
    if (q.multiple) return Array.isArray(v) && v.length >= q.min;
    return typeof v === "string" && v.length > 0;
  });

  function toggle(q: (typeof SURVEY)[number], label: string) {
    setAnswers((prev) => {
      if (!q.multiple) return { ...prev, [q.key]: label };
      const cur = Array.isArray(prev[q.key]) ? (prev[q.key] as string[]) : [];
      return {
        ...prev,
        [q.key]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label],
      };
    });
  }

  function finish() {
    const profile: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      targetGrade,
      examDate,
      selfAssessment: level,
      survey: answers as unknown as SurveyAnswer,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dku-50 to-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <DkuLogo />

        <div className="mt-6 flex gap-2">
          {["기본 정보", "Background Survey", "자가평가", "확인"].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-dku-600" : "bg-slate-200"}`} />
              <p className={`mt-2 text-xs font-bold ${i <= step ? "text-dku-700" : "text-slate-400"}`}>
                {s}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">시작하기</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                목표 등급과 시험 일정을 먼저 정합니다. AI 피드백이 이 목표에 맞춰집니다.
              </p>

              <label className="mt-6 block text-sm font-bold text-slate-700">이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-dku-500"
              />

              <label className="mt-4 block text-sm font-bold text-slate-700">단국대 이메일</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@dankook.ac.kr"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-dku-500"
              />
              {email && !emailValid && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  @dankook.ac.kr 주소만 사용할 수 있습니다.
                </p>
              )}

              <p className="mt-6 text-sm font-bold text-slate-700">목표 등급</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {TARGET_GRADES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setTargetGrade(g.value)}
                    className={`rounded-xl border-2 p-3.5 text-left transition ${
                      targetGrade === g.value
                        ? "border-dku-600 bg-dku-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base font-extrabold text-dku-700">{g.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-600">{g.desc}</span>
                  </button>
                ))}
              </div>

              <label className="mt-6 block text-sm font-bold text-slate-700">시험 일정</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-dku-500"
              />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">Background Survey</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                질문을 읽고 정확히 답변해 주시기 바랍니다.
                <strong className="text-slate-700"> 이 응답을 기초로 개인별 문항이 출제됩니다.</strong>
              </p>

              {[1, 2, 3, 4].map((part) => (
                <section key={part} className="mt-7">
                  <h2 className="text-lg font-bold text-slate-800">Part {part} of 4</h2>
                  {(surveyByPart.get(part) ?? []).map((q) => {
                    const v = answers[q.key];
                    const chosen = Array.isArray(v) ? v : v ? [v] : [];
                    return (
                      <div key={q.key} className="mt-4">
                        <p className="text-sm font-semibold text-slate-800">{q.prompt}</p>
                        <div className="mt-2 space-y-1.5">
                          {q.options.map((o) => (
                            <label
                              key={o.label}
                              className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                            >
                              <input
                                type={q.multiple ? "checkbox" : "radio"}
                                name={q.key}
                                checked={chosen.includes(o.label)}
                                onChange={() => toggle(q, o.label)}
                                className="mt-0.5 accent-dku-600"
                              />
                              <span className="text-sm text-slate-700">{o.label}</span>
                            </label>
                          ))}
                        </div>
                        {q.multiple && chosen.length < q.min && (
                          <p className="mt-1 text-xs font-semibold text-amber-600">
                            {q.min}개 이상 선택해 주세요 (현재 {chosen.length}개)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">자가평가</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                본인 수준에 가장 가까운 항목을 고르세요. 선택한 단계가 출제 난이도를 결정합니다.
              </p>
              <div className="mt-5 space-y-2">
                {SELF_ASSESSMENT.map((s) => (
                  <button
                    key={s.level}
                    type="button"
                    onClick={() => setLevel(s.level)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                      level === s.level
                        ? "border-dku-600 bg-dku-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="shrink-0 rounded-md bg-dku-700 px-2 py-0.5 text-xs font-extrabold text-white">
                      {s.level}단계
                    </span>
                    <span className="text-sm text-slate-700">{s.text}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                지금 고른 단계로 시작해서, 시험 중 7번 문항 후 한 번 더 조정합니다.
                그래서 최종 난이도가 <strong>{level}-{level}</strong> 이나{" "}
                <strong>{level}-{Math.min(6, level + 1)}</strong> 처럼 두 숫자로 표기됩니다.
                <br />
                난이도 1·2단계는 12문항, 3~6단계는 15문항이 출제됩니다.
                목표가 IM2 이상이면 3단계 이상을 권합니다.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">확인</h1>
              <dl className="mt-5 divide-y divide-slate-100 text-sm">
                {[
                  ["이름", name],
                  ["이메일", email],
                  ["목표 등급", targetGrade],
                  ["시험 일정", examDate],
                  ["시작 난이도", `${level}-${level} (${level <= 2 ? 12 : 15}문항)`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5">
                    <dt className="font-semibold text-slate-500">{k}</dt>
                    <dd className="font-bold text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                설문 응답은 나중에 대시보드에서 다시 수정할 수 있습니다.
              </p>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              ← 이전
            </button>
            {step < 3 ? (
              <button
                type="button"
                disabled={(step === 0 && !step0Ok) || (step === 1 && !surveyOk)}
                onClick={() => setStep((s) => (s + 1) as Step)}
                className="rounded-lg bg-dku-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
              >
                다음 →
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-lg bg-dku-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
              >
                시작하기 →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
