"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { currentAccount, updateAccount, type Account } from "@/lib/account";
import { saveProfile } from "@/lib/store";
import type { TargetGrade } from "@/lib/types";

/**
 * 초기 설정 — 서비스 안내 → 목표 등급 → 시험 일정.
 *
 * 등록 직후 한 번 거친다. 목표 등급이 문항 난이도와 모범답안 수준을 정하므로
 * 학습을 시작하기 전에 받아야 한다.
 */
const GRADES: { value: TargetGrade; en: string; desc: string }[] = [
  { value: "IL", en: "Intermediate Low", desc: "익숙한 주제를 간단한 문장으로" },
  { value: "IM1", en: "Intermediate Mid 1", desc: "다양한 주제를 문장으로 연결하기" },
  { value: "IM2", en: "Intermediate Mid 2", desc: "구체적인 묘사와 자연스러운 설명" },
  { value: "IM3", en: "Intermediate Mid 3", desc: "복잡한 주제도 논리적으로 전달" },
  { value: "IH", en: "Intermediate High", desc: "예상 밖의 상황에도 유연하게 대응" },
  { value: "AL", en: "Advanced Low", desc: "다양한 시제로 깊이 있게 이야기" },
];

const STEPS = ["서비스 안내", "목표 등급", "시험 일정"];

export default function Setup() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState([false, false]);
  const [grade, setGrade] = useState<TargetGrade | null>(null);
  const [examDate, setExamDate] = useState("");
  const [undecided, setUndecided] = useState(false);

  useEffect(() => {
    const a = currentAccount();
    if (!a) { router.replace("/register"); return; }
    setAccount(a);
    if (a.targetGrade) setGrade(a.targetGrade);
    if (a.examDate) setExamDate(a.examDate);
  }, [router]);

  if (!account) return <div className="min-h-screen bg-slate-50" />;

  function finish() {
    // 일정을 정하지 않은 사람에게는 넉넉히 한 달 뒤를 임시로 잡아 준다.
    // 마이페이지에서 언제든 바꿀 수 있고, 화면에도 그렇게 적어 둔다.
    const date = undecided || !examDate ? plusDays(30) : examDate;
    updateAccount(account!.email, { targetGrade: grade!, examDate: date });
    saveProfile({
      name: account!.name,
      email: account!.email,
      targetGrade: grade!,
      examDate: date,
      createdAt: account!.createdAt,
    });
    router.push("/setup/ready");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-dku-50/40">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        <BrandLogo />
        <span className="font-brand text-lg text-slate-900">{BRAND.productShort}</span>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <Stepper step={step} />

        {step === 0 && (
          <Notices
            agreed={agreed}
            onToggle={(i) => setAgreed((a) => a.map((v, j) => (j === i ? !v : v)))}
            onBack={() => router.push("/")}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <GradeStep
            grade={grade}
            onPick={setGrade}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <DateStep
            examDate={examDate}
            onPick={setExamDate}
            undecided={undecided}
            onToggleUndecided={() => setUndecided((v) => !v)}
            onBack={() => setStep(1)}
            onFinish={finish}
          />
        )}
      </div>
    </main>
  );
}

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── 단계 표시 ───────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-center gap-3 py-8 sm:gap-5">
      {STEPS.map((label, i) => {
        const done = i < step;
        const on = i === step;
        return (
          <li key={label} className="flex items-center gap-3 sm:gap-5">
            <span className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                  done || on ? "bg-dku-600 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-sm font-bold ${
                  on ? "text-dku-700" : done ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span className={`h-px w-10 sm:w-20 ${i < step ? "bg-dku-500" : "bg-slate-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Nav({
  onBack, onNext, nextDisabled, nextLabel, hint,
}: {
  onBack: () => void; onNext: () => void;
  nextDisabled?: boolean; nextLabel: string; hint?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-bold text-slate-600 transition hover:bg-slate-50"
      >
        ← 이전
      </button>
      {hint && <span className="text-sm text-slate-400">{hint}</span>}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-xl bg-dku-600 px-8 py-3.5 font-bold text-white transition hover:bg-dku-700 disabled:bg-slate-300"
      >
        {nextLabel} <span aria-hidden>→</span>
      </button>
    </div>
  );
}

// ── 1. 서비스 안내 ──────────────────────────────────────────
function Notices({
  agreed, onToggle, onBack, onNext,
}: {
  agreed: boolean[]; onToggle: (i: number) => void;
  onBack: () => void; onNext: () => void;
}) {
  const all = agreed.every(Boolean);
  return (
    <>
      <h1 className="hero-headline text-center text-3xl text-slate-900 sm:text-4xl">
        시작 전에 확인해주세요
      </h1>
      <p className="mt-3 text-center text-slate-500">안전하고 편리한 학습을 위한 서비스 안내입니다.</p>

      <div className="mt-9 grid gap-6 lg:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dku-50 text-dku-600">
              <ShieldIcon />
            </span>
            <span className="rounded-full bg-dku-50 px-3 py-1.5 text-xs font-bold text-dku-700">
              개인정보 보호
            </span>
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            학습자의 개인정보를 소중하게
          </h2>
          <hr className="mt-4 border-slate-100" />
          <p className="mt-4 leading-relaxed text-slate-600">
            {BRAND.productShort}은 학습자의 개인정보를 절대 우선하여 설계되었습니다.
          </p>
          <ul className="mt-4 space-y-2.5 text-slate-600">
            {[
              "개인 학습 데이터는 기기에 저장됩니다.",
              "채점을 위한 답변 텍스트는 AI 채점 서버로 전송됩니다.",
              "이름·이메일 등 식별 정보는 함께 보내지 않습니다.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-dku-500" />
                {t}
              </li>
            ))}
          </ul>
          <label className="mt-auto flex cursor-pointer items-center gap-3 border-t border-slate-100 pt-6">
            <input
              type="checkbox"
              checked={agreed[0]}
              onChange={() => onToggle(0)}
              className="h-4 w-4 accent-dku-600"
            />
            <span className="font-semibold text-slate-700">개인정보 안내를 확인했습니다.</span>
          </label>
        </article>

        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dku-50 text-dku-600">
              <ChatIcon />
            </span>
            <span className="rounded-full bg-dku-50 px-3 py-1.5 text-xs font-bold text-dku-700">
              베타 서비스
            </span>
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            함께 만들어가는 교내 어학 서비스
          </h2>
          <hr className="mt-4 border-slate-100" />
          <p className="mt-4 leading-relaxed text-slate-600">
            {BRAND.productShort}은 {BRAND.memberFull} 전용 AI 기반 OPIc 학습 서비스로, 현재 베타
            운영 중으로 일부 오류가 발생할 수 있습니다.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            불편한 점이나 개선 의견을 알려주세요.
            <br />더 좋은 서비스로 발전할 수 있도록 소중한 의견을 기다립니다.
          </p>

          <div className="mt-5 flex items-center gap-3.5 rounded-2xl bg-slate-50 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-dku-600 shadow-sm">
              <MailIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-400">문의 및 피드백</span>
              <span className="block font-bold text-slate-800">운영 담당자에게 문의</span>
            </span>
            <span className="ml-auto text-slate-300" aria-hidden>›</span>
          </div>

          <label className="mt-auto flex cursor-pointer items-center gap-3 border-t border-slate-100 pt-6">
            <input
              type="checkbox"
              checked={agreed[1]}
              onChange={() => onToggle(1)}
              className="h-4 w-4 accent-dku-600"
            />
            <span className="font-semibold text-slate-700">베타 서비스 안내를 확인했습니다.</span>
          </label>
        </article>
      </div>

      <Nav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!all}
        nextLabel="확인 후 다음으로"
        hint={all ? undefined : "두 안내를 모두 확인해주세요."}
      />
    </>
  );
}

// ── 2. 목표 등급 ────────────────────────────────────────────
function GradeStep({
  grade, onPick, onBack, onNext,
}: {
  grade: TargetGrade | null; onPick: (g: TargetGrade) => void;
  onBack: () => void; onNext: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
      <h1 className="hero-headline text-center text-3xl text-slate-900 sm:text-4xl">
        어떤 등급을 목표로 하나요?
      </h1>
      <p className="mt-3 text-center text-slate-500">
        목표에 맞춰 문항 난이도와 학습 방향을 안내해드려요.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GRADES.map((g) => {
          const on = grade === g.value;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => onPick(g.value)}
              aria-pressed={on}
              className={`rounded-2xl border-2 p-6 text-left transition ${
                on ? "border-dku-500 bg-dku-50/60" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`text-3xl font-black ${on ? "text-dku-600" : "text-slate-900"}`}>
                  {g.value}
                </span>
                <span
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    on ? "bg-dku-600 text-white" : "border-2 border-slate-200 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </div>
              <span className="mt-1 block text-slate-400">{g.en}</span>
              <span className="mt-4 block border-t border-slate-100 pt-4 text-sm text-slate-600">
                {g.desc}
              </span>
            </button>
          );
        })}
      </div>

      <Nav onBack={onBack} onNext={onNext} nextDisabled={!grade} nextLabel="다음" />
    </section>
  );
}

