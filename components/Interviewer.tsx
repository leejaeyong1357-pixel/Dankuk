"use client";

import { useState } from "react";

/**
 * 모의고사 면접관.
 *
 * 실제 OPIc 화면은 사각 액자 안에 면접관 반신 일러스트를 보여 준다.
 * 학생이 시험장에서 마주할 화면과 같은 구도로 연습해야 실전에서 덜 당황하므로
 * 프레임·구도·크기를 맞춘다.
 *
 * 다만 실제 시험의 캐릭터 그림은 그대로 옮기지 않는다. 남의 원화이기 때문이다.
 * 같은 형식의 자체 캐릭터(EVA)이며, 역할은 정해진 문항을 순서대로
 * 읽어주는 것이다. 학생의 답을 이해해 대화를 잇는 챗봇이 아니다.
 *
 * 직접 만들거나 사용권을 확보한 그림이 있으면 public/interviewer.png 로 넣으면
 * 된다. 파일이 있으면 그 그림을 쓰고, 없으면 아래에 그려 둔 것을 쓴다.
 */
const PORTRAIT = "/interviewer.png";
export const INTERVIEWER_NAME = "EVA";

export function Interviewer({
  speaking,
  name = INTERVIEWER_NAME,
  caption,
  size = "md",
}: {
  speaking: boolean;
  name?: string;
  /** 액자 아래 보조 문구. 없으면 표시하지 않는다 */
  caption?: string;
  /** lg = 시작 화면, md = 문항 진행 중, wide = 응시 화면의 가로 액자 */
  size?: "md" | "lg" | "wide";
}) {
  const [noPhoto, setNoPhoto] = useState(false);
  const wide = size === "wide";
  const w = wide ? 620 : size === "lg" ? 208 : 148;
  const h = wide ? 310 : Math.round(w * 0.9);

  return (
    <div className={wide ? "w-full" : "flex flex-col items-center"}>
      <div
        className={`overflow-hidden bg-white ${
          wide
            ? "mx-auto w-full max-w-[620px] rounded-lg border border-slate-200"
            : "border-2 border-slate-300 shadow-sm"
        }`}
        style={wide ? { aspectRatio: "2 / 1" } : { width: w, height: h }}
      >
        {!noPhoto && (
          // 정적 배포라 next/image 최적화를 쓰지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={PORTRAIT}
            alt={`면접관 ${name}`}
            className="h-full w-full object-cover"
            onError={() => setNoPhoto(true)}
          />
        )}
        {noPhoto && (
        <svg
          viewBox={wide ? "0 0 400 200" : "0 0 200 180"}
          className="h-full w-full"
          preserveAspectRatio={wide ? "xMidYMid slice" : "xMidYMin slice"}
          aria-label={`면접관 ${name}`}
          role="img"
        >
          {wide ? <RoomWide speaking={speaking} /> : <RoomTall speaking={speaking} />}
        </svg>
        )}
      </div>

      {caption && (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {speaking ? "문항을 읽는 중…" : caption}
        </p>
      )}
    </div>
  );
}

