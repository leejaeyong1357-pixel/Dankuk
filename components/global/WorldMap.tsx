"use client";

import { BRAND } from "@/lib/brand";
import { COUNTRIES, HOME, type Country } from "@/lib/global/content";
import { Flag, type FlagCode } from "./Flag";
import { COUNTRIES_D, px, py } from "@/lib/global/world-paths";

/**
 * 세계지도 — 한국에서 어디로 연결되는지 보여 주는 자리.
 *
 * 받은 시안(오늘의.png)을 재어 옮겼다. 크기는 시안 1px 을 뜻하는 --u 로 적는다
 * (app/global/page.tsx 가 화면 폭에 맞춰 정한다).
 *
 * 윤곽은 Natural Earth(퍼블릭 도메인)를 밀러 도법으로 옮긴 lib/global/world-paths.ts.
 * 나라마다 윤곽이 따로라 흰 테두리가 곧 국경선이다 (시안에 옅은 국경선이 있다).
 *
 * 시안처럼 나라마다 작은 점을 찍고, 이름표는 그 근처에 띄운다. 점선은 대한민국
 * 점에서 각 이름표로 간다. 대한민국 자리에는 회사 마크 이름표를 세운다.
 *
 * 핀 자리는 그 나라의 대략적인 중심이며 사업장 좌표가 아니다.
 * 국기는 이모지가 아니라 그림이다 (Windows 에는 국기 글꼴이 없다).
 */

/** 그려 낼 범위 — 시안 지도 칸의 가로세로비(2.05:1)에 맞췄다 */
const VB = { x: 0, y: 58, w: 1000, h: 488 };

const HOME_X = px(HOME.lon);
const HOME_Y = py(HOME.lat);

/**
 * 이름표를 점에서 얼마나 비킬지 (지도 좌표), 선이 부푸는 정도.
 * 시안의 이름표-점 간격을 재어 옮겼다. 중국·인도는 붙어 있어 인도를 점 왼쪽에 둔다.
 */
const PLACE: Record<Country["code"], { dx: number; dy: number; bow: number }> = {
  MX: { dx: 5, dy: -40, bow: 0.14 },
  PL: { dx: 42, dy: -48, bow: 0.12 },
  CN: { dx: -40, dy: -22, bow: 0.05 },
  IN: { dx: -95, dy: -5, bow: 0.08 },
  BR: { dx: 0, dy: -52, bow: 0.12 },
  AU: { dx: 15, dy: -15, bow: -0.12 },
};

/** 대한민국 이름표는 점 위 — 아래로 꼬리를 내려 점을 가리킨다 */
const HOME_TAG = { dx: 13, dy: -65 };

const lpct = (x: number) => ((x - VB.x) / VB.w) * 100;
const tpct = (y: number) => ((y - VB.y) / VB.h) * 100;
const u = (n: number) => `calc(${n} * var(--u, 1px))`;

/** 한국에서 이름표까지의 곡선 */
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
  const spots = COUNTRIES.map((c) => {
    const x = px(c.lon);
    const y = py(c.lat);
    return { c, x, y, tx: x + PLACE[c.code].dx, ty: y + PLACE[c.code].dy };
  });

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
          <radialGradient id="gm-glow">
            <stop offset="0%" stopColor="currentColor" className="text-dku-500" stopOpacity="0.5" />
            <stop offset="50%" stopColor="currentColor" className="text-dku-400" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" className="text-dku-300" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 육지 — 나라마다 따로라 흰 테두리가 국경선이 된다 */}
        <g className="text-dku-100" fill="currentColor" stroke="#ffffff" strokeWidth="0.9" strokeLinejoin="round">
          {COUNTRIES_D.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* 점선 — 대한민국에서 각 이름표로 */}
        <g fill="none" strokeLinecap="round" className="text-dku-500">
          {spots.map(({ c, tx, ty }) => (
            <path
              key={c.code}
              d={link(tx, ty, PLACE[c.code].bow)}
              stroke="currentColor"
              strokeWidth={c.code === value ? 3 : 2.4}
              strokeDasharray="0.1 6.5"
              opacity={c.code === value ? 1 : 0.85}
            />
          ))}
        </g>

        {/* 나라 점 */}
        {spots.map(({ c, x, y }) => (
          <g key={c.code} className="cursor-pointer text-dku-500" onClick={() => onChange(c.code)}>
            <circle cx={x} cy={y} r="12" fill="transparent" />
            <circle cx={x} cy={y} r={c.code === value ? 6 : 4.6} fill="currentColor" stroke="#ffffff" strokeWidth="2" />
          </g>
        ))}

        {/* 대한민국 — 번지는 빛과 점 */}
        <circle cx={HOME_X} cy={HOME_Y} r="30" fill="url(#gm-glow)" />
        <circle cx={HOME_X} cy={HOME_Y} r="8" className="text-dku-500" fill="currentColor" stroke="#ffffff" strokeWidth="3" />
      </svg>

      {/* 이름표 */}
      {spots.map(({ c, tx, ty }) => (
        <Tag key={c.code} x={tx} y={ty} code={c.code} ko={c.ko} active={c.code === value} onClick={() => onChange(c.code)} />
      ))}
      <HomeTag x={HOME_X + HOME_TAG.dx} y={HOME_Y + HOME_TAG.dy} />
    </div>
  );
}

/** 나라 이름표 — 흰 바탕, 옅은 그림자, 국기와 이름 */
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
        gap: u(9),
        padding: `${u(7)} ${u(12)}`,
        borderRadius: u(6),
        fontSize: u(13.5),
      }}
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap bg-white font-semibold text-[#14234b] shadow-[0_3px_10px_-2px_rgba(15,40,90,0.22)] ring-dku-500 transition hover:ring-1 max-md:hidden ${
        active ? "ring-2" : ""
      }`}
    >
      <Flag code={code} style={{ width: u(22), height: u(15) }} />
      {ko}
    </button>
  );
}

/** 대한민국 자리 — 회사 마크 이름표, 아래로 꼬리 */
function HomeTag({ x, y }: { x: number; y: number }) {
  return (
    <span
      aria-label="대한민국"
      style={{
        left: `${lpct(x)}%`,
        top: `${tpct(y)}%`,
        padding: `${u(8)} ${u(13)}`,
        borderRadius: u(6),
        fontSize: u(13.5),
        gap: u(8),
      }}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap bg-white font-semibold text-[#14234b] shadow-[0_3px_12px_-2px_rgba(15,40,90,0.28)]"
    >
      {BRAND.markImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={BRAND.markImage} alt="" style={{ height: u(19), width: "auto" }} />
      ) : (
        <>
          <Flag code="KR" style={{ width: u(22), height: u(15) }} />
          대한민국
        </>
      )}
      <span
        className="absolute left-1/2 top-full -translate-x-1/2 border-x-transparent border-t-white drop-shadow-[0_2px_1px_rgba(15,40,90,0.12)]"
        style={{ borderLeftWidth: u(7), borderRightWidth: u(7), borderTopWidth: u(8) }}
      />
    </span>
  );
}
