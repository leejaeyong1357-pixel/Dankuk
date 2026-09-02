import type { Grade } from "./types";

/**
 * 등급별 프로필 — 결과지·세부진단서·등급 사다리에 쓰인다.
 *
 * ACTFL Proficiency Guidelines 원문을 그대로 옮기지 않는다 (저작물).
 * 같은 기준을 근거로 하되 문구는 자체 작성하며, 화면에도
 * "AI 예상 등급이며 공식 OPIc 성적이 아님" 을 항상 함께 표시한다.
 */
export interface LevelProfile {
  name: string;
  nameKo: string;
  band: "Novice" | "Intermediate" | "Advanced";
  /** 결과지 상단 한 줄 요약 */
  headline: string;
  headlineKo: string;
  /** Functional Highlights — 이 등급 화자가 할 수 있는 것 */
  highlights: string[];
  highlightsKo: string[];
  /** 4개 축 서술 (첨부2 표) */
  rubric: {
    communicationTasks: string;
    contextsContent: string;
    discourseType: string;
    accuracy: string;
  };
  rubricKo: {
    communicationTasks: string;
    contextsContent: string;
    discourseType: string;
    accuracy: string;
  };
  /** 세부진단서 본문 */
  diagnostic: string[];
  diagnosticKo: string[];
  /** 다음 등급으로 가기 위한 조언 */
  tips: string[];
  tipsKo: string[];
}

const P = (x: LevelProfile) => x;

