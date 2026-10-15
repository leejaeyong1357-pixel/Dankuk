/**
 * 오늘의 글로벌 — 상황 시드.
 *
 * 콘텐츠는 AI 가 지어내지 않고 여기 적힌 것을 쓴다. 회의에서 쓰는 말은
 * 틀리면 바로 업무에 영향이 가므로, 검수한 문장만 내보낸다.
 * 개인화(내 이름·회의 목적으로 바꿔 말하기)만 AI 가 맡는다.
 *
 * 사업장 좌표와 공장 이름은 확인된 것이 없으므로 넣지 않는다.
 * 지도에 찍는 것은 "국가" 이며, 실제 사업장 위치가 아니다.
 */

export type GlobalKind = "meeting" | "trip";

export interface Phrase {
  en: string;
  ko: string;
}

export interface Scenario {
  id: string;
  kind: GlobalKind;
  /** 카드 제목 — "회의의 첫 30초" 처럼 상황을 그대로 */
  title: string;
  /** 한 줄 설명 */
  subtitle: string;
  /** 이 상황에서 쓰는 핵심 표현 셋 */
  phrases: [Phrase, Phrase, Phrase];
}

export interface Country {
  code: "MX" | "BR" | "PL" | "IN" | "CN";
  ko: string;
  flag: string;
  /** 지도 위 위치 (0~1000 × 0~500 좌표계) — 사업장 좌표가 아니다 */
  x: number;
  y: number;
  /** 라벨을 핀 왼쪽에 둘지 */
  labelLeft?: boolean;
}

export const COUNTRIES: Country[] = [
  { code: "MX", ko: "멕시코", flag: "🇲🇽", x: 217, y: 186, labelLeft: true },
  { code: "BR", ko: "브라질", flag: "🇧🇷", x: 358, y: 278, labelLeft: true },
  { code: "PL", ko: "폴란드", flag: "🇵🇱", x: 553, y: 106 },
  { code: "IN", ko: "인도", flag: "🇮🇳", x: 719, y: 189 },
  { code: "CN", ko: "중국", flag: "🇨🇳", x: 792, y: 153 },
];

export const KIND_KO: Record<GlobalKind, string> = {
  meeting: "글로벌 미팅",
  trip: "해외출장",
};

/** 지금 콘텐츠와 음성이 준비된 언어만 켠다 */
export const LANGUAGES = [{ code: "en", ko: "영어", enabled: true }] as const;

