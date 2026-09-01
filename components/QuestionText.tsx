"use client";

import { lookup } from "@/lib/dictionary";

/**
 * 문항 영어 원문. 단어 위에 마우스를 올리면 우측 사전 패널에 뜻이 뜬다.
 * (첨부 1 Wonpic 화면의 동작을 그대로 옮긴 것)
 */
export function QuestionText({
  text,
  activeWord,
  onHover,
}: {
  text: string;
  activeWord: string | null;
  onHover: (word: string | null, meaning: string | null) => void;
}) {
  // 단어와 구두점을 분리해 단어에만 hover 를 건다
  const tokens = text.split(/(\s+)/);

  return (
    <p className="text-[19px] font-semibold leading-[2.1] tracking-tight text-slate-900">
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        const core = tok.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
        const lead = tok.slice(0, tok.indexOf(core) === -1 ? 0 : tok.indexOf(core));
        const tail = tok.slice(lead.length + core.length);
        if (!core) return <span key={i}>{tok}</span>;
        const meaning = lookup(core);
        return (
          <span key={i}>
            {lead}
            <span
              className="word"
              data-active={activeWord === `${i}` ? "true" : "false"}
              onMouseEnter={() => onHover(core, meaning)}
              onFocus={() => onHover(core, meaning)}
              tabIndex={0}
            >
              {core}
            </span>
            {tail}
          </span>
        );
      })}
    </p>
  );
}
