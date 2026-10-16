"use client";

import { COUNTRIES, HOME, type Country } from "@/lib/global/content";
import { Flag, type FlagCode } from "./Flag";
import { KOREA, LAND, px, py } from "@/lib/global/world-paths";

/**
 * 세계지도 — 한국에서 어디로 연결되는지 보여 주는 자리.
 *
 * 윤곽은 손으로 그리지 않는다. Natural Earth(퍼블릭 도메인)를 옮긴
 * lib/global/world-paths.ts 를 그대로 쓰므로 대륙 비율과 나라 위치가 실제와 맞다.
 * 국경선은 긋지 않는다 — 시안이 하나로 이어진 실루엣이고, 1000px 폭에서는
 * 국경선을 넣으면 선이 너무 촘촘해 지저분해진다.
 *
 * 핀 자리는 그 나라의 대략적인 중심이며 사업장 좌표가 아니다.
 *
 * 이름표는 SVG 가 아니라 HTML 로 띄운다. 한글 자간과 그림자가 SVG text 보다
 * 깨끗하다. 겹쳐 놓을 수 있도록 지도 칸의 가로세로비를 viewBox 와 똑같이 묶어
 * 두었다 — 그래야 백분율 좌표가 지도 좌표와 1:1 로 맞는다.
 *
 * 국기는 이모지가 아니라 그림이다. Windows 에는 국기 글꼴이 없어 이모지로 두면
 * 회사 PC 에서 "KR" 같은 글자 두 개로 나온다 (components/global/Flag.tsx).
 */

/**
 * 그려 낼 범위 — 세계지도 전체가 들어가게 잡는다.
 *
 * 전에는 위를 잘라 그린란드와 북극권이 납작하게 눌려 보였다. 이제 경도는
 * -180~180 을 그대로 쓰고, 위도는 그린란드 꼭대기(북위 85도)부터 파타고니아
 * 끝(남위 56도)까지 담는다. 남극은 데이터에서 빠져 있어 아래가 비지 않는다.
 */
const VB = { x: 0, y: 14, w: 1000, h: 392 };

const HOME_X = px(HOME.lon);
const HOME_Y = py(HOME.lat);

/**
 * 이름표를 핀 어느 쪽에 둘지, 연결선을 얼마나 부풀릴지.
 *
 * 선이 서로 겹치지 않도록 나라마다 다르게 준다. 모두 같은 값을 주면
 * 서쪽으로 가는 세 선(폴란드·브라질·멕시코)이 한 줄처럼 포개진다.
 *
 * 중국만 이름표가 왼쪽이다. 핀이 대한민국 바로 옆이라 오른쪽에 두면 겹친다.
 */
const PLACE: Record<Country["code"], { side: "left" | "right"; dy?: number; bow: number }> = {
  US: { side: "right", dy: -2, bow: 0.22 },
  BR: { side: "right", dy: 6, bow: 0.17 },
  PL: { side: "right", dy: -6, bow: 0.3 },
  IN: { side: "right", dy: 12, bow: 0.14 },
  CN: { side: "left", dy: -8, bow: 0.22 },
  AU: { side: "right", bow: 0.22 },
};

/** 지도 좌표 → 칸 안에서의 백분율 */
const lpct = (x: number) => ((x - VB.x) / VB.w) * 100;
const tpct = (y: number) => ((y - VB.y) / VB.h) * 100;

/**
 * 한국에서 그 나라로 가는 곡선.
 *
 * 가운데를 바깥으로 밀어 지구를 돌아가는 인상을 준다.
 * 어느 쪽으로 밀지는 선의 방향이 정해 주므로 선끼리 엇갈리지 않는다.
 */
function link(bx: number, by: number, bow: number): string {
  const dx = bx - HOME_X;
  const dy = by - HOME_Y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = dy / len;
  let ny = -dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const mx = (HOME_X + bx) / 2 + nx * len * bow;
  const my = (HOME_Y + by) / 2 + ny * len * bow;
  return `M${HOME_X} ${HOME_Y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx} ${by}`;
}

