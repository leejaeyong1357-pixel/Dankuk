/**
 * 문형 변형.
 *
 * 같은 Question Type 과 난이도라도 물어보는 방식이 매번 같으면 연습 가치가 떨어진다.
 * prompt-templates.mjs 의 기본 문형에 이 변형들을 합쳐서 문항 다양성을 확보한다.
 */
const t = (en, ko, mission) => ({ en, ko, mission });

export const VARIANTS = {
  DESCRIPTION_PLACE: {
    low: [
      t("Where do you usually go? Tell me what it looks like.",
        "보통 어디에 가시나요? 그곳이 어떻게 생겼는지 말해 주세요.",
        "장소 이름과 생김새를 한 문장씩 말하세요."),
      t("Tell me about a place you like near your home.",
        "집 근처에 좋아하는 장소에 대해 말해 주세요.",
        "위치와 좋아하는 이유를 각각 한 문장으로 말하세요."),
    ],
    mid: [
      t("Think of {sub}. What does it look like inside, and what do you notice first when you arrive?",
        "{subKo}를 떠올려 보세요. 내부는 어떻게 생겼고, 도착했을 때 가장 먼저 눈에 들어오는 것은 무엇인가요?",
        "도착 순간의 시선 이동을 따라가며 묘사하세요."),
      t("Tell me about {sub} in detail. How big is it, what is around it, and what kind of people go there?",
        "{subKo}에 대해 자세히 말해 주세요. 얼마나 크고, 주변에는 무엇이 있으며, 어떤 사람들이 가나요?",
        "규모 → 주변 → 이용자 순서로 채우세요."),
    ],
    high: [
      t("Paint a picture of {sub} for someone who has never been there. Include what it looks like, how it feels to be there, and why people keep going back.",
        "{subKo}에 한 번도 가보지 않은 사람에게 그림을 그리듯 설명해 주세요. 어떻게 생겼고, 그곳에 있으면 어떤 느낌이며, 사람들이 왜 계속 찾는지 포함해 주세요.",
        "시각 묘사 + 분위기 + 일반화까지 세 층으로 쌓으세요."),
      t("Describe {sub} and explain how it has come to look the way it does now.",
        "{subKo}를 묘사하고, 지금의 모습이 되기까지 어떻게 변해 왔는지 설명해 주세요.",
        "묘사에 변화의 내력을 얹으세요."),
    ],
  },
  DESCRIPTION_OBJECT: {
    low: [
      t("What does it look like? Tell me its color and size.",
        "그것은 어떻게 생겼나요? 색과 크기를 말해 주세요.",
        "색·크기·모양을 각각 한 문장으로 말하세요."),
    ],
    mid: [
      t("Tell me about {sub}. When did you get it, what does it look like, and how often do you use it?",
        "{subKo}에 대해 말해 주세요. 언제 갖게 되었고, 어떻게 생겼으며, 얼마나 자주 쓰나요?",
        "취득 시점 → 외형 → 사용 빈도 순서로."),
      t("Describe {sub} so that I could recognize it. What makes it different from similar ones?",
        "제가 알아볼 수 있게 {subKo}를 묘사해 주세요. 비슷한 것들과 무엇이 다른가요?",
        "식별 가능한 특징을 최소 세 개 대세요."),
    ],
    high: [
      t("Describe {sub} in detail and explain what it says about the way you live.",
        "{subKo}를 자세히 묘사하고, 그것이 당신의 생활 방식에 대해 무엇을 말해 주는지 설명해 주세요.",
        "묘사에서 해석으로 넘어가세요."),
    ],
  },
  DESCRIPTION_PERSON: {
    low: [
      t("Who is that person? Tell me two things about them.",
        "그 사람은 누구인가요? 그 사람에 대해 두 가지를 말해 주세요.",
        "관계와 특징을 하나씩 말하세요."),
    ],
    mid: [
      t("Tell me about {sub}. What do they look like, and what do you usually do together?",
        "{subKo}에 대해 말해 주세요. 어떻게 생겼고, 함께 주로 무엇을 하나요?",
        "외모와 함께하는 활동을 모두 다루세요."),
      t("Describe {sub}. What is their personality like, and can you give me an example that shows it?",
        "{subKo}를 묘사해 주세요. 성격은 어떻고, 그것을 보여 주는 예를 들어 주시겠어요?",
        "성격 주장 뒤에 뒷받침 일화를 붙이세요."),
    ],
    high: [
      t("Tell me about {sub} and explain how your relationship with them has changed over time.",
        "{subKo}에 대해 말하고, 그 사람과의 관계가 시간이 지나며 어떻게 변했는지 설명해 주세요.",
        "인물 묘사에 관계의 변화를 얹으세요."),
    ],
  },
  ROUTINE: {
    low: [
      t("How often do you do it? Tell me when you usually do it.",
        "얼마나 자주 하시나요? 보통 언제 하는지 말해 주세요.",
        "빈도와 시간대를 말하세요."),
    ],
    mid: [
      t("Tell me about a typical time you spend on {en}. Start from when you get ready and go through to the end.",
        "{ko}에 쓰는 일반적인 시간에 대해 말해 주세요. 준비하는 순간부터 끝날 때까지 순서대로요.",
        "준비 → 진행 → 마무리 순서로."),
      t("What is your routine when it comes to {sub}? Who is usually with you, and what changes on weekends?",
        "{subKo}와 관련한 당신의 루틴은 어떤가요? 보통 누구와 함께하고, 주말에는 무엇이 달라지나요?",
        "평일과 주말을 대비시키세요."),
    ],
    high: [
      t("Describe your routine around {en} in as much detail as you can, and explain which part matters most to you and why.",
        "{ko}와 관련한 루틴을 가능한 자세히 묘사하고, 어느 부분이 가장 중요하며 왜 그런지 설명해 주세요.",
        "절차에 우선순위 판단을 더하세요."),
    ],
  },
  PREFERENCE: {
    low: [
      t("Which do you like better? Tell me why.",
        "어느 쪽을 더 좋아하나요? 이유를 말해 주세요.",
        "선택과 이유를 한 가지씩 말하세요."),
    ],
    mid: [
      t("When it comes to {en}, what do you look for first? Explain what matters to you and what does not.",
        "{ko}에 관해서라면 무엇을 먼저 보시나요? 무엇이 중요하고 무엇이 그렇지 않은지 설명해 주세요.",
        "기준을 세우고 우선순위를 매기세요."),
    ],
    high: [
      t("What do you value most about {en}, and how would you convince someone who disagrees?",
        "{ko}에서 가장 가치 있게 여기는 것은 무엇이고, 동의하지 않는 사람을 어떻게 설득하시겠어요?",
        "가치 진술에 반론 대응을 더하세요."),
    ],
  },
  PAST_EXPERIENCE: {
    low: [
      t("What did you do last time? Tell me about it.",
        "지난번에는 무엇을 하셨나요? 그것에 대해 말해 주세요.",
        "과거형으로 두세 문장 말하세요."),
    ],
    mid: [
      t("Tell me about a day when things went well with {sub}. What happened that day?",
        "{subKo}와 관련해 일이 잘 풀렸던 날에 대해 말해 주세요. 그날 무슨 일이 있었나요?",
        "시간 순서로 사건을 배열하세요."),
      t("Think of a specific time you were involved with {en}. Where were you, who were you with, and what did you do?",
        "{ko}와 관련된 구체적인 때를 떠올려 보세요. 어디에 있었고, 누구와 있었으며, 무엇을 했나요?",
        "육하원칙을 채우세요."),
    ],
    high: [
      t("Tell me about an experience with {sub} that did not go as planned. Explain what you expected, what actually happened, and how you reacted.",
        "{subKo}와 관련해 계획대로 되지 않았던 경험을 말해 주세요. 무엇을 기대했고, 실제로는 무슨 일이 있었으며, 어떻게 반응했는지 설명해 주세요.",
        "기대와 현실의 낙차를 드러내세요."),
    ],
  },
  PAST_RECENT: {
    low: [
      t("When did you last do it? What did you do?",
        "마지막으로 언제 했나요? 무엇을 했나요?",
        "최근 경험을 과거형으로 짧게 말하세요."),
    ],
    mid: [
      t("Tell me about the last time you did this. How was it different from usual?",
        "마지막으로 이것을 했던 때에 대해 말해 주세요. 평소와 무엇이 달랐나요?",
        "최근 경험과 평소의 차이를 말하세요."),
    ],
    high: [
      t("Walk me through the most recent time in detail, from beginning to end, and tell me how you felt afterwards.",
        "가장 최근의 경험을 처음부터 끝까지 자세히 설명하고, 그 후 어떤 기분이었는지 말해 주세요.",
        "사건에 사후 감정까지 붙이세요."),
    ],
  },
  PAST_MEMORABLE: {
    low: [
      t("What is a good memory you have? Tell me what happened.",
        "좋은 기억 하나는 무엇인가요? 무슨 일이 있었는지 말해 주세요.",
        "과거형으로 사건 하나를 말하세요."),
    ],
    mid: [
      t("Tell me about something surprising that happened with {sub}. What made it surprising?",
        "{subKo}와 관련해 놀라운 일이 있었던 때를 말해 주세요. 무엇이 놀라웠나요?",
        "놀람의 원인을 분명히 하세요."),
      t("Describe a time related to {en} that you still talk about with others. Why does it come up?",
        "{ko}와 관련해 지금도 다른 사람들과 이야기하는 일을 묘사해 주세요. 왜 그 이야기가 나오나요?",
        "반복해 회자되는 이유를 설명하세요."),
    ],
    high: [
      t("Tell me the story of the time related to {sub} that changed how you think about it. Give the background, the event, and what you took away from it.",
        "{subKo}에 대한 생각을 바꾼 경험의 이야기를 들려주세요. 배경, 사건, 그리고 거기서 얻은 것을 말해 주세요.",
        "배경 → 사건 → 인식 변화 순서로."),
    ],
  },
  FIRST_EXPERIENCE: {
    low: [
      t("Do you remember the first time? How was it?",
        "처음이 기억나나요? 어땠나요?",
        "처음 경험을 과거형으로 짧게 말하세요."),
    ],
    mid: [
      t("When did you first try it? What do you remember about that day?",
        "처음 해본 것이 언제인가요? 그날에 대해 무엇이 기억나나요?",
        "시점과 인상적인 장면을 말하세요."),
    ],
    high: [
      t("Describe your very first experience with {en} and compare it with how you approach it now.",
        "{ko}를 처음 경험했던 때를 묘사하고, 지금 접근하는 방식과 비교해 주세요.",
        "첫 경험과 현재를 나란히 놓으세요."),
    ],
  },
  CHANGE: {
    mid: [
      t("What has changed about {sub} recently? Tell me what it used to be like.",
        "{subKo}에서 최근 무엇이 달라졌나요? 예전에는 어땠는지 말해 주세요.",
        "과거와 현재를 나누어 말하세요."),
    ],
    high: [
      t("Explain how {en} has developed over time, and tell me whether you think the change has been for the better.",
        "{ko}가 시간이 지나며 어떻게 발전해 왔는지 설명하고, 그 변화가 나은 방향이었다고 보는지 말해 주세요.",
        "변화 서술에 평가를 더하세요."),
    ],
  },
  COMPARE: {
    mid: [
      t("Compare {sub} with another one you know. Which do you prefer, and why?",
        "{subKo}를 당신이 아는 다른 것과 비교해 주세요. 어느 쪽을 선호하고 왜 그런가요?",
        "두 대상을 항목별로 대조하세요."),
    ],
    high: [
      t("Compare how {en} works in your country with how it works somewhere else. What accounts for the difference?",
        "당신의 나라에서의 {ko}와 다른 곳에서의 {ko}를 비교해 주세요. 그 차이는 무엇 때문인가요?",
        "지역 간 비교에 원인 분석을 더하세요."),
    ],
  },
  CHANGE_COMPARE: {
    mid: [
      t("How do people your age deal with {en} compared with your parents' generation?",
        "당신 또래는 {ko}를 부모 세대와 비교해 어떻게 다르게 대하나요?",
        "세대 대조를 명확히 하세요."),
    ],
    high: [
      t("Trace how {en} has shifted over the past decade and compare the situation then and now, explaining what drove the shift.",
        "지난 10년간 {ko}가 어떻게 이동해 왔는지 추적하고, 그때와 지금을 비교하며 무엇이 그 변화를 이끌었는지 설명해 주세요.",
        "시간축 비교에 동인 분석을 더하세요."),
    ],
  },
  OPINION: {
    mid: [
      t("Do you think {en} is important? Say why or why not.",
        "{ko}가 중요하다고 생각하시나요? 그렇게 생각하는 이유를 말해 주세요.",
        "입장과 근거 두 개를 말하세요."),
    ],
    high: [
      t("Some people say {en} is overrated. What is your position, and how would you respond to that view?",
        "어떤 사람들은 {ko}가 과대평가되었다고 말합니다. 당신의 입장은 무엇이며, 그 견해에 어떻게 답하시겠어요?",
        "반론을 인정한 뒤 재반박하세요."),
    ],
  },
  ISSUE: {
    high: [
      t("What is the biggest challenge around {en} in your country right now? Explain the background and who is affected.",
        "지금 당신의 나라에서 {ko}와 관련된 가장 큰 과제는 무엇인가요? 배경과 영향을 받는 사람들을 설명해 주세요.",
        "문제 정의와 이해관계자를 다루세요."),
      t("Describe a problem connected to {en} that has been in the news, and evaluate how well it is being handled.",
        "뉴스에 나온 {ko} 관련 문제를 묘사하고, 그것이 얼마나 잘 다뤄지고 있는지 평가해 주세요.",
        "사건 서술에 대응 평가를 더하세요."),
    ],
  },
  CAUSE_EFFECT: {
    high: [
      t("Why do you think {en} has become more important lately? Trace the causes and the consequences.",
        "최근 {ko}가 더 중요해진 이유는 무엇이라고 보시나요? 원인과 결과를 짚어 주세요.",
        "인과를 두 단계 이상 이으세요."),
    ],
  },
  ADVANTAGE_DISADVANTAGE: {
    high: [
      t("Weigh the good and bad sides of {en} for people your age, and say which side you come down on.",
        "당신 또래에게 {ko}의 좋은 면과 나쁜 면을 저울질하고, 어느 쪽에 서는지 말해 주세요.",
        "대상 집단을 특정해 논하세요."),
    ],
  },
  HYPOTHETICAL: {
    high: [
      t("If {en} disappeared tomorrow, what would people do instead? Describe how life would adjust.",
        "내일 {ko}가 사라진다면 사람들은 대신 무엇을 할까요? 삶이 어떻게 조정될지 묘사해 주세요.",
        "가정법을 유지하며 파급 효과를 말하세요."),
    ],
  },
  ROLEPLAY_ASK: {
    low: [
      t("Ask me two questions about {en}.",
        "{ko}에 대해 두 가지 질문을 해 주세요.",
        "질문만 두 개 만드세요."),
    ],
    mid: [
      t("Here is a situation. You are thinking about {en} and want details before you commit. Call {cp} and ask three or four questions.",
        "상황입니다. 당신은 {ko}를 고민 중이고 결정 전에 세부 사항을 알고 싶습니다. {cpKo}에 전화해 서너 가지 질문을 하세요.",
        "가격·시간·조건 등 다른 범주를 물으세요."),
    ],
    high: [
      t("Act this out. A friend recommended something about {en} and you want to check the details yourself. Contact {cp} and ask four specific questions.",
        "연기해 주세요. 친구가 {ko}에 대해 추천했고 당신은 직접 세부 사항을 확인하고 싶습니다. {cpKo}에 연락해 구체적인 질문 네 가지를 하세요.",
        "질문마다 다른 정보를 노리세요."),
    ],
  },
  ROLEPLAY_INFORMATION: {
    mid: [
      t("Call {cp} and explain that you are new to {en}. Ask what you need to know before starting.",
        "{cpKo}에 전화해 {ko}가 처음이라고 설명하세요. 시작하기 전에 알아야 할 것을 물어보세요.",
        "상황 설명 후 질문으로 넘어가세요."),
    ],
    high: [
      t("You need to compare options for {en}. Contact {cp}, describe your situation, and ask enough questions to make a decision.",
        "{ko}의 선택지를 비교해야 합니다. {cpKo}에 연락해 상황을 설명하고 결정할 수 있을 만큼 질문하세요.",
        "비교 기준을 세우고 물으세요."),
    ],
  },
  ROLEPLAY_PROBLEM: {
    low: [
      t("Something is wrong. Tell {cp} what happened.",
        "문제가 생겼습니다. {cpKo}에 무슨 일인지 말하세요.",
        "문제를 설명하고 도움을 요청하세요."),
    ],
    mid: [
      t("A problem has come up with {en}. Call {cp}, explain what went wrong, and suggest two ways to fix it.",
        "{ko}에 문제가 생겼습니다. {cpKo}에 전화해 무엇이 잘못되었는지 설명하고 해결 방법 두 가지를 제안하세요.",
        "문제 설명과 대안 두 개를 말하세요."),
    ],
    high: [
      t("Something has gone wrong with {en} at the worst possible time. Contact {cp}, explain the situation clearly, apologize, and lay out three options.",
        "가장 곤란한 시점에 {ko}에 문제가 생겼습니다. {cpKo}에 연락해 상황을 분명히 설명하고, 사과한 뒤, 세 가지 선택지를 제시하세요.",
        "정중한 표현과 선택지 세 개를 쓰세요."),
    ],
  },
  ROLEPLAY_SOLUTION: {
    mid: [
      t("Suggest to {cp} how to handle the problem with {en}. Give two options and say which one you would take.",
        "{ko}의 문제를 어떻게 처리할지 {cpKo}에 제안하세요. 두 가지 선택지를 주고 어느 쪽을 택할지 말하세요.",
        "선택지와 본인 선택을 말하세요."),
    ],
    high: [
      t("Work out a solution for the problem with {en}. Present the options to {cp}, compare them honestly, and make a recommendation.",
        "{ko} 문제의 해결책을 만들어 주세요. {cpKo}에 선택지를 제시하고 솔직하게 비교한 뒤 추천하세요.",
        "비교와 근거 있는 추천을 하세요."),
    ],
  },
  ROLEPLAY_PAST_EXPERIENCE: {
    low: [
      t("That's the end. Did something like that happen to you before?",
        "상황은 끝났습니다. 전에 그런 일이 있었나요?",
        "실제 경험을 과거형으로 말하세요."),
    ],
    mid: [
      t("The situation is over. Have you ever had to change plans at the last minute? Tell me what happened.",
        "상황은 끝났습니다. 막판에 계획을 바꿔야 했던 적이 있나요? 무슨 일이 있었는지 말해 주세요.",
        "실제 경험을 과거시제로 서술하세요."),
    ],
    high: [
      t("The situation is over. Tell me about a real time when you had to deal with someone else's mistake. What did you do, and how did it end?",
        "상황은 끝났습니다. 다른 사람의 실수를 수습해야 했던 실제 경험을 말해 주세요. 무엇을 했고 어떻게 끝났나요?",
        "타인의 실수와 본인의 대응을 말하세요."),
    ],
  },
};
