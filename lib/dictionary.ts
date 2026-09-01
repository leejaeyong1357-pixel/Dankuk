/**
 * 학습 화면 우측 사전 패널용 어휘 사전.
 * 문항에 등장하는 단어를 전부 포함하도록 유지한다.
 * (문항도 우리가 생성하므로 커버리지를 100% 통제할 수 있다.)
 */
export const DICTIONARY: Record<string, string> = {
  // 지시·요청 동사
  tell: "말하다", describe: "묘사하다, 설명하다", explain: "설명하다",
  give: "주다, 제시하다", ask: "묻다, 질문하다", answer: "답하다",
  compare: "비교하다", suggest: "제안하다", propose: "제안하다",
  offer: "제안하다, 제공하다", apologize: "사과하다", solve: "해결하다",
  fix: "고치다, 해결하다", deal: "다루다, 대처하다", dealing: "다루는 것",
  contact: "연락하다", call: "전화하다, 부르다", walk: "걷다; 차근차근 설명하다",
  spend: "(시간·돈을) 쓰다", remember: "기억하다", think: "생각하다",
  know: "알다", learn: "배우다", learned: "배웠다", need: "필요하다",
  want: "원하다", like: "좋아하다; ~같은", enjoy: "즐기다", enjoyed: "즐겼다",
  happen: "일어나다", happened: "일어났다", decide: "결정하다",
  involve: "포함하다, 관련되다", involves: "관련되다", involving: "관련된",
  involved: "관련된", relate: "관련짓다", related: "관련된",
  plan: "계획; 계획하다", planning: "계획 중인", start: "시작하다",
  finish: "끝내다", end: "끝; 끝나다", ended: "끝났다", turn: "돌다; 되다",
  stay: "머무르다", stayed: "머물렀다", change: "바꾸다; 변화", changed: "바뀐",
  changes: "변화들", cause: "일으키다", caused: "일으켰다",
  use: "사용하다", uses: "사용하다", make: "만들다", makes: "만들다",
  made: "만들었다", get: "얻다", go: "가다", going: "가는 중인",
  come: "오다", comes: "오다", fall: "떨어지다", fallen: "무산된",
  fell: "떨어졌다", go_apart: "틀어지다", indicate: "나타내다",
  indicated: "표시했다, 답했다", hear: "듣다", heard: "들었다",
  become: "되다", became: "되었다", act: "연기하다, 행동하다",
  look: "보다; ~해 보이다", exist: "존재하다", exists: "존재하다",

  // 명사
  survey: "설문조사", interview: "면접, 인터뷰", situation: "상황",
  problem: "문제", problems: "문제들", issue: "문제, 사안",
  issues: "문제들", concern: "우려", concerns: "우려들",
  alternative: "대안", alternatives: "대안들", detail: "세부 사항",
  details: "세부 사항들", information: "정보", question: "질문",
  questions: "질문들", experience: "경험", story: "이야기",
  time: "시간; 때", times: "번, 횟수", way: "방식, 길", ways: "방식들",
  people: "사람들", person: "사람", life: "삶, 인생",
  country: "나라", news: "뉴스", incident: "사건", incidents: "사건들",
  arrangement: "약속, 준비", difference: "차이", kind: "종류",
  kinds: "종류들", sentence: "문장", sentences: "문장들",
  week: "주", year: "년", years: "년들", summer: "여름",
  minute: "분", ages: "연령대", beginning: "시작",

  // 형용사·부사
  memorable: "기억에 남는", special: "특별한", typical: "일반적인, 전형적인",
  different: "다른", similar: "비슷한", same: "같은", other: "다른",
  many: "많은", more: "더 많은", most: "가장 많은", few: "몇몇의",
  some: "몇몇의", any: "어떤", all: "모든", whole: "전체의",
  full: "완전한", fully: "충분히", detailed: "자세한",
  unexpected: "예상치 못한", surprising: "놀라운", funny: "재미있는",
  difficult: "어려운", possible: "가능한", workable: "실행 가능한",
  specific: "구체적인", general: "일반적인", generally: "대체로",
  current: "현재의", currently: "현재", recent: "최근의", recently: "최근에",
  original: "원래의", last: "마지막의; 지난", past: "과거", today: "오늘날",
  young: "젊은", younger: "더 젊은", old: "나이든", older: "더 나이든",
  real: "실제의", still: "여전히", also: "또한", often: "자주",
  usually: "보통", normally: "평소에", once: "한 번",
  before: "전에", after: "후에", then: "그 다음에", now: "지금",
  ago: "~전에", back: "뒤로; 되돌아", apart: "떨어져",
  unfortunately: "안타깝게도", sorry: "미안한", afraid: "두려운; 유감인",
  okay: "괜찮은", well: "잘", longer: "더 긴; (no longer) 더 이상 ~않는",
  wrong: "잘못된", right: "옳은", best: "최고의",
  through: "~을 통해", rather: "오히려", ten: "10", twenty: "20",
  three: "3", four: "4", two: "2", one: "1",

  // 접속·전치·기능어
  and: "그리고", or: "또는", but: "그러나", so: "그래서",
  because: "왜냐하면", while: "~하는 동안; 반면에", whereas: "반면에",
  compared: "비교하여", than: "~보다", if: "만약", when: "언제; ~할 때",
  where: "어디", what: "무엇", who: "누구", why: "왜", how: "어떻게",
  which: "어느", that: "그것; ~라는", this: "이것", those: "그것들",
  there: "거기", here: "여기", about: "~에 대해", with: "~와 함께",
  from: "~로부터", to: "~로", for: "~을 위해", of: "~의", in: "~안에",
  on: "~위에", at: "~에", as: "~로서", up: "위로", out: "밖으로",
  by: "~에 의해", into: "~안으로", over: "~위에", between: "~사이에",
  a: "하나의", an: "하나의", the: "그", no: "아니오; 어떤 ~도 없는",
  not: "아니다", yes: "네",

  // 대명사·be동사
  i: "나", you: "당신", your: "당신의", yours: "당신의 것",
  yourself: "너 자신", me: "나를", my: "나의", it: "그것", its: "그것의",
  they: "그들", their: "그들의", them: "그들을", we: "우리",
  he: "그", she: "그녀", is: "~이다", are: "~이다", am: "~이다",
  was: "~였다", were: "~였다", be: "~이다", been: "~였던",
  do: "하다", does: "하다", did: "했다", done: "완료된",
  have: "가지다", has: "가지다", had: "가졌다",
  will: "~할 것이다", would: "~할 것이다", can: "할 수 있다",
  could: "할 수 있었다", may: "~일지도 모른다", might: "~일지도 모른다",
  should: "~해야 한다", must: "~해야 한다",
  let: "~하게 하다", please: "부디, ~해 주세요",

  // 주제 어휘
  movie: "영화", movies: "영화들", theater: "극장", park: "공원",
  parks: "공원들", music: "음악", concert: "콘서트", concerts: "콘서트들",
  performance: "공연", performances: "공연들", museum: "박물관",
  museums: "박물관들", camping: "캠핑", beach: "해변", bar: "술집",
  bars: "술집들", sport: "운동", sports: "운동", swimming: "수영",
  cycling: "자전거 타기", jogging: "조깅", walking: "걷기", yoga: "요가",
  hiking: "하이킹", fishing: "낚시", gym: "체육관, 헬스장",
  reading: "독서", instrument: "악기", dancing: "춤추기",
  writing: "글쓰기", drawing: "그림 그리기", cooking: "요리",
  pet: "애완동물", pets: "애완동물들", home: "집", dormitory: "기숙사",
  school: "학교", workplace: "직장", trip: "여행", trips: "여행들",
  travel: "여행하다", abroad: "해외로", vacation: "휴가",
  business: "사업, 업무", bank: "은행", banks: "은행들",
  weather: "날씨", season: "계절", seasons: "계절들", hotel: "호텔",
  hotels: "호텔들", holiday: "휴일, 명절", holidays: "휴일들",
  appointment: "약속", appointments: "약속들", gathering: "모임",
  gatherings: "모임들", industry: "산업", industries: "산업들",
  health: "건강", restaurant: "식당", restaurants: "식당들",
  cafe: "카페", cafes: "카페들", transportation: "교통수단",
  public: "공공의", recycling: "재활용", internet: "인터넷",
  technology: "기술", electronic: "전자의", device: "기기",
  devices: "기기들", shopping: "쇼핑", store: "가게", neighborhood: "동네",
  family: "가족", friend: "친구", friends: "친구들", job: "직업",
  phone: "전화", library: "도서관", clinic: "병원, 진료소",
  agency: "대행사", office: "사무실", ticket: "표",
  interested: "관심 있는", live: "살다; 라이브의",
};

/** 단어 하나의 뜻을 찾는다. 굴절형은 간단히 정규화해 시도한다. */
export function lookup(raw: string): string | null {
  const w = raw.toLowerCase().replace(/[^a-z']/g, "");
  if (!w) return null;
  if (DICTIONARY[w]) return DICTIONARY[w];
  const stems = [
    w.replace(/'s$/, ""),
    w.replace(/ies$/, "y"),
    w.replace(/es$/, ""),
    w.replace(/s$/, ""),
    w.replace(/ed$/, ""),
    w.replace(/ed$/, "e"),
    w.replace(/ing$/, ""),
    w.replace(/ing$/, "e"),
  ];
  for (const s of stems) if (s !== w && DICTIONARY[s]) return DICTIONARY[s];
  return null;
}
