/**
 * 상황마다 붙는 아이콘 · 색 · 그림 (시안: 메인.png).
 *
 * 카드 왼쪽의 둥근 아이콘과 오른쪽 그림을 상황 id 로 정한다. 시안에 나온 상황은
 * 시안과 같은 그림을, 나오지 않은 상황은 같은 결로 고른 그림을 쓴다.
 * 표에 없는 새 상황은 묶음(group) 이름으로 가늠하고, 그것도 없으면 대화 그림을 쓴다.
 */
import type { ReactNode } from "react";
import type { Art } from "./SceneArt";

export type Tone = "orange" | "blue" | "purple" | "green" | "red" | "sky";

export type IconName =
  | "doc" | "swap" | "cube" | "bulb" | "people" | "bars" | "sun" | "monitor" | "gear" | "calendar"
  | "fileText" | "chart" | "robot" | "trend" | "wrench" | "alert" | "search" | "usersCheck" | "briefcase"
  | "plane" | "bed" | "pin" | "fork" | "gift" | "heart" | "clock" | "mail" | "chat" | "hand" | "coin"
  | "calc" | "server" | "lock" | "id" | "mic" | "check" | "globe" | "truck" | "phone" | "flask"
  | "shield" | "building" | "factory" | "flag" | "home" | "target";

interface Meta {
  icon: IconName;
  tone: Tone;
  art: Art;
}

const M = (icon: IconName, tone: Tone, art: Art): Meta => ({ icon, tone, art });

const BY_ID: Record<string, Meta> = {
  // ── 직무 ─────────────────────────────────────
  j01: M("doc", "blue", "drawing"),
  j02: M("swap", "green", "part"),
  j03: M("cube", "blue", "caliper"),
  j04: M("bulb", "orange", "bulbDoc"),
  j05: M("people", "blue", "handshake"),
  j06: M("bars", "blue", "chartUp"),
  j07: M("sun", "orange", "heatmap"),
  j08: M("monitor", "blue", "monitorHeat"),
  j09: M("gear", "blue", "led"),
  j10: M("calendar", "orange", "clipboard"),
  j11: M("fileText", "purple", "docCheck"),
  j12: M("chart", "green", "lineChart"),
  j13: M("robot", "orange", "lineMachine"),
  j14: M("trend", "orange", "gearArrow"),
  j15: M("wrench", "purple", "machineWarn"),
  j16: M("alert", "orange", "boxX"),
  j17: M("search", "red", "magnifierDoc"),
  j18: M("usersCheck", "green", "audit"),
  j19: M("people", "blue", "factory"),
  j20: M("truck", "orange", "truck"),
  j21: M("flag", "green", "presentation"),
  j22: M("building", "blue", "globeChat"),
  j23: M("coin", "orange", "coins"),
  j24: M("alert", "red", "chat"),
  j25: M("fileText", "blue", "docCheck"),
  j26: M("coin", "orange", "coins"),
  j27: M("clock", "red", "truck"),
  j28: M("target", "blue", "presentation"),
  j29: M("chart", "green", "chartUp"),
  j30: M("mail", "purple", "mail"),
  j31: M("id", "blue", "idCard"),
  j32: M("calendar", "orange", "calendar"),
  j33: M("usersCheck", "green", "people"),
  j34: M("bed", "blue", "hotel"),
  j35: M("fork", "orange", "meal"),
  j36: M("shield", "red", "shield"),
  j37: M("calc", "blue", "calculator"),
  j38: M("coin", "green", "coins"),
  j39: M("trend", "purple", "chartUp"),
  j40: M("server", "red", "server"),
  j41: M("monitor", "blue", "presentation"),
  j42: M("lock", "purple", "shield"),

  // ── 글로벌 미팅 ──────────────────────────────
  m01: M("hand", "orange", "chat"),
  m02: M("doc", "blue", "presentation"),
  m03: M("id", "green", "idCard"),
  m04: M("usersCheck", "blue", "people"),
  m05: M("target", "purple", "presentation"),
  m06: M("trend", "green", "chartUp"),
  m07: M("bars", "blue", "lineChart"),
  m08: M("monitor", "blue", "presentation"),
  m09: M("check", "green", "docCheck"),
  m10: M("clock", "orange", "chat"),
  m11: M("chat", "blue", "chat"),
  m12: M("hand", "purple", "mail"),
  m13: M("alert", "red", "chat"),
  m14: M("check", "green", "handshake"),
  m15: M("clock", "orange", "calendar"),
  m16: M("alert", "red", "boxX"),
  m17: M("alert", "orange", "chat"),
  m18: M("heart", "purple", "handshake"),
  m19: M("truck", "orange", "truck"),
  m20: M("swap", "blue", "drawing"),
  m21: M("factory", "green", "lineMachine"),
  m22: M("coin", "orange", "coins"),
  m23: M("calendar", "blue", "clipboard"),
  m24: M("fileText", "purple", "clipboard"),
  m25: M("calendar", "green", "calendar"),
  m26: M("hand", "blue", "handshake"),
  m27: M("clock", "purple", "clock"),
  m28: M("mail", "blue", "mail"),
  m29: M("people", "green", "people"),
  m30: M("mic", "orange", "chat"),

  // ── 해외출장 ─────────────────────────────────
  t01: M("plane", "blue", "plane"),
  t02: M("shield", "purple", "shield"),
  t03: M("plane", "sky", "plane"),
  t04: M("swap", "orange", "map"),
  t05: M("id", "green", "passport"),
  t06: M("briefcase", "red", "suitcase"),
  t07: M("pin", "blue", "map"),
  t08: M("coin", "orange", "coins"),
  t09: M("phone", "purple", "phone"),
  t10: M("bed", "blue", "hotel"),
  t11: M("bed", "green", "hotel"),
  t12: M("calendar", "orange", "calendar"),
  t13: M("pin", "red", "map"),
  t14: M("building", "blue", "factory"),
  t15: M("target", "green", "presentation"),
  t16: M("factory", "orange", "lineMachine"),
  t17: M("search", "blue", "magnifierDoc"),
  t18: M("shield", "red", "shield"),
  t19: M("alert", "orange", "machineWarn"),
  t20: M("chat", "purple", "globeChat"),
  t21: M("fork", "orange", "meal"),
  t22: M("chat", "green", "chat"),
  t23: M("mail", "blue", "mail"),
  t24: M("gift", "purple", "gift"),
  t25: M("heart", "red", "chat"),
  t26: M("calendar", "orange", "calendar"),
  t27: M("factory", "green", "factory"),
  t28: M("fileText", "blue", "docCheck"),
  t29: M("hand", "purple", "handshake"),
  t30: M("plane", "blue", "suitcase"),
};

