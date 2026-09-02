"use client";

import { useEffect, useState } from "react";

/** 전체 시험 타이머. 문항별 강제 제한은 두지 않는다 (시간 배분은 학생 몫). */
export function ExamTimer({
  startedAt,
  totalMinutes,
  onExpire,
}: {
  startedAt: string;
  totalMinutes: number;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const total = totalMinutes * 60;
  const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  const left = Math.max(0, total - elapsed);

  useEffect(() => {
    if (left === 0) onExpire?.();
  }, [left, onExpire]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const warn = left <= 300;

  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-extrabold tabular-nums ${
        warn ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
      }`}
      title="전체 시험 제한 시간"
    >
      ⏱ {mm}:{ss}
    </span>
  );
}
