"use client";

import { COUNTRIES, HOME, type Country } from "@/lib/global/content";
import { LAND, px, py } from "@/lib/global/world-paths";

/**
 * 세계지도 — 한국에서 어디로 연결되는지 보여 주는 자리.
 *
 * 윤곽은 손으로 그리지 않는다. Natural Earth(퍼블릭 도메인)를 옮긴
 * lib/global/world-paths.ts 를 그대로 쓰므로 대륙 비율과 나라 위치가 실제와 맞다.
 * 나라마다 path 가 하나씩이라 흰 테두리가 곧 국경선이 된다.
 *
 * 핀 자리는 그 나라의 대략적인 중심이며 사업장 좌표가 아니다.
 *
 * 이름표는 SVG 가 아니라 HTML 로 띄운다. 한글 자간과 그림자가 SVG text 보다
 * 깨끗하게 나오고, 국기 이모지도 제 색으로 보인다. 겹쳐 놓을 수 있도록
 * 지도 칸의 가로세로비를 viewBox 와 똑같이 묶어 두었다 — 그래야 백분율
 * 좌표가 지도 좌표와 1:1 로 맞는다.
 */

/**
 * 그려 낼 범위.
 *
 * 남극은 데이터에서 빠져 있고, 그린란드 위쪽은 여기서 잘라 가로로 긴 띠를 만든다.
 * 아래는 파타고니아와 뉴질랜드까지 들어가도록 남위 59도선까지 내린다.
 */
const VB = { x: 8, y: 40, w: 984, h: 376 };

const HOME_X = px(HOME.lon);
const HOME_Y = py(HOME.lat);

/** 대한민국 (ISO 3166-1 숫자 코드) */
const KR = "410";

/**
 * 이름표를 핀 어느 쪽에 둘지, 연결선을 얼마나 부풀릴지.
 *
 * 선이 서로 겹치지 않도록 나라마다 다르게 준다. 모두 같은 값을 주면
 * 서쪽으로 가는 세 선(폴란드·브라질·멕시코)이 한 줄처럼 포개진다.
 */
const PLACE: Record<Country["code"], { side: "left" | "right"; dy?: number; bow: number }> = {
  MX: { side: "left", bow: 0.2 },
  BR: { side: "right", dy: 6, bow: 0.17 },
  PL: { side: "left", dy: -4, bow: 0.3 },
  IN: { side: "right", dy: 12, bow: 0.14 },
  CN: { side: "left", dy: -10, bow: 0.22 },
  AU: { side: "right", bow: 0.22 },
};

/** 지도 좌표 → 칸 안에서의 백분율 */
const lpct = (x: number) => ((x - VB.x) / VB.w) * 100;
const tpct = (y: number) => ((y - VB.y) / VB.h) * 100;

