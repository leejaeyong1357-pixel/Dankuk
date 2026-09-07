"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DkuLogo } from "@/components/DkuLogo";
import { currentAccount, updateAccount, type Account } from "@/lib/account";
import { saveProfile } from "@/lib/store";
import type { TargetGrade } from "@/lib/types";

/**
 * 초기 설정 — 공지 → 목표 등급 → 시험 일정.
 *
 * 등록 직후 한 번만 거친다. 목표 등급이 문항 난이도와 모범답안 수준을
 * 정하므로 학습을 시작하기 전에 받아야 한다.
 */
const GRADES: { value: TargetGrade; en: string; desc: string; use: string }[] = [
  { value: "IL", en: "Intermediate Low", desc: "익숙한 주제를 문장으로 이어서 말할 수 있는 단계", use: "일반 지원 최소 구간" },
  { value: "IM1", en: "Intermediate Mid 1", desc: "다양한 주제에 대해 문단 수준으로 답변하는 단계", use: "기술직 일반 요구 구간" },
  { value: "IM2", en: "Intermediate Mid 2", desc: "구체적인 묘사와 설명이 가능하고 흐름이 자연스러운 단계", use: "사무직 지원 최소 구간" },
  { value: "IM3", en: "Intermediate Mid 3", desc: "복잡한 주제도 논리적으로 풀어내는 단계", use: "사무직 일반 요구 구간" },
  { value: "IH", en: "Intermediate High", desc: "돌발 상황에도 유연하게 대처하고 다양한 문법을 구사하는 단계", use: "주요 기업·공공기관 선호 구간" },
  { value: "AL", en: "Advanced Low", desc: "전문 주제를 깊이 있게 논의할 수 있는 최상위 단계", use: "해외 업무·교환학생 지원 구간" },
];

type Step = 1 | 2 | 3;

export default function Setup() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [agreed, setAgreed] = useState([false, false]);
  const [grade, setGrade] = useState<TargetGrade | null>(null);
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    const a = currentAccount();
    if (!a) { router.replace("/register"); return; }
    setAccount(a);
  }, [router]);

  if (!account) return <div className="min-h-screen bg-slate-50" />;

  function finish() {
    updateAccount(account!.email, { targetGrade: grade!, examDate });
    saveProfile({
      name: account!.name,
      email: account!.email,
      targetGrade: grade!,
      examDate,
      createdAt: account!.createdAt,
    });
    router.push("/setup/ready");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-dku-50/40 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center">
          <DkuLogo />
        </div>
        <h1 className="font-brand mt-6 text-center text-2xl text-slate-900">DKU OPIc 초기 설정</h1>
        <p className="mt-1 text-center text-sm text-slate-400">단계 {step} / 3</p>

        {step === 1 && (
          <Notices
            agreed={agreed}
            onToggle={(i) => setAgreed((a) => a.map((v, j) => (j === i ? !v : v)))}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900">목표 등급</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              도달하고 싶은 OPIc 등급을 선택하세요. 문항 난이도와 모범답안 수준이 맞춰집니다.
            </p>

            <div className="mt-5 space-y-2.5">
              {GRADES.map((g) => {
                const on = grade === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGrade(g.value)}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border-2 p-4 text-left transition ${
                      on ? "border-dku-700 bg-dku-50/60" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span>
                      <span className="text-base font-extrabold text-slate-900">{g.value}</span>
                      <span className="ml-1.5 text-sm text-slate-400">{g.en}</span>
                      <span className="mt-1 block text-sm text-slate-600">{g.desc}</span>
                      <span className="mt-1 block text-xs font-bold text-dku-600">{g.use}</span>
                    </span>
                    {on && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />}
                  </button>
                );
              })}
            </div>

            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!grade} />
          </section>
        )}

        {step === 3 && (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900">시험 일정</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              응시 예정일을 입력하면 남은 기간에 맞춰 학습량을 안내합니다.
            </p>

            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="mt-5 w-full rounded-lg border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-dku-500"
            />
            <p className="mt-2 text-xs text-slate-400">아직 정하지 않았다면 대략적인 날짜를 넣어도 됩니다.</p>

            <Nav
              onBack={() => setStep(2)}
              onNext={finish}
              nextDisabled={examDate.length !== 10}
              nextLabel="설정 완료 →"
            />
          </section>
        )}
      </div>
    </div>
  );
}

