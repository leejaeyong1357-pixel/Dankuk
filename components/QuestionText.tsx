"use client";

import { useState } from "react";
import { STOPWORDS, lookup } from "@/lib/dictionary";

/**
 * 문항 영어 원문.
 *
 * 뜻이 있는 단어에는 밑줄을 그어 두고, 마우스를 올리면 그 단어와 뜻을
 * 오른쪽 사전 패널로 넘긴다. 문장 위에 뜨는 말풍선은 읽는 줄을 가려서
 * 오히려 방해가 됐다.
 */
export function QuestionText({
  text,
  onHover,
}: {
  text: string;
  /** 마우스가 올라간 단어와 그 뜻 — 오른쪽 사전에 그대로 넘긴다 */
  onHover: (word: string | null, meaning: string | null) => void;
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
              onMouseEnter={() => { setOpen(i); if (meaning) onHover(core, meaning); }}
              onFocus={() => { setOpen(i); if (meaning) onHover(core, meaning); }}
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

            </span>
            {tail}
          </span>
        );
      })}
    </p>
  );
}
