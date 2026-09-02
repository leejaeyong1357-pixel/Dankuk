/**
 * 결정적 지표 계산 검증.
 *
 * 이 값들은 LLM 을 거치지 않고 채점에 직접 들어가므로 회귀가 생기면
 * 학생 점수가 조용히 틀어진다. 경계 사례를 고정해 둔다.
 *
 * 실행: npm run verify:metrics
 */
import { computeMetrics, gapsFromMetrics } from "../lib/metrics.ts";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`   ✓ ${msg}`);
  else { console.log(`   ✗ ${msg}`); failures++; }
};

/** 단어 목록으로 Transcript 를 만든다 */
function tx(words, opts = {}) {
  const list = words.map((w, i) => ({
    word: w,
    start: Number((i * 0.4).toFixed(2)),
    end: Number((i * 0.4 + 0.3).toFixed(2)),
  }));
  const duration = opts.duration ?? (list.length ? list[list.length - 1].end : 0);
  return {
    text: words.join(" "),
    durationSec: duration,
    words: opts.words ?? list,
    segments: opts.segments ?? [{ text: words.join(" "), start: 0, end: duration, language: "en" }],
  };
}

console.log("\n── 필러 오탐 방지 ──────────────────────────");
{
  // "like" 는 동사, "well" 은 부사, "actually" 는 담화 표지로도 쓰인다.
  // 문맥 없이 세면 정상 발화를 필러로 오탐해 감점하게 된다.
  const m = computeMetrics(tx("I like to study there and I do well actually".split(" ")));
  ok(m.fillerCount === 0, `like/well/actually 는 필러로 세지 않는다 (${m.fillerCount}회)`);

  const m2 = computeMetrics(tx("um I uh went there hmm yesterday".split(" ")));
  ok(m2.fillerCount === 3, `간투사 um/uh/hmm 은 센다 (${m2.fillerCount}회)`);

  const phrase = computeMetrics(tx("you know I mean it was kind of good".split(" ")));
  ok(phrase.fillerCount === 3, `구 단위 필러(you know / I mean / kind of)를 센다 (${phrase.fillerCount}회)`);
}

console.log("\n── 연결어 ──────────────────────────────────");
{
  const m = computeMetrics(tx("I went because it was fun but then I left".split(" ")));
  ok(m.distinctConnectors.includes("because"), "because 를 연결어로 센다");
  ok(!m.distinctConnectors.includes("actually"), "actually 는 논리 연결어로 세지 않는다");
  ok(m.distinctConnectors.length >= 3, `연결어 종류 ${m.distinctConnectors.length}종`);
}

console.log("\n── 과거시제 ────────────────────────────────");
{
  const m = computeMetrics(tx("I went there and watched a movie and enjoyed it".split(" ")));
  ok(m.pastTenseVerbCount >= 3, `불규칙(went)과 규칙(-ed)을 모두 센다 (${m.pastTenseVerbCount}개)`);
}

console.log("\n── 침묵 구간 ───────────────────────────────");
{
  const words = [
    { word: "I", start: 0, end: 0.3 },
    { word: "went", start: 3.5, end: 3.8 },   // 3.2초 공백
    { word: "there", start: 4.0, end: 4.3 },
  ];
  const m = computeMetrics({
    text: "I went there", durationSec: 4.3, words,
    segments: [{ text: "I went there", start: 0, end: 4.3, language: "en" }],
  });
  ok(m.longestPauseSec >= 3.1, `최장 침묵 ${m.longestPauseSec}초`);
  ok(m.pauseOverTwoSec === 1, `2초 이상 침묵 ${m.pauseOverTwoSec}회`);
}

console.log("\n── 한국어 이탈 탐지 ────────────────────────");
{
  const m = computeMetrics({
    text: "I went there 그리고 재밌었어요",
    durationSec: 6,
    words: [{ word: "I", start: 0, end: 0.3 }],
    segments: [
      { text: "I went there", start: 0, end: 3, language: "en" },
      { text: "그리고 재밌었어요", start: 3, end: 6, language: "ko" },
    ],
  });
  ok(m.koreanSpillover === true, "ko 태그 구간이 있으면 이탈로 판정한다");
  ok(m.koreanSpilloverSec === 3, `한국어 발화 ${m.koreanSpilloverSec}초`);

  const clean = computeMetrics(tx("I went there".split(" ")));
  ok(clean.koreanSpillover === false, "영어만 있으면 이탈이 아니다");
}

console.log("\n── 무응답 ──────────────────────────────────");
{
  const m = computeMetrics({ text: "", durationSec: 0, words: [], segments: [] });
  ok(m.wordCount === 0 && Number.isFinite(m.wpm), `무응답에서 0으로 나누지 않는다 (wpm=${m.wpm})`);
  ok(m.typeTokenRatio === 0, "무응답의 어휘 다양성은 0");
}

console.log("\n── 목표 등급 대비 미달 판정 ────────────────");
{
  const short = computeMetrics(tx("I like it".split(" ")));
  const gaps = gapsFromMetrics(short, "IH");
  ok(gaps.some((g) => g.includes("발화 시간")), "짧은 답변에서 발화 시간 미달을 지적한다");
  ok(gaps.some((g) => g.includes("단어 수")), "단어 수 미달을 지적한다");

  const spill = computeMetrics({
    text: "네", durationSec: 5, words: [],
    segments: [{ text: "네", start: 0, end: 5, language: "ko" }],
  });
  ok(
    gapsFromMetrics(spill, "IM2").some((g) => g.includes("한국어")),
    "한국어 이탈을 감점 요인으로 지적한다",
  );
}

console.log(failures === 0 ? "\n전체 통과\n" : `\n실패 ${failures}건\n`);
process.exit(failures === 0 ? 0 : 1);
