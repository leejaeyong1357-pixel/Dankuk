/**
 * Question Type 별 문항 문형.
 *
 * 저작권 방침(docs/SPEC.md §0)에 따라 외부 자료의 문항 원문을 쓰지 않는다.
 * OPIc 문항은 ACTFL 기능 단위의 정형 문형이므로 구조만 지키고 표현은 자체 작성한다.
 *
 * tier: low(1~2) / mid(3~4) / high(5~6)
 * 슬롯: {en} 주제, {sub} 세부주제, {ko} 주제(한글), {subKo} 세부주제(한글), {cp} 롤플레이 상대
 */
const t = (en, ko, mission) => ({ en, ko, mission });

export const PROMPTS = {
  SELF_INTRODUCTION: {
    low: [t(
      "Let's start the interview now. Tell me something about yourself.",
      "인터뷰를 시작하겠습니다. 자신에 대해 이야기해 주세요.",
      "채점에 반영되지 않는 워밍업 문항입니다. 이름과 요즘 하는 일을 편하게 말하세요.")],
    mid: [t(
      "Let's start the interview now. Tell me something about yourself.",
      "인터뷰를 시작하겠습니다. 자신에 대해 이야기해 주세요.",
      "채점에 반영되지 않는 워밍업 문항입니다. 이름과 요즘 하는 일을 편하게 말하세요.")],
    high: [t(
      "Let's start the interview now. Tell me something about yourself.",
      "인터뷰를 시작하겠습니다. 자신에 대해 이야기해 주세요.",
      "채점에 반영되지 않는 워밍업 문항입니다. 이름과 요즘 하는 일을 편하게 말하세요.")],
  },

  DESCRIPTION_PLACE: {
    low: [t("Tell me about {sub}. What does it look like?",
      "{subKo}에 대해 말해 주세요. 어떻게 생겼나요?",
      "장소를 문장 단위로 묘사하세요. 눈에 보이는 것부터 말하면 됩니다.")],
    mid: [t("I would like to know about {sub}. Where is it, what does it look like, and why do you like going there? Please describe it in detail.",
      "{subKo}에 대해 알고 싶습니다. 어디에 있고, 어떻게 생겼으며, 왜 그곳에 가는 것을 좋아하나요? 자세히 묘사해 주세요.",
      "위치 → 외형 → 좋아하는 이유 순서로 문단을 만드세요.")],
    high: [t("Describe {sub} as fully as you can. What is it like, who goes there, and what makes it different from other places like it?",
      "{subKo}를 가능한 충분히 묘사해 주세요. 어떤 곳이고, 누가 가며, 비슷한 다른 곳과 무엇이 다른가요?",
      "개인 경험을 넘어 일반화까지 가세요. 다른 곳과의 차별점을 반드시 언급하세요.")],
  },

  DESCRIPTION_OBJECT: {
    low: [t("Tell me about {sub}. What is it like?",
      "{subKo}에 대해 말해 주세요. 어떤 것인가요?",
      "사물의 생김새와 쓰임을 간단한 문장으로 설명하세요.")],
    mid: [t("Describe {sub} in detail. What does it look like, and how do you use it?",
      "{subKo}를 자세히 묘사해 주세요. 어떻게 생겼고, 어떻게 사용하나요?",
      "외형과 용도를 함께 말하세요. 형용사 하나로 끝내지 마세요.")],
    high: [t("Describe {sub} in as much detail as you can, and explain why it matters to you more than other similar things.",
      "{subKo}를 가능한 자세히 묘사하고, 비슷한 다른 것보다 왜 당신에게 더 의미가 있는지 설명해 주세요.",
      "묘사에 더해 개인적 의미까지 붙이세요.")],
  },

  DESCRIPTION_PERSON: {
    low: [t("Tell me about {sub}. What are they like?",
      "{subKo}에 대해 말해 주세요. 어떤 사람인가요?",
      "외모와 성격을 짧은 문장으로 말하세요.")],
    mid: [t("Tell me about {sub}. What do they look like, what kind of person are they, and how did you meet?",
      "{subKo}에 대해 말해 주세요. 어떻게 생겼고, 어떤 성격이며, 어떻게 알게 되었나요?",
      "외모 → 성격 → 관계의 시작 순서로 구성하세요.")],
    high: [t("Describe {sub} in detail. What kind of person are they, how have they changed since you met, and how would you compare them with someone else you know well?",
      "{subKo}를 자세히 묘사해 주세요. 어떤 사람이고, 처음 알았을 때와 비교해 어떻게 변했으며, 잘 아는 다른 사람과 비교하면 어떤가요?",
      "묘사에 변화와 비교를 얹으세요. 시제를 의도적으로 오가야 합니다.")],
  },

  ROUTINE: {
    low: [t("What do you usually do there? How often do you go?",
      "그곳에서 보통 무엇을 하나요? 얼마나 자주 가나요?",
      "빈도 표현(once a week 등)을 반드시 넣으세요.")],
    mid: [t("Walk me through what you usually do when it comes to {sub}. What do you do first, and what comes after that? Tell me in detail.",
      "{subKo}와 관련해 보통 무엇을 하는지 순서대로 말해 주세요. 먼저 무엇을 하고, 그 다음에는 무엇을 하나요?",
      "First / Then / After that 로 최소 4단계를 만드세요. 현재시제를 유지하세요.")],
    high: [t("Take me through everything you normally do when it comes to {sub}, from start to finish. Also tell me why you do it that way rather than some other way.",
      "{subKo}와 관련해 평소 하는 모든 것을 처음부터 끝까지 말해 주세요. 그리고 왜 다른 방식이 아니라 그 방식으로 하는지도 설명해 주세요.",
      "절차마다 이유를 붙이세요. 단순 나열이면 감점됩니다.")],
  },

  PREFERENCE: {
    low: [t("Which one do you like the most? Why do you like it?",
      "어떤 것을 가장 좋아하나요? 왜 좋아하나요?",
      "좋아하는 것 하나를 고르고 이유를 두 가지 대세요.")],
    mid: [t("Among the things related to {en}, which do you like the most and why? Tell me what makes it better than the others.",
      "{ko}와 관련된 것들 중 무엇을 가장 좋아하고 왜 그런가요? 다른 것보다 나은 점을 말해 주세요.",
      "선호 + 비교 근거를 함께 제시하세요.")],
    high: [t("What do you prefer when it comes to {en}, and why? Explain your reasons and tell me whether your preference has changed over time.",
      "{ko}에 관해 무엇을 선호하고 왜 그런가요? 이유를 설명하고, 그 선호가 시간이 지나며 바뀌었는지도 말해 주세요.",
      "선호 + 근거 + 변화까지 다루세요.")],
  },

  PAST_EXPERIENCE: {
    low: [t("Tell me about a time you did that. When was it?",
      "그것을 했던 때에 대해 말해 주세요. 언제였나요?",
      "과거시제로 말하세요. 시점을 반드시 넣으세요.")],
    mid: [t("Tell me about an experience you have had with {sub}. When was it, what happened, and how did it go?",
      "{subKo}와 관련된 경험을 말해 주세요. 언제였고, 무슨 일이 있었으며, 어떻게 되었나요?",
      "배경 → 사건 → 결과 순서로. 동사는 전부 과거형이어야 합니다.")],
    high: [t("Tell me in detail about an experience you have had with {sub}. Set the scene first, then tell me what happened step by step, and finish with how it turned out.",
      "{subKo}와 관련된 경험을 자세히 말해 주세요. 먼저 상황을 설정하고, 무슨 일이 있었는지 순서대로 말한 뒤, 어떻게 끝났는지로 마무리해 주세요.",
      "장문 서술입니다. 시간 순서와 시제 일관성이 점수를 가릅니다.")],
  },

  PAST_RECENT: {
    low: [t("When was the last time you did that? What did you do?",
      "마지막으로 그것을 한 게 언제인가요? 무엇을 했나요?",
      "가장 최근 경험을 과거시제로 짧게 말하세요.")],
    mid: [t("When was the last time you dealt with {sub}? Where were you, who were you with, and what did you do?",
      "마지막으로 {subKo}와 관련된 일을 한 것은 언제인가요? 어디에 있었고, 누구와 함께였으며, 무엇을 했나요?",
      "최근 경험을 육하원칙으로 채우세요.")],
    high: [t("Tell me about the most recent time you dealt with {sub}. Give me the full story with as much detail as you can, and tell me how it compared with other times.",
      "가장 최근에 {subKo}와 관련된 일을 했던 때를 말해 주세요. 가능한 자세히 전체 이야기를 들려주고, 다른 때와 비교하면 어땠는지도 말해 주세요.",
      "최근 경험 + 다른 때와의 비교까지 요구합니다.")],
  },

  PAST_MEMORABLE: {
    low: [t("Tell me about a time you really enjoyed. What happened?",
      "정말 즐거웠던 때에 대해 말해 주세요. 무슨 일이 있었나요?",
      "즐거웠던 경험 하나를 과거시제로 말하세요.")],
    mid: [t("Describe a memorable experience you have had with {sub}. What happened, and why do you still remember it? Give as many details as you can.",
      "{subKo}와 관련해 기억에 남는 경험을 말해 주세요. 무슨 일이 있었고, 왜 아직도 기억에 남나요? 가능한 자세히 말해 주세요.",
      "사건 + 기억에 남는 이유가 모두 나와야 합니다.")],
    high: [t("Tell me about the most memorable experience you have had with {sub}. Something funny, difficult, or unexpected may have happened. Explain the whole story from beginning to end, and tell me what it meant to you.",
      "{subKo}와 관련해 가장 기억에 남는 경험을 말해 주세요. 재미있거나 힘들거나 예상치 못한 일이 있었을 수 있습니다. 처음부터 끝까지 전체 이야기를 설명하고, 그 경험이 당신에게 어떤 의미였는지 말해 주세요.",
      "다문단 서술. 마지막에 의미·교훈으로 닫으세요.")],
  },

  FIRST_EXPERIENCE: {
    low: [t("Do you remember the first time? What was it like?",
      "처음이 기억나나요? 어땠나요?",
      "처음 경험을 과거시제로 짧게 말하세요.")],
    mid: [t("Tell me about the first time you got into {en}. How did it start, and how did you feel back then?",
      "{ko}를 처음 시작했던 때에 대해 말해 주세요. 어떻게 시작했고, 그때 기분이 어땠나요?",
      "계기 → 첫 경험 → 그때의 감정 순서로.")],
    high: [t("Take me back to the first time you got into {en}. What made you start, what was that first experience like, and how is it different from how you do it now?",
      "{ko}를 처음 시작했던 때로 돌아가 봅시다. 무엇 때문에 시작했고, 첫 경험은 어땠으며, 지금 하는 방식과는 어떻게 다른가요?",
      "첫 경험 + 현재와의 대조. 과거와 현재 시제를 번갈아 쓰세요.")],
  },

  CHANGE: {
    mid: [t("How has {en} changed for you over the years? What was different before, and what is different now?",
      "{ko}는 몇 년 사이 당신에게 어떻게 달라졌나요? 예전에는 무엇이 달랐고 지금은 무엇이 다른가요?",
      "과거시제와 현재시제를 의도적으로 번갈아 쓰세요.")],
    high: [t("Tell me how {en} has changed over the last ten years or so. What has changed the most, what has stayed the same, and what do you think caused those changes?",
      "지난 10년쯤 사이 {ko}가 어떻게 변했는지 말해 주세요. 무엇이 가장 많이 변했고, 무엇이 그대로이며, 그 변화의 원인은 무엇이라고 생각하나요?",
      "변화 + 불변 + 원인 분석까지 다루세요.")],
  },

  COMPARE: {
    mid: [t("Compare two {plural} you know well. How are they similar, and how are they different?",
      "당신이 잘 아는 두 가지 {ko}를 비교해 주세요. 어떤 점이 비슷하고 어떤 점이 다른가요?",
      "대조 연결어(whereas, while, compared to)를 쓰세요.")],
    high: [t("Compare {en} today with the way it used to be. Explain the differences in detail and tell me which you think is better and why.",
      "오늘날의 {ko}를 예전 모습과 비교해 주세요. 차이를 자세히 설명하고, 어느 쪽이 낫다고 생각하는지와 그 이유를 말해 주세요.",
      "비교 + 평가와 근거까지 요구합니다.")],
  },

  CHANGE_COMPARE: {
    mid: [t("How is {en} different now compared to when you were younger? Tell me about the changes.",
      "어릴 때와 비교해 지금의 {ko}는 어떻게 다른가요? 그 변화에 대해 말해 주세요.",
      "두 시점을 명확히 나누어 말하세요.")],
    high: [t("People of different ages relate to {en} in different ways. Compare how younger people and older people deal with it, explain why that difference exists, and tell me how you expect it to change.",
      "연령대에 따라 {ko}를 대하는 방식이 다릅니다. 젊은 사람과 나이 든 사람이 어떻게 다르게 대하는지 비교하고, 왜 그런 차이가 생기는지 설명한 뒤, 앞으로 어떻게 변할 것 같은지도 말해 주세요.",
      "집단 비교 + 원인 + 전망. 일반화 표현이 필요합니다.")],
  },

  OPINION: {
    high: [t("What do you personally think about {en}? Give me your opinion and support it with reasons and examples.",
      "{ko}에 대해 개인적으로 어떻게 생각하나요? 의견을 말하고 이유와 예를 들어 뒷받침해 주세요.",
      "주장 → 이유 2개 → 예시 순서로 논증하세요.")],
    mid: [t("What do you think about {en}? Tell me your opinion and why you think that way.",
      "{ko}에 대해 어떻게 생각하나요? 의견과 그렇게 생각하는 이유를 말해 주세요.",
      "의견과 이유를 분명히 나누어 말하세요.")],
  },

  ISSUE: {
    high: [t("What kinds of problems or concerns do people have with {en} these days? Explain one issue in detail and suggest how it could be addressed.",
      "요즘 사람들은 {ko}와 관련해 어떤 문제나 우려를 가지고 있나요? 한 가지 문제를 자세히 설명하고 어떻게 해결할 수 있을지 제안해 주세요.",
      "문제 정의 → 원인 → 해결책 구조로 가세요.")],
  },

  CAUSE_EFFECT: {
    high: [t("What has caused the recent changes in {en}, and what effects have those changes had on people's lives? Explain the connection in detail.",
      "{ko}의 최근 변화는 무엇 때문에 일어났고, 그 변화가 사람들의 삶에 어떤 영향을 주었나요? 그 연결고리를 자세히 설명해 주세요.",
      "원인과 결과를 명시적으로 연결하세요 (because of, as a result).")],
  },

  ADVANTAGE_DISADVANTAGE: {
    high: [t("What are the advantages and disadvantages of {en}? Explain both sides and tell me which outweighs the other.",
      "{ko}의 장점과 단점은 무엇인가요? 양쪽을 모두 설명하고 어느 쪽이 더 크다고 보는지 말해 주세요.",
      "장점·단점을 균형 있게 다룬 뒤 결론을 내리세요.")],
  },

  HYPOTHETICAL: {
    high: [t("Suppose {en} were to change completely in the next few years. What would happen, and how would people adapt? Explain what you imagine in detail.",
      "앞으로 몇 년 안에 {ko}가 완전히 바뀐다고 가정해 봅시다. 무슨 일이 일어날 것이고 사람들은 어떻게 적응할까요? 상상한 바를 자세히 설명해 주세요.",
      "가정법(would, might)을 유지하며 설명하세요.")],
  },

  // ── Role Play ────────────────────────────────────────────
  ROLEPLAY_ASK: {
    low: [t("I'll give you a situation. You want to know more about {en}. Ask me two or three questions about it.",
      "상황을 드리겠습니다. 당신은 {ko}에 대해 더 알고 싶습니다. 그것에 관해 두세 가지 질문을 해 주세요.",
      "질문만 하세요. 설명하지 마세요.")],
    mid: [t("I'll give you a situation and ask you to act it out. You want to find out more about {en}. Call {cp} and ask three or four questions to get the information you need.",
      "상황을 드릴 테니 연기해 주세요. 당신은 {ko}에 대해 더 알고 싶습니다. {cpKo}에 전화해서 필요한 정보를 얻기 위해 서너 가지 질문을 해 주세요.",
      "완전한 의문문을 3~4개 만드세요. 서로 다른 범주를 물어야 점수가 올라갑니다.")],
    high: [t("Here is a situation to act out. You are planning something involving {en} and you need details before deciding. Contact {cp} and ask three or four specific questions.",
      "연기할 상황입니다. 당신은 {ko}와 관련된 일을 계획 중이고 결정 전에 세부 정보가 필요합니다. {cpKo}에 연락해 구체적인 질문을 서너 가지 해 주세요.",
      "가격·시간·조건 등 범주를 나눠 구체적으로 물으세요.")],
  },

  ROLEPLAY_INFORMATION: {
    mid: [t("You need some information about {en}. Call {cp} and explain what you need, then ask for the details.",
      "{ko}에 대한 정보가 필요합니다. {cpKo}에 전화해 무엇이 필요한지 설명하고 세부 사항을 물어보세요.",
      "상황 설명 후 질문으로 넘어가세요.")],
    high: [t("You need detailed information about {en} before you can move ahead. Contact {cp}, explain your situation clearly, and ask everything you need to know.",
      "{ko}에 대해 진행하기 전 상세한 정보가 필요합니다. {cpKo}에 연락해 상황을 분명히 설명하고 알아야 할 것을 모두 물어보세요.",
      "상황 설명 + 다층 질문. 격식 있는 표현을 쓰세요.")],
  },

  ROLEPLAY_PROBLEM: {
    low: [t("There is a problem. Explain what happened and ask for help.",
      "문제가 생겼습니다. 무슨 일인지 설명하고 도움을 요청하세요.",
      "문제 설명 + 요청 두 가지만 하면 됩니다.")],
    mid: [t("I'm sorry, but there is a problem you need to solve. Something went wrong and your plan for {en} is no longer possible. Explain the situation to {cp} and offer two or three alternatives.",
      "죄송하지만 해결해야 할 문제가 있습니다. 문제가 생겨 {ko}에 대한 계획을 진행할 수 없게 되었습니다. {cpKo}에 상황을 설명하고 두세 가지 대안을 제시해 주세요.",
      "사과 → 상황 설명 → 대안 2~3개. 대안마다 이유를 붙이세요.")],
    high: [t("Unfortunately a complication has come up. The arrangement you made about {en} has fallen through at the last minute. Contact {cp}, explain exactly what happened, apologize, and propose two or three workable alternatives.",
      "안타깝게도 문제가 생겼습니다. {ko}에 대해 잡아둔 약속이 막판에 무산되었습니다. {cpKo}에 연락해 무슨 일이 있었는지 정확히 설명하고, 사과한 뒤, 실행 가능한 대안을 두세 가지 제안해 주세요.",
      "정중한 표현(I'm afraid, Would it be possible)을 쓰고 대안을 구체적으로 제시하세요.")],
  },

  ROLEPLAY_SOLUTION: {
    mid: [t("Now suggest how to fix the problem with {en}. Give {cp} two or three options and say which you prefer.",
      "이제 {ko}와 관련된 문제를 어떻게 해결할지 제안해 주세요. {cpKo}에 두세 가지 선택지를 주고 어느 쪽을 선호하는지 말해 주세요.",
      "선택지 제시 + 본인 선호와 이유.")],
    high: [t("Propose a solution to the problem with {en}. Lay out two or three options for {cp}, weigh them against each other, and recommend the one you think works best.",
      "{ko}와 관련된 문제의 해결책을 제안해 주세요. {cpKo}에 두세 가지 선택지를 제시하고, 서로 비교한 뒤, 가장 낫다고 생각하는 것을 추천해 주세요.",
      "선택지 비교 + 근거 있는 추천까지 요구합니다.")],
  },

  ROLEPLAY_PAST_EXPERIENCE: {
    low: [t("That's the end of the situation. Have you had a problem like that before? Tell me what happened.",
      "상황은 끝났습니다. 전에 그런 문제를 겪은 적이 있나요? 무슨 일이 있었는지 말해 주세요.",
      "실제 경험으로 돌아와 과거시제로 말하세요.")],
    mid: [t("That's the end of the situation. Now tell me about a time you had a similar problem in real life. What was the problem, and how did you deal with it?",
      "상황은 끝났습니다. 이제 실제로 비슷한 문제를 겪었던 때를 말해 주세요. 문제가 무엇이었고 어떻게 해결했나요?",
      "롤플레이가 끝났습니다. 실제 경험으로 돌아와 과거시제로 서술하세요.")],
    high: [t("That's the end of the situation. Think back to a time when a plan of yours fell apart and you had to sort it out yourself. Tell me the whole story — what went wrong, what you did, and how it ended.",
      "상황은 끝났습니다. 당신의 계획이 틀어져 직접 해결해야 했던 때를 떠올려 보세요. 무엇이 잘못되었고, 무엇을 했으며, 어떻게 끝났는지 전체 이야기를 말해 주세요.",
      "장문 과거 서술. 인과를 분명히 연결하세요.")],
  },
};