export const SCENARIOS: Scenario[] = [
  // ── 글로벌 미팅 ────────────────────────────────────────
  {
    id: "m-opening",
    kind: "meeting",
    title: "회의의 첫 30초",
    subtitle: "인사하고, 오늘의 안건을 소개해요.",
    phrases: [
      { en: "Let's start with today's agenda.", ko: "오늘의 안건부터 시작하겠습니다." },
      { en: "Thanks for joining on short notice.", ko: "갑작스러운 요청에도 참석해 주셔서 감사합니다." },
      { en: "We have about thirty minutes today.", ko: "오늘은 30분 정도 예정하고 있습니다." },
    ],
  },
  {
    id: "m-intro",
    kind: "meeting",
    title: "나를 소개하기",
    subtitle: "이름, 소속, 오늘 맡은 역할을 말해요.",
    phrases: [
      { en: "I'm Jiwon Park, I lead the quality team here.", ko: "저는 품질팀을 맡고 있는 박지원입니다." },
      { en: "I'll be walking you through the quality data today.", ko: "오늘 품질 데이터를 제가 설명드리겠습니다." },
      { en: "Feel free to stop me if anything is unclear.", ko: "이해가 안 되는 부분이 있으면 언제든 말씀해 주세요." },
    ],
  },
  {
    id: "m-agenda",
    kind: "meeting",
    title: "안건 소개하기",
    subtitle: "오늘 다룰 것을 순서대로 짚어요.",
    phrases: [
      { en: "There are three things I'd like to cover.", ko: "오늘 세 가지를 다루려고 합니다." },
      { en: "First, the delivery schedule. Then, the open quality issues.", ko: "먼저 납기 일정, 다음으로 미해결 품질 이슈입니다." },
      { en: "If we have time, I'd like to touch on next month's plan.", ko: "시간이 되면 다음 달 계획도 짚고 싶습니다." },
    ],
  },
  {
    id: "m-status",
    kind: "meeting",
    title: "진행 상황 공유하기",
    subtitle: "어디까지 됐고 무엇이 남았는지 말해요.",
    phrases: [
      { en: "We're on track for the end of this month.", ko: "이번 달 말 일정은 예정대로 진행 중입니다." },
      { en: "Two of the five items are still open.", ko: "다섯 건 중 두 건이 아직 미해결입니다." },
      { en: "The main blocker is the part from the supplier.", ko: "가장 큰 걸림돌은 공급사 부품입니다." },
    ],
  },
  {
    id: "m-confirm",
    kind: "meeting",
    title: "다시 확인하기",
    subtitle: "못 알아들었을 때 정중하게 되묻기.",
    phrases: [
      { en: "Sorry, could you say that again?", ko: "죄송합니다, 다시 말씀해 주시겠어요?" },
      { en: "Just to make sure I understood — you mean the June shipment?", ko: "제가 이해한 게 맞는지 확인하면, 6월 선적을 말씀하시는 거죠?" },
      { en: "Could you spell that for me?", ko: "철자를 불러 주시겠어요?" },
    ],
  },
  {
    id: "m-ask",
    kind: "meeting",
    title: "질문하고 요청하기",
    subtitle: "필요한 것을 분명하게 부탁해요.",
    phrases: [
      { en: "Could you send me the updated drawing by Friday?", ko: "금요일까지 수정된 도면을 보내 주실 수 있을까요?" },
      { en: "Who should I contact about the shipping documents?", ko: "선적 서류는 누구에게 연락하면 될까요?" },
      { en: "Would it be possible to move the review to next week?", ko: "검토를 다음 주로 옮길 수 있을까요?" },
    ],
  },
  {
    id: "m-disagree",
    kind: "meeting",
    title: "정중하게 반대하기",
    subtitle: "다른 의견을 상하지 않게 말해요.",
    phrases: [
      { en: "I see your point, but I have a concern about the timing.", ko: "말씀은 이해하지만, 일정이 좀 걱정됩니다." },
      { en: "That could work, though we'd need more time for testing.", ko: "가능은 하겠지만 검증 시간이 더 필요합니다." },
      { en: "Can we look at another option before we decide?", ko: "결정하기 전에 다른 안도 한번 볼 수 있을까요?" },
    ],
  },
  {
    id: "m-quality",
    kind: "meeting",
    title: "품질 이슈 설명하기",
    subtitle: "무엇이, 얼마나, 왜 생겼는지 말해요.",
    phrases: [
      { en: "We found a defect rate of about two percent in the last lot.", ko: "지난 로트에서 약 2%의 불량률이 확인됐습니다." },
      { en: "The root cause looks like a supplier material change.", ko: "근본 원인은 공급사 자재 변경으로 보입니다." },
      { en: "We've already contained the affected lots.", ko: "해당 로트는 이미 격리 조치했습니다." },
    ],
  },
  {
    id: "m-delivery",
    kind: "meeting",
    title: "납기 조정하기",
    subtitle: "늦어질 때 솔직하고 구체적으로 말해요.",
    phrases: [
      { en: "We'll need two more weeks for the second batch.", ko: "2차 물량은 2주가 더 필요합니다." },
      { en: "We can ship half of it on the original date.", ko: "절반은 원래 날짜에 출하할 수 있습니다." },
      { en: "I'll send a revised schedule by tomorrow morning.", ko: "내일 오전까지 수정 일정을 보내드리겠습니다." },
    ],
  },
  {
    id: "m-owner",
    kind: "meeting",
    title: "담당자와 기한 정하기",
    subtitle: "누가, 언제까지 하는지 못 박아요.",
    phrases: [
      { en: "So, Marek will handle the drawing by next Wednesday.", ko: "그럼 도면은 마렉 님이 다음 주 수요일까지 맡으시는 거죠." },
      { en: "I'll take the supplier side and report back on Friday.", ko: "공급사 쪽은 제가 맡고 금요일에 공유드리겠습니다." },
      { en: "Let's set the deadline as the tenth, end of day.", ko: "기한은 10일 업무 종료 시점으로 하겠습니다." },
    ],
  },
  {
    id: "m-closing",
    kind: "meeting",
    title: "회의 마무리하기",
    subtitle: "정리하고 다음 할 일을 확인해요.",
    phrases: [
      { en: "Let me quickly recap what we agreed.", ko: "합의한 내용을 빠르게 정리하겠습니다." },
      { en: "I'll send the meeting notes this afternoon.", ko: "회의록은 오늘 오후에 보내드리겠습니다." },
      { en: "Thanks everyone, talk to you next week.", ko: "모두 감사합니다, 다음 주에 뵙겠습니다." },
    ],
  },

  // ── 해외출장 ───────────────────────────────────────────
  {
    id: "t-arrival",
    kind: "trip",
    title: "입국과 이동",
    subtitle: "입국 심사와 택시에서 쓰는 말이에요.",
    phrases: [
      { en: "I'm here on business for five days.", ko: "출장으로 5일 머뭅니다." },
      { en: "I'm visiting our partner company.", ko: "협력사를 방문하러 왔습니다." },
      { en: "Could you take me to this address, please?", ko: "이 주소로 가 주시겠어요?" },
    ],
  },
  {
    id: "t-hotel",
    kind: "trip",
    title: "호텔 체크인",
    subtitle: "예약을 확인하고 필요한 것을 요청해요.",
    phrases: [
      { en: "I have a reservation under Park.", ko: "박으로 예약했습니다." },
      { en: "Is breakfast included?", ko: "조식이 포함되어 있나요?" },
      { en: "Could I get a late checkout on Friday?", ko: "금요일에 늦은 체크아웃이 가능할까요?" },
    ],
  },
  {
    id: "t-purpose",
    kind: "trip",
    title: "방문 목적 설명하기",
    subtitle: "현장에서 내가 온 이유를 말해요.",
    phrases: [
      { en: "I'm here to review the production line.", ko: "생산 라인을 점검하러 왔습니다." },
      { en: "We'd like to check the quality process in person.", ko: "품질 공정을 직접 확인하고 싶습니다." },
      { en: "I'll be here until Thursday.", ko: "목요일까지 머물 예정입니다." },
    ],
  },
  {
    id: "t-tour",
    kind: "trip",
    title: "현장 안내 요청하기",
    subtitle: "보고 싶은 곳을 부탁해요.",
    phrases: [
      { en: "Could you show me the assembly line first?", ko: "조립 라인부터 보여 주시겠어요?" },
      { en: "Is it okay if I take a few photos?", ko: "사진을 몇 장 찍어도 괜찮을까요?" },
      { en: "Where should I put on the safety gear?", ko: "안전 장비는 어디서 착용하면 될까요?" },
    ],
  },
  {
    id: "t-dinner",
    kind: "trip",
    title: "식사와 스몰토크",
    subtitle: "업무 밖에서 자연스럽게 대화해요.",
    phrases: [
      { en: "This is my first time in Poland — any food I should try?", ko: "폴란드는 처음인데, 꼭 먹어 볼 음식이 있을까요?" },
      { en: "How long have you been with the company?", ko: "회사에 얼마나 계셨나요?" },
      { en: "Let me get this one — you can get the next.", ko: "이번엔 제가 내겠습니다, 다음에 사 주세요." },
    ],
  },
];

export function scenariosOf(kind: GlobalKind): Scenario[] {
  return SCENARIOS.filter((s) => s.kind === kind);
}

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
