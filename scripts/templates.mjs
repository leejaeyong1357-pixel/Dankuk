/**
 * 문항 생성 템플릿.
 *
 * 저작권 방침(SPEC §0)에 따라 외부 자료의 문항 원문을 쓰지 않는다.
 * OPIc 문항은 ACTFL 기능(function) 단위의 정형 문형이므로,
 * 그 구조만 지키고 표현은 자체 작성한다.
 *
 * 슬롯: {en} = 주제 영어 명사구, {ko} = 주제 한글, {cp} = 롤플레이 상대
 */

/** kind: describe / habit / experience / compare / issue */
export const COMBO = {
  describe: {
    "1-2": [
      {
        en: "Tell me about {en}. What do you like about it? Please tell me in a few sentences.",
        ko: "{ko}에 대해 말해주세요. 어떤 점이 좋은가요? 몇 문장으로 말해주세요.",
        mission: "{ko}를 문장 단위로 설명하세요. 좋아하는 이유를 최소 두 가지 붙이세요.",
      },
    ],
    "3-4": [
      {
        surveyOnly: true,
        en: "You indicated in the survey that you are interested in {en}. Tell me about it in detail. What does it look like, and what makes it special to you?",
        ko: "당신은 설문에서 {ko}에 관심이 있다고 했습니다. 그것에 대해 자세히 말해주세요. 어떻게 생겼고, 당신에게 왜 특별한가요?",
        mission: "묘사 문항입니다. 외형 → 위치·분위기 → 나에게 특별한 이유 순서로 문단을 만드세요.",
      },
      {
        en: "Please describe {en} that you know well. Where is it, what does it look like, and why do you like it? Give me as many details as you can.",
        ko: "당신이 잘 아는 {ko}에 대해 묘사해주세요. 어디에 있고, 어떻게 생겼으며, 왜 좋아하나요? 가능한 자세히 말해주세요.",
        mission: "세부 묘사를 최소 3개 넣으세요. 형용사 하나로 끝내지 말고 근거를 붙이세요.",
      },
    ],
    "5-6": [
      {
        en: "I would like to know about {en}. Describe it as fully as you can — what it is like, who uses it, and what people in your country generally think about it.",
        ko: "{ko}에 대해 알고 싶습니다. 가능한 충분히 묘사해주세요. 어떤 모습인지, 누가 이용하는지, 당신의 나라 사람들이 그것을 대체로 어떻게 생각하는지 말해주세요.",
        mission: "개인 경험을 넘어 일반화까지 가세요. '사람들은 대체로 ~한다' 수준의 진술을 포함하세요.",
      },
    ],
  },

  habit: {
    "1-2": [
      {
        en: "How often do you do this? Who do you usually go with? Tell me about it.",
        ko: "얼마나 자주 하시나요? 보통 누구와 함께 가시나요? 그것에 대해 말해주세요.",
        mission: "빈도 표현(once a week 등)과 함께하는 사람을 반드시 언급하세요.",
      },
    ],
    "3-4": [
      {
        en: "How often do you spend time on {en}? What do you usually do, and who do you do it with? Please walk me through a typical time in detail.",
        ko: "{ko}에 얼마나 자주 시간을 쓰시나요? 주로 무엇을 하고, 누구와 함께 하시나요? 일반적인 경우를 자세히 설명해주세요.",
        mission: "루틴 문항입니다. First / Then / After that 로 순서를 만들고 현재시제를 유지하세요.",
      },
      {
        en: "Tell me what you usually do from beginning to end when it comes to {en}. What do you do first, and what comes after that?",
        ko: "{ko}와 관련해서 처음부터 끝까지 보통 무엇을 하는지 말해주세요. 먼저 무엇을 하고, 그 다음에는 무엇을 하나요?",
        mission: "절차를 시간 순서로 나열하세요. 최소 4단계를 만드세요.",
      },
    ],
    "5-6": [
      {
        en: "Walk me through everything you normally do when it comes to {en}, from start to finish. Also tell me why you do it that way rather than some other way.",
        ko: "{ko}와 관련해 평소 하는 모든 것을 처음부터 끝까지 설명해주세요. 그리고 왜 다른 방식이 아니라 그런 방식으로 하는지도 말해주세요.",
        mission: "절차 + 이유까지 요구합니다. 각 단계마다 근거를 한 번씩 붙이세요.",
      },
    ],
  },

  experience: {
    "1-2": [
      {
        en: "Tell me about a time you enjoyed {en}. What happened? When was it?",
        ko: "{ko}를 즐겼던 때에 대해 말해주세요. 무슨 일이 있었나요? 언제였나요?",
        mission: "과거시제로 말하세요. 시점(last summer 등)을 반드시 넣으세요.",
      },
    ],
    "3-4": [
      {
        en: "Describe a memorable experience you have had with {en}. When was it, what happened, and why do you still remember it? Give as many details as you can.",
        ko: "{ko}와 관련해 기억에 남는 경험을 말해주세요. 언제였고, 무슨 일이 있었으며, 왜 아직도 기억에 남나요? 가능한 자세히 말해주세요.",
        mission: "경험 문항입니다. 배경 → 사건 → 결과 → 감정 순서로. 동사는 전부 과거형이어야 합니다.",
      },
      {
        en: "Think back to something unexpected that happened while you were dealing with {en}. What was the situation, what did you do, and how did it turn out?",
        ko: "{ko}와 관련해 예상치 못한 일이 있었던 때를 떠올려 보세요. 어떤 상황이었고, 무엇을 했으며, 어떻게 끝났나요?",
        mission: "문제 상황 서술입니다. 갈등 → 대응 → 결말이 드러나야 합니다.",
      },
    ],
    "5-6": [
      {
        en: "Tell me about the most memorable experience you have had related to {en}. Something funny, difficult, or surprising may have happened. Explain the whole story from beginning to end, and tell me what you learned from it.",
        ko: "{ko}와 관련해 가장 기억에 남는 경험을 말해주세요. 재미있거나 힘들거나 놀라운 일이 있었을 수 있습니다. 처음부터 끝까지 전체 이야기를 설명하고, 그로부터 무엇을 배웠는지 말해주세요.",
        mission: "장문 서술입니다. 시간 순서를 유지하고 마지막에 교훈·의미로 마무리하세요.",
      },
    ],
  },

  compare: {
    "3-4": [
      {
        en: "How has {en} changed compared to the past? Tell me what was different before and what is different now.",
        ko: "{ko}는 과거와 비교해 어떻게 달라졌나요? 예전에는 무엇이 달랐고 지금은 무엇이 다른지 말해주세요.",
        mission: "비교 문항입니다. 과거시제와 현재시제를 의도적으로 번갈아 쓰세요.",
      },
    ],
    "5-6": [
      {
        en: "Compare {en} today with the way it was ten or twenty years ago. What has changed the most, what has stayed the same, and what caused those changes?",
        ko: "오늘날의 {ko}를 10년 또는 20년 전과 비교해주세요. 무엇이 가장 많이 변했고, 무엇이 그대로이며, 무엇이 그 변화를 만들었나요?",
        mission: "비교 + 원인 분석입니다. whereas, while, compared to 같은 대조 연결어를 쓰세요.",
      },
      {
        en: "People of different ages relate to {en} in different ways. Compare how younger people and older people deal with it, and explain why you think the difference exists.",
        ko: "연령대에 따라 {ko}를 대하는 방식이 다릅니다. 젊은 사람들과 나이 든 사람들이 그것을 어떻게 다르게 대하는지 비교하고, 그 차이가 왜 생긴다고 생각하는지 설명해주세요.",
        mission: "두 집단을 대조하고 각각에 근거를 붙이세요. 일반화 표현이 필요합니다.",
      },
    ],
  },

  issue: {
    "5-6": [
      {
        en: "What kinds of problems or concerns do people currently have with {en}? Explain one of those issues in detail and suggest how it could be solved.",
        ko: "사람들이 현재 {ko}와 관련해 어떤 문제나 우려를 가지고 있나요? 그 중 하나를 자세히 설명하고 어떻게 해결할 수 있을지 제안해주세요.",
        mission: "이슈 문항입니다. 문제 정의 → 원인 → 해결책 제안 구조로 가세요.",
      },
      {
        en: "Have you heard about any news or incidents involving {en} recently? Tell me what happened, why it became an issue, and what people think about it.",
        ko: "최근 {ko}와 관련된 뉴스나 사건을 들어본 적이 있나요? 무슨 일이 있었고, 왜 문제가 되었으며, 사람들이 어떻게 생각하는지 말해주세요.",
        mission: "사건 서술 + 사회적 반응까지 요구합니다. 간접화법을 활용하세요.",
      },
    ],
  },
};

