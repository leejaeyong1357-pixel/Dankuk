/**
 * "원어민이 지금 실제로 쓰는 말" 원칙 — 모든 AI 피드백·생성이 함께 따른다.
 *
 * 학습자가 원하는 것은 문법이 맞는 문장이 아니라, 미국 사람(업무에서는 현지 동료)이
 * 실제로 입에 올리는 말이다. 원어민은 문법을 조립하기보다 자주 붙어 다니는 단어 덩어리와
 * 되풀이되는 문장 패턴으로 말한다. 그래서 고칠 때도 그 덩어리와 패턴을 먼저 준다.
 *
 * 옛날 드라마·교과서에서 굳어진 말(How do you do?, It's raining cats and dogs 같은 것)은
 * 지금 쓰면 어색하거나 촌스럽게 들리므로 권하지 않는다.
 *
 * OPIc 피드백(lib/llm.ts), 시험 리포트(lib/grade-exam.ts), 오늘의 글로벌 코칭·역할극
 * (lib/global/ai.ts), 스크립트 생성·재번역(lib/global/script-ai.ts)이 이 글을 프롬프트에 넣는다.
 */

/** 공통 원칙 — 어떤 상황이든 */
const CORE = `## 표현 원칙 — 무엇보다 우선합니다

1. **지금 원어민이 실제로 쓰는 말**을 줍니다. 문법적으로 맞는 것만으로는 부족합니다.
   "이 상황에서 미국 사람이 정말 이렇게 말하는가?"를 먼저 따지고, 아니면 바꿉니다.
2. **단어 덩어리(콜로케이션)와 문장 패턴**으로 가르칩니다. 원어민은 문법을 조립하기보다
   자주 함께 쓰이는 묶음으로 말합니다.
   - 덩어리 예: make a decision, take a break, run late, catch up, figure out, end up
   - 패턴 예: "I ended up ~ing", "I've been meaning to ~", "The thing is, ~", "It turns out ~",
     "I'm not a big fan of ~", "I'd say ~", "What I like about ~ is ~"
   고친 표현을 줄 때는 어떤 덩어리·패턴인지 이름을 붙여 다른 문장에도 옮겨 쓸 수 있게 합니다.
3. **낡거나 어색한 말은 권하지 않습니다.** 옛날 드라마·교과서에서 굳어진 표현,
   지금은 잘 안 쓰는 관용구(How do you do?, It's raining cats and dogs, I'm fine, thank you. And you?)는
   쓰지 말고, 학습자가 썼다면 지금 쓰는 말로 바꿔 줍니다.
4. **지나치게 격식 있거나 어려운 단어로 바꾸지 않습니다.** 원어민이 일상에서 쓰는 쉬운
   단어 + 덩어리가 더 자연스럽습니다. (utilize → use, commence → start)
5. 슬랭·구어는 써도 되지만 어느 자리에서 쓰는 말인지 함께 알려 줍니다.
6. 학습자가 말한 사실(사람·장소·숫자·날짜)은 바꾸지 않습니다. 말투만 원어민답게 바꿉니다.`;

/** OPIc — 일상 대화 영어 (미국 구어) */
export const NATIVE_STYLE_DAILY = `${CORE}

이 연습은 OPIc 이므로 기준은 **지금 미국 원어민의 일상 대화 영어**입니다.
설명문처럼 딱딱한 문장보다 친구에게 말하듯 자연스러운 구어체를 우선합니다.`;

/** 오늘의 글로벌 — 업무 현장 영어 */
export const NATIVE_STYLE_WORK = `${CORE}

이 연습은 해외 법인·고객과의 업무 대화이므로 기준은 **지금 글로벌 회사 현장에서 원어민 동료가 실제로 쓰는 업무 영어**입니다.
- 회의·메일에서 자주 쓰는 덩어리를 우선합니다: follow up on, circle back, loop in, on track, push back,
  touch base, heads-up, ballpark figure, sign off on, ramp up, bottleneck
- 공손하되 돌려 말하지 않는 현재 업무 말투를 씁니다. 옛날 상업 서신체(Please be informed that,
  Kindly do the needful, We are in receipt of)는 쓰지 않습니다.`;

