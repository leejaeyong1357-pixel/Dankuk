"use client";

import { playPrompt } from "@/lib/audio";
import { lookup } from "@/lib/dictionary";

/**
 * 문장을 단어 단위로 쪼개 마우스를 올릴 수 있게 한다.
 *
 * 단어 위에 올리면 오른쪽 사전 칸이 그 단어로 바뀌고, 누르면 그 단어만 읽어 준다.
 * 말풍선을 띄우지 않는 이유는, 문장 위에 떠서 읽던 줄을 가리기 때문이다.
 *
 * 단어마다 한글 발음을 따로 들고 있지 않아도 된다. 문장 발음이 단어 순서대로
 * 띄어 적혀 있어서, 토막 수가 단어 수와 같으면 그대로 짝지어 쓴다
 * (스페인어·폴란드어·힌디어·포르투갈어 180문장 전부 일치하는 것을 확인했다).
 * 수가 어긋나면 짝짓지 않고 문장 발음만 보여 준다 — 틀린 발음을 붙이느니 없는 편이 낫다.
 */

/** 마우스를 올린 단어 */
export interface HoverWord {
  word: string;
  /** 그 단어만의 한글 발음. 짝지을 수 없으면 null */
  read: string | null;
  /** 읽어 줄 때 쓸 언어 */
  lang: string;
  /** 이 단어가 들어 있는 문장의 뜻 */
  ko?: string;
}

/** 한자·가나처럼 띄어쓰기가 없는 글은 글자 하나가 곧 한 덩어리다 */
function isScriptWithoutSpaces(lang: string): boolean {
  return lang === "zh";
}

export function PhraseLine({
  text,
  read,
  lang = "en",
  ko,
  onWord,
  className = "",
}: {
  text: string;
  /** 문장 전체의 한글 발음 */
  read?: string;
  lang?: string;
  ko?: string;
  onWord: (w: HoverWord | null) => void;
  className?: string;
}) {
  const noSpaces = isScriptWithoutSpaces(lang);

  // 띄어쓰기를 살려 둔 채 쪼갠다 (중국어는 글자 하나씩)
  const parts = noSpaces ? [...text] : text.split(/(\s+)/);

  // 구두점은 단어에서 떼어 둔다 — "agenda." 로는 사전을 찾지 못한다
  const bareOf = (p: string) => p.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");

  /**
   * 단어 번호 → 발음 토막.
   *
   * 토막 수가 단어 수와 다르면 통째로 포기한다. 한 칸이라도 밀리면
   * 모든 단어에 엉뚱한 발음이 붙는다.
   */
  const chunks = read?.trim() ? read.trim().split(/\s+/) : [];
  const words = parts.filter((p) => p.trim() && bareOf(p));
  const aligned = !noSpaces && chunks.length > 0 && chunks.length === words.length;

  let n = -1;

  return (
    <span lang={lang} className={className} onMouseLeave={() => onWord(null)}>
      {parts.map((p, i) => {
        const bare = bareOf(p);
        if (!p.trim() || !bare) return <span key={i}>{p}</span>;
        n += 1;
        const mine = aligned ? (chunks[n] ?? null) : null;
        const hover: HoverWord = { word: bare, read: mine ? bareOf(mine) || mine : null, lang, ko };
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onMouseEnter={() => onWord(hover)}
            onFocus={() => onWord(hover)}
            onClick={() => playPrompt(bare, null, undefined, lang)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playPrompt(bare, null, undefined, lang);
              }
            }}
            title={`${bare} 듣기`}
            className="cursor-pointer rounded px-0.5 outline-none transition hover:bg-dku-100/70 focus:bg-dku-100/70"
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
 * 아무 데도 안 올렸을 때는 문장 전체 발음을, 단어에 올렸을 때는 그 단어의
 * 발음만 보여 준다. 마우스를 떼면 다시 문장 전체로 돌아간다.
 */
export function WordPanel({
  word,
  read,
  lang = "en",
  onSave,
  saved,
}: {
  /** 지금 마우스가 올라간 단어 */
  word: HoverWord | null;
  /** 문장 전체의 한글 발음 */
  read?: string;
  lang?: string;
  onSave?: (en: string, ko: string) => void;
  saved?: string[];
}) {
  // 낱말 사전은 영어만 갖고 있다. 다른 말에서는 문장 뜻을 대신 보여 준다
  const meaning = word && word.lang === "en" ? lookup(word.word) : null;
  const speak = () => word && playPrompt(word.word, null, undefined, word.lang);

  return (
    <aside className="sticky top-24 h-fit rounded-2xl border-2 border-dku-500 bg-white p-5">
      <p className="text-[13px] font-bold text-dku-700">사전</p>

      {word ? (
        <>
          <div className="mt-3 flex items-start gap-2">
            <p className="min-w-0 break-all text-[24px] font-bold text-dku-700">{word.word}</p>
            <button
              type="button"
              onClick={speak}
              aria-label={`${word.word} 듣기`}
              className="mt-1 shrink-0 rounded-lg bg-dku-50 p-1.5 text-dku-600 transition hover:bg-dku-100"
            >
              <SpeakerIcon />
            </button>
          </div>

          {meaning ? (
            <p className="mt-1 text-[16px] text-slate-800">{meaning}</p>
          ) : word.lang === "en" ? (
            <p className="mt-1 text-[16px] text-slate-400">사전에 없는 단어입니다</p>
          ) : (
            <>
              <p className="mt-1 text-[13px] text-slate-400">
                이 말은 낱말 사전이 아직 없습니다. 문장 뜻으로 가늠해 주세요.
              </p>
              {word.ko && <p className="mt-1.5 text-[15px] text-slate-700">{word.ko}</p>}
            </>
          )}

          {meaning && onSave && (
            <button
              type="button"
              onClick={() => onSave(word.word, meaning)}
              disabled={saved?.includes(word.word)}
              className="mt-3 rounded-lg border border-dku-200 px-3 py-1.5 text-[12px] font-bold text-dku-700 transition hover:bg-dku-50 disabled:border-slate-200 disabled:text-slate-400"
            >
              {saved?.includes(word.word) ? "단어장에 있음" : "＋ 단어장에 담기"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
          문장의 단어에 마우스를 올리면 뜻과 발음이 여기에 나옵니다. 누르면 그 단어만 읽어 줍니다.
        </p>
      )}

      {/* 단어에 올라가 있으면 그 단어 발음, 아니면 문장 전체 발음 */}
      {word?.read ? (
        <Reading label="이 단어 발음" value={word.read} />
      ) : (
        read && <Reading label="이 문장 발음" value={read} />
      )}
    </aside>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <p className="text-[12px] font-bold text-slate-400">{label}</p>
      <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">[{value}]</p>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
    </svg>
  );
}
