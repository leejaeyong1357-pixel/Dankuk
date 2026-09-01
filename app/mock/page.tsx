"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { initialLabel, questionCountOf } from "@/lib/difficulty";
import { clearSession, loadResult } from "@/lib/exam-session";

/** 시험 시작 전 안내 — 실제 시험의 오리엔테이션·시설 점검 단계에 해당한다 */
export default function MockIntro() {
  const router = useRouter();
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [soundOk, setSoundOk] = useState(false);

  async function testMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicOk(true);
    } catch {
      setMicOk(false);
    }
  }

  function testSound() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "Hello, this is Ava. Can you hear me clearly? If you can, you are ready to begin.",
    );
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    setSoundOk(true);
  }

  return (
    <AppShell>
      {(profile) => {
        const total = questionCountOf(profile.selfAssessment);
        const prev = loadResult();

        return (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">모의고사</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              내 Background Survey 응답으로 만든 {total}문항 실전 세트입니다. 시작 난이도는{" "}
              <strong className="text-dku-700">{initialLabel(profile.selfAssessment)}</strong> 이며,
              7번 문항 후 한 번 조정합니다.
            </p>

            {prev && (
              <Link
                href="/mock/result"
                className="mt-5 flex items-center justify-between rounded-xl border border-dku-200 bg-dku-50 px-5 py-3.5 transition hover:bg-dku-100"
              >
                <span className="text-sm font-bold text-dku-800">
                  지난 응시 결과 보기 · {prev.grade.grade} ({prev.takenAt.slice(0, 10)})
                </span>
                <span className="text-sm font-bold text-dku-700">→</span>
              </Link>
            )}

            {/* 헤드셋 안내 */}
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-bold text-slate-400">STEP 1</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">🎧 헤드셋을 착용해 주세요</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                실제 시험은 헤드셋을 쓰고 진행합니다. 시작 전에 소리와 마이크가 정상인지 확인하세요.
                주변이 조용한 곳에서 응시해야 음성 인식 정확도가 올라갑니다.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-800">1) 소리 확인</p>
                  <p className="mt-1 text-xs text-slate-500">Ava의 안내 음성이 들리는지 확인합니다.</p>
                  <button
                    type="button"
                    onClick={testSound}
                    className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                  >
                    ▶ 음성 재생
                  </button>
                  {soundOk && (
                    <p className="mt-2 text-xs font-bold text-emerald-600">재생했습니다. 들리셨나요?</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-800">2) 마이크 확인</p>
                  <p className="mt-1 text-xs text-slate-500">브라우저에 마이크 권한을 허용합니다.</p>
                  <button
                    type="button"
                    onClick={testMic}
                    className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                  >
                    🎙 마이크 테스트
                  </button>
                  {micOk === true && (
                    <p className="mt-2 text-xs font-bold text-emerald-600">마이크가 정상입니다.</p>
                  )}
                  {micOk === false && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 진행 방식 */}
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-bold text-slate-400">STEP 2</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">진행 방식</h2>
              <ol className="mt-4 space-y-2.5 text-sm text-slate-700">
                <li>① Ava가 문항을 읽어줍니다. <strong>다시 듣기는 1회</strong> 가능합니다.</li>
                <li>② 답변을 녹음합니다. 답변 시간에 제한은 없습니다.</li>
                <li>
                  ③ <strong className="text-dku-700">7번 문항 후 난이도를 한 번 다시 고릅니다.</strong>{" "}
                  (더 쉬운 / 비슷한 / 더 어려운)
                </li>
                <li>④ {total}문항을 마치면 성적표가 나옵니다.</li>
              </ol>
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                <strong>롤플레이(11~13번)를 건너뛰지 마세요.</strong> 실제 시험에서 이 구간을 넘기면
                점수가 크게 깎입니다. 1번 자기소개는 채점에 반영되지 않으니 편하게 말하세요.
              </p>
            </section>

            <button
              type="button"
              onClick={() => {
                clearSession();
                router.push("/mock/exam");
              }}
              className="mt-6 w-full rounded-xl bg-dku-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-dku-800"
            >
              시험 시작하기 →
            </button>
          </>
        );
      }}
    </AppShell>
  );
}
