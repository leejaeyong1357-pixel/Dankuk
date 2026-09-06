"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DkuLogo } from "@/components/DkuLogo";
import { allAccounts, removeAccount, type Account } from "@/lib/account";

/**
 * 관리 화면 — 등록자 / 등록일 / 최근 학습일.
 *
 * 서버가 없는 정적 배포이므로 계정은 각자의 브라우저 안에만 있다.
 * 따라서 이 화면이 보여 주는 것은 "이 기기에서 등록한 사람"뿐이다.
 * 전교생 현황을 보려면 서버(DB)가 필요하다 — 화면에도 그렇게 적어 둔다.
 *
 * 코드 확인도 서버 검증이 아니라 화면 가리개다. 정적 파일이므로
 * 누구든 코드를 읽으면 값을 알 수 있다. 진짜 접근 통제가 필요하면 서버가 있어야 한다.
 */
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "dku-admin";
const UNLOCK_KEY = "dku-opic:admin";

function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function daysAgo(iso?: string): string {
  if (!iso) return "학습 기록 없음";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<Account[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    if (unlocked) setRows(allAccounts());
  }, [unlocked]);

  function unlock() {
    if (code.trim() !== ADMIN_CODE) { setError(true); return; }
    sessionStorage.setItem(UNLOCK_KEY, "1");
    setUnlocked(true);
  }

  function drop(email: string) {
    if (!confirm(`${email} 등록을 이 기기에서 지웁니다. 계속할까요?`)) return;
    removeAccount(email);
    setRows(allAccounts());
  }

  function exportCsv() {
    const head = "이름,이메일,목표등급,시험일,등록일시,최근학습일시";
    const body = rows.map((a) =>
      [a.name, a.email, a.targetGrade ?? "", a.examDate ?? "", a.createdAt, a.lastActiveAt ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["﻿" + [head, ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dku-opic-등록자-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-sm">
          <div className="flex justify-center">
            <DkuLogo />
          </div>
          <h1 className="mt-7 text-center text-xl font-extrabold text-slate-900">관리자 확인</h1>
          <form
            className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(e) => { e.preventDefault(); unlock(); }}
          >
            <label className="block text-sm font-bold text-slate-700">관리 코드</label>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-dku-500"
            />
            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600">코드가 맞지 않습니다.</p>
            )}
            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-dku-800 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-dku-900"
            >
              열기
            </button>
            <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
              정적 사이트라 이 확인은 서버 검증이 아닙니다. 화면을 가릴 뿐이므로
              민감한 정보를 여기에 두지 마세요.
            </p>
          </form>
          <Link href="/" className="mt-5 block text-center text-sm font-semibold text-slate-400">
            ← 홈으로
          </Link>
        </div>
      </div>
    );
  }

  const active = rows.filter((a) => a.lastActiveAt).length;
  const setupDone = rows.filter((a) => a.targetGrade && a.examDate).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <DkuLogo />
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
              등록자 관리
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:text-slate-300"
            >
              CSV 내려받기
            </button>
            <Link
              href="/"
              className="rounded-xl bg-dku-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-dku-800"
            >
              홈으로
            </Link>
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          <strong className="font-extrabold">이 기기에서 등록한 사람만 표시됩니다.</strong> 서버 없이
          동작하는 배포라 계정과 학습 기록이 각자의 브라우저에만 저장됩니다. 여러 사람의 현황을 한
          곳에서 보려면 서버(DB)가 있어야 합니다.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="등록 인원" value={`${rows.length}명`} />
          <Stat label="초기 설정 완료" value={`${setupDone}명`} />
          <Stat label="학습 기록 있음" value={`${active}명`} />
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3">이름</th>
                <th className="px-5 py-3">이메일</th>
                <th className="px-5 py-3">목표 등급</th>
                <th className="px-5 py-3">시험일</th>
                <th className="px-5 py-3">등록일시</th>
                <th className="px-5 py-3">최근 학습</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    이 기기에서 등록한 사람이 아직 없습니다.
                  </td>
                </tr>
              )}
              {rows.map((a) => (
                <tr key={a.email}>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{a.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{a.email}</td>
                  <td className="px-5 py-3.5">
                    {a.targetGrade ? (
                      <span className="rounded-md bg-dku-50 px-2 py-1 text-xs font-bold text-dku-700">
                        {a.targetGrade}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">설정 전</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{a.examDate || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{fmt(a.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-900">{daysAgo(a.lastActiveAt)}</span>
                    <span className="ml-2 text-xs text-slate-400">{fmt(a.lastActiveAt)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => drop(a.email)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          학생의 답변·점수는 여기에 표시되지 않습니다. 등록 시 안내한 대로 개인 학습 데이터는
          본인 기기를 벗어나지 않습니다.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-dku-800">{value}</p>
    </div>
  );
}
