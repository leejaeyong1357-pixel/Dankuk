"use client";

import { COUNTRIES, HOME, type Country } from "@/lib/global/content";
import { Flag, type FlagCode } from "./Flag";
import { KOREA, LAND, px, py } from "@/lib/global/world-paths";

/**
 * 세계지도 — 한국에서 어디로 연결되는지 보여 주는 자리.
 *
 * 받은 시안을 픽셀로 재어 그대로 옮겼다. 크기는 전부 시안 1px 을 뜻하는
 * --u 로 적는다 (app/global/page.tsx 가 화면 폭에 맞춰 정한다). 그래서 화면이
 * 넓어져도 시안과 같은 비율로 커진다.
 *
 * 윤곽은 Natural Earth(퍼블릭 도메인)를 밀러 도법으로 옮긴 lib/global/world-paths.ts.
 * 시안이 밀러 도법이라 가로세로가 2:1 이다. 등장방형(2.55:1)으로 그리면 위아래가
 * 눌려 보이고, 지도 칸 높이가 옆 칸과 맞지 않는다.
 *
 * 시안처럼 나라마다 점을 찍지 않고 이름표가 곧 자리 표시다. 점은 대한민국 하나뿐이고,
 * 선은 그 점에서 각 이름표로 간다. 이름표는 시안 자리에 맞춰 나라 중심에서 조금씩
 * 비켜 둔다 (중국·인도처럼 붙어 있는 나라가 겹치지 않게).
 *
 * 국기는 이모지가 아니라 그림이다. Windows 에는 국기 글꼴이 없어 이모지로 두면
 * 회사 PC 에서 "KR" 같은 글자 두 개로 나온다 (components/global/Flag.tsx).
 */

/** 그려 낼 범위 — 북위 84도부터 남위 57도까지, 가로세로 2:1 */
const VB = { x: 0, y: 46, w: 1000, h: 500 };

const HOME_X = px(HOME.lon);
const HOME_Y = py(HOME.lat);

/**
 * 이름표 자리 (나라 중심에서 얼마나 비킬지, 지도 좌표) 와 선이 부푸는 정도.
 * 값은 시안의 이름표 위치를 재어 옮긴 것이다.
 */
const PLACE: Record<Country["code"], { dx: number; dy: number; bow: number }> = {
  MX: { dx: -20, dy: -32, bow: 0.16 },
  BR: { dx: -4, dy: 8, bow: 0.16 },
  PL: { dx: 0, dy: -56, bow: 0.14 },
  IN: { dx: -18, dy: 12, bow: 0.12 },
  CN: { dx: -100, dy: -28, bow: 0.1 },
  AU: { dx: 26, dy: 3, bow: 0.18 },
};

/** 대한민국 이름표는 점 오른쪽 위 — 아래로 꼬리를 내려 점을 가리킨다 */
const HOME_TAG = { dx: 45, dy: -58 };

const lpct = (x: number) => ((x - VB.x) / VB.w) * 100;
const tpct = (y: number) => ((y - VB.y) / VB.h) * 100;
const u = (n: number) => `calc(${n} * var(--u, 1px))`;

