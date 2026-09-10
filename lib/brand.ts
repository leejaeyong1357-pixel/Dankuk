/**
 * 어느 조직 이름으로 내보낼지 한 곳에서 정한다.
 *
 * 같은 서비스를 학교용·회사용으로 번갈아 보여 줄 일이 있어, 화면마다 조직
 * 이름을 박아 두면 되돌릴 때 전부 다시 찾아야 한다. 문구를 여기 모아 두고
 * 아래 ACTIVE 한 줄만 바꾸면 전체가 따라 바뀌게 한다.
 *
 * 색도 같이 바뀐다 — tailwind.config.ts 의 dku 팔레트 값이 조직 색이다.
 * 이름을 바꿀 때 그 파일의 팔레트도 함께 바꿔야 한다 (주석에 두 벌 적어 두었다).
 */
export type BrandKey = "dku" | "hanwha";

export interface Brand {
  /** 조직 이름 — "단국대학교", "한화엔진" */
  org: string;
  /** 짧은 이름 — "단국대", "한화엔진" */
  orgShort: string;
  /** 영문 이름 */
  orgEn: string;
  /** 서비스 이름 — 화면 상단에 뜬다 */
  product: string;
  /** 짧은 서비스 이름 — 로그인·설정 화면 제목 */
  productShort: string;
  /** 이용 대상 — "재학생", "임직원" */
  member: string;
  /** 소속 구성원 표현 — "단국대 재학생", "한화엔진 임직원" */
  memberFull: string;
  /** 대시보드 배너 제목 둘째 줄 */
  heroLine: string;
  /** 배너 인용구 */
  heroQuote: string;
  /** 배너 사진 경로. 없으면 그린 배경이 나온다 */
  heroImage: string;
  /** 배너 칸의 가로/세로 비 (두 칸으로 놓이는 넓은 화면) */
  heroAspect: string;
  /**
   * 좁은 화면에서 배너 칸의 가로/세로 비.
   *
   * 좁아지면 사진의 오른쪽이 잘려 나간다. 사진에 카드가 박혀 있는 경우
   * 그 카드가 통째로 잘려 나가도록 비를 잡는다. 반쯤 걸치면 흉하다.
   */
  heroAspectNarrow: string;
  /**
   * 배너 문구가 사진 안에 이미 박혀 있는가.
   *
   * true 면 사진이 문구까지 들고 있으므로 화면에서 덧그리지 않는다.
   * false 면 사진은 배경만 맡고 문구·카드는 화면이 그린다. 글자가 사진
   * 해상도에 묶이지 않아 어느 크기에서도 또렷하다.
   */
  heroTextBaked: boolean;
  /** 회원가입 왼쪽에 깔리는 사진. 없으면 그린 배경이 나온다 */
  sideImage: string;
  /** 로그인 화면 왼쪽을 채우는 세로 사진. 문구가 사진 안에 들어 있다 */
  loginImage: string;
  /** 로고 아래 작게 붙는 제품 표기 */
  productTag: string;
  /** 로그인 화면 제목 */
  loginTitle: string;
  /** 로그인 화면 부제 */
  loginSub: string;
  /** 배너 오른쪽 카드 문구 */
  heroCard: [string, string];
  /** 배너에 얹는 손글씨 문구 (사진에 이미 들어 있으면 사진이 이긴다) */
  heroScript: [string, string];
  /** 영문 표어 */
  motto: [string, string];
  /** 첫 화면 배지 */
  landingBadge: string;
  /** 첫 화면 시작 버튼 */
  landingCta: string;
  /** 관리자 로그인 아이디 (비밀번호도 같은 값) */
  adminId: string;
  /** 화면 맨 아래 덧붙이는 한 줄. 없으면 비운다 */
  footnote: string;
  /** 첫 화면 표지의 어두운 배경 클래스 */
  heroDark: string;
}

const BRANDS: Record<BrandKey, Brand> = {
  dku: {
    org: "단국대학교",
    orgShort: "단국대",
    orgEn: "DANKOOK UNIVERSITY",
    product: "OPIc Trainer",
    productShort: "DKU OPIc",
    member: "재학생",
    memberFull: "단국대 재학생",
    heroLine: "가장 빠른 학습 루트",
    heroQuote: "지금의 노력이, 더 큰 기회를 만듭니다.",
    heroImage: "/dashboard-hero.jpg",
    heroAspect: "1095/466",
    heroAspectNarrow: "1095/466",
    heroTextBaked: true,
    sideImage: "/campus.jpg",
    loginImage: "/campus.jpg",
    productTag: "OPIc TRAINER",
    loginTitle: "다시 만나 반갑습니다",
    loginSub: "등록한 계정으로 학습을 이어가세요.",
    heroCard: ["단국대학교와 함께,", "당신의 가능성은 더 멀리."],
    heroScript: ["오늘의 연습이", "더 밝은 세상을 만듭니다."],
    motto: ["Better English", "A Brighter Tomorrow"],
    landingBadge: "단국대학교 학생을 위한 AI 말하기 연습",
    landingCta: "단국대 계정으로 시작하기",
    adminId: "dku",
    footnote: "",
    heroDark: "bg-dku-900",
  },
  hanwha: {
    org: "한화엔진",
    orgShort: "한화엔진",
    orgEn: "HANWHA ENGINE",
    product: "OPIc Trainer",
    productShort: "한화엔진 OPIc",
    member: "임직원",
    memberFull: "한화엔진 임직원",
    heroLine: "글로벌 역량을 키우는 학습 루트",
    heroQuote: "오늘의 연습이, 내일의 자신감이 됩니다.",
    heroImage: "/hanwha-hero.jpg",
    heroAspect: "935/387",
    heroAspectNarrow: "660/387",
    heroTextBaked: false,
    sideImage: "/hanwha-side.jpg",
    loginImage: "/hanwha-login.jpg",
    productTag: "OPIc TRAINER",
    loginTitle: "다시 만나 반갑습니다",
    loginSub: "등록한 계정으로 학습을 이어가세요.",
    heroCard: ["한화엔진과 함께,", "글로벌 무대를 향해."],
    heroScript: ["더 넓은 세상과", "연결되는 영어"],
    motto: ["SPEAK WITH", "CONFIDENCE"],
    landingBadge: "한화엔진 임직원을 위한 AI 말하기 연습",
    landingCta: "한화엔진 계정으로 시작하기",
    adminId: "admin123",
    footnote: "한화엔진 임직원 학습 화면 시안 · 이미지는 연출 예시입니다.",
    // 오렌지의 900 은 탁한 갈색이 된다. 어두운 회색 위에 오렌지를 얹는다
    heroDark: "bg-slate-900",
  },
};

/** ★ 여기 한 줄만 바꾸면 전체가 따라 바뀐다 */
export const ACTIVE: BrandKey = "hanwha";

export const BRAND = BRANDS[ACTIVE];
