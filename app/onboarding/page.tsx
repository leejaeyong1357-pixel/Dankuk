"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { saveProfile } from "@/lib/store";
import { requestCode, verifyCode } from "@/lib/sync";
import type { TargetGrade, UserProfile } from "@/lib/types";

/**
 * 최초 1회 온보딩 + 로그인.
 *
 * 단국대 이메일로 인증 코드를 받아 확인해야 계정이 만들어진다.
 * 이메일을 그대로 신뢰하지 않으므로 타인의 기록에 접근할 수 없다.
 * Background Survey 와 난이도 선택은 실제 시험과 같은 순서로 /mock 에서 진행한다.
 */
const TARGET_GRADES: { value: TargetGrade; label: string; desc: string }[] = [
  { value: "IL", label: "IL", desc: "익숙한 주제를 문장으로 이어 말하기" },
  { value: "IM2", label: "IM2", desc: "구체적 묘사, 자연스러운 흐름 — 취업 최소선" },
  { value: "IM3", label: "IM3", desc: "복잡한 주제도 논리적으로 전개" },
  { value: "IH", label: "IH", desc: "낯선 상황·문제 해결까지 — 대기업 다수 기준" },
  { value: "AL", label: "AL", desc: "추상 주제 비교·논증, 다문단 발화" },
];

type Step = "profile" | "code";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetGrade, setTargetGrade] = useState<TargetGrade>("IH");
  const [examDate, setExamDate] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailValid = /^[^@\s]+@dankook\.ac\.kr$/i.test(email.trim());
  const ready = name.trim().length > 0 && emailValid && examDate.length === 10;

  async function sendCode() {
    setBusy(true);
    setError(null);
    const res = await requestCode(email.trim().toLowerCase());
    setBusy(false);

    if (!res) {
      // DB 가 없는 환경에서는 인증 없이 로컬 프로필만 만들고 넘어간다
      finishLocal();
      return;
    }
    if (res.error) { setError(res.error); return; }
    setDevCode(res.devCode ?? null);
    setNotice(
      res.devCode
        ? "메일 서버가 설정되지 않아 화면에 코드를 표시합니다. 운영에서는 메일로 발송됩니다."
        : `${email} 로 인증 코드를 보냈습니다. ${res.expiresInMinutes ?? 10}분 안에 입력해 주세요.`,
    );
    setStep("code");
  }

  function finishLocal() {
    const profile: UserProfile = {
      name: name.trim(), email: email.trim().toLowerCase(),
      targetGrade, examDate, createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    router.push("/dashboard");
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await verifyCode({
      email: email.trim().toLowerCase(),
      code: code.trim(),
      name: name.trim(), targetGrade, examDate,
    });
    setBusy(false);

    if (!res) { setError("네트워크 오류가 발생했습니다."); return; }
    if (res.error) { setError(res.error); return; }
    if (res.profile) saveProfile(res.profile);
    else finishLocal();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dku-50 to-slate-50">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <DkuLogo />

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {step === "profile" ? (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">시작하기</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                단국대 이메일로 본인 확인 후 계정이 만들어집니다.
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

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={!ready || busy}
                className="mt-8 w-full rounded-xl bg-dku-700 px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
              >
                {busy ? "전송 중…" : "인증 코드 받기 →"}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">이메일 인증</h1>
              <p className="mt-1.5 text-sm text-slate-500">{notice}</p>

              {devCode && (
                <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  개발 모드 인증 코드:{" "}
                  <strong className="font-mono text-lg tracking-widest">{devCode}</strong>
                </p>
              )}

              <label className="mt-6 block text-sm font-bold text-slate-700">인증 코드 6자리</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-dku-500"
              />

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void confirm()}
                disabled={code.length !== 6 || busy}
                className="mt-6 w-full rounded-xl bg-dku-700 px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-dku-800 disabled:bg-slate-300"
              >
                {busy ? "확인 중…" : "확인하고 시작하기 →"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("profile"); setCode(""); setError(null); }}
                className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
              >
                ← 정보 수정
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