export function sceneMeta(id: string): Meta {
  return BY_ID[id] ?? M("chat", "blue", "chat");
}

/** 묶음 머리의 아이콘 — 직무는 큰 구분(연구개발·품질…)으로, 미팅·출장은 묶음 이름으로 */
export function groupIcon(group: string): IconName {
  if (group.startsWith("연구개발")) return "flask";
  if (group.startsWith("생산기술")) return "gear";
  if (group.startsWith("품질")) return "shield";
  if (group.startsWith("영업 및 구매")) return "briefcase";
  if (group.startsWith("경영지원")) return "building";
  if (/공항|비행/.test(group)) return "plane";
  if (/호텔|이동/.test(group)) return "bed";
  if (/현장/.test(group)) return "factory";
  if (/식사/.test(group)) return "fork";
  if (/귀국|변수/.test(group)) return "home";
  if (/묻고/.test(group)) return "chat";
  if (/문제/.test(group)) return "alert";
  if (/마무리/.test(group)) return "check";
  if (/진행/.test(group)) return "trend";
  return "people";
}

export const TONE: Record<Tone, string> = {
  orange: "bg-[#fff2e2] text-[#f08a1c]",
  blue: "bg-[#e8f0fe] text-[#2d65c8]",
  purple: "bg-[#f0ebff] text-[#7b5ce6]",
  green: "bg-[#e3f7ee] text-[#1f9e6b]",
  red: "bg-[#ffe9e9] text-[#e04646]",
  sky: "bg-[#e3f4fd] text-[#1d8fc8]",
};

const P: Record<IconName, ReactNode> = {
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  swap: <><path d="M4 8h13l-3-3M20 16H7l3 3" /></>,
  cube: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></>,
  bulb: <><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.5h6c0-1.2.4-1.9 1-2.5A6 6 0 0 0 12 3z" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2a5 5 0 0 1 5.5 5.8" /></>,
  bars: <><path d="M6 20V11M12 20V5M18 20v-6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  fileText: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 12h6M9 16h4" /></>,
  chart: <><path d="M4 20h16M7 16v-5M12 16V8M17 16v-3" /></>,
  robot: <><rect x="5" y="9" width="14" height="10" rx="2" /><path d="M12 9V5M9 5h6M9 14h.01M15 14h.01M3 13v3M21 13v3" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  wrench: <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></>,
  alert: <><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17h.01" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  usersCheck: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 11l2 2 4-4" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
  plane: <><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></>,
  bed: <><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="2" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  fork: <><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 3c-2 0-3 3-3 6s1 4 3 4v8" /></>,
  gift: <><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M3 13h18M12 9v12M12 9C10 4 6 5 7.5 7.5 8.5 9 12 9 12 9s3.5 0 4.5-1.5C18 5 14 4 12 9z" /></>,
  heart: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  chat: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.3A8 8 0 1 1 21 12z" /></>,
  hand: <><path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-12.6 4.2L4 15a1.6 1.6 0 0 1 2.4-2l.6.8" /></>,
  coin: <><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></>,
  calc: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>,
  server: <><rect x="4" y="4" width="16" height="7" rx="1.5" /><rect x="4" y="13" width="16" height="7" rx="1.5" /><path d="M8 7.5h.01M8 16.5h.01" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2.5" /><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7.5 15h9" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" /></>,
  factory: <><path d="M3 21V10l6 4v-4l6 4V6h4v15z" /><path d="M7 17h2M12 17h2" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  home: <><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
};

export function SceneIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[name]}
    </svg>
  );
}