/** 얼굴 — 두 장면이 같은 얼굴을 쓴다 */
function Face({ speaking, x, y, s = 1 }: { speaking: boolean; x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* 목 */}
      <path d="M-13 4h26v34h-26z" fill="#e0ad89" />
      {/* 어깨·재킷 */}
      <path d="M-86 100c5-44 32-66 86-66s81 22 86 66z" fill="#2c3142" />
      {/* 셔츠 */}
      <path d="M-20 26L0 47l20-21 9 5-29 34h-1l-28-34z" fill="#f8fafc" />
      <path d="M-20 26L0 47l-9 18-19-34z" fill="#394052" />
      <path d="M20 26L0 47l9 18 19-34z" fill="#394052" />
      {/* 머리카락 — 어깨까지 내려오는 한 덩어리 */}
      <path
        d="M-36 52c-5-28-5-52-2-70C-33-54-20-68 0-68s33 14 38 50c3 18 3 42-2 70l-16-2c5-26 6-48 4-64-3-24-11-34-24-34s-21 10-24 34c-2 16-1 38 4 64z"
        fill="#5a3a23"
      />
      {/* 얼굴 */}
      <ellipse cx="0" cy="-18" rx="27" ry="32" fill="#f3cbab" />
      <ellipse cx="-26" cy="-16" rx="5" ry="8" fill="#e0ad89" />
      <ellipse cx="26" cy="-16" rx="5" ry="8" fill="#e0ad89" />
      {/* 앞머리 */}
      <path d="M-27 -28c3-24 14-34 27-34s24 10 27 34c-5-16-14-22-27-22-9 0-14 3-19 9-3 4-6 8-8 13z" fill="#4a2f1c" />
      {/* 눈썹·눈 */}
      <path d="M-16 -28q7-4 14 0" stroke="#4a2f1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M2 -28q7-4 14 0" stroke="#4a2f1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="-9" cy="-18" rx="4.4" ry="4.8" fill="#ffffff" />
      <ellipse cx="9" cy="-18" rx="4.4" ry="4.8" fill="#ffffff" />
      <circle cx="-9" cy="-18" r="2.6" fill="#3b2a1e" />
      <circle cx="9" cy="-18" r="2.6" fill="#3b2a1e" />
      {/* 코 */}
      <path d="M0 -14v8l-4 2" stroke="#d49c79" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* 입 — 문항을 읽을 때 열린다 */}
      {speaking ? (
        <ellipse cx="0" cy="3" rx="5.5" ry="4.5" fill="#a8524d" />
      ) : (
        <path d="M-7 2q7 4.5 14 0" stroke="#a8524d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      <ellipse cx="-18" cy="-7" rx="5" ry="3.2" fill="#eba98c" opacity="0.45" />
      <ellipse cx="18" cy="-7" rx="5" ry="3.2" fill="#eba98c" opacity="0.45" />
    </g>
  );
}

/**
 * 가로 액자용 장면 — 교실.
 *
 * 세로 그림을 가로 액자에 끼우면 양옆이 비거나 얼굴이 잘린다.
 * 가로에 맞는 장면을 따로 그린다: 왼쪽에 칠판, 가운데 면접관, 바닥선.
 */
function RoomWide({ speaking }: { speaking: boolean }) {
  return (
    <>
      <rect width="400" height="200" fill="#bcc6b7" />
      {/* 바닥 */}
      <rect y="168" width="400" height="32" fill="#a7b2a2" />
      <path d="M0 168h400" stroke="#97a393" strokeWidth="2" />

      {/* 칠판 — 오른쪽 */}
      <rect x="252" y="26" width="128" height="92" rx="2" fill="#8a7a5e" />
      <rect x="258" y="32" width="116" height="80" rx="1.5" fill="#4a6150" />
      <path d="M268 52h62M268 66h84M268 80h48" stroke="#ffffff" strokeWidth="2" opacity="0.28" strokeLinecap="round" />
      <rect x="252" y="118" width="128" height="6" rx="2" fill="#7a6c53" />

      {/* 창 — 왼쪽 */}
      <rect x="22" y="30" width="86" height="78" rx="2" fill="#cfdbe6" />
      <rect x="22" y="30" width="86" height="78" rx="2" fill="none" stroke="#9fae9a" strokeWidth="4" />
      <path d="M65 30v78M22 69h86" stroke="#9fae9a" strokeWidth="4" />

      <Face speaking={speaking} x={200} y={112} s={1.2} />
    </>
  );
}

/** 세로 액자용 장면 — 기존 구도 */
function RoomTall({ speaking }: { speaking: boolean }) {
  return (
    <>
      <rect width="200" height="180" fill="#bcc6b7" />
      <rect x="116" y="0" width="84" height="180" fill="#a7b2a2" />
      <rect x="124" y="10" width="68" height="104" fill="#4a6150" />
      <Face speaking={speaking} x={100} y={100} s={1} />
    </>
  );
}
