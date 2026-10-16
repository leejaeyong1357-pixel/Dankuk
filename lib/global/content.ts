/**
 * 글로벌 회화 — 상황과 표현.
 *
 * 콘텐츠는 AI 가 지어내지 않고 여기 적힌 것을 쓴다. 회의에서 쓰는 말은
 * 틀리면 바로 업무에 영향이 가므로, 검수한 문장만 내보낸다.
 * AI 는 "내 상황에 맞게 바꿔 말하기" 와 피드백만 맡는다.
 *
 * 사업장 좌표와 공장 이름은 확인된 것이 없으므로 넣지 않는다.
 * 지도에 찍는 것은 "국가" 이며 실제 사업장 위치가 아니다.
 */

export type GlobalKind = "meeting" | "trip";

export interface Phrase {
  en: string;
  ko: string;
}

export interface Scenario {
  id: string;
  kind: GlobalKind;
  /** 목록을 묶는 소분류 */
  group: string;
  title: string;
  subtitle: string;
  phrases: Phrase[];
}

export interface Country {
  code: "MX" | "BR" | "PL" | "IN" | "CN";
  ko: string;
  flag: string;
  /** 지도 위 위치 (0~1000 x 0~500) — 사업장 좌표가 아니다 */
  x: number;
  y: number;
  labelLeft?: boolean;
}

export const COUNTRIES: Country[] = [
  { code: "MX", ko: "멕시코", flag: "\u{1F1F2}\u{1F1FD}", x: 217, y: 186, labelLeft: true },
  { code: "BR", ko: "브라질", flag: "\u{1F1E7}\u{1F1F7}", x: 358, y: 278, labelLeft: true },
  { code: "PL", ko: "폴란드", flag: "\u{1F1F5}\u{1F1F1}", x: 553, y: 106 },
  { code: "IN", ko: "인도", flag: "\u{1F1EE}\u{1F1F3}", x: 719, y: 189 },
  { code: "CN", ko: "중국", flag: "\u{1F1E8}\u{1F1F3}", x: 792, y: 153 },
];

/** 우리 쪽은 늘 한국이다 — 화면에는 "중국 · 한국" 처럼 양쪽을 함께 적는다 */
export const HOME_KO = "한국";

export const KIND_KO: Record<GlobalKind, string> = {
  meeting: "글로벌 미팅",
  trip: "해외출장",
};

/**
 * 언어.
 *
 * 폴란드 사업장과는 폴란드어, 중국 사업장과는 중국어로 말하는 것이 먼저다.
 * 회의를 영어로 하는 자리도 많으므로 영어는 모든 나라에서 고를 수 있게 둔다.
 */
export interface Language {
  code: LangCode;
  ko: string;
  /** 모국어로 적은 이름 */
  native: string;
}

export type LangCode = "en" | "pl" | "zh" | "hi" | "pt" | "es";

export const LANGUAGES: Language[] = [
  { code: "pl", ko: "폴란드어", native: "Polski" },
  { code: "zh", ko: "중국어", native: "中文" },
  { code: "hi", ko: "힌디어", native: "हिन्दी" },
  { code: "pt", ko: "포르투갈어", native: "Português" },
  { code: "es", ko: "스페인어", native: "Español" },
  { code: "en", ko: "영어", native: "English" },
];

/** 그 나라에서 먼저 쓰는 말 — 국가를 고르면 이 언어로 맞춰진다 */
export const LANG_BY_COUNTRY: Record<Country["code"], LangCode> = {
  PL: "pl",
  CN: "zh",
  IN: "hi",
  BR: "pt",
  MX: "es",
};

/** 그 나라에서 고를 수 있는 말 — 자국어가 먼저, 영어가 뒤 */
export function languagesFor(country: Country["code"]): Language[] {
  const own = LANG_BY_COUNTRY[country];
  return LANGUAGES.filter((l) => l.code === own || l.code === "en").sort((a) =>
    a.code === own ? -1 : 1,
  );
}

export function languageKo(code: LangCode): string {
  return LANGUAGES.find((l) => l.code === code)?.ko ?? "영어";
}

