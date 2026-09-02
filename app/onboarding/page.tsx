"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { saveProfile } from "@/lib/store";
import { syncProfile } from "@/lib/sync";
import type { TargetGrade, UserProfile } from "@/lib/types";

/**
 * 최초 1회 온보딩 — 계정과 목표만 받는다.
 * Background Survey 와 난이도 선택은 실제 시험과 같은 순서로
 * 모의고사 시작 흐름(/mock)에서 진행한다.
 */
const TARGET_GRADES: { value: TargetGrade; label: string; desc: string }[] = [
  { value: "IL", label: "IL", desc: "익숙한 주제를 문장으로 이어 말하기" },
  { value: "IM2", label: "IM2", desc: "구체적 묘사, 자연스러운 흐름 — 취업 최소선" },
  { value: "IM3", label: "IM3", desc: "복잡한 주제도 논리적으로 전개" },
  { value: "IH", label: "IH", desc: "낯선 상황·문제 해결까지 — 대기업 다수 기준" },
  { value: "AL", label: "AL", desc: "추상 주제 비교·논증, 다문단 발화" },
];

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetGrade, setTargetGrade] = useState<TargetGrade>("IH");
  const [examDate, setExamDate] = useState("");

  const emailValid = /@dankook\.ac\.kr$/i.test(email.trim());
  const ready = name.trim().length > 0 && emailValid && examDate.length === 10;

  async function finish() {
    const profile: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      targetGrade,
      examDate,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    // DB 가 켜져 있으면 서버에도 남긴다. 실패해도 로컬로 계속 진행한다.
    await syncProfile({
      email: profile.email, name: profile.name,
      targetGrade: profile.targetGrade, examDate: profile.examDate,
    });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dku-50 to-slate-50">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <DkuLogo />

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight">시작하기</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            목표 등급과 시험 일정을 먼저 정합니다. AI 피드백이 이 목표에 맞춰집니다.
            <br />
            Background Survey 와 난이도 선택은 실제 시험처럼 모의고사 시작 시 진행합니다.
          </p>

          <label className="mt-7 block text-sm font-bold text-slate-700">이름</label>
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
                  targetGrade === g.value ? "border-dku-600 bg-dku-50" : "border-slate-200 hover:border-slate-300"
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

          <button
            type="button"
            onClick={() => void finish()}
            disabled={!ready}
            className="mt-8 w-full rounded-xl bg-dku-700 px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
          >
            시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