export const LEVEL_PROFILE: Record<Grade, LevelProfile> = {
  NL: P({
    name: "Novice Low", nameKo: "노비스 로우", band: "Novice",
    headline: "Produces isolated words and memorized phrases.",
    headlineKo: "낱말과 외운 표현 수준으로 말합니다.",
    highlights: [
      "Responds with single words or short memorized expressions.",
      "Relies on a small set of familiar items such as greetings and numbers.",
      "Is understood mainly by listeners used to non-native speech.",
    ],
    highlightsKo: [
      "한 단어 또는 외운 짧은 표현으로 답합니다.",
      "인사말, 숫자처럼 익숙한 소수의 표현에 의존합니다.",
      "비원어민 발화에 익숙한 청자만 이해할 수 있습니다.",
    ],
    rubric: {
      communicationTasks: "Handles only the most predictable exchanges with isolated words.",
      contextsContent: "Deals with a very narrow range of immediately familiar topics.",
      discourseType: "Produces individual words and set phrases rather than sentences.",
      accuracy: "Frequently misunderstood except by sympathetic listeners.",
    },
    rubricKo: {
      communicationTasks: "가장 예측 가능한 상황에서 낱말 수준으로만 대응합니다.",
      contextsContent: "즉각적으로 익숙한 극히 좁은 범위의 화제만 다룹니다.",
      discourseType: "문장이 아니라 개별 단어와 굳어진 표현을 산출합니다.",
      accuracy: "우호적인 청자가 아니면 자주 이해되지 않습니다.",
    },
    diagnostic: [
      "At this level the speaker communicates with isolated words and a few memorized expressions. Answers are very short and often stop after naming a thing or a person.",
      "Building a stock of complete simple sentences is the first step toward the next level.",
    ],
    diagnosticKo: [
      "낱말과 소수의 외운 표현으로 의사를 전달하는 단계입니다. 답변이 매우 짧고, 대상이나 사람을 지목하는 데서 끝나는 경우가 많습니다.",
      "완전한 단문을 쌓는 것이 다음 등급으로 가는 첫 걸음입니다.",
    ],
    tips: [
      "Practice answering with a full sentence rather than a single word.",
      "Memorize 10 sentence frames you can reuse for any topic.",
    ],
    tipsKo: [
      "한 단어가 아니라 완전한 문장으로 답하는 연습을 하세요.",
      "어떤 주제에도 재사용할 수 있는 문장 틀 10개를 외우세요.",
    ],
  }),

  NM: P({
    name: "Novice Mid", nameKo: "노비스 미드", band: "Novice",
    headline: "Answers in short, memorized phrases about familiar things.",
    headlineKo: "익숙한 대상을 짧은 관용 표현으로 답합니다.",
    highlights: [
      "Lists familiar items such as food, colors, days and family members.",
      "Answers simple questions with short phrases, often with pauses.",
      "Repeats and reuses learned expressions rather than creating language.",
    ],
    highlightsKo: [
      "음식, 색깔, 요일, 가족처럼 익숙한 항목을 나열합니다.",
      "간단한 질문에 짧은 구로 답하며 멈춤이 잦습니다.",
      "새로 문장을 만들기보다 배운 표현을 반복해 씁니다.",
    ],
    rubric: {
      communicationTasks: "Lists and names familiar items in predictable exchanges.",
      contextsContent: "Handles everyday topics tied to immediate surroundings.",
      discourseType: "Produces short phrases and occasional simple sentences.",
      accuracy: "Understood with effort by listeners used to non-native speech.",
    },
    rubricKo: {
      communicationTasks: "예측 가능한 상황에서 익숙한 항목을 나열하고 이름 붙입니다.",
      contextsContent: "주변 환경과 직결된 일상 화제를 다룹니다.",
      discourseType: "짧은 구와 간헐적인 단문을 산출합니다.",
      accuracy: "비원어민 발화에 익숙한 청자가 노력하면 이해합니다.",
    },
    diagnostic: [
      "The speaker answers with short phrases drawn from memorized material. Sentences appear occasionally but are not sustained across a whole answer.",
      "Connecting two or three sentences on one topic is the immediate next target.",
    ],
    diagnosticKo: [
      "외운 자료에서 끌어온 짧은 구로 답합니다. 문장이 간헐적으로 나타나지만 답변 전체에 걸쳐 유지되지는 않습니다.",
      "한 주제에 대해 두세 문장을 이어 붙이는 것이 당면 목표입니다.",
    ],
    tips: [
      "Link two sentences with 'and' or 'because' before stopping.",
      "Prepare one concrete example for each familiar topic.",
    ],
    tipsKo: [
      "말을 멈추기 전에 and 나 because 로 문장 두 개를 이어 보세요.",
      "익숙한 주제마다 구체적인 예시를 하나씩 준비하세요.",
    ],
  }),

  NH: P({
    name: "Novice High", nameKo: "노비스 하이", band: "Novice",
    headline: "Makes simple sentences about everyday topics, with breakdowns.",
    headlineKo: "일상 주제를 간단한 문장으로 말하나 자주 무너집니다.",
    highlights: [
      "Creates simple sentences about familiar routines and surroundings.",
      "Handles straightforward questions but breaks down when the topic shifts.",
      "Relies on present tense; past narration is attempted but not sustained.",
    ],
    highlightsKo: [
      "익숙한 일상과 주변에 대해 단문을 만들어 냅니다.",
      "단순한 질문에는 대응하지만 화제가 바뀌면 무너집니다.",
      "현재시제에 의존하며, 과거 서술을 시도하나 유지하지 못합니다.",
    ],
    rubric: {
      communicationTasks: "Manages simple questions and answers on familiar routines.",
      contextsContent: "Deals with everyday topics in informal settings.",
      discourseType: "Produces discrete simple sentences, not connected discourse.",
      accuracy: "Generally understood by listeners accustomed to language learners.",
    },
    rubricKo: {
      communicationTasks: "익숙한 일상에 대한 단순한 문답을 처리합니다.",
      contextsContent: "비격식 상황의 일상 화제를 다룹니다.",
      discourseType: "연결된 담화가 아니라 개별 단문을 산출합니다.",
      accuracy: "학습자 발화에 익숙한 청자는 대체로 이해합니다.",
    },
    diagnostic: [
      "The speaker creates simple sentences on familiar topics but cannot sustain them across a full answer. Responses tend to end after two or three sentences.",
      "Sustained paragraph-length speech and control of the past tense separate this level from the Intermediate range.",
    ],
    diagnosticKo: [
      "익숙한 주제에 대해 단문을 만들지만 답변 전체에 걸쳐 유지하지 못합니다. 두세 문장 뒤에 답변이 끝나는 경향이 있습니다.",
      "문단 길이의 지속적 발화와 과거시제 통제가 중급 구간과의 경계입니다.",
    ],
    tips: [
      "Aim for six or more sentences per answer before stopping.",
      "Drill past-tense verbs until you can narrate a whole event without switching to present.",
    ],
    tipsKo: [
      "답변 하나에 최소 여섯 문장을 채우고 나서 멈추세요.",
      "한 사건을 현재시제로 새지 않고 끝까지 서술할 수 있을 때까지 과거형 동사를 반복 훈련하세요.",
    ],
  }),

  IL: P({
    name: "Intermediate Low", nameKo: "인터미디어트 로우", band: "Intermediate",
    headline: "Creates sentences to handle simple, predictable situations.",
    headlineKo: "예측 가능한 상황을 문장을 만들어 처리합니다.",
    highlights: [
      "Creates language rather than reciting memorized material.",
      "Handles simple transactions such as ordering, asking directions or making a purchase.",
      "Speaks in strings of sentences on very familiar topics.",
    ],
    highlightsKo: [
      "외운 자료를 읊는 것이 아니라 스스로 언어를 만들어 냅니다.",
      "주문, 길 묻기, 구매 같은 단순한 거래 상황을 처리합니다.",
      "매우 익숙한 주제에 대해 문장을 이어서 말합니다.",
    ],
    rubric: {
      communicationTasks: "Creates with the language to ask and answer simple questions and complete basic transactions.",
      contextsContent: "Handles predictable everyday situations tied to personal life.",
      discourseType: "Produces strings of sentences rather than connected paragraphs.",
      accuracy: "Understood by sympathetic listeners; frequent hesitation and self-correction.",
    },
    rubricKo: {
      communicationTasks: "스스로 언어를 만들어 단순한 문답과 기본 거래를 완수합니다.",
      contextsContent: "개인 생활과 연결된 예측 가능한 일상 상황을 다룹니다.",
      discourseType: "연결된 문단이 아니라 문장의 나열을 산출합니다.",
      accuracy: "우호적인 청자는 이해하며, 머뭇거림과 자기 수정이 잦습니다.",
    },
    diagnostic: [
      "The speaker creates original sentences and can complete simple, predictable tasks. Answers are a series of sentences rather than an organized paragraph, and detail is thin.",
      "The next step is length and organization: grouping sentences around one point and supporting it.",
    ],
    diagnosticKo: [
      "스스로 문장을 만들어 단순하고 예측 가능한 과제를 완수합니다. 답변이 조직된 문단이 아니라 문장의 나열이며 세부 묘사가 얇습니다.",
      "다음 단계는 길이와 조직입니다. 하나의 요점을 중심으로 문장을 묶고 근거를 붙이세요.",
    ],
    tips: [
      "Group your sentences: state a point, then give two supporting details.",
      "Use connectors (because, so, after that) instead of listing sentences side by side.",
      "Add one concrete detail — a place, a time, a number — to every answer.",
    ],
    tipsKo: [
      "요점을 먼저 말하고 뒷받침 세부 사항을 두 개 붙이는 식으로 문장을 묶으세요.",
      "문장을 나란히 늘어놓지 말고 연결어(because, so, after that)를 쓰세요.",
      "장소·시간·숫자 같은 구체적 정보를 답변마다 하나씩 넣으세요.",
    ],
  }),

  IM1: P({
    name: "Intermediate Mid 1", nameKo: "인터미디어트 미드 1", band: "Intermediate",
    headline: "Handles familiar topics with sentence-level answers of some length.",
    headlineKo: "익숙한 주제를 어느 정도 길이의 문장으로 다룹니다.",
    highlights: [
      "Answers questions on familiar personal topics with several sentences.",
      "Manages simple complications with hesitation.",
      "Uses present tense reliably; past tense appears but is inconsistent.",
    ],
    highlightsKo: [
      "익숙한 개인 화제에 여러 문장으로 답합니다.",
      "단순한 돌발 상황을 머뭇거리며 처리합니다.",
      "현재시제는 안정적이나 과거시제는 일관되지 않습니다.",
    ],
    rubric: {
      communicationTasks: "Asks and answers questions and handles simple situations with some elaboration.",
      contextsContent: "Covers personal and everyday topics; struggles outside them.",
      discourseType: "Produces long strings of sentences approaching paragraph length.",
      accuracy: "Generally understood; errors do not usually block meaning.",
    },
    rubricKo: {
      communicationTasks: "질문과 답변을 주고받고 단순한 상황을 어느 정도 부연하며 처리합니다.",
      contextsContent: "개인적·일상적 화제를 다루며 그 밖에서는 어려움을 겪습니다.",
      discourseType: "문단 길이에 근접한 긴 문장 나열을 산출합니다.",
      accuracy: "대체로 이해되며 오류가 의미 전달을 막지는 않습니다.",
    },
    diagnostic: [
      "The speaker handles familiar topics with answers of reasonable length, but organization is loose and tense control slips when narrating past events.",
      "Consistency is the issue at this level rather than capability.",
    ],
    diagnosticKo: [
      "익숙한 주제를 적당한 길이로 다루지만 조직이 느슨하고, 과거 사건을 서술할 때 시제 통제가 흔들립니다.",
      "이 단계의 문제는 능력보다 일관성입니다.",
    ],
    tips: [
      "Keep every verb in one time frame for a whole answer.",
      "Open each answer with a one-sentence summary before the details.",
    ],
    tipsKo: [
      "한 답변 안에서 모든 동사의 시제를 하나로 유지하세요.",
      "세부 사항에 들어가기 전에 한 문장으로 요약을 던지고 시작하세요.",
    ],
  }),

  IM2: P({
    name: "Intermediate Mid 2", nameKo: "인터미디어트 미드 2", band: "Intermediate",
    headline: "Describes and explains familiar topics with natural flow.",
    headlineKo: "익숙한 주제를 구체적으로 묘사하며 흐름을 유지합니다.",
    highlights: [
      "Describes people, places and routines with concrete detail.",
      "Narrates past events with generally consistent tense control.",
      "Maintains a natural flow with limited hesitation on familiar topics.",
    ],
    highlightsKo: [
      "사람·장소·일상을 구체적인 세부와 함께 묘사합니다.",
      "과거 사건을 대체로 일관된 시제로 서술합니다.",
      "익숙한 주제에서는 머뭇거림이 적고 흐름이 자연스럽습니다.",
    ],
    rubric: {
      communicationTasks: "Describes, narrates and handles straightforward situations with elaboration.",
      contextsContent: "Handles most concrete everyday topics; abstract topics remain difficult.",
      discourseType: "Produces paragraph-length answers with recognizable organization.",
      accuracy: "Clearly understood; errors occur but rarely obscure meaning.",
    },
    rubricKo: {
      communicationTasks: "묘사하고 서술하며, 단순한 상황을 부연과 함께 처리합니다.",
      contextsContent: "구체적인 일상 화제 대부분을 다루며 추상 화제는 여전히 어렵습니다.",
      discourseType: "조직이 드러나는 문단 길이의 답변을 산출합니다.",
      accuracy: "분명히 이해되며 오류가 있어도 의미를 흐리는 일은 드뭅니다.",
    },
    diagnostic: [
      "The speaker produces paragraph-length answers with concrete detail on familiar topics and narrates past events with reasonable control.",
      "What is missing is range: unfamiliar topics, comparison and problem resolution still cause the discourse to shorten.",
    ],
    diagnosticKo: [
      "익숙한 주제에 대해 구체적 세부를 담은 문단 길이의 답변을 산출하고, 과거 사건도 어느 정도 통제하며 서술합니다.",
      "부족한 것은 범위입니다. 낯선 주제, 비교, 문제 해결에서는 여전히 발화가 짧아집니다.",
    ],
    tips: [
      "Practice topics you did not choose in the survey — the unexpected set.",
      "Add a comparison to every description: how is it different from another one?",
      "Extend answers past 60 seconds before you stop.",
    ],
    tipsKo: [
      "설문에서 고르지 않은 주제, 즉 돌발 세트를 연습하세요.",
      "묘사할 때마다 비교를 하나 붙이세요. 다른 것과 무엇이 다른가?",
      "답변을 60초 이상으로 늘린 뒤에 멈추세요.",
    ],
  }),

  IM3: P({
    name: "Intermediate Mid 3", nameKo: "인터미디어트 미드 3", band: "Intermediate",
    headline: "Handles varied topics with organized, logically developed answers.",
    headlineKo: "다양한 주제를 논리적으로 전개해 답합니다.",
    highlights: [
      "Organizes answers logically: point, reason, example.",
      "Handles most concrete topics including some outside personal experience.",
      "Manages complications in a role play with workable alternatives.",
    ],
    highlightsKo: [
      "요점 → 이유 → 예시 순서로 답변을 조직합니다.",
      "개인 경험 밖의 화제를 포함해 구체적 주제 대부분을 다룹니다.",
      "롤플레이의 돌발 상황에서 실행 가능한 대안을 제시합니다.",
    ],
    rubric: {
      communicationTasks: "Narrates, describes and resolves straightforward complications.",
      contextsContent: "Covers a wide range of concrete topics; handles some unfamiliar ones.",
      discourseType: "Produces connected paragraph-length discourse with clear organization.",
      accuracy: "Understood without difficulty; control of basic structures is solid.",
    },
    rubricKo: {
      communicationTasks: "서술하고 묘사하며 단순한 돌발 상황을 해결합니다.",
      contextsContent: "폭넓은 구체적 화제를 다루고 일부 낯선 주제도 감당합니다.",
      discourseType: "조직이 분명한 연결된 문단 담화를 산출합니다.",
      accuracy: "어려움 없이 이해되며 기본 구조 통제가 견고합니다.",
    },
    diagnostic: [
      "The speaker develops answers logically and handles a wide range of concrete topics, including some outside direct personal experience.",
      "The gap to Intermediate High is sustained performance under pressure: unfamiliar topics and complications should not shorten the discourse.",
    ],
    diagnosticKo: [
      "답변을 논리적으로 전개하며, 직접 경험 밖의 주제를 포함해 폭넓은 구체적 화제를 다룹니다.",
      "IH 와의 격차는 압박 상황에서의 지속성입니다. 낯선 주제와 돌발 상황에서도 발화가 짧아지지 않아야 합니다.",
    ],
    tips: [
      "Practice the unexpected topic set until it feels the same as your survey topics.",
      "Rehearse role play complications: apologize, explain, offer two alternatives.",
      "Add cause-and-effect language: as a result, that's why, because of that.",
    ],
    tipsKo: [
      "돌발 주제 세트를 설문 주제와 똑같이 느껴질 때까지 연습하세요.",
      "롤플레이 돌발 상황을 반복하세요. 사과 → 상황 설명 → 대안 두 개.",
      "인과 표현을 넣으세요. as a result, that's why, because of that.",
    ],
  }),

  IH: P({
    name: "Intermediate High", nameKo: "인터미디어트 하이", band: "Intermediate",
    headline: "Narrates and describes in major time frames; handles complications.",
    headlineKo: "주요 시제로 서술·묘사하며 돌발 상황을 해결합니다.",
    highlights: [
      "Converses with ease on routine tasks and social situations.",
      "Narrates and describes in past, present and future using connected paragraphs.",
      "Handles a complication or an unexpected turn of events, though not always smoothly.",
      "Shows occasional breakdown when Advanced-level demands are sustained.",
    ],
    highlightsKo: [
      "일상 과제와 사회적 상황에서 무리 없이 대화합니다.",
      "과거·현재·미래를 오가며 연결된 문단으로 서술하고 묘사합니다.",
      "돌발 상황이나 예상치 못한 전개를 처리하지만 늘 매끄럽지는 않습니다.",
      "고급 수준의 요구가 지속되면 간헐적으로 무너집니다.",
    ],
    rubric: {
      communicationTasks: "Narrates and describes in major time frames and resolves complications, with occasional breakdown.",
      contextsContent: "Handles most informal and some formal topics, including work and current interests.",
      discourseType: "Produces connected paragraph-length discourse, not fully sustained.",
      accuracy: "Communicates clearly; vocabulary and control reduce the need for pauses.",
    },
    rubricKo: {
      communicationTasks: "주요 시제로 서술·묘사하고 돌발 상황을 해결하나 간헐적으로 무너집니다.",
      contextsContent: "비격식 화제 대부분과 일부 격식 화제, 업무·관심사까지 다룹니다.",
      discourseType: "연결된 문단 담화를 산출하나 완전히 지속되지는 않습니다.",
      accuracy: "명확히 전달하며 어휘와 통제력 덕분에 멈춤이 줄어듭니다.",
    },
    diagnostic: [
      "The speaker handles a substantial number of Advanced-level tasks but cannot sustain all of them all of the time. Narration and description in the appropriate time frame occasionally break down, or paragraph-length discourse is not maintained.",
      "Closing that gap means removing the breakdowns rather than adding new abilities.",
    ],
    diagnosticKo: [
      "고급 수준 과제를 상당수 수행하지만 그것을 항상 유지하지는 못합니다. 적절한 시제의 서술·묘사가 간헐적으로 무너지거나 문단 길이의 담화가 유지되지 않습니다.",
      "이 격차를 메우는 일은 새로운 능력을 더하는 것이 아니라 무너지는 지점을 없애는 것입니다.",
    ],
    tips: [
      "Record yourself and mark exactly where the tense slips — those points are the ceiling.",
      "Practice abstract topics: social change, advantages and disadvantages, causes.",
      "Sustain paragraph organization for 90 seconds without a reset.",
    ],
    tipsKo: [
      "자기 답변을 녹음해 시제가 흔들리는 지점을 정확히 표시하세요. 그 지점이 천장입니다.",
      "추상 주제를 연습하세요. 사회 변화, 장단점, 원인 분석.",
      "90초 동안 문단 조직을 리셋 없이 유지하세요.",
    ],
  }),

  AL: P({
    name: "Advanced Low", nameKo: "어드밴스드 로우", band: "Advanced",
    headline: "Sustains narration and description in all major time frames.",
    headlineKo: "모든 주요 시제에서 서술과 묘사를 지속합니다.",
    highlights: [
      "Participates fully in informal and some formal conversations on school, home, work and leisure.",
      "Narrates and describes in past, present and future with some control of aspect.",
      "Handles the linguistic challenge of a complication or an unexpected turn of events.",
      "Communicates with enough accuracy and precision to avoid misrepresentation.",
    ],
    highlightsKo: [
      "학교·집·직장·여가에 관한 비격식 대화와 일부 격식 대화에 충분히 참여합니다.",
      "과거·현재·미래를 상(相)까지 어느 정도 통제하며 서술하고 묘사합니다.",
      "돌발 상황이나 예상치 못한 전개가 주는 언어적 부담을 감당합니다.",
      "왜곡 없이 의도를 전달할 만큼 정확하고 정밀하게 소통합니다.",
    ],
    rubric: {
      communicationTasks: "Sustains Advanced-level tasks, although minimally. Narrates and describes in major time frames using paragraph-length discourse.",
      contextsContent: "Handles a variety of communicative tasks and most informal plus some formal conversations.",
      discourseType: "Produces connected discourse of paragraph length and organization.",
      accuracy: "Conveys the intended message with sufficient accuracy, clarity and precision.",
    },
    rubricKo: {
      communicationTasks: "고급 수준 과제를 최소한이나마 지속합니다. 문단 길이의 담화로 주요 시제를 오가며 서술·묘사합니다.",
      contextsContent: "다양한 의사소통 과제와 비격식 대화 대부분, 일부 격식 대화를 다룹니다.",
      discourseType: "문단 길이와 조직을 갖춘 연결된 담화를 산출합니다.",
      accuracy: "충분한 정확성·명료성·정밀성으로 의도한 메시지를 전달합니다.",
    },
    diagnostic: [
      "The speaker sustains Advanced-level tasks, although minimally. Narration and description are handled in all major time frames, and a complication in a transaction can be resolved using strategies such as rephrasing and circumlocution.",
      "Narrations and descriptions still tend to be handled separately rather than interwoven, which marks the boundary with the next sublevel.",
    ],
    diagnosticKo: [
      "고급 수준 과제를 최소한이나마 지속합니다. 모든 주요 시제에서 서술과 묘사를 처리하고, 거래 상황의 돌발 문제를 바꿔 말하기·우회 표현 같은 전략으로 해결합니다.",
      "다만 서술과 묘사가 서로 엮이기보다 따로 처리되는 경향이 남아 있으며, 이것이 다음 하위 등급과의 경계입니다.",
    ],
    tips: [
      "Interweave narration and description instead of handling them in separate blocks.",
      "Broaden cohesive devices: adverbial phrases and subordinate clauses.",
      "Read and listen to news in your field so that professional topics come easily.",
      "Reduce hesitation and self-correction to improve delivery.",
    ],
    tipsKo: [
      "서술과 묘사를 따로 처리하지 말고 서로 엮어서 말하세요.",
      "결속 장치를 넓히세요. 부사구와 종속절을 적극적으로 쓰세요.",
      "관심 분야의 뉴스를 읽고 들어 전문적 화제가 자연스럽게 나오도록 하세요.",
      "머뭇거림과 자기 수정을 줄여 전달력을 높이세요.",
    ],
  }),
};

