/**
 * 상황 카드 오른쪽의 작은 그림 (시안: 메인.png).
 *
 * 시안의 그림은 옅은 파랑 위주의 반입체 일러스트다. 사진을 잘라 쓰면 작은 크기에서
 * 뭉개지고 시안에 없는 상황은 그림이 없으므로, 같은 결의 그림을 SVG 로 직접 그렸다.
 * 모든 그림은 160 x 90 칸 안에서 같은 색·그림자·밝은 면 규칙을 따른다.
 *
 * 어떤 상황에 어떤 그림을 쓸지는 components/global/scene-meta.ts 가 정한다.
 */
import type { ReactNode } from "react";

export type Art =
  | "drawing" | "part" | "caliper" | "bulbDoc" | "handshake" | "chartUp" | "heatmap" | "monitorHeat"
  | "led" | "clipboard" | "docCheck" | "lineChart" | "lineMachine" | "gearArrow" | "machineWarn"
  | "boxX" | "magnifierDoc" | "audit" | "truck" | "plane" | "coins" | "calculator" | "calendar"
  | "idCard" | "presentation" | "server" | "shield" | "mail" | "globeChat" | "hotel" | "meal"
  | "gift" | "suitcase" | "map" | "chat" | "clock" | "people" | "factory" | "passport" | "phone";

/** 공통 색 — 시안의 옅은 파랑, 흰 윗면, 포인트 색 */
const C = {
  a: "#eaf2fe",
  b: "#d4e4fb",
  c: "#b4cff4",
  d: "#86afe9",
  e: "#4f86dc",
  f: "#2d65c8",
  w: "#ffffff",
  o: "#ffad42",
  g: "#2fbf86",
  r: "#ef4b4b",
  p: "#9a7cf0",
  y: "#ffd34d",
};