/** 최초 1회 공지 — 개인정보 처리와 베타 안내 */
function Notices({
  agreed, onToggle, onNext,
}: {
  agreed: boolean[]; onToggle: (i: number) => void; onNext: () => void;
}) {
  const all = agreed.every(Boolean);
  return (
    <>
      <article className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <span className="rounded-full bg-dku-50 px-3 py-1 text-xs font-bold text-dku-700">
          공지 1 · 🔒 개인정보 보호 약속
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-slate-900">
          여러분의 개인정보를 절대 우선합니다
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          DKU OPIc 은 학습자의 개인정보를{" "}
          <strong className="font-bold text-dku-700">절대 우선</strong>하여 설계되었습니다.
        </p>

        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>
            <p className="font-bold">· 관리자도 여러분의 개인 학습 데이터·점수·답변을 볼 수 없습니다.</p>
            <p className="mt-0.5 pl-3 text-xs leading-relaxed text-slate-400">
              모든 답변과 기록은 본인 기기에만 저장되며, 서버로 전송되지 않습니다.
            </p>
          </li>
          <li>
            <p className="font-bold">· 계정과 비밀번호도 이 기기를 벗어나지 않습니다.</p>
            <p className="mt-0.5 pl-3 text-xs leading-relaxed text-slate-400">
              비밀번호는 원문 대신 SHA-256 해시로만 저장됩니다.
            </p>
          </li>
          <li>
            <p className="font-bold">
              · 채점을 위해 <strong className="text-dku-700">답변 텍스트만</strong> AI 채점 서버로
              전송됩니다.
            </p>
            <p className="mt-0.5 pl-3 text-xs leading-relaxed text-slate-400">
              이름·이메일 등 개인 식별 정보는 함께 보내지 않습니다.
            </p>
          </li>
        </ul>

        <p className="mt-4 rounded-lg border-l-4 border-dku-600 bg-dku-50 px-4 py-3 text-sm font-bold text-dku-800">
          걱정 없이 마음껏 사용하셔도 됩니다.
        </p>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5 border-t border-slate-100 pt-5">
          <input
            type="checkbox"
            checked={agreed[0]}
            onChange={() => onToggle(0)}
            className="h-4 w-4 accent-dku-700"
          />
          <span className="text-sm font-semibold text-slate-700">위 내용을 확인했습니다.</span>
        </label>
      </article>

      <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <span className="rounded-full bg-dku-50 px-3 py-1 text-xs font-bold text-dku-700">
          공지 2 · 💬 베타 서비스 안내
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-slate-900">
          처음 만드는 교내 어학 서비스입니다
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          DKU OPIc 은 단국대 재학생 전용 AI 기반 OPIc 학습 서비스로,
          <br />
          <strong className="font-bold">개발 초기 단계에서 일부 렉·버그가 발생할 수 있습니다.</strong>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          문의·건의·버그 제보는 언제든 편하게 연락 바랍니다. 학습 중 불편한 점이나
          개선 아이디어가 있다면 큰 도움이 됩니다.
        </p>

        <div className="mt-4 rounded-xl border-2 border-dku-600 px-4 py-3">
          <p className="text-[11px] font-bold tracking-wider text-dku-600">CONTACT</p>
          <p className="mt-0.5 font-extrabold text-slate-900">운영 담당자</p>
          <p className="mt-0.5 font-mono text-sm text-dku-700">☎ 000-0000-0000</p>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5 border-t border-slate-100 pt-5">
          <input
            type="checkbox"
            checked={agreed[1]}
            onChange={() => onToggle(1)}
            className="h-4 w-4 accent-dku-700"
          />
          <span className="text-sm font-semibold text-slate-700">위 내용을 확인했습니다.</span>
        </label>
      </article>

      <button
        type="button"
        onClick={onNext}
        disabled={!all}
        className="mt-5 w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800 disabled:bg-slate-400"
      >
        {all ? "다음 →" : "공지 2개를 모두 확인해주세요"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">본 공지는 최초 1회만 표시됩니다.</p>
    </>
  );
}

function Nav({
  onBack, onNext, nextDisabled, nextLabel = "다음 →",
}: {
  onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string;
}) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="rounded-xl bg-dku-50 px-5 py-3 text-sm font-bold text-dku-700 transition hover:bg-dku-100"
      >
        ← 이전
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-xl bg-dku-800 px-7 py-3 text-sm font-extrabold text-white transition hover:bg-dku-900 disabled:bg-slate-300"
      >
        {nextLabel}
      </button>
    </div>
  );
}