/** 롤플레이 3문항 고정 시퀀스 */
export const ROLEPLAY = {
  rp_ask: {
    "3-4": [
      {
        en: "I am going to give you a situation and ask you to act it out. You want to know more about {en}. Call {cp} and ask three or four questions to get the information you need.",
        ko: "상황을 드릴 테니 연기해 주세요. 당신은 {ko}에 대해 더 알고 싶습니다. {cpKo}에 전화해서 필요한 정보를 얻기 위해 3~4가지 질문을 하세요.",
        mission: "질문만 하는 문항입니다. 완전한 의문문을 3~4개 만드세요. 설명하지 마세요.",
      },
    ],
    "5-6": [
      {
        en: "Here is a situation for you to act out. You are planning something that involves {en}, and you need details before you decide. Contact {cp} and ask three or four specific questions.",
        ko: "연기할 상황입니다. 당신은 {ko}와 관련된 무언가를 계획 중이고, 결정하기 전에 세부 정보가 필요합니다. {cpKo}에 연락해서 구체적인 질문 3~4가지를 하세요.",
        mission: "구체적인 질문을 하세요. 가격·시간·조건 등 서로 다른 범주를 물어야 점수가 올라갑니다.",
      },
    ],
  },
  rp_solve: {
    "3-4": [
      {
        en: "I'm sorry, but there is a problem you need to solve. Something went wrong and your original plan for {en} is no longer possible. Explain the situation to the other person and offer two or three alternatives.",
        ko: "죄송하지만 해결해야 할 문제가 있습니다. 문제가 생겨서 {ko}에 대한 원래 계획을 진행할 수 없게 되었습니다. 상대에게 상황을 설명하고 2~3가지 대안을 제시하세요.",
        mission: "사과 → 상황 설명 → 대안 2~3개 순서. 대안마다 이유를 붙이세요.",
      },
    ],
    "5-6": [
      {
        en: "Unfortunately, a problem has come up. The arrangement you made about {en} has fallen through at the last minute. Contact the person involved, explain what happened, apologize, and propose two or three workable alternatives.",
        ko: "안타깝게도 문제가 생겼습니다. {ko}에 대해 잡아둔 약속이 막판에 무산되었습니다. 관련된 사람에게 연락해 무슨 일이 있었는지 설명하고, 사과한 뒤, 실행 가능한 대안 2~3가지를 제안하세요.",
        mission: "정중한 표현(I'm afraid, Would it be okay if)을 쓰고 대안을 구체적으로 제시하세요.",
      },
    ],
  },
  rp_relate: {
    "3-4": [
      {
        en: "That's the end of the situation. Now tell me about a time when you had a similar problem in real life. What was the problem, and how did you deal with it?",
        ko: "상황은 끝났습니다. 이제 실제로 비슷한 문제를 겪었던 때를 말해주세요. 문제가 무엇이었고, 어떻게 해결했나요?",
        mission: "롤플레이가 끝났습니다. 실제 경험으로 돌아와 과거시제로 서술하세요.",
      },
    ],
    "5-6": [
      {
        en: "That's the end of the situation. Think back to a time when a plan of yours fell apart and you had to fix it yourself. Tell me the whole story — what went wrong, what you did, and how it ended.",
        ko: "상황은 끝났습니다. 당신의 계획이 틀어져서 직접 해결해야 했던 때를 떠올려 보세요. 무엇이 잘못되었고, 무엇을 했으며, 어떻게 끝났는지 전체 이야기를 말해주세요.",
        mission: "장문 과거 서술입니다. 사건의 인과를 분명히 연결하세요.",
      },
    ],
  },
};

/** 1번 자기소개 (채점 제외) */
export const INTRO = {
  en: "Let's start the interview. Tell me about yourself.",
  ko: "인터뷰를 시작하겠습니다. 자신에 대해 소개해 주세요.",
  mission: "채점에 반영되지 않는 문항입니다. 긴장을 풀고 이름·소속·요즘 하는 일을 자연스럽게 말하세요.",
};