function Defs() {
  return (
    <defs>
      <linearGradient id="sa-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={C.b} />
        <stop offset="1" stopColor={C.d} />
      </linearGradient>
      <linearGradient id="sa-deep" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={C.d} />
        <stop offset="1" stopColor={C.f} />
      </linearGradient>
      <linearGradient id="sa-paper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e6eefb" />
      </linearGradient>
      <linearGradient id="sa-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3f6fb" />
        <stop offset="0.5" stopColor="#c6d3e6" />
        <stop offset="1" stopColor="#8fa3c2" />
      </linearGradient>
      <radialGradient id="sa-heat" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ff4d3a" />
        <stop offset="0.3" stopColor="#ffb340" />
        <stop offset="0.55" stopColor="#ffe45c" />
        <stop offset="0.75" stopColor="#5fd6a4" />
        <stop offset="1" stopColor="#4f86dc" stopOpacity="0.15" />
      </radialGradient>
      <filter id="sa-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2d4f8c" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

/** 바닥 그림자 */
const Floor = ({ cx = 80, w = 56 }: { cx?: number; w?: number }) => (
  <ellipse cx={cx} cy={82} rx={w} ry={5} fill={C.c} opacity={0.35} />
);

/** 종이 한 장 */
const Paper = ({ x, y, w, h, lines = 3 }: { x: number; y: number; w: number; h: number; lines?: number }) => (
  <g filter="url(#sa-shadow)">
    <rect x={x} y={y} width={w} height={h} rx={4} fill="url(#sa-paper)" stroke={C.c} strokeWidth={0.8} />
    {[...Array(lines)].map((_, i) => (
      <rect key={i} x={x + 6} y={y + 8 + i * 8} width={w - 12 - (i % 2) * 8} height={3} rx={1.5} fill={C.c} />
    ))}
  </g>
);

/** 둥근 표시 (체크·X·느낌표) */
const Badge = ({ x, y, color, mark }: { x: number; y: number; color: string; mark: "check" | "x" | "!" }) => (
  <g filter="url(#sa-shadow)">
    <circle cx={x} cy={y} r={10} fill={color} />
    {mark === "check" && <path d={`M${x - 4.5} ${y} l3 3 l6 -6.5`} stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    {mark === "x" && <path d={`M${x - 4} ${y - 4} l8 8 M${x + 4} ${y - 4} l-8 8`} stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />}
    {mark === "!" && <path d={`M${x} ${y - 5} v6 M${x} ${y + 4.5} v0.5`} stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />}
  </g>
);

/** 막대그래프 */
const Bars = ({ x, y, h = [10, 16, 24, 32], color = "url(#sa-deep)" }: { x: number; y: number; h?: number[]; color?: string }) => (
  <g>
    {h.map((v, i) => (
      <rect key={i} x={x + i * 9} y={y - v} width={6} height={v} rx={1.5} fill={color} opacity={0.55 + i * 0.12} />
    ))}
  </g>
);

const SCENES: Record<Art, ReactNode> = {
  drawing: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="40" y="16" width="84" height="60" rx="4" fill={C.a} stroke={C.c} />
        <path d="M50 64h64M50 26v38M60 54h20v-18h14v18h12" stroke={C.d} strokeWidth="1.6" fill="none" />
        <circle cx="87" cy="45" r="6" stroke={C.e} strokeWidth="1.6" fill="none" />
        <path d="M100 28h16M108 24v8" stroke={C.e} strokeWidth="1.2" />
      </g>
      <path d="M118 70l14-30 5 2-14 30z" fill={C.o} />
    </g>
  ),
  part: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <path d="M46 52l30-16 38 14-30 18z" fill="url(#sa-steel)" />
        <path d="M46 52v14l38 16v-14z" fill="#9fb2cf" />
        <path d="M84 68v14l30-16v-16z" fill="#b8c7dd" />
        <ellipse cx="80" cy="50" rx="11" ry="6" fill="#7d93b5" />
        <ellipse cx="80" cy="49" rx="7" ry="3.6" fill="#e9eff8" />
      </g>
      <path d="M112 28q14-10 26 6" stroke={C.e} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M134 28l5 8-9 0z" fill={C.e} />
    </g>
  ),
  caliper: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <ellipse cx="62" cy="56" rx="20" ry="20" fill="url(#sa-steel)" />
        <ellipse cx="62" cy="56" rx="10" ry="10" fill="#e9eff8" stroke="#8fa3c2" />
        <rect x="88" y="18" width="10" height="62" rx="2" fill="url(#sa-steel)" />
        <path d="M98 22h34v8h-26v6h-8z" fill="#c6d3e6" />
        <path d="M98 44h22v6h-22z" fill="#9fb2cf" />
      </g>
      <rect x="104" y="6" width="44" height="14" rx="4" fill="#fff" stroke={C.c} />
      <text x="126" y="16" textAnchor="middle" fontSize="8" fill={C.f} fontWeight="700">±0.05</text>
    </g>
  ),
  bulbDoc: (
    <g>
      <Floor />
      <Paper x={40} y={18} w={52} h={60} lines={4} />
      <Bars x={52} y={72} h={[6, 10, 14]} />
      <g filter="url(#sa-shadow)">
        <circle cx="114" cy="40" r="16" fill="#fff6d6" stroke={C.y} strokeWidth="2" />
        <rect x="107" y="56" width="14" height="10" rx="2" fill={C.d} />
        <path d="M110 40q4-6 8 0" stroke={C.o} strokeWidth="2" fill="none" />
      </g>
    </g>
  ),
  handshake: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <path d="M30 50l26-10 22 10-8 10-18-6-20 8z" fill="url(#sa-blue)" />
        <path d="M130 48l-28-10-24 14 8 10 18-8 24 6z" fill="url(#sa-deep)" />
        <path d="M70 52q10 10 22 2l-6-8q-6 4-12 0z" fill="#fff" />
      </g>
      <path d="M58 26l4-8M80 22v-9M102 26l-4-8" stroke={C.e} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  chartUp: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="36" y="20" width="96" height="58" rx="6" fill="#fff" stroke={C.b} />
        <Bars x={50} y={70} h={[12, 18, 26, 36, 44]} />
      </g>
      <path d="M50 52l18-10 16 6 26-22" stroke={C.e} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M108 22l8-2-2 8z" fill={C.e} />
    </g>
  ),
  heatmap: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <path d="M24 70l40-48 96 0-40 48z" fill="#f4f8ff" stroke={C.c} />
        <ellipse cx="96" cy="44" rx="46" ry="20" fill="url(#sa-heat)" />
      </g>
      <path d="M40 66h70M52 54h70" stroke={C.c} strokeWidth="0.8" />
    </g>
  ),
  monitorHeat: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="36" y="12" width="94" height="58" rx="5" fill="#25365e" />
        <rect x="40" y="16" width="86" height="50" rx="3" fill="#eef4ff" />
        <ellipse cx="88" cy="42" rx="34" ry="16" fill="url(#sa-heat)" />
        <rect x="74" y="70" width="18" height="8" fill="#9fb2cf" />
      </g>
    </g>
  ),
  led: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <ellipse cx="62" cy="52" rx="24" ry="24" fill="url(#sa-steel)" />
        <ellipse cx="62" cy="52" rx="14" ry="14" fill="#e9eff8" />
        <rect x="96" y="30" width="34" height="34" rx="6" fill="url(#sa-steel)" />
        <rect x="104" y="38" width="18" height="18" rx="3" fill={C.y} />
        <circle cx="113" cy="47" r="5" fill="#fff8d0" />
      </g>
      <path d="M113 22v-8M128 26l6-6M98 26l-6-6" stroke={C.o} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  clipboard: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="50" y="14" width="56" height="66" rx="6" fill={C.b} />
        <rect x="56" y="22" width="44" height="54" rx="3" fill="#fff" />
        <rect x="68" y="10" width="20" height="9" rx="3" fill={C.d} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M61 ${32 + i * 11}l3 3 5-6`} stroke={C.g} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <rect x="73" y={31 + i * 11} width="22" height="3.5" rx="1.5" fill={C.c} />
          </g>
        ))}
      </g>
      <path d="M104 74l26-34 6 5-26 34-8 3z" fill={C.e} />
      <path d="M130 40l6 5 3-4-6-5z" fill={C.o} />
    </g>
  ),
  docCheck: (
    <g>
      <Floor />
      <Paper x={44} y={14} w={58} h={66} lines={5} />
      <Bars x={110} y={74} h={[10, 16, 24]} />
      <Badge x={106} y={30} color={C.g} mark="check" />
    </g>
  ),
  lineChart: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="34" y="16" width="100" height="60" rx="6" fill="#fff" stroke={C.b} />
        <path d="M44 56l12-8 10 10 12-18 12 12 12-14 12 10 10-6" stroke={C.e} strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M44 66h80" stroke={C.b} />
      </g>
    </g>
  ),
  lineMachine: (
    <g>
      <Floor w={66} />
      <g filter="url(#sa-shadow)">
        <path d="M18 64l60-22 66 0-60 22z" fill={C.b} />
        <path d="M18 64v8l66 0v-8z" fill={C.d} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path d={`M${38 + i * 20} ${54 - i * 7}l8-3 8 3-8 3z`} fill="#fff" />
            <path d={`M${38 + i * 20} ${54 - i * 7}v8l8 3v-8z`} fill={C.c} />
            <path d={`M${46 + i * 20} ${57 - i * 7}v8l8-3v-8z`} fill={C.d} />
          </g>
        ))}
        <rect x="110" y="16" width="26" height="40" rx="3" fill="url(#sa-steel)" />
        <rect x="115" y="22" width="16" height="10" rx="2" fill={C.e} />
      </g>
    </g>
  ),
  gearArrow: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <circle cx="66" cy="50" r="24" fill="url(#sa-steel)" />
        {[...Array(8)].map((_, i) => (
          <rect key={i} x="62" y="20" width="8" height="10" rx="2" fill="#b8c7dd" transform={`rotate(${i * 45} 66 50)`} />
        ))}
        <circle cx="66" cy="50" r="9" fill="#e9eff8" />
      </g>
      <path d="M86 66q24-6 40-40" stroke={C.o} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M118 22l16-4-4 16z" fill={C.o} />
    </g>
  ),
  machineWarn: (
    <g>
      <Floor w={62} />
      <g filter="url(#sa-shadow)">
        <rect x="30" y="18" width="72" height="58" rx="5" fill="url(#sa-steel)" />
        <rect x="38" y="26" width="30" height="20" rx="2" fill="#25365e" />
        <rect x="74" y="26" width="20" height="40" rx="2" fill="#dfe7f3" />
        <circle cx="84" cy="34" r="3" fill={C.g} />
        <circle cx="84" cy="44" r="3" fill={C.r} />
      </g>
      <g filter="url(#sa-shadow)">
        <path d="M120 36l18 32h-36z" fill={C.r} />
        <path d="M120 48v9M120 61v1" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  ),
  boxX: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <path d="M30 60l50-20 60 10-50 22z" fill="#f2f6fc" stroke={C.c} />
        <path d="M30 60v8l60 12v-8z" fill={C.c} />
        <path d="M90 72v8l50-22v-8z" fill={C.d} />
        <path d="M70 52l20-8 22 4-20 9z" fill={C.b} />
      </g>
      <Badge x={112} y={30} color={C.r} mark="x" />
    </g>
  ),
  magnifierDoc: (
    <g>
      <Floor />
      <Paper x={38} y={18} w={70} h={56} lines={4} />
      <g filter="url(#sa-shadow)">
        <circle cx="112" cy="54" r="15" fill="#eef5ff" stroke={C.e} strokeWidth="4" />
        <path d="M122 66l12 12" stroke={C.e} strokeWidth="6" strokeLinecap="round" />
      </g>
    </g>
  ),
  audit: (
    <g>
      <Floor />
      <Bars x={36} y={76} h={[14, 22, 30]} />
      <g filter="url(#sa-shadow)" transform="rotate(8 104 46)">
        <rect x="80" y="12" width="48" height="66" rx="5" fill={C.b} />
        <rect x="85" y="20" width="38" height="54" rx="3" fill="#fff" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="89" y={27 + i * 11} width="6" height="6" rx="1.5" stroke={C.e} fill="none" />
            <rect x="98" y={28.5 + i * 11} width="20" height="3" rx="1.5" fill={C.c} />
          </g>
        ))}
      </g>
    </g>
  ),
  truck: (
    <g>
      <Floor w={64} />
      <g filter="url(#sa-shadow)">
        <rect x="26" y="26" width="72" height="42" rx="4" fill="url(#sa-blue)" />
        <path d="M98 38h22l14 14v16h-36z" fill="url(#sa-deep)" />
        <rect x="104" y="42" width="14" height="10" rx="2" fill="#eaf2fe" />
        <circle cx="46" cy="72" r="8" fill="#25365e" />
        <circle cx="116" cy="72" r="8" fill="#25365e" />
        <circle cx="46" cy="72" r="3" fill="#dfe7f3" />
        <circle cx="116" cy="72" r="3" fill="#dfe7f3" />
      </g>
      <path d="M8 40h12M4 50h14" stroke={C.c} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  plane: (
    <g>
      <path d="M10 70q40-26 120-30" stroke={C.b} strokeWidth="2" strokeDasharray="3 5" fill="none" />
      <g filter="url(#sa-shadow)" transform="rotate(-14 90 40)">
        <path d="M40 42l90-6q12 0 12 6t-12 6l-90-6z" fill="#fff" stroke={C.c} />
        <path d="M86 40l-14-26h10l26 26z" fill="url(#sa-deep)" />
        <path d="M86 44l-14 26h10l26-26z" fill={C.d} />
        <path d="M48 42l-6-14h6l12 14z" fill={C.e} />
      </g>
    </g>
  ),
  coins: (
    <g>
      <Floor />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} filter="url(#sa-shadow)">
          <ellipse cx="62" cy={68 - i * 9} rx="22" ry="7" fill={C.o} />
          <ellipse cx="62" cy={65 - i * 9} rx="22" ry="7" fill={C.y} />
        </g>
      ))}
      <g filter="url(#sa-shadow)">
        <path d="M96 30h34l8 14-8 14h-34z" fill="url(#sa-blue)" />
        <circle cx="128" cy="44" r="3" fill="#fff" />
        <text x="110" y="48" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.f}>%</text>
      </g>
    </g>
  ),
  calculator: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="58" y="12" width="46" height="66" rx="7" fill="url(#sa-deep)" />
        <rect x="64" y="18" width="34" height="14" rx="2" fill="#eaf6ff" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={65 + c * 11} y={38 + r * 12} width="8" height="8" rx="2" fill="#fff" opacity="0.9" />),
        )}
      </g>
      <Paper x={110} y={34} w={34} h={42} lines={3} />
    </g>
  ),
  calendar: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="46" y="18" width="70" height="60" rx="7" fill="#fff" stroke={C.b} />
        <rect x="46" y="18" width="70" height="16" rx="7" fill={C.e} />
        <rect x="46" y="28" width="70" height="6" fill={C.e} />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}${c}`} x={53 + c * 15} y={40 + r * 11} width="9" height="7" rx="1.5" fill={r === 1 && c === 2 ? C.o : C.b} />
          )),
        )}
      </g>
    </g>
  ),
  idCard: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="36" y="22" width="90" height="56" rx="7" fill="#fff" stroke={C.b} />
        <circle cx="60" cy="44" r="10" fill={C.c} />
        <path d="M46 68q14-14 28 0" fill={C.c} />
        <rect x="80" y="36" width="36" height="4" rx="2" fill={C.d} />
        <rect x="80" y="46" width="28" height="4" rx="2" fill={C.c} />
        <rect x="80" y="56" width="32" height="4" rx="2" fill={C.c} />
      </g>
      <Badge x={126} y={24} color={C.g} mark="check" />
    </g>
  ),
  presentation: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="34" y="12" width="96" height="56" rx="4" fill="#fff" stroke={C.b} />
        <Bars x={46} y={58} h={[12, 20, 28, 36]} />
        <circle cx="106" cy="38" r="14" fill={C.b} />
        <path d="M106 38v-14a14 14 0 0 1 14 14z" fill={C.e} />
        <path d="M82 68l-6 12M82 68l6 12" stroke="#9fb2cf" strokeWidth="2.5" />
      </g>
    </g>
  ),
  server: (
    <g>
      <Floor />
      {[0, 1, 2].map((i) => (
        <g key={i} filter="url(#sa-shadow)">
          <rect x="52" y={18 + i * 20} width="60" height="16" rx="3" fill="url(#sa-deep)" />
          <circle cx="62" cy={26 + i * 20} r="2.5" fill={i === 1 ? C.r : C.g} />
          <rect x="72" y={24 + i * 20} width="30" height="4" rx="2" fill="#bcd3f7" />
        </g>
      ))}
      <Badge x={120} y={22} color={C.r} mark="!" />
    </g>
  ),
  shield: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <path d="M80 12l34 12v20q0 24-34 36-34-12-34-36v-20z" fill="url(#sa-deep)" />
        <rect x="68" y="40" width="24" height="20" rx="3" fill="#fff" />
        <path d="M72 40v-6a8 8 0 0 1 16 0v6" stroke="#fff" strokeWidth="3" fill="none" />
        <circle cx="80" cy="50" r="3" fill={C.f} />
      </g>
    </g>
  ),
  mail: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="40" y="26" width="80" height="50" rx="6" fill="#fff" stroke={C.b} />
        <path d="M40 30l40 26 40-26" stroke={C.d} strokeWidth="2.4" fill="none" />
      </g>
      <g filter="url(#sa-shadow)">
        <circle cx="122" cy="26" r="11" fill={C.e} />
        <path d="M117 26h10M123 22l4 4-4 4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </g>
  ),
  globeChat: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <circle cx="70" cy="46" r="28" fill="url(#sa-blue)" />
        <path d="M54 34q8 4 6 12-6 4-2 10M78 22q-4 8 4 12 10-2 12 8M66 70q4-8 12-6" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
      <g filter="url(#sa-shadow)">
        <rect x="100" y="14" width="44" height="24" rx="8" fill={C.e} />
        <path d="M108 38l-2 8 10-8z" fill={C.e} />
        <circle cx="113" cy="26" r="2.2" fill="#fff" />
        <circle cx="122" cy="26" r="2.2" fill="#fff" />
        <circle cx="131" cy="26" r="2.2" fill="#fff" />
      </g>
    </g>
  ),
  hotel: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="54" y="14" width="54" height="64" rx="4" fill="url(#sa-blue)" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={60 + c * 16} y={20 + r * 12} width="10" height="7" rx="1.5" fill="#fff" opacity="0.85" />),
        )}
        <rect x="74" y="66" width="14" height="12" rx="2" fill={C.f} />
      </g>
      <g filter="url(#sa-shadow)">
        <rect x="112" y="52" width="34" height="18" rx="4" fill="#fff" stroke={C.c} />
        <rect x="116" y="46" width="12" height="10" rx="3" fill={C.b} />
      </g>
    </g>
  ),
  meal: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <ellipse cx="80" cy="56" rx="38" ry="16" fill="#fff" stroke={C.b} />
        <ellipse cx="80" cy="53" rx="24" ry="9" fill={C.a} />
        <circle cx="72" cy="51" r="5" fill={C.o} />
        <circle cx="86" cy="52" r="4" fill={C.g} />
      </g>
      <path d="M32 30v40M28 30v10q4 4 8 0V30M128 30q8 6 0 20v20" stroke="#9fb2cf" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  gift: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="54" y="38" width="54" height="40" rx="4" fill="url(#sa-deep)" />
        <rect x="50" y="30" width="62" height="12" rx="3" fill={C.e} />
        <rect x="77" y="30" width="8" height="48" fill={C.o} />
        <path d="M81 30q-16-18-20-6 4 6 20 6q16-18 20-6-4 6-20 6" fill={C.o} />
      </g>
    </g>
  ),
  suitcase: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="56" y="26" width="50" height="52" rx="8" fill="url(#sa-deep)" />
        <path d="M70 26v-8h22v8" stroke={C.d} strokeWidth="4" fill="none" />
        <path d="M68 34v36M94 34v36" stroke="#bcd3f7" strokeWidth="3" />
      </g>
      <g filter="url(#sa-shadow)">
        <rect x="110" y="20" width="30" height="40" rx="3" fill="#fff" stroke={C.c} />
        <path d="M116 30h18M116 38h12" stroke={C.c} strokeWidth="3" />
      </g>
    </g>
  ),
  map: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <path d="M30 68l30-12 30 12 34-12v-40l-34 12-30-12-30 12z" fill="#fff" stroke={C.c} />
        <path d="M60 16v40M90 28v40" stroke={C.b} />
        <path d="M38 44q20-14 40 2t40-10" stroke={C.d} strokeWidth="2" strokeDasharray="3 3" fill="none" />
      </g>
      <g filter="url(#sa-shadow)">
        <path d="M118 46s-14-12-14-22a14 14 0 0 1 28 0c0 10-14 22-14 22z" fill={C.r} />
        <circle cx="118" cy="24" r="5" fill="#fff" />
      </g>
    </g>
  ),
  chat: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="32" y="18" width="62" height="34" rx="10" fill="url(#sa-blue)" />
        <path d="M44 52l-4 10 14-10z" fill={C.d} />
        <rect x="42" y="28" width="40" height="4" rx="2" fill="#fff" />
        <rect x="42" y="37" width="28" height="4" rx="2" fill="#fff" />
      </g>
      <g filter="url(#sa-shadow)">
        <rect x="80" y="40" width="58" height="30" rx="10" fill="#fff" stroke={C.c} />
        <path d="M126 70l4 9-14-9z" fill="#fff" />
        <circle cx="98" cy="55" r="2.6" fill={C.e} />
        <circle cx="109" cy="55" r="2.6" fill={C.e} />
        <circle cx="120" cy="55" r="2.6" fill={C.e} />
      </g>
    </g>
  ),
  clock: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <circle cx="74" cy="46" r="30" fill="#fff" stroke={C.d} strokeWidth="4" />
        <path d="M74 28v18l12 8" stroke={C.f} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      <g filter="url(#sa-shadow)">
        <circle cx="124" cy="30" r="14" fill="url(#sa-blue)" />
        <path d="M112 30h24M124 16q-8 14 0 28M124 16q8 14 0 28" stroke="#fff" strokeWidth="1.5" fill="none" />
      </g>
    </g>
  ),
  people: (
    <g>
      <Floor />
      {[[56, C.c], [104, C.d], [80, C.e]].map(([x, col], i) => (
        <g key={i} filter="url(#sa-shadow)">
          <circle cx={x as number} cy={i === 2 ? 34 : 40} r={i === 2 ? 12 : 10} fill={col as string} />
          <path d={`M${(x as number) - 18} ${i === 2 ? 76 : 76}q18-${i === 2 ? 30 : 26} 36 0`} fill={col as string} />
        </g>
      ))}
    </g>
  ),
  factory: (
    <g>
      <Floor w={64} />
      <g filter="url(#sa-shadow)">
        <path d="M24 78v-36l24 14v-14l24 14v-14l24 14v-30h14v52z" fill="url(#sa-blue)" />
        <rect x="112" y="40" width="30" height="38" rx="2" fill={C.d} />
        {[0, 1].map((i) => <rect key={i} x={118} y={46 + i * 14} width="18" height="8" rx="1.5" fill="#fff" opacity="0.85" />)}
      </g>
      <path d="M100 18q6-8 0-14" stroke={C.c} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  passport: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="56" y="14" width="48" height="64" rx="5" fill="url(#sa-deep)" />
        <circle cx="80" cy="40" r="12" stroke="#d6e6ff" strokeWidth="2" fill="none" />
        <path d="M68 40h24M80 28q-6 12 0 24M80 28q6 12 0 24" stroke="#d6e6ff" strokeWidth="1.4" fill="none" />
        <rect x="68" y="60" width="24" height="4" rx="2" fill="#d6e6ff" />
      </g>
      <Badge x={110} y={24} color={C.g} mark="check" />
    </g>
  ),
  phone: (
    <g>
      <Floor />
      <g filter="url(#sa-shadow)">
        <rect x="62" y="10" width="38" height="70" rx="8" fill="#25365e" />
        <rect x="66" y="16" width="30" height="56" rx="4" fill="#eef4ff" />
        <rect x="70" y="24" width="22" height="10" rx="3" fill={C.e} />
        <rect x="70" y="40" width="16" height="10" rx="3" fill="#fff" stroke={C.c} />
      </g>
      <path d="M110 30q8 8 0 16M118 24q14 14 0 28" stroke={C.e} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
};

export function SceneArt({ art, className = "" }: { art: Art; className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      <Defs />
      {SCENES[art]}
    </svg>
  );
}
