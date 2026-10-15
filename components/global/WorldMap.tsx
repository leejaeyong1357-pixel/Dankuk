"use client";

import { COUNTRIES, type Country } from "@/lib/global/content";

/**
 * 세계지도 — 국가를 고르는 자리.
 *
 * 지도 데이터를 내려받을 수 없는 환경이라 단순화한 윤곽을 직접 그렸다.
 * 측량용이 아니라 "어디와 연결되는지" 를 한눈에 보여 주는 그림이며,
 * 핀은 국가를 가리킬 뿐 실제 사업장 좌표가 아니다.
 *
 * 비율은 viewBox 로 고정해 가로로 늘어나 찌그러지지 않게 한다.
 */
export function WorldMap({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 1000 500"
      className="h-auto w-full"
      role="group"
      aria-label="국가 선택 지도"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="#dde3ec">
        {/* 북아메리카 */}
        <path d="M38.9 69.4 L111.1 58.3 L166.7 55.6 L236.1 50.0 L277.8 77.8 L322.2 83.3 L347.2 108.3 L316.7 125.0 L294.4 138.9 L275.0 163.9 L277.8 180.6 L250.0 169.4 L230.6 177.8 L208.3 194.4 L233.3 205.6 L194.4 183.3 L175.0 161.1 L155.6 138.9 L152.8 113.9 L133.3 97.2 L83.3 83.3 Z" />
        {/* 중미 */}
        <path d="M233.3 205.6 L255.6 205.6 L269.4 225.0 L286.1 227.8 L266.7 213.9 L244.4 208.3 Z" />
        {/* 그린란드 */}
        <path d="M375.0 19.4 L444.4 33.3 L438.9 55.6 L383.3 83.3 L347.2 66.7 L338.9 38.9 Z" />
        {/* 남아메리카 */}
        <path d="M286.1 227.8 L305.6 219.4 L333.3 227.8 L361.1 244.4 L402.8 263.9 L391.7 288.9 L366.7 319.4 L338.9 344.4 L327.8 361.1 L316.7 402.8 L294.4 394.4 L300.0 361.1 L302.8 333.3 L280.6 269.4 L275.0 244.4 Z" />
        {/* 아프리카 */}
        <path d="M452.8 208.3 L472.2 155.6 L527.8 147.2 L569.4 161.1 L594.4 166.7 L619.4 216.7 L641.7 219.4 L616.7 255.6 L611.1 283.3 L597.2 316.7 L572.2 344.4 L550.0 344.4 L533.3 300.0 L525.0 252.8 L505.6 236.1 L477.8 236.1 L463.9 225.0 Z" />
        {/* 유럽 */}
        <path d="M475.0 130.6 L475.0 141.7 L508.3 133.3 L544.4 138.9 L555.6 133.3 L577.8 136.1 L583.3 122.2 L611.1 116.7 L611.1 83.3 L577.8 66.7 L555.6 55.6 L527.8 75.0 L513.9 88.9 L486.1 111.1 L477.8 116.7 Z" />
        {/* 영국 */}
        <path d="M483.3 88.9 L497.2 88.9 L502.8 105.6 L486.1 111.1 Z" />
        {/* 아시아 */}
        <path d="M577.8 66.7 L638.9 61.1 L694.4 50.0 L777.8 38.9 L861.1 50.0 L944.4 61.1 L972.2 83.3 L930.6 97.2 L888.9 111.1 L861.1 133.3 L838.9 166.7 L805.6 194.4 L791.7 222.2 L763.9 233.3 L755.6 194.4 L722.2 208.3 L700.0 194.4 L666.7 183.3 L638.9 180.6 L619.4 216.7 L594.4 166.7 L583.3 147.2 L583.3 122.2 L611.1 116.7 L611.1 83.3 Z" />
        {/* 인도 */}
        <path d="M700.0 194.4 L722.2 208.3 L716.7 227.8 L744.4 191.7 L722.2 180.6 L694.4 183.3 Z" />
        {/* 동남아 */}
        <path d="M763.9 233.3 L791.7 222.2 L819.4 244.4 L847.2 250.0 L833.3 272.2 L791.7 266.7 L772.2 244.4 Z" />
        {/* 호주 */}
        <path d="M816.7 311.1 L838.9 300.0 L866.7 283.3 L894.4 280.6 L916.7 316.7 L916.7 352.8 L888.9 355.6 L858.3 338.9 L819.4 344.4 Z" />
        {/* 뉴질랜드 */}
        <path d="M980.6 347.2 L991.7 358.3 L977.8 377.8 L963.9 372.2 Z" />
        {/* 일본 */}
        <path d="M861.1 161.1 L877.8 152.8 L894.4 138.9 L902.8 127.8 L888.9 133.3 L869.4 155.6 Z" />
      </g>

      {/* 연결선 — 사람이 세상을 움직인다는 인상 */}
      <g stroke="#bcd0ec" strokeWidth="1.2" fill="none" opacity="0.7">
        <path d="M216.7 186.1 Q380 90 552.8 105.6" strokeDasharray="4 6" />
        <path d="M552.8 105.6 Q660 90 791.7 152.8" strokeDasharray="4 6" />
        <path d="M552.8 105.6 Q640 140 719.4 188.9" strokeDasharray="4 6" />
        <path d="M216.7 186.1 Q300 250 358.3 277.8" strokeDasharray="4 6" />
      </g>
      {COUNTRIES.map((c) => (
        <Pin key={c.code} c={c} active={c.code === value} onChange={onChange} />
      ))}
    </svg>
  );
}

function Pin({
  c,
  active,
  onChange,
}: {
  c: Country;
  active: boolean;
  onChange: (code: string) => void;
}) {
  const labelW = c.ko.length * 13 + 20;
  const lx = c.labelLeft ? c.x + 14 : c.x - labelW / 2;
  const ly = c.labelLeft ? c.y - 11 : c.y - 48;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={c.ko}
      aria-pressed={active}
      className="cursor-pointer outline-none"
      onClick={() => onChange(c.code)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(c.code);
        }
      }}
    >
      {/* 고른 곳에만 이름표를 띄운다 — 다섯 개가 늘 떠 있으면 지도가 안 보인다 */}
      {active && (
        <g>
          <rect x={lx} y={ly} width={labelW} height={26} rx="7" fill="#1d4ed8" />
          <text
            x={lx + labelW / 2}
            y={ly + 18}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#ffffff"
          >
            {c.ko}
          </text>
        </g>
      )}

      {active ? (
        <>
          <circle cx={c.x} cy={c.y - 2} r="16" fill="#1d4ed8" opacity="0.14" />
          <path
            d={`M${c.x} ${c.y + 10} C${c.x - 12} ${c.y - 6} ${c.x - 11} ${c.y - 24} ${c.x} ${c.y - 24} C${c.x + 11} ${c.y - 24} ${c.x + 12} ${c.y - 6} ${c.x} ${c.y + 10} Z`}
            fill="#1d4ed8"
          />
          <circle cx={c.x} cy={c.y - 16} r="4.6" fill="#ffffff" />
        </>
      ) : (
        <>
          <circle cx={c.x} cy={c.y} r="13" fill="transparent" />
          <circle cx={c.x} cy={c.y} r="6.5" fill="#1d4ed8" opacity="0.85" />
          <circle cx={c.x} cy={c.y} r="11" fill="none" stroke="#1d4ed8" strokeWidth="1.4" opacity="0.3" />
        </>
      )}
    </g>
  );
}