export const SCENARIOS: Scenario[] = [
  {
    id: "m01",
    kind: "meeting",
    group: "회의 열기",
    title: "오프닝 · 인사",
    subtitle: "회의를 여는 첫 인사",
    phrases: [
      {
        en: "Good morning, everyone. Thanks for joining.",
        ko: "안녕하세요, 참석해 주셔서 감사합니다."
      },
      {
        en: "Can everyone hear me okay?",
        ko: "제 목소리 잘 들리시나요?"
      },
      {
        en: "Let's give it another minute for the others.",
        ko: "다른 분들을 위해 1분만 더 기다리겠습니다."
      }
    ]
  },
  {
    id: "m02",
    kind: "meeting",
    group: "회의 열기",
    title: "안건 소개",
    subtitle: "오늘 다룰 것을 순서대로",
    phrases: [
      {
        en: "Let's start with today's agenda.",
        ko: "오늘의 안건부터 시작하겠습니다."
      },
      {
        en: "There are three things I'd like to cover.",
        ko: "세 가지를 다루려고 합니다."
      },
      {
        en: "If we have time, I'd like to touch on next month's plan.",
        ko: "시간이 되면 다음 달 계획도 짚고 싶습니다."
      }
    ]
  },
  {
    id: "m03",
    kind: "meeting",
    group: "회의 열기",
    title: "자기소개",
    subtitle: "이름·소속·오늘 맡은 역할",
    phrases: [
      {
        en: "I'm Jiwon Park, I lead the quality team.",
        ko: "품질팀을 맡고 있는 박지원입니다."
      },
      {
        en: "I'll be walking you through the data today.",
        ko: "오늘 데이터를 제가 설명드리겠습니다."
      },
      {
        en: "Feel free to stop me if anything is unclear.",
        ko: "이해가 안 되시면 언제든 말씀해 주세요."
      }
    ]
  },
  {
    id: "m04",
    kind: "meeting",
    group: "회의 열기",
    title: "참석자 확인",
    subtitle: "누가 왔는지 짚고 넘어가기",
    phrases: [
      {
        en: "Is everyone on the call?",
        ko: "모두 접속하셨나요?"
      },
      {
        en: "I think we're still waiting on Marek.",
        ko: "마렉 님을 아직 기다리는 것 같습니다."
      },
      {
        en: "Let's go ahead and start.",
        ko: "그럼 시작하겠습니다."
      }
    ]
  },
  {
    id: "m05",
    kind: "meeting",
    group: "회의 열기",
    title: "회의 목적 말하기",
    subtitle: "왜 모였는지 한 문장으로",
    phrases: [
      {
        en: "The goal today is to agree on the delivery date.",
        ko: "오늘 목표는 납기일에 합의하는 것입니다."
      },
      {
        en: "We need a decision by the end of this call.",
        ko: "이 회의 안에 결정이 필요합니다."
      },
      {
        en: "I'd like your input before we finalize.",
        ko: "확정하기 전에 의견을 듣고 싶습니다."
      }
    ]
  },
  {
    id: "m06",
    kind: "meeting",
    group: "진행과 공유",
    title: "진행 상황 공유",
    subtitle: "어디까지 됐는지",
    phrases: [
      {
        en: "We're on track for the end of this month.",
        ko: "이번 달 말 일정은 예정대로입니다."
      },
      {
        en: "Two of the five items are still open.",
        ko: "다섯 건 중 두 건이 아직 미해결입니다."
      },
      {
        en: "The main blocker is the part from the supplier.",
        ko: "가장 큰 걸림돌은 공급사 부품입니다."
      }
    ]
  },
  {
    id: "m07",
    kind: "meeting",
    group: "진행과 공유",
    title: "숫자 설명하기",
    subtitle: "수치를 분명하게",
    phrases: [
      {
        en: "The defect rate went down from three percent to one.",
        ko: "불량률이 3%에서 1%로 내려갔습니다."
      },
      {
        en: "That's about two thousand units per week.",
        ko: "주당 약 2천 개 수준입니다."
      },
      {
        en: "These numbers are as of last Friday.",
        ko: "이 수치는 지난 금요일 기준입니다."
      }
    ]
  },
  {
    id: "m08",
    kind: "meeting",
    group: "진행과 공유",
    title: "자료 공유하기",
    subtitle: "화면이나 문서를 띄울 때",
    phrases: [
      {
        en: "Let me share my screen.",
        ko: "화면을 공유하겠습니다."
      },
      {
        en: "Can you see the slide now?",
        ko: "지금 슬라이드가 보이시나요?"
      },
      {
        en: "I'll send this file right after the meeting.",
        ko: "회의 후 바로 파일을 보내드리겠습니다."
      }
    ]
  },
  {
    id: "m09",
    kind: "meeting",
    group: "진행과 공유",
    title: "다시 확인하기",
    subtitle: "못 알아들었을 때",
    phrases: [
      {
        en: "Sorry, could you say that again?",
        ko: "죄송합니다, 다시 말씀해 주시겠어요?"
      },
      {
        en: "Just to make sure — you mean the June shipment?",
        ko: "확인차 여쭙는데, 6월 선적을 말씀하시는 거죠?"
      },
      {
        en: "Could you spell that for me?",
        ko: "철자를 불러 주시겠어요?"
      }
    ]
  },
  {
    id: "m10",
    kind: "meeting",
    group: "진행과 공유",
    title: "천천히 부탁하기",
    subtitle: "속도가 빠를 때",
    phrases: [
      {
        en: "Could you speak a little more slowly, please?",
        ko: "조금만 더 천천히 말씀해 주시겠어요?"
      },
      {
        en: "You're breaking up a bit.",
        ko: "소리가 조금 끊깁니다."
      },
      {
        en: "Let me repeat that back to you.",
        ko: "제가 다시 한번 정리해 보겠습니다."
      }
    ]
  },
  {
    id: "m11",
    kind: "meeting",
    group: "묻고 답하기",
    title: "질문하기",
    subtitle: "필요한 것을 묻기",
    phrases: [
      {
        en: "Who should I contact about the shipping documents?",
        ko: "선적 서류는 누구에게 연락하면 될까요?"
      },
      {
        en: "When can we expect the updated drawing?",
        ko: "수정 도면은 언제쯤 받을 수 있을까요?"
      },
      {
        en: "What's the lead time for that part?",
        ko: "그 부품의 리드타임은 얼마나 되나요?"
      }
    ]
  },
  {
    id: "m12",
    kind: "meeting",
    group: "묻고 답하기",
    title: "요청하기",
    subtitle: "정중하게 부탁하기",
    phrases: [
      {
        en: "Could you send me the report by Friday?",
        ko: "금요일까지 보고서를 보내 주실 수 있을까요?"
      },
      {
        en: "Would it be possible to move the review to next week?",
        ko: "검토를 다음 주로 옮길 수 있을까요?"
      },
      {
        en: "I'd appreciate it if you could confirm by tomorrow.",
        ko: "내일까지 확인해 주시면 감사하겠습니다."
      }
    ]
  },
  {
    id: "m13",
    kind: "meeting",
    group: "묻고 답하기",
    title: "정중한 반대",
    subtitle: "다른 의견 말하기",
    phrases: [
      {
        en: "I see your point, but I have a concern about the timing.",
        ko: "말씀은 이해하지만 일정이 걱정됩니다."
      },
      {
        en: "That could work, though we'd need more time for testing.",
        ko: "가능은 하겠지만 검증 시간이 더 필요합니다."
      },
      {
        en: "Can we look at another option before we decide?",
        ko: "결정 전에 다른 안도 볼 수 있을까요?"
      }
    ]
  },
  {
    id: "m14",
    kind: "meeting",
    group: "묻고 답하기",
    title: "동의하기",
    subtitle: "좋다고 말하기",
    phrases: [
      {
        en: "That works for us.",
        ko: "저희는 괜찮습니다."
      },
      {
        en: "I'm comfortable with that approach.",
        ko: "그 방식에 동의합니다."
      },
      {
        en: "Let's go with that.",
        ko: "그렇게 하시죠."
      }
    ]
  },
  {
    id: "m15",
    kind: "meeting",
    group: "묻고 답하기",
    title: "보류하기",
    subtitle: "지금 결정 못 할 때",
    phrases: [
      {
        en: "Let me check internally and get back to you.",
        ko: "내부 확인 후 다시 말씀드리겠습니다."
      },
      {
        en: "I'd rather not commit to a date just yet.",
        ko: "아직 날짜를 확답드리기는 어렵습니다."
      },
      {
        en: "Can we park this and come back to it?",
        ko: "이 건은 잠시 두고 나중에 다시 볼까요?"
      }
    ]
  },
  {
    id: "m16",
    kind: "meeting",
    group: "문제와 협의",
    title: "품질 이슈 설명",
    subtitle: "무엇이·왜 생겼는지",
    phrases: [
      {
        en: "We found a defect rate of about two percent in the last lot.",
        ko: "지난 로트에서 약 2% 불량률이 확인됐습니다."
      },
      {
        en: "The root cause looks like a supplier material change.",
        ko: "근본 원인은 공급사 자재 변경으로 보입니다."
      },
      {
        en: "We've already contained the affected lots.",
        ko: "해당 로트는 이미 격리했습니다."
      }
    ]
  },
  {
    id: "m17",
    kind: "meeting",
    group: "문제와 협의",
    title: "불만 전달하기",
    subtitle: "문제를 분명히 말하기",
    phrases: [
      {
        en: "We've seen this issue three times this quarter.",
        ko: "이번 분기에만 세 번째 발생한 문제입니다."
      },
      {
        en: "This is affecting our production schedule.",
        ko: "저희 생산 일정에 영향을 주고 있습니다."
      },
      {
        en: "We need a corrective action plan by next week.",
        ko: "다음 주까지 개선 계획이 필요합니다."
      }
    ]
  },
  {
    id: "m18",
    kind: "meeting",
    group: "문제와 협의",
    title: "사과하기",
    subtitle: "우리 쪽 잘못일 때",
    phrases: [
      {
        en: "I'm sorry for the delay on our side.",
        ko: "저희 쪽 지연에 대해 죄송합니다."
      },
      {
        en: "We take full responsibility for this.",
        ko: "이 건은 저희 책임입니다."
      },
      {
        en: "Here's what we're doing to prevent it.",
        ko: "재발 방지를 위해 이렇게 조치하고 있습니다."
      }
    ]
  },
  {
    id: "m19",
    kind: "meeting",
    group: "문제와 협의",
    title: "납기 조정",
    subtitle: "늦어질 때",
    phrases: [
      {
        en: "We'll need two more weeks for the second batch.",
        ko: "2차 물량은 2주가 더 필요합니다."
      },
      {
        en: "We can ship half of it on the original date.",
        ko: "절반은 원래 날짜에 출하할 수 있습니다."
      },
      {
        en: "I'll send a revised schedule by tomorrow morning.",
        ko: "내일 오전까지 수정 일정을 보내겠습니다."
      }
    ]
  },
  {
    id: "m20",
    kind: "meeting",
    group: "문제와 협의",
    title: "설계 변경 논의",
    subtitle: "도면이 바뀔 때",
    phrases: [
      {
        en: "The customer requested a design change last week.",
        ko: "고객이 지난주에 설계 변경을 요청했습니다."
      },
      {
        en: "This will affect the tooling schedule.",
        ko: "금형 일정에 영향이 있습니다."
      },
      {
        en: "Can your team review the new drawing by Wednesday?",
        ko: "수요일까지 새 도면을 검토해 주실 수 있을까요?"
      }
    ]
  },
  {
    id: "m21",
    kind: "meeting",
    group: "문제와 협의",
    title: "생산 계획 조율",
    subtitle: "물량과 일정",
    phrases: [
      {
        en: "We're planning twenty thousand units for May.",
        ko: "5월에 2만 개를 계획하고 있습니다."
      },
      {
        en: "Can your line handle that volume?",
        ko: "그 물량을 라인에서 소화할 수 있을까요?"
      },
      {
        en: "Let's lock the plan by the end of this week.",
        ko: "이번 주 안에 계획을 확정하시죠."
      }
    ]
  },
  {
    id: "m22",
    kind: "meeting",
    group: "문제와 협의",
    title: "비용 이야기",
    subtitle: "돈 이야기 꺼내기",
    phrases: [
      {
        en: "Could you share the cost breakdown?",
        ko: "비용 내역을 공유해 주시겠어요?"
      },
      {
        en: "That's higher than what we budgeted.",
        ko: "예산보다 높습니다."
      },
      {
        en: "Is there room to negotiate on the unit price?",
        ko: "단가에 조정 여지가 있을까요?"
      }
    ]
  },
  {
    id: "m23",
    kind: "meeting",
    group: "마무리",
    title: "담당자와 기한 정하기",
    subtitle: "누가 언제까지",
    phrases: [
      {
        en: "So, Marek will handle the drawing by next Wednesday.",
        ko: "도면은 마렉 님이 다음 주 수요일까지 맡으시는 거죠."
      },
      {
        en: "I'll take the supplier side and report back on Friday.",
        ko: "공급사 쪽은 제가 맡고 금요일에 공유하겠습니다."
      },
      {
        en: "Let's set the deadline as the tenth, end of day.",
        ko: "기한은 10일 업무 종료 시점으로 하겠습니다."
      }
    ]
  },
  {
    id: "m24",
    kind: "meeting",
    group: "마무리",
    title: "회의록 정리",
    subtitle: "결정 사항 확인",
    phrases: [
      {
        en: "Let me quickly recap what we agreed.",
        ko: "합의한 내용을 빠르게 정리하겠습니다."
      },
      {
        en: "So there are three action items.",
        ko: "실행 항목이 세 가지입니다."
      },
      {
        en: "Please correct me if I missed anything.",
        ko: "빠진 것이 있으면 말씀해 주세요."
      }
    ]
  },
  {
    id: "m25",
    kind: "meeting",
    group: "마무리",
    title: "다음 회의 잡기",
    subtitle: "일정 정하기",
    phrases: [
      {
        en: "Shall we meet again in two weeks?",
        ko: "2주 뒤에 다시 만날까요?"
      },
      {
        en: "Does Tuesday afternoon work for you?",
        ko: "화요일 오후 괜찮으신가요?"
      },
      {
        en: "I'll send a calendar invite today.",
        ko: "오늘 중으로 초대장을 보내겠습니다."
      }
    ]
  },
  {
    id: "m26",
    kind: "meeting",
    group: "마무리",
    title: "클로징",
    subtitle: "회의 마무리",
    phrases: [
      {
        en: "I'll send the meeting notes this afternoon.",
        ko: "회의록은 오늘 오후에 보내겠습니다."
      },
      {
        en: "Thanks everyone, talk to you next week.",
        ko: "모두 감사합니다, 다음 주에 뵙겠습니다."
      },
      {
        en: "Have a good rest of your day.",
        ko: "남은 하루도 잘 보내세요."
      }
    ]
  },
  {
    id: "m27",
    kind: "meeting",
    group: "마무리",
    title: "시차 조율",
    subtitle: "서로 다른 시간대",
    phrases: [
      {
        en: "What time works for you in your time zone?",
        ko: "그쪽 시간으로 몇 시가 괜찮으신가요?"
      },
      {
        en: "That would be eight in the morning for us.",
        ko: "저희 쪽은 아침 8시가 됩니다."
      },
      {
        en: "Let's alternate the meeting time each month.",
        ko: "매달 회의 시간을 번갈아 가며 정하시죠."
      }
    ]
  },
  {
    id: "m28",
    kind: "meeting",
    group: "마무리",
    title: "메일 후속 조치",
    subtitle: "회의 뒤에 보내는 말",
    phrases: [
      {
        en: "As discussed in today's call, here's the summary.",
        ko: "오늘 회의에서 논의한 대로 요약 드립니다."
      },
      {
        en: "Please let me know if anything looks different.",
        ko: "다르게 이해하신 부분이 있으면 알려 주세요."
      },
      {
        en: "I'll follow up early next week.",
        ko: "다음 주 초에 다시 연락드리겠습니다."
      }
    ]
  },
  {
    id: "m29",
    kind: "meeting",
    group: "마무리",
    title: "소개와 연결",
    subtitle: "사람을 소개할 때",
    phrases: [
      {
        en: "Let me introduce my colleague, Minsu.",
        ko: "제 동료 민수를 소개하겠습니다."
      },
      {
        en: "He'll be your main contact from now on.",
        ko: "앞으로 주 담당자는 그분입니다."
      },
      {
        en: "I'll copy him on the next email.",
        ko: "다음 메일에 참조로 넣겠습니다."
      }
    ]
  },
  {
    id: "m30",
    kind: "meeting",
    group: "마무리",
    title: "회의 중 끼어들기",
    subtitle: "말을 끊어야 할 때",
    phrases: [
      {
        en: "Sorry to jump in — can I add one thing?",
        ko: "끼어들어 죄송한데, 한 가지만 덧붙여도 될까요?"
      },
      {
        en: "Before we move on, I have a quick question.",
        ko: "넘어가기 전에 짧은 질문이 있습니다."
      },
      {
        en: "Let's come back to that in a moment.",
        ko: "그 건은 잠시 후에 다시 다루시죠."
      }
    ]
  },
  {
    id: "t01",
    kind: "trip",
    group: "공항·비행기",
    title: "항공권·체크인",
    subtitle: "공항 카운터에서",
    phrases: [
      {
        en: "I'd like an aisle seat, please.",
        ko: "통로 쪽 좌석으로 부탁드립니다."
      },
      {
        en: "Just one checked bag.",
        ko: "부칠 짐은 하나입니다."
      },
      {
        en: "Where is the gate for this flight?",
        ko: "이 항공편 게이트는 어디인가요?"
      }
    ]
  },
  {
    id: "t02",
    kind: "trip",
    group: "공항·비행기",
    title: "보안 검색",
    subtitle: "검색대 통과",
    phrases: [
      {
        en: "Do I need to take out my laptop?",
        ko: "노트북을 꺼내야 하나요?"
      },
      {
        en: "These are my personal items.",
        ko: "개인 소지품입니다."
      },
      {
        en: "Sorry, I forgot about the bottle.",
        ko: "죄송합니다, 물병을 깜빡했습니다."
      }
    ]
  },
  {
    id: "t03",
    kind: "trip",
    group: "공항·비행기",
    title: "기내에서",
    subtitle: "비행기 안",
    phrases: [
      {
        en: "Could I have some water, please?",
        ko: "물 좀 주시겠어요?"
      },
      {
        en: "Excuse me, I think that's my seat.",
        ko: "실례지만 제 자리인 것 같습니다."
      },
      {
        en: "Could you help me with the overhead bin?",
        ko: "짐칸 좀 도와주시겠어요?"
      }
    ]
  },
  {
    id: "t04",
    kind: "trip",
    group: "공항·비행기",
    title: "환승",
    subtitle: "비행기를 갈아탈 때",
    phrases: [
      {
        en: "I'm connecting to Warsaw.",
        ko: "바르샤바로 환승합니다."
      },
      {
        en: "Where do I go for the transfer?",
        ko: "환승은 어디로 가야 하나요?"
      },
      {
        en: "My layover is about three hours.",
        ko: "환승 대기는 세 시간 정도입니다."
      }
    ]
  },
  {
    id: "t05",
    kind: "trip",
    group: "공항·비행기",
    title: "입국 심사",
    subtitle: "심사대에서",
    phrases: [
      {
        en: "I'm here on business for five days.",
        ko: "출장으로 5일 머뭅니다."
      },
      {
        en: "I'm visiting our partner company.",
        ko: "협력사를 방문하러 왔습니다."
      },
      {
        en: "I'm staying at the Marriott downtown.",
        ko: "시내 메리어트에 묵습니다."
      }
    ]
  },
  {
    id: "t06",
    kind: "trip",
    group: "공항·비행기",
    title: "수하물 문제",
    subtitle: "짐이 안 나왔을 때",
    phrases: [
      {
        en: "My bag didn't come out.",
        ko: "제 가방이 나오지 않았습니다."
      },
      {
        en: "Here's my baggage claim tag.",
        ko: "수하물 표입니다."
      },
      {
        en: "Could you deliver it to my hotel?",
        ko: "호텔로 보내 주실 수 있나요?"
      }
    ]
  },
  {
    id: "t07",
    kind: "trip",
    group: "공항·비행기",
    title: "공항에서 이동",
    subtitle: "택시·기차",
    phrases: [
      {
        en: "Where can I get a taxi?",
        ko: "택시는 어디서 탈 수 있나요?"
      },
      {
        en: "Could you take me to this address, please?",
        ko: "이 주소로 가 주시겠어요?"
      },
      {
        en: "How long does it take to downtown?",
        ko: "시내까지 얼마나 걸리나요?"
      }
    ]
  },
  {
    id: "t08",
    kind: "trip",
    group: "공항·비행기",
    title: "환전·결제",
    subtitle: "돈 쓰는 자리",
    phrases: [
      {
        en: "Do you take credit cards?",
        ko: "카드 결제 되나요?"
      },
      {
        en: "Could I get a receipt, please?",
        ko: "영수증 주시겠어요?"
      },
      {
        en: "Where's the nearest ATM?",
        ko: "가장 가까운 ATM이 어디인가요?"
      }
    ]
  },
  {
    id: "t09",
    kind: "trip",
    group: "공항·비행기",
    title: "유심·통신",
    subtitle: "현지 연결",
    phrases: [
      {
        en: "I'd like a prepaid SIM card.",
        ko: "선불 유심을 사고 싶습니다."
      },
      {
        en: "Does it include data?",
        ko: "데이터가 포함되나요?"
      },
      {
        en: "Could you help me set it up?",
        ko: "설정 좀 도와주시겠어요?"
      }
    ]
  },
  {
    id: "t10",
    kind: "trip",
    group: "호텔·이동",
    title: "호텔 체크인",
    subtitle: "숙소 도착",
    phrases: [
      {
        en: "I have a reservation under Park.",
        ko: "박으로 예약했습니다."
      },
      {
        en: "Is breakfast included?",
        ko: "조식이 포함되어 있나요?"
      },
      {
        en: "What time is checkout?",
        ko: "체크아웃은 몇 시인가요?"
      }
    ]
  },
  {
    id: "t11",
    kind: "trip",
    group: "호텔·이동",
    title: "호텔 요청",
    subtitle: "방에서 필요한 것",
    phrases: [
      {
        en: "Could I get an extra towel?",
        ko: "수건을 하나 더 받을 수 있을까요?"
      },
      {
        en: "The air conditioning isn't working.",
        ko: "에어컨이 작동하지 않습니다."
      },
      {
        en: "Could I have a wake-up call at six?",
        ko: "6시에 모닝콜 부탁드립니다."
      }
    ]
  },
  {
    id: "t12",
    kind: "trip",
    group: "호텔·이동",
    title: "호텔 연장·변경",
    subtitle: "일정이 바뀔 때",
    phrases: [
      {
        en: "Could I extend my stay by one night?",
        ko: "하루 더 연장할 수 있을까요?"
      },
      {
        en: "Could I get a late checkout on Friday?",
        ko: "금요일에 늦은 체크아웃이 가능할까요?"
      },
      {
        en: "Is there a fee for that?",
        ko: "추가 요금이 있나요?"
      }
    ]
  },
  {
    id: "t13",
    kind: "trip",
    group: "호텔·이동",
    title: "길 묻기",
    subtitle: "현지에서 이동",
    phrases: [
      {
        en: "Excuse me, how do I get to the station?",
        ko: "실례지만 역까지 어떻게 가나요?"
      },
      {
        en: "Is it within walking distance?",
        ko: "걸어갈 만한 거리인가요?"
      },
      {
        en: "Could you show me on the map?",
        ko: "지도에서 보여 주시겠어요?"
      }
    ]
  },
  {
    id: "t14",
    kind: "trip",
    group: "현장 방문",
    title: "회사 방문 도착",
    subtitle: "리셉션에서",
    phrases: [
      {
        en: "I have a meeting with Mr. Nowak at ten.",
        ko: "10시에 노박 씨와 회의가 있습니다."
      },
      {
        en: "I'm from SL Corporation in Korea.",
        ko: "한국 SL에서 왔습니다."
      },
      {
        en: "Should I sign in here?",
        ko: "여기에 서명하면 될까요?"
      }
    ]
  },
  {
    id: "t15",
    kind: "trip",
    group: "현장 방문",
    title: "방문 목적 설명",
    subtitle: "왜 왔는지",
    phrases: [
      {
        en: "I'm here to review the production line.",
        ko: "생산 라인을 점검하러 왔습니다."
      },
      {
        en: "We'd like to check the quality process in person.",
        ko: "품질 공정을 직접 확인하고 싶습니다."
      },
      {
        en: "I'll be here until Thursday.",
        ko: "목요일까지 머물 예정입니다."
      }
    ]
  },
  {
    id: "t16",
    kind: "trip",
    group: "현장 방문",
    title: "현장 안내 요청",
    subtitle: "보고 싶은 곳",
    phrases: [
      {
        en: "Could you show me the assembly line first?",
        ko: "조립 라인부터 보여 주시겠어요?"
      },
      {
        en: "Is it okay if I take a few photos?",
        ko: "사진을 몇 장 찍어도 괜찮을까요?"
      },
      {
        en: "Where should I put on the safety gear?",
        ko: "안전 장비는 어디서 착용하면 될까요?"
      }
    ]
  },
  {
    id: "t17",
    kind: "trip",
    group: "현장 방문",
    title: "현장에서 질문",
    subtitle: "라인을 보며",
    phrases: [
      {
        en: "What's the cycle time for this station?",
        ko: "이 공정의 사이클 타임은 얼마인가요?"
      },
      {
        en: "How many shifts do you run?",
        ko: "교대는 몇 조로 운영하시나요?"
      },
      {
        en: "Where do you inspect this part?",
        ko: "이 부품은 어디서 검사하나요?"
      }
    ]
  },
  {
    id: "t18",
    kind: "trip",
    group: "현장 방문",
    title: "안전 규정 확인",
    subtitle: "현장 안전",
    phrases: [
      {
        en: "Do I need safety shoes in this area?",
        ko: "이 구역에서는 안전화가 필요한가요?"
      },
      {
        en: "Is this area off-limits?",
        ko: "여기는 출입 제한 구역인가요?"
      },
      {
        en: "Please let me know if I'm standing in the way.",
        ko: "제가 방해가 되면 말씀해 주세요."
      }
    ]
  },
  {
    id: "t19",
    kind: "trip",
    group: "현장 방문",
    title: "문제 보고",
    subtitle: "현장에서 이상을 봤을 때",
    phrases: [
      {
        en: "I noticed something I'd like to check.",
        ko: "확인하고 싶은 부분을 발견했습니다."
      },
      {
        en: "Could we take a closer look at this?",
        ko: "이 부분을 좀 더 자세히 볼 수 있을까요?"
      },
      {
        en: "I'll write this up in my trip report.",
        ko: "출장 보고서에 기록해 두겠습니다."
      }
    ]
  },
  {
    id: "t20",
    kind: "trip",
    group: "현장 방문",
    title: "통역 부탁",
    subtitle: "말이 안 통할 때",
    phrases: [
      {
        en: "Is there someone who speaks English?",
        ko: "영어 하시는 분이 계신가요?"
      },
      {
        en: "Could you translate that for me?",
        ko: "통역해 주시겠어요?"
      },
      {
        en: "Let me write it down.",
        ko: "제가 적어 보겠습니다."
      }
    ]
  },
  {
    id: "t21",
    kind: "trip",
    group: "식사·관계",
    title: "식당에서",
    subtitle: "주문하기",
    phrases: [
      {
        en: "Could we get a table for three?",
        ko: "세 명 자리 있을까요?"
      },
      {
        en: "What would you recommend?",
        ko: "무엇을 추천하시나요?"
      },
      {
        en: "I don't eat pork, is that okay?",
        ko: "돼지고기를 안 먹는데 괜찮을까요?"
      }
    ]
  },
  {
    id: "t22",
    kind: "trip",
    group: "식사·관계",
    title: "저녁 자리 스몰토크",
    subtitle: "업무 밖 대화",
    phrases: [
      {
        en: "This is my first time here — any place I should see?",
        ko: "여기는 처음인데, 꼭 가 볼 곳이 있을까요?"
      },
      {
        en: "How long have you been with the company?",
        ko: "회사에 얼마나 계셨나요?"
      },
      {
        en: "Let me get this one — you can get the next.",
        ko: "이번엔 제가 내겠습니다, 다음에 사 주세요."
      }
    ]
  },
  {
    id: "t23",
    kind: "trip",
    group: "식사·관계",
    title: "초대 받기·거절",
    subtitle: "권유에 답하기",
    phrases: [
      {
        en: "That sounds great, I'd love to join.",
        ko: "좋네요, 함께 하겠습니다."
      },
      {
        en: "I'd love to, but I have an early flight.",
        ko: "가고 싶지만 아침 비행기가 있어서요."
      },
      {
        en: "Maybe next time — thank you for asking.",
        ko: "다음 기회에요, 말씀 감사합니다."
      }
    ]
  },
  {
    id: "t24",
    kind: "trip",
    group: "식사·관계",
    title: "선물 주고받기",
    subtitle: "인사 선물",
    phrases: [
      {
        en: "This is a small gift from Korea.",
        ko: "한국에서 가져온 작은 선물입니다."
      },
      {
        en: "It's nothing special, but I hope you like it.",
        ko: "별것 아니지만 마음에 드셨으면 합니다."
      },
      {
        en: "Thank you, that's very thoughtful.",
        ko: "감사합니다, 정말 세심하시네요."
      }
    ]
  },
  {
    id: "t25",
    kind: "trip",
    group: "식사·관계",
    title: "몸이 아플 때",
    subtitle: "건강 문제",
    phrases: [
      {
        en: "I'm not feeling well today.",
        ko: "오늘 몸이 좀 안 좋습니다."
      },
      {
        en: "Is there a pharmacy nearby?",
        ko: "근처에 약국이 있나요?"
      },
      {
        en: "I may need to see a doctor.",
        ko: "병원에 가야 할 것 같습니다."
      }
    ]
  },
  {
    id: "t26",
    kind: "trip",
    group: "변수와 귀국",
    title: "일정 변경",
    subtitle: "출장 중 변경",
    phrases: [
      {
        en: "My flight got delayed by three hours.",
        ko: "비행기가 세 시간 지연됐습니다."
      },
      {
        en: "Could we push our meeting to the afternoon?",
        ko: "회의를 오후로 미룰 수 있을까요?"
      },
      {
        en: "I'll let you know as soon as I land.",
        ko: "도착하는 대로 연락드리겠습니다."
      }
    ]
  },
  {
    id: "t27",
    kind: "trip",
    group: "변수와 귀국",
    title: "공장 견학 마무리",
    subtitle: "현장을 떠나며",
    phrases: [
      {
        en: "Thank you for showing me around today.",
        ko: "오늘 안내해 주셔서 감사합니다."
      },
      {
        en: "This was very helpful.",
        ko: "많은 도움이 되었습니다."
      },
      {
        en: "I'll share my notes with your team.",
        ko: "정리한 내용을 팀에 공유하겠습니다."
      }
    ]
  },
  {
    id: "t28",
    kind: "trip",
    group: "변수와 귀국",
    title: "출장 보고 준비",
    subtitle: "돌아가기 전",
    phrases: [
      {
        en: "Could you send me the data we discussed?",
        ko: "논의한 데이터를 보내 주시겠어요?"
      },
      {
        en: "I'd like to confirm the numbers before I report.",
        ko: "보고 전에 수치를 확인하고 싶습니다."
      },
      {
        en: "Let's keep in touch by email.",
        ko: "메일로 계속 연락하시죠."
      }
    ]
  },
  {
    id: "t29",
    kind: "trip",
    group: "변수와 귀국",
    title: "작별 인사",
    subtitle: "떠나며",
    phrases: [
      {
        en: "It was great meeting you in person.",
        ko: "직접 뵙게 되어 반가웠습니다."
      },
      {
        en: "Thanks again for your hospitality.",
        ko: "환대해 주셔서 다시 한번 감사합니다."
      },
      {
        en: "Please let me know if you visit Korea.",
        ko: "한국에 오시면 꼭 알려 주세요."
      }
    ]
  },
  {
    id: "t30",
    kind: "trip",
    group: "변수와 귀국",
    title: "귀국길",
    subtitle: "돌아오는 공항",
    phrases: [
      {
        en: "I'd like to check in for the flight to Seoul.",
        ko: "서울행 항공편 체크인하려고 합니다."
      },
      {
        en: "Is the flight on time?",
        ko: "항공편이 정시인가요?"
      },
      {
        en: "Could I get a window seat this time?",
        ko: "이번엔 창가 자리로 가능할까요?"
      }
    ]
  }
];

export function scenariosOf(kind: GlobalKind): Scenario[] {
  return SCENARIOS.filter((s) => s.kind === kind);
}

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** 유형 안에서 소분류 순서를 지키며 묶는다 */
export function groupsOf(kind: GlobalKind): { group: string; items: Scenario[] }[] {
  const out: { group: string; items: Scenario[] }[] = [];
  for (const s of scenariosOf(kind)) {
    const last = out[out.length - 1];
    if (last && last.group === s.group) last.items.push(s);
    else out.push({ group: s.group, items: [s] });
  }
  return out;
}