/** 첨부4 등급 사다리 — OPI 상위 등급은 참고용으로 함께 보여준다 */
export const LADDER: { key: string; label: string; scope: "OPI" | "OPIc" }[] = [
  { key: "S", label: "S", scope: "OPI" },
  { key: "AH", label: "AH", scope: "OPI" },
  { key: "AM", label: "AM", scope: "OPI" },
  { key: "AL", label: "AL", scope: "OPIc" },
  { key: "IH", label: "IH", scope: "OPIc" },
  { key: "IM", label: "IM", scope: "OPIc" },
  { key: "IL", label: "IL", scope: "OPIc" },
  { key: "NH", label: "NH", scope: "OPIc" },
  { key: "NM", label: "NM", scope: "OPIc" },
  { key: "NL", label: "NL", scope: "OPIc" },
];

/** IM1/IM2/IM3 는 사다리에서 IM 한 칸에 대응한다 */
export function ladderKeyOf(grade: Grade): string {
  return grade.startsWith("IM") ? "IM" : grade;
}

/** 리포트에 찍는 식별 번호. 공식 인증서번호가 아니라 우리 시험 식별자다. */
export function reportId(examId: string): string {
  let h = 2166136261;
  for (let i = 0; i < examId.length; i++) {
    h ^= examId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `DKU-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
