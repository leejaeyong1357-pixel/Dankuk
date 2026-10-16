"use client";

import { lookup } from "@/lib/dictionary";

/**
 * 문장을 단어 단위로 쪼개 마우스를 올릴 수 있게 한다.
 *
 * 단어 위에 올리면 오른쪽 사전 칸이 그 단어로 바뀐다.
 * 말풍선을 띄우지 않는 이유는, 문장 위에 떠서 읽던 줄을 가리기 때문이다.
 */
export function PhraseLine({
  text,
  onWord,
  className = "",
}: {
  text: string;
  onWord: (w: string | null) => void;
  className?: string;
}) {
  // 구두점은 단어에서 떼어 둔다 — "agenda." 로는 사전을 찾지 못한다
  const parts = text.split(/(\s+)/);

  return (
    <span className={className} onMouseLeave={() => onWord(null)}>
      {parts.map((p, i) => {
        if (!p.trim()) return <span key={i}>{p}</span>;
        const bare = p.replace(/^[^\w']+|[^\w']+$/g, "");
        if (!bare) return <span key={i}>{p}</span>;
        return (
          <span
            key={i}
            tabIndex={0}
            onMouseEnter={() => onWord(bare)}
            onFocus={() => onWord(bare)}
            className="cursor-help rounded px-0.5 outline-none transition hover:bg-dku-100/70 focus:bg-dku-100/70"
          >
            {p}
          </span>
        );
      })}
    </span>
  );
}

/**
 * 오른쪽 사전 칸.
 *
 * 뜻과 한글 발음을 함께 적는다. 뜻만 있으면 읽지 못하고,
 * 발음만 있으면 무슨 말인지 모른다.
 */
export function WordPanel({
  word,
  read,
  lang = "en",
  onSave,
  saved,
}: {
  word: string | null;
  /** 문장 전체의 한글 발음 */
  read?: string;
  /** 지금 보고 있는 말 — 영어가 아니면 낱말 사전이 아직 없다 */
  lang?: string;
  onSave?: (en: string, ko: string) => void;
  saved?: string[];
}) {
  const meaning = word && lang === "en" ? lookup(word) : null;

  return (
    <aside className="sticky top-24 h-fit rounded-2xl border-2 border-dku-500 bg-white p-5">
      <p className="text-[13px] font-bold text-dku-700">사전</p>

      {word ? (
        <>
          <p className="mt-3 break-all text-[24px] font-bold text-dku-700">{word}</p>
          <p className="mt-1 text-[16px] text-slate-800">
            {meaning ?? (
              <span className="text-slate-400">
                {lang === "en"
                  ? "사전에 없는 단어입니다"
                  : "이 말의 낱말 뜻은 준비 중입니다. 아래 문장 발음을 참고하세요."}
              </span>
            )}
          </p>
          {meaning && onSave && (
            <button
              type="button"
              onClick={() => onSave(word, meaning)}
              disabled={saved?.includes(word)}
              className="mt-3 rounded-lg border border-dku-200 px-3 py-1.5 text-[12px] font-bold text-dku-700 transition hover:bg-dku-50 disabled:border-slate-200 disabled:text-slate-400"
            >
              {saved?.includes(word) ? "단어장에 있음" : "＋ 단어장에 담기"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
          문장의 단어에 마우스를 올리면 뜻이 여기에 나옵니다.
        </p>
      )}

      {read && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[12px] font-bold text-slate-400">이 문장 발음</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">[{read}]</p>
        </div>
      )}
    </aside>
  );
}