export function WorldMap({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div
      className="relative w-full select-none overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
    >
      <svg
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="대한민국에서 멕시코·브라질·폴란드·인도·중국·호주로 이어지는 세계지도"
      >
        <defs>
          {/* 바다 — 흰 배경에서 자연스럽게 떠오르도록 아주 옅게 */}
          <radialGradient id="gm-sea" cx="0.5" cy="0.42" r="0.8">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-50" />
          </radialGradient>

          {/* 육지 — 위에서 아래로 옅은 파랑이 깊어진다 */}
          <linearGradient id="gm-land" x1="0.1" y1="0" x2="0.55" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-dku-100" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-200" />
          </linearGradient>

          {/* 대한민국 */}
          <linearGradient id="gm-home" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-dku-500" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-700" />
          </linearGradient>

          {/* 핀 둘레의 은은한 발광 */}
          <filter id="gm-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>

        <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#gm-sea)" />

        {/* 육지 — 국경선 없이 하나로 이어진 실루엣 */}
        {/*
          그림자를 깔지 않는다. 육지 위쪽이 viewBox 에 잘리는데, 그림자가 그
          단면을 따라 그려져 북극에 가로줄이 하나 생겼다. 깊이는 그라데이션만으로 낸다.
        */}
        <path d={LAND} fill="url(#gm-land)" />

        {/* 연결선 — 모두 대한민국에서 출발한다 */}
        <g fill="none" strokeLinecap="round" className="text-dku-500">
          {COUNTRIES.map((c) => {
            const on = c.code === value;
            return (
              <path
                key={c.code}
                d={link(px(c.lon), py(c.lat), PLACE[c.code].bow)}
                stroke="currentColor"
                strokeWidth={on ? 2.1 : 1.6}
                strokeDasharray="5.5 6.5"
                opacity={on ? 1 : 0.68}
              />
            );
          })}
        </g>

        {/* 대한민국 — 모든 연결의 출발점. 작게 나와 묻히므로 제자리에서 키운다 */}
        <g>
          <circle
            cx={HOME_X}
            cy={HOME_Y}
            r="20"
            className="text-dku-400"
            fill="currentColor"
            opacity="0.3"
            filter="url(#gm-glow)"
          />
          <path
            d={KOREA}
            fill="url(#gm-home)"
            transform={`translate(${HOME_X} ${HOME_Y}) scale(2.9) translate(${-HOME_X} ${-HOME_Y})`}
          />
        </g>

        {/* 핀 */}
        {COUNTRIES.map((c) => (
          <Pin
            key={c.code}
            x={px(c.lon)}
            y={py(c.lat)}
            active={c.code === value}
            label={c.ko}
            onClick={() => onChange(c.code)}
          />
        ))}
        <Pin x={HOME_X} y={HOME_Y} active home label={HOME.ko} />
      </svg>

      {/* 이름표 */}
      <Tag x={HOME_X} y={HOME_Y} side="top" code="KR" ko={HOME.ko} tone="home" always />
      {COUNTRIES.map((c) => {
        const p = PLACE[c.code];
        return (
          <Tag
            key={c.code}
            x={px(c.lon)}
            y={py(c.lat) + (p.dy ?? 0)}
            side={p.side}
            code={c.code}
            ko={c.ko}
            tone={c.code === value ? "on" : "off"}
            onClick={() => onChange(c.code)}
          />
        );
      })}
    </div>
  );
}

/** 핀 — 선명한 파란 원 + 흰 테두리 + 둘레의 발광 */
function Pin({
  x, y, active, home = false, label, onClick,
}: {
  x: number; y: number; active: boolean; home?: boolean; label: string; onClick?: () => void;
}) {
  const r = home ? 5.2 : active ? 4.8 : 4.2;
  return (
    <g
      className={`text-dku-600 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? label : undefined}
    >
      {(active || home) && (
        <circle cx={x} cy={y} r={home ? 11 : 9} fill="currentColor" opacity="0.3" filter="url(#gm-glow)" />
      )}
      {/* 누르기 쉬우라고 보이지 않는 넓은 과녁을 깔아 둔다 */}
      {onClick && <circle cx={x} cy={y} r="13" fill="transparent" />}
      <circle cx={x} cy={y} r={r} fill="currentColor" stroke="#ffffff" strokeWidth="1.7" />
    </g>
  );
}

/** 이름표 — 국기와 한글 이름 */
function Tag({
  x, y, side, code, ko, tone, always = false, onClick,
}: {
  x: number; y: number;
  side: "left" | "right" | "top";
  code: FlagCode; ko: string;
  tone: "home" | "on" | "off";
  /** 좁은 화면에서도 남길 것인가 — 대한민국만 해당한다 */
  always?: boolean;
  onClick?: () => void;
}) {
  const gap = 12;
  const pos =
    side === "top"
      ? { left: `${lpct(x)}%`, top: `${tpct(y - 46)}%`, transform: "translate(-50%,-50%)" }
      : side === "right"
        ? { left: `${lpct(x + gap)}%`, top: `${tpct(y)}%`, transform: "translateY(-50%)" }
        : { left: `${lpct(x - gap)}%`, top: `${tpct(y)}%`, transform: "translate(-100%,-50%)" };

  const skin =
    tone === "home"
      ? "bg-dku-600 text-white"
      : tone === "on"
        ? "bg-white text-dku-800 ring-2 ring-dku-500"
        : "bg-white text-slate-700 ring-1 ring-slate-900/[0.06]";

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      aria-hidden={!onClick}
      style={pos}
      className={`absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 py-1 text-[11px] font-bold shadow-[0_4px_14px_-3px_rgba(29,78,216,0.3)] transition sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-[13px] ${skin} ${
        always
          ? // 대한민국은 지도 오른쪽 끝에 있어, 좁은 화면에서 가운데 맞춤으로 두면
            // 칸 밖으로 잘린다. 좁을 때만 오른쪽 가장자리에 붙인다
            "max-md:!left-auto max-md:!right-1.5 max-md:!translate-x-0"
          : "hidden md:flex"
      } ${onClick ? "hover:-translate-y-px" : "cursor-default"}`}
    >
      <Flag code={code} className="h-[11px] w-[16px] sm:h-[13px] sm:w-[19px]" />
      {ko}
    </button>
  );
}
