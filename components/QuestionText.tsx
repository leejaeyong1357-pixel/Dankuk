"use client";

import { useState } from "react";
import { STOPWORDS, lookup } from "@/lib/dictionary";

/**
 * 문항 영어 원문.
 *
 * 모르는 단어에 마우스를 올리면 그 자리에 뜻이 뜬다. 예전에는 화면 옆에
 * 사전 패널을 늘 띄워 두었는데, 읽는 자리에서 눈이 계속 옆으로 빠져
 * 문장을 끝까지 읽지 못했다. 필요할 때만 그 단어 위에 뜨게 바꿨다.
 */
export function QuestionText({
  text,
  onSaveWord,
  savedWords = [],
}: {
  text: string;
  /** 단어장에 담기. 없으면 담기 버튼을 보이지 않는다 */
  onSaveWord?: (entry: { en: string; ko: string }) => void;
  savedWords?: string[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const tokens = text.split(/(\s+)/);

  return (
    <p
      className="text-[19px] font-semibold leading-[2] text-slate-900"
      onMouseLeave={() => setOpen(null)}
    >
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        const core = tok.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
        if (!core) return <span key={i}>{tok}</span>;
        const at = tok.indexOf(core);
        const lead = tok.slice(0, at);
        const tail = tok.slice(at + core.length);
        // 누구나 아는 기능어까지 밑줄이 그어지면 문장이 지저분해진다
        const meaning = STOPWORDS.has(core.toLowerCase()) ? null : lookup(core);
        const on = open === i;

        return (
          <span key={i}>
            {lead}
            <span
              className="relative inline-block"
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onBlur={() => setOpen(null)}
            >
              <span
                className={
                  // 뜻이 있는 단어에는 밑줄을 그어 둔다. 표시가 없으면 어디에
                  // 마우스를 올려야 하는지 알 수 없어 기능이 없는 것처럼 보인다.
                  meaning
                    ? `cursor-help rounded-sm border-b-2 border-dotted transition-colors ${
                        on ? "border-dku-600 bg-dku-100 text-dku-800" : "border-slate-300"
                      }`
                    : undefined
                }
                tabIndex={meaning ? 0 : undefined}
              >
                {core}
              </span>

              {on && meaning && (
                <span
                  role="tooltip"
                  className="absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[260px] -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-[13px] font-medium leading-snug text-white shadow-lg"
                >
                  <span className="block font-bold text-white">{core}</span>
                  <span className="mt-0.5 block text-slate-200">{meaning}</span>
                  {onSaveWord && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); onSaveWord({ en: core, ko: meaning }); }}
                      disabled={savedWords.includes(core)}
                      className="mt-1.5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-white/25 disabled:text-slate-400"
                    >
                      {savedWords.includes(core) ? "단어장에 있음" : "＋ 단어장"}
                    </button>
                  )}
                  <span className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-slate-900" />
                </span>
              )}
            </span>
            {tail}
          </span>
        );
      })}
    </p>
  );
}