/** 한국에서 이름표까지 — 위로 살짝 부푼 곡선 */
function link(bx: number, by: number, bow: number): string {
  const dx = bx - HOME_X;
  const dy = by - HOME_Y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = dy / len;
  let ny = -dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const mx = (HOME_X + bx) / 2 + nx * len * bow;
  const my = (HOME_Y + by) / 2 + ny * len * bow;
  return `M${HOME_X.toFixed(1)} ${HOME_Y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

export function WorldMap({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const tags = COUNTRIES.map((c) => ({
    c,
    x: px(c.lon) + PLACE[c.code].dx,
    y: py(c.lat) + PLACE[c.code].dy,
  }));

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <svg
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="대한민국에서 멕시코·브라질·폴란드·인도·중국·호주로 이어지는 세계지도"
      >
        <defs>
          {/* 시안의 육지는 아주 옅다 — 바탕(#f3f8fe)과 한 톤 차이 */}
          <linearGradient id="gm-land" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-dku-100" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-100" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id="gm-glow">
            <stop offset="0%" stopColor="currentColor" className="text-dku-500" stopOpacity="0.55" />
            <stop offset="45%" stopColor="currentColor" className="text-dku-400" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-300" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path d={LAND} fill="url(#gm-land)" />
        <path d={KOREA} className="text-dku-300" fill="currentColor" opacity="0.7" />

        {/* 연결선 — 모두 대한민국에서 출발해 각 이름표에서 끝난다 */}
        <g fill="none" strokeLinecap="round" className="text-dku-400">
          {tags.map(({ c, x, y }) => (
            <path
              key={c.code}
              d={link(x, y, PLACE[c.code].bow)}
              stroke="currentColor"
              strokeWidth={c.code === value ? 2 : 1.4}
              strokeDasharray="4 5"
              opacity={c.code === value ? 0.95 : 0.6}
            />
          ))}
        </g>

        {/* 대한민국 — 번지는 빛과 점 */}
        <circle cx={HOME_X} cy={HOME_Y} r="34" fill="url(#gm-glow)" />
        <circle cx={HOME_X} cy={HOME_Y} r="7.5" className="text-dku-500" fill="currentColor" stroke="#ffffff" strokeWidth="2.5" />
      </svg>

      {/* 이름표 */}
      {tags.map(({ c, x, y }) => (
        <Tag
          key={c.code}
          x={x}
          y={y}
          code={c.code}
          ko={c.ko}
          active={c.code === value}
          onClick={() => onChange(c.code)}
        />
      ))}
      <HomeTag x={HOME_X + HOME_TAG.dx} y={HOME_Y + HOME_TAG.dy} pointX={HOME_X} />
    </div>
  );
}

/** 나라 이름표 — 흰 바탕, 옅은 파란 테두리, 국기와 이름 */
function Tag({
  x, y, code, ko, active, onClick,
}: {
  x: number; y: number; code: FlagCode; ko: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        left: `${lpct(x)}%`,
        top: `${tpct(y)}%`,
        gap: u(8),
        padding: `${u(6)} ${u(11)}`,
        borderRadius: u(6),
        fontSize: u(13),
        borderWidth: active ? 2 : 1,
      }}
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap border bg-white font-semibold text-[#1b2b55] shadow-[0_2px_8px_-2px_rgba(29,78,216,0.25)] transition hover:border-dku-500 max-md:hidden ${
        active ? "border-dku-500" : "border-dku-200"
      }`}
    >
      <Flag code={code} style={{ width: u(22), height: u(14) }} />
      {ko}
    </button>
  );
}

/** 대한민국 이름표 — 파란 바탕, 아래로 꼬리 */
function HomeTag({ x, y, pointX }: { x: number; y: number; pointX: number }) {
  // 꼬리는 이름표 안에서 점이 있는 쪽으로 붙인다
  const tail = Math.max(14, Math.min(40, 50 - ((x - pointX) / 1000) * 100 * 3));
  return (
    <span
      aria-hidden
      style={{
        left: `${lpct(x)}%`,
        top: `${tpct(y)}%`,
        gap: u(8),
        padding: `${u(7)} ${u(11)}`,
        borderRadius: u(6),
        fontSize: u(13),
      }}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap bg-dku-600 font-semibold text-white shadow-[0_4px_12px_-3px_rgba(29,78,216,0.5)]"
    >
      <Flag code="KR" style={{ width: u(22), height: u(14) }} />
      대한민국
      <span
        className="absolute top-full -translate-x-1/2 border-x-transparent border-t-dku-600"
        style={{ left: `${tail}%`, borderLeftWidth: u(6), borderRightWidth: u(6), borderTopWidth: u(8) }}
      />
    </span>
  );
}
