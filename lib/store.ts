"use client";

import { mirror } from "./remote";
import type { UserProfile } from "./types";

/**
 * 클라이언트 상태 저장소.
 *
 * 읽기는 이 브라우저에서, 쓰기는 여기에 쓴 뒤 곧바로 서버에도 올린다
 * (lib/remote.ts). 서버가 없는 배포에서는 mirror() 가 아무 일도 하지 않으므로
 * 예전처럼 이 기기 안에서만 돈다.
 */
const PROFILE_KEY = "dku-opic:profile";
const PROGRESS_KEY = "dku-opic:progress";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: UserProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  mirror(PROFILE_KEY);
}

export function clearProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(PROGRESS_KEY);
}

export interface Progress {
  /** 학습 완료한 문항 id */
  done: string[];
  /** 마지막 학습일 (YYYY-MM-DD) */
  lastStudied?: string;
  /** 연속 학습일 */
  streak: number;
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { done: [], streak: 0 };
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Progress) : { done: [], streak: 0 };
  } catch {
    return { done: [], streak: 0 };
  }
}

export function markDone(questionId: string) {
  const p = loadProgress();
  if (!p.done.includes(questionId)) p.done.push(questionId);

  const today = new Date().toISOString().slice(0, 10);
  if (p.lastStudied !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    p.streak = p.lastStudied === yesterday ? p.streak + 1 : 1;
    p.lastStudied = today;
  }
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  mirror(PROGRESS_KEY);
  return p;
}

export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