// ── 3. 시험 일정 ────────────────────────────────────────────
function DateStep({
  examDate, onPick, undecided, onToggleUndecided, onBack, onFinish,
}: {
  examDate: string; onPick: (d: string) => void;
  undecided: boolean; onToggleUndecided: () => void;
  onBack: () => void; onFinish: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dku-50 text-dku-600">
          <CalendarIcon />
        </span>
        <h1 className="hero-headline mt-5 text-2xl text-slate-900 sm:text-3xl">
          시험은 언제 예정되어 있나요?
        </h1>
        <p className="mt-3 text-slate-500">남은 기간에 맞춰 학습 계획을 안내해드려요.</p>
      </div>

      <label className="mt-8 block">
        <span className="mb-2 block font-bold text-slate-800">시험 예정일</span>
        <input
          type="date"
          value={examDate}
          disabled={undecided}
          onChange={(e) => onPick(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-lg outline-none transition focus:border-dku-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </label>

      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={undecided}
          onChange={onToggleUndecided}
          className="mt-1 h-4 w-4 accent-dku-600"
        />
        <span>
          <span className="block font-semibold text-slate-700">
            아직 시험 일정이 정해지지 않았어요
          </span>
          <span className="mt-0.5 block text-sm text-dku-600">
            한 달 뒤로 임시 설정합니다. 일정은 나중에도 변경할 수 있어요.
          </span>
        </span>
      </label>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <Nav
          onBack={onBack}
          onNext={onFinish}
          nextDisabled={!undecided && examDate.length !== 10}
          nextLabel="학습 시작하기"
        />
      </div>
    </section>
  );
}

// ── 아이콘 ──────────────────────────────────────────────────
const I = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round",
  strokeLinejoin: "round", "aria-hidden": true } as const;

function ShieldIcon() {
  return <svg {...I}><path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>;
}
function ChatIcon() {
  return <svg {...I}><path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" /><path d="M9 12h6" /></svg>;
}
function MailIcon() {
  return <svg {...I} width="20" height="20"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></svg>;
}
function CalendarIcon() {
  return <svg {...I} width="26" height="26"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /><rect x="7" y="13" width="4" height="4" rx="1" fill="currentColor" stroke="none" /></svg>;
}