/**
 * 한국에서 그 나라로 가는 곡선.
 *
 * 가운데를 북쪽으로 밀어 지구를 돌아가는 인상을 준다.
 * 어느 쪽으로 밀지는 선의 방향에 따라 정해져, 선끼리 엇갈리지 않는다.
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
  const land = LAND.filter((p) => p.id !== KR);
  const korea = LAND.find((p) => p.id === KR);

  return (
    <div
      className="relative w-full select-none overflow-hidden rounded-xl"
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
          <radialGradient id="gm-sea" cx="0.5" cy="0.44" r="0.78">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-50" />
          </radialGradient>

          {/* 육지 — 위에서 아래로 옅은 파랑이 깊어진다 */}
          <linearGradient id="gm-land" x1="0.15" y1="0" x2="0.65" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-dku-200" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-300" />
          </linearGradient>

          {/* 대한민국 */}
          <linearGradient id="gm-home" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-dku-500" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-700" />
          </linearGradient>

          {/* 육지에 얇은 그림자를 깔아 평면이 아니게 만든다 */}
          <filter id="gm-lift" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow
              dx="0"
              dy="1.6"
              stdDeviation="1.8"
              floodColor="#1d4ed8"
              floodOpacity="0.16"
            />
          </filter>

          {/* 핀 둘레의 은은한 발광 */}
          <filter id="gm-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#gm-sea)" />

        {/* 육지 — 나라마다 하나씩이라 흰 테두리가 국경선이 된다 */}
        <g
          filter="url(#gm-lift)"
          fill="url(#gm-land)"
          stroke="#ffffff"
          strokeWidth="0.65"
          strokeLinejoin="round"
        >
          {land.map((p) => (
            <path key={p.id} d={p.d} />
          ))}
        </g>

        {/* 연결선 — 모두 대한민국에서 출발한다 */}
        <g fill="none" strokeLinecap="round" className="text-dku-500">
          {COUNTRIES.map((c) => {
            const on = c.code === value;
            return (
              <path
                key={c.code}
                d={link(px(c.lon), py(c.lat), PLACE[c.code].bow)}
                stroke="currentColor"
                strokeWidth={on ? 2 : 1.45}
                strokeDasharray="5 7"
                opacity={on ? 0.95 : 0.62}
              />
            );
          })}
        </g>

        {/* 대한민국 — 모든 연결의 출발점 */}
        {korea && (
          <g>
            <circle
              cx={HOME_X}
              cy={HOME_Y}
              r="19"
              className="text-dku-400"
              fill="currentColor"
              opacity="0.28"
              filter="url(#gm-glow)"
            />
            {/* 반도가 아주 작게 나와 묻히므로 제자리에서 조금만 키운다 */}
            <path
              d={korea.d}
              fill="url(#gm-home)"
              stroke="#ffffff"
              strokeWidth="0.4"
              transform={`translate(${HOME_X} ${HOME_Y}) scale(2.3) translate(${-HOME_X} ${-HOME_Y})`}
            />
          </g>
        )}

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
      <Tag
        x={HOME_X}
        y={HOME_Y}
        side="top"
        flag={HOME.flag}
        ko={HOME.ko}
        tone="home"
        always
      />
      {COUNTRIES.map((c) => {
        const p = PLACE[c.code];
        return (
          <Tag
            key={c.code}
            x={px(c.lon)}
            y={py(c.lat) + (p.dy ?? 0)}
            side={p.side}
            flag={c.flag}
            ko={c.ko}
            tone={c.code === value ? "on" : "off"}
            always={c.code === value}
            onClick={() => onChange(c.code)}
          />
        );
      })}
    </div>
  );
}

/** 핀 — 선명한 파란 원 + 흰 테두리 + 둘레의 발광 */
function Pin({
  x,
  y,
  active,
  home = false,
  label,
  onClick,
}: {
  x: number;
  y: number;
  active: boolean;
  home?: boolean;
  label: string;
  onClick?: () => void;
}) {
  const r = home ? 5.4 : active ? 4.8 : 4;
  return (
    <g
      className={`text-dku-600 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? label : undefined}
    >
      {(active || home) && (
        <circle
          cx={x}
          cy={y}
          r={home ? 11 : 9}
          fill="currentColor"
          opacity="0.3"
          filter="url(#gm-glow)"
        />
      )}
      {/* 누르기 쉬우라고 보이지 않는 넓은 과녁을 깔아 둔다 */}
      {onClick && <circle cx={x} cy={y} r="13" fill="transparent" />}
      <circle cx={x} cy={y} r={r} fill="currentColor" stroke="#ffffff" strokeWidth="1.6" />
    </g>
  );
}

/** 이름표 — 국기와 한글 이름 */
function Tag({
  x,
  y,
  side,
  flag,
  ko,
  tone,
  always = false,
  onClick,
}: {
  x: number;
  y: number;
  side: "left" | "right" | "top";
  flag: string;
  ko: string;
  tone: "home" | "on" | "off";
  always?: boolean;
  onClick?: () => void;
}) {
  const gap = 11;
  const pos =
    side === "top"
      ? { left: `${lpct(x)}%`, top: `${tpct(y - 45)}%`, transform: "translate(-50%,-50%)" }
      : side === "right"
        ? { left: `${lpct(x + gap)}%`, top: `${tpct(y)}%`, transform: "translateY(-50%)" }
        : { left: `${lpct(x - gap)}%`, top: `${tpct(y)}%`, transform: "translate(-100%,-50%)" };

  const skin =
    tone === "home"
      ? "bg-dku-700 text-white ring-dku-700"
      : tone === "on"
        ? "bg-white text-dku-800 ring-2 ring-dku-500"
        : "bg-white text-slate-700 ring-1 ring-slate-900/[0.07]";

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      aria-hidden={!onClick}
      style={pos}
      className={`absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1 text-[11px] font-bold shadow-[0_5px_16px_-4px_rgba(29,78,216,0.35)] transition sm:px-3 sm:py-1.5 sm:text-[13px] ${skin} ${
        always ? "" : "hidden md:flex"
      } ${onClick ? "hover:-translate-y-px" : "cursor-default"}`}
    >
      <span aria-hidden>{flag}</span>
      {ko}
    </button>
  );
}
