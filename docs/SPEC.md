# 단국대 OPIc AI 학습 트레이너 — 설계 명세 (v0.1)

> 상태: 방향 확정용 초안. 구현 착수 전 합의 문서.

---

## 0. 데이터 저작권 방침 (선결 사항)

저장소에 올려둔 `오픽만수르` PDF 10종에는 다음 문구가 명시되어 있습니다.

> 본 자료의 일부 혹은 전체 내용을 무단으로 복제/배포하거나 2차적 저작물로 재편집하는 경우,
> 5년 이하의 징역 또는 5천만원 이하의 벌금과 민사상 손해배상을 청구합니다.
> 개인의 시험준비 또는 비영리 목적의 블로그 글 링크 공유에 한하여 활용을 허용합니다.

단국대생 대상 **웹 서비스는 "공중 배포"** 에 해당하므로, 이 PDF의 영문·국문 문항 텍스트와
예시 답변을 그대로 DB에 넣어 서비스하면 침해입니다.

**따라서 채택하는 방침:**

| 대상 | 처리 |
|---|---|
| PDF의 **출제 구조·유형·주제 분포** | 사실(fact) 정보 → 분석에 활용 (`data/reference_set_structure.json`) |
| PDF의 **문항 영문/국문 원문** | 서비스에 미탑재. 내부 참고만 |
| PDF의 **예시 답변** | 서비스에 미탑재 |
| 실제 서비스 문항 뱅크 | 위 구조를 근거로 **자체 생성** (§7) |

OPIc 문항은 ACTFL이 정한 기능(function) 단위의 정형 문형이라, 구조를 지키면서
표현을 자체 작성하면 시험 대비 효과는 동일하며 법적 위험은 사라집니다.

---

## 1. 제품 정의

- **형태**: 웹 (모바일 앱 아님). 단국대 재학생이 로그인해 사용.
- **핵심 가치**: 목표 등급 + 시험일 + Background Survey → **개인화 출제 → 학습 → 모의고사 → 성적표**
- **브랜딩**: 단국대학교 로고, 첨부 3(Wonpic) 계열의 UI/UX 톤.

---

## 2. Exam Generation Engine

문제를 무작위 15개 뽑아 뿌리는 구조를 쓰지 않는다. 출제는 반드시 아래를 거친다.

```
Background Survey
  -> Eligible Topic Pool
  -> Initial Difficulty (1~6)
  -> Testlet Selection (Level Check + Probe)
  -> 1st Session (7문항)
  -> Difficulty Re-adjustment
  -> Second Difficulty
  -> 2nd Session Testlet Selection (Role Play / 상위 Function)
  -> Complete Exam
```

구현은 `lib/exam/` 에 모듈로 분리한다 (config / question-types / survey /
topics / repository / generator / history / session).

### 2.1 난이도 1~6

UI 에서 숫자 1~6 을 직접 고르게 한다. Easy / Normal / Hard 를 쓰지 않는다.
난이도가 오를수록 **요구되는 Speaking Function 자체가 어려워진다.**
어휘 난이도의 문제가 아니다. 허용 기능 목록은 `TYPES_BY_LEVEL` 에 있다.

| 난이도 | 추가되는 기능 |
|---|---|
| 1 | 묘사 · 선호 · 간단한 일상 (복잡한 롤플레이·비교·이슈 제외) |
| 2 | + 간단한 과거 경험 |
| 3 | + 기억에 남는 경험, 기초 비교, 롤플레이 질문하기 |
| 4 | + 처음 경험, 변화, 변화·비교, 롤플레이 문제 해결 |
| 5 | + 확장 서술, 복합 롤플레이, 의견, 원인과 결과 |
| 6 | + 이슈, 장단점, 가정 상황, 사회적·추상적 주제 |

문항 수는 `EXAM_CONFIG` 로 관리한다 (`low: 12`, `standard: 15`,
`firstSessionTarget: 7`). 코드 곳곳에 숫자를 하드코딩하지 않는다.

### 2.2 중간 난이도 재조정

7번 문항을 마치면 별도 화면을 띄운다 — "지금까지의 질문 난이도는 어떠셨나요?"

```
EASIER   secondDifficulty = initialDifficulty - 1
SIMILAR  secondDifficulty = initialDifficulty
HARDER   secondDifficulty = initialDifficulty + 1
         (최소 1, 최대 6)
```

`initialDifficulty` / `secondDifficulty` / `difficultySelection` 3개를 모두 저장한다.
결과적으로 3-3, 4-4, 5-5, 5-6, 6-6 같은 조합이 만들어진다.

**2nd Session 은 secondDifficulty 로 새로 생성한다.** 버튼만 바뀌고 문제 난이도가
그대로이면 안 된다. 5-6 은 5-4 보다 후반부에 상위 Function 이 실제로 더 많이 나온다
(`npm run verify` TEST B 가 이를 검증한다).

### 2.3 Testlet

출제의 기본 단위는 문항 하나가 아니라 **같은 주제로 묶인 2~3문항 세트**다.
한 testlet 의 문항은 흩어지지 않고 연속 출제된다.

```
MOVIE-T0139  (topic: MOVIE, level: 3, kind: COMBO)
  1  DESCRIPTION_PLACE   LEVEL_CHECK
  2  ROUTINE             LEVEL_CHECK
  3  PAST_MEMORABLE      PROBE
```

롤플레이는 3문항이 같은 `roleplayGroupId` 를 가진다
(`ROLEPLAY_ASK` -> `ROLEPLAY_PROBLEM` -> `ROLEPLAY_PAST_EXPERIENCE`).

### 2.4 Question Type

23종 ENUM 으로 관리한다. NORMAL / HARD 같은 모호한 타입은 쓰지 않는다.

```
SELF_INTRODUCTION
DESCRIPTION_PLACE / DESCRIPTION_PERSON / DESCRIPTION_OBJECT
ROUTINE / PREFERENCE
PAST_EXPERIENCE / PAST_RECENT / PAST_MEMORABLE / FIRST_EXPERIENCE
CHANGE / COMPARE / CHANGE_COMPARE
ROLEPLAY_ASK / ROLEPLAY_INFORMATION / ROLEPLAY_PROBLEM
ROLEPLAY_SOLUTION / ROLEPLAY_PAST_EXPERIENCE
OPINION / ISSUE / CAUSE_EFFECT / ADVANTAGE_DISADVANTAGE / HYPOTHETICAL
```

### 2.5 Level Check / Probe

모든 문항을 같은 난이도로 만들지 않는다.
testlet 의 앞 문항은 `LEVEL_CHECK`(현재 난이도를 안정적으로 수행하는지),
마지막 문항은 `PROBE`(한 단계 위 기능을 수행할 수 있는지)다.
PROBE 수행 여부가 상위 등급 부여의 근거가 된다.

### 2.6 돌발 문제

설문 문제만 출제하지 않는다. `surveyCategory: "UNEXPECTED"` 주제를 별도로 둔다
(날씨, 명절, 교통, 인터넷, 기술, 재활용, 은행, 호텔, 약속, 전화, 건강, 지역,
산업, 환경, 사회 변화). 콤보 3세트에 설문:돌발 = 2:1 을 목표로 배정한다.

낮은 난이도 학생에게 추상적인 ISSUE 를 강제하지 않는다.
`TYPES_BY_LEVEL` 과 `restrictTypes` 필터로 난이도와 함께 걸러낸다.

### 2.7 출제 선택 — Weighted Random

완전 랜덤도 안 되고 항상 같아도 안 된다. 점수를 가중치로 삼아 확률 추출한다.

```
surveyMatch        설문에서 고른 주제        +2.0
difficultyMatch    목표 난이도와의 거리      +1.5 ~ 0
questionFreshness  아직 안 풀어본 문제       +1.2
userHistoryPenalty 최근 N회에 나온 testlet   -3.0
frequencyWeight    출제 빈도 가중치
```

후보가 없으면 제약을 단계적으로 푼다 — 최근 이력 → 설문 한정 → 주제 중복 →
기능 제한 → 난이도만. 중복 회피를 엄격히 걸어 출제가 실패하는 일이 없어야 한다.

### 2.8 같은 문제 반복 방지

`userQuestionHistory` 에 회차별 testlet/문항 id 를 저장한다.
1순위 아직 안 풀어본 문제, 2순위 오래전에 풀었던 문제, 3순위 최근 문제.
최근 `historyLookback` 회에 등장한 testlet 은 우선 제외한다.

### 2.9 검증

`npm run verify` 로 TEST A~E 를 검증한다.

| | 시나리오 | 확인 항목 |
|---|---|---|
| A | 3 → 비슷함 → 3-3 | 15문항, 1st 7문항, testlet 연속성, 중복 없음 |
| B | 5 → 어려움 → 5-6 | 후반부 상위 Function 이 5-4 보다 많음 |
| C | 6 → 어려움 → 6-6 | 상한 유지 |
| D | 1 → 쉬움 → 1-1 | 하한 유지, 12문항, 추상 기능 0건 |
| E | 2회 응시 | testlet·문항 겹침 0건 |

## 3. 두 개의 모드 — AI 투입 지점이 다름

| | 모의고사 모드 | 유형별 학습 모드 |
|---|---|---|
| 목적 | 실전 재현 | 실력 향상 |
| Ava 음성 | **TTS 품질이 전부** | TTS |
| 사용자 응답 | 녹음 → **STT 정확도가 전부** | 녹음 → STT |
| Claude API | **시험 중에는 미사용** (종료 후 채점에만) | **문항마다 사용** |
| 문항 텍스트 | **표시하지 않음** (듣기만, 최대 2회) | 표시 + 단어 사전 |
| 산출물 | OPIc 성적표 형식 결과지 | 답변 첨삭 + 목표 등급 맞춤 모범답안 |

> 사용자 지시 그대로: **모의고사는 AI가 실시간으로 붙지 않는다.** TTS/STT 품질만 확보하면 됨.
> 채점은 시험이 끝난 뒤 전체 트랜스크립트를 한 번에 Claude로 넘겨 처리.

---

## 4. AI 피드백 엔진 (유형별 학습 모드)

### 4.1 채점 기준 — ACTFL 4대 준거

ACTFL은 말하기를 4가지 준거로 **총체적(holistic)** 평가합니다.
"모든 준거를 그 레벨에서 지속적으로 수행"해야 해당 등급이 부여됩니다.

| 준거 | 의미 | 서비스 내 측정 지표 |
|---|---|---|
| **Global Tasks / Functions** | 무엇을 할 수 있는가 (묘사·서술·질문·설득) | 문항이 요구한 기능 수행 여부, 과거시제 서술 성공 여부 |
| **Context / Content** | 다룰 수 있는 화제의 범위 | 주제 어휘 다양성, 구체적 디테일 개수 |
| **Accuracy / Comprehensibility** | 얼마나 잘 이해되는가 | 문법 오류율, 발음, 유창성, 어휘 적절성 |
| **Text Type** | 산출량과 조직 | 발화량(초·단어수), 문장→문단 구조, 연결어 사용 |

### 4.2 등급별 목표 프로필

| 등급 | 요구 산출 | 핵심 |
|---|---|---|
| IL | 문장 나열 | 익숙한 주제를 문장으로 이어 말함 |
| IM1–IM2 | 짧은 문단 | 구체적 묘사, 자연스러운 흐름 |
| IM3 | 문단 | 논리적 전개 |
| IH | 확장 문단 | 익숙하지 않은 상황·문제 해결, 질문→상황→이유/예시 |
| AL | 다문단 | 추상 주제, 비교·논증, 일관된 시제 통제 |

### 4.3 채점 파이프라인 — 결정적 지표 / LLM 분리

**채점을 통째로 LLM에 맡기지 않습니다.** 절반은 LLM 없이 계산됩니다.
결정적(deterministic)이라 매번 같은 값이 나오고, 비용이 0이며,
"어제랑 점수가 왜 다르냐"는 신뢰 붕괴를 막습니다.

| 항목 | 산출 방식 | LLM |
|---|---|---|
| 발화량 · WPM · 침묵 구간 | faster-whisper word timestamps | ✗ 계산 |
| 필러(um, uh, like) 빈도 | 전사 파싱 | ✗ 계산 |
| 연결어 사용 (because, so, actually…) | 사전 매칭 | ✗ 계산 |
| 과거시제 정확도 | 경량 파서 | ✗ 계산 |
| **한국어 이탈 탐지** | Whisper 언어 태그 | ✗ 계산 |
| 어휘 다양성 (TTR) | 계산 | ✗ 계산 |
| ACTFL 4대 준거 점수 | 지표 + 전사를 근거로 판정 | ✓ |
| 첨삭 (최소 수정본) | | ✓ |
| 목표 등급 모범답안 | | ✓ |
| 핵심 표현 추출 | | ✓ |

LLM 호출을 첨삭·모범답안으로 좁히면 출력 토큰이 줄어 비용도 함께 내려갑니다.

### 4.4 채점 LLM — Claude Sonnet 5 (확정)

**결정**: `claude-sonnet-5`. 단, **인터페이스 뒤에 두어 교체 가능하게** 구현합니다.

오픈 모델을 쓰지 않는 이유:

- 현행 오픈 모델 순위는 SWE-bench / Terminal-Bench / AIME 등 **코딩·수학·에이전트 벤치마크**로,
  우리 작업(ACTFL 루브릭 일관 적용 + 등급별로 의도적 하향 조정된 영어 모범답안 + 한국어 설명)을
  측정하지 않습니다.
- Sonnet급에 근접하는 오픈 모델(Kimi K3 ≈ 1.6TB 가중치, DeepSeek V4 Pro 등)은
  다중 GPU가 필요해 **채점용 GPU 임대료가 Sonnet API 요금을 초과**합니다.
  (500명 기준 Sonnet 월 약 63만원)
- 단일 GPU급(Qwen3.6-27B, Kanana 32B, HyperCLOVA X SEED 등)은 LLM-as-judge 편차가 커서
  **채점 일관성**이 확보되지 않습니다. 채점은 정확도보다 일관성이 먼저입니다.

**전환 조건**: 학생 음성·전사의 **외부 API 반출이 대학 정책상 금지**되는 경우.
그때는 성능·비용과 무관하게 자체 호스팅이 유일한 길이며,
후보는 **gpt-oss-120b** (Apache-2.0, 80GB 단일 GPU 타깃) 또는 **GLM-5.2** (MIT).
→ 미결정 사항 §9 에 등재.

### 4.5 피드백 산출 형식 (문항 1개당)

```json
{
  "scores": { "function": 0-5, "content": 0-5, "accuracy": 0-5, "textType": 0-5 },
  "metrics": { "durationSec": 0, "wordCount": 0, "wpm": 0,
               "fillerCount": 0, "connectorCount": 0, "pastTenseAccuracy": 0.0 },
  "estimatedGrade": "IM2",
  "gapToTarget": ["과거시제 3회 오류", "발화량 목표 대비 -35%"],
  "corrected": "사용자 문장을 최소 수정한 버전",
  "modelAnswer": "목표 등급(IH)에 맞춘 모범답안",
  "keyExpressions": [{ "en": "...", "ko": "...", "why": "..." }]
}
```

- `modelAnswer` 는 **목표 등급에 맞춰 난이도를 조절**합니다. IL 목표자에게 AL 답안을 주면 무용지물.
- 발음은 STT 신뢰도 점수 + 음소 단위 오인식 패턴으로 근사 (전용 발음 평가 API 도입은 v2).

---

## 5. 화면 구성

### 5.1 온보딩 (최초 로그인 1회)
1. 단국대 계정 로그인
2. **목표 등급 설정** (IL / IM2 / IM3 / IH / AL)
3. **시험 일정 설정** → 대시보드 D-day
4. **Background Survey** (Part 1~4, 실제 시험과 동일 문항)
5. **Self Assessment** (난이도 1~6)

### 5.2 대시보드
- D-day, 목표 등급, 학습 스트릭, 주제별 진척도, 취약 유형

### 5.3 유형별 학습 — 구현 완료
- 좌: 미션 박스 / QUESTION(단어 단위 hover) / 한글 번역 토글 / 문제 듣기 / 답변 시작
- **우: 사전 패널** — 단어 hover 시 뜻 표시
- 하단: 이전·다음 문항, 진행률 `n / N`
- 답변 후: §4.3 피드백 카드 전개

### 5.4 모의고사 (실전 재현) — 구현 완료
1. 헤드셋 안내 화면 + 음량 테스트
2. Background Survey → Self Assessment
3. Ava 오리엔테이션 음성
4. 문항 1~7 → **2차 난이도 선택 화면** → 8~15
5. 종료 → 채점 대기 → **OPIc 성적표 형식 결과지**

### 5.5 결과지 — 구현 완료
- 실제 OPIc 성적표 레이아웃 차용: 등급(NL~AL), 등급 설명문, 응시일, 유효기간(2년)
- 추가: 4대 준거 레이더 차트, 문항별 점수, 취약 유형 Top 3

### 5.6 단어장
- 학습 중 저장한 단어 → 복습

---

## 6. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript | 웹 단일 배포, SSR |
| 스타일 | Tailwind CSS | Wonpic 톤 재현 속도 |
| DB | PostgreSQL + Prisma | 관계형 (사용자–설문–세션–응답) |
| 인증 | 단국대 이메일 기반 (`@dankook.ac.kr`) | 재학생 한정 |
| **채점 LLM** | **Claude Sonnet 5** (`claude-sonnet-5`) | 확정 |
| **TTS** | **Kokoro-82M** (Apache-2.0) | 오픈소스 확정 · §6.1 |
| **STT** | **faster-whisper large-v3** (MIT) | 오픈소스 확정 · §6.2 |
| 오디오 | MediaRecorder API | 브라우저 녹음 |

### 6.1 TTS — Kokoro-82M

**핵심 전제: 문항은 고정이므로 음성을 오프라인 배치로 1회 생성해 정적 MP3로 서빙합니다.**
따라서 TTS는 런타임 인프라도, 런타임 비용도 **0원**입니다. 품질만 보고 고르면 됩니다.

| 후보 | 라이선스 | 판정 |
|---|---|---|
| **Kokoro-82M** | Apache-2.0 | **채택.** 82M로 작아 CPU에서도 실시간 이상, 54개 보이스/8개 언어, 미국식 여성 보이스 보유 |
| Chatterbox (Resemble AI) | MIT | 예비. 0.5B, 품질 우위. Kokoro 음질이 부족하면 승격 |
| Orpheus 3B (Canopy Labs) | Apache-2.0 | 예비. 자연스러움 최상위지만 GPU 필요 |
| F5-TTS | **CC-BY-NC 4.0** | **배제.** 비상업 조건 |
| XTTS-v2 (Coqui) | **CPML (비상업)** | **배제.** 동일 사유 |

> **주의**: 실제 OPIc의 Ava 음성을 클로닝하지 않습니다. 음성 인격권 문제가 있고,
> 시험 대비 효과는 "동일 음색"이 아니라 **동일 레지스터(미국식 여성·중간 속도·중립 톤)** 에서 나옵니다.
> Kokoro의 미국식 여성 보이스 중 하나를 골라 `AVA_VOICE` 상수로 고정합니다.

### 6.2 STT — faster-whisper (large-v3)

여기가 유일한 런타임 추론 부하입니다. 후보 비교:

| 후보 | 라이선스 | 판정 |
|---|---|---|
| **faster-whisper (CTranslate2)** | MIT | **채택.** `word_timestamps=True` 로 단어 단위 타임스탬프 → 발화량·유창성 지표 직결 |
| NVIDIA Parakeet TDT 0.6B v2 | 오픈 | **배제.** 속도·WER은 1위지만 **영어 전용** |
| WhisperX | 오픈 | 선택. 음소 단위 강제 정렬로 타임스탬프 정밀도 향상. 필요 시 도입 |
| whisper.cpp | MIT | 예비. CPU/Apple Silicon 배포 시 |

**Parakeet를 쓰지 않는 이유가 중요합니다.** 우리 사용자는 *한국인이 말하는 영어* 이고,
OPIc 채점 항목에 **"언어 선택"** 이 있습니다 — 즉 학생이 중간에 한국어로 새는 것을
**탐지해야** 합니다. Parakeet는 영어 전용이라 한국어 발화를 깨진 영어로 뱉습니다.
Whisper 계열은 99개 언어를 다루므로 한국어 구간을 그대로 받아쓰고 플래그할 수 있습니다.
다국어 학습 덕에 **비원어민 억양 강건성**도 Whisper 쪽이 앞섭니다.

**배포**: Python FastAPI 마이크로서비스로 감싸 Next.js에서 호출.
- GPU(L4/4090급) 1대: large-v3 int8 기준 90초 답변 ≈ 3초 → 대화형 응답 가능
- GPU 없으면 `distil-large-v3` 또는 `medium` int8 CPU → 큐잉 처리

### 6.3 비용 (오픈소스 + Sonnet 5 확정 기준)

TTS/STT가 자체 호스팅으로 전환되어 **API 종량 비용은 Claude Sonnet 5 하나만** 남습니다.
(Sonnet 5: 입력 $2 / 출력 $10 per 1M tokens)

| 항목 | 비용 |
|---|---|
| 유형별 학습 1문항 | 약 **28원** |
| 모의고사 1회 (15문항 일괄 채점) | 약 **106원** |
| 학생 1인/월 (하루 1문항 + 모의고사 4회) | 약 **1,260원** |
| 100명/월 | 약 **13만원** |
| 500명/월 | 약 **63만원** |

> 비용의 대부분이 **출력 토큰**(첨삭 + 모범답안)이라 프롬프트 캐싱 효과는 제한적입니다.
> 줄이려면 모범답안 길이를 목표 등급에 맞춰 상한을 두는 쪽이 효과적입니다.
> 별도로 STT용 GPU 서버 비용이 발생하며, 학교 인프라를 쓸 수 있으면 0원입니다.

---

## 7. 문항 뱅크 구축 계획

외부 스크랩은 ① 네트워크 정책상 대부분 차단 ② 저작권 위험 → **자체 생성**으로 확정.

**생성 축**: `주제(약 45종) × 기능(묘사/습관/경험/비교/이슈) × 난이도밴드(1-2 / 3-4 / 5-6)`

- 주제 45종 = 설문 항목 전체 + 돌발 주제(은행, 날씨/계절, 호텔, 명절, 약속, 모임, 산업,
  건강, 식당/외식, 교통수단, 재활용, 인터넷, 기술, 도서관, 병원, 지역/나라 …)
- 롤플레이는 `주제 × (질문하기/대안제시/유사경험)` 별도 축
- 1차 목표: **주제당 콤보 2세트 이상 → 약 300문항**, 롤플레이 40세트

각 문항 레코드:
```
{ id, type, topic, function, difficultyBand, textEn, textKo,
  missionKo, targetGrade, glossary[], audioUrl }
```

---

## 8. 데이터 모델 (초안)

```
User            id, email, name, targetGrade, examDate, streak
SurveyResponse  userId, part1..part4(jsonb), selfAssessmentLevel
Question        §7 레코드
MockExam        userId, difficulty, secondChoice, startedAt, finishedAt
Answer          examId|studyId, questionId, audioUrl, transcript,
                metrics(jsonb), aiFeedback(jsonb), estimatedGrade
Vocabulary      userId, word, meaning, sourceQuestionId
```

---

## 9. 미결정 사항

1. **단국대 계정 인증** — 실제 SSO 연동 가능 여부? 불가 시 이메일 도메인 검증으로 대체.
2. **STT 추론 서버** — 학교에서 GPU 서버를 받을 수 있는지. 불가 시 CPU 큐잉 설계로 전환.
3. **Kokoro 보이스 선정** — 미국식 여성 보이스 후보 중 청취 비교 후 1개 고정.
4. **학생 음성·전사의 외부 반출 허용 여부** — 대학 개인정보 정책 확인 필요.
   금지되면 채점 LLM을 gpt-oss-120b / GLM-5.2 자체 호스팅으로 전환 (§4.4).
5. **배포** — 학교 서버 / Vercel / 사내 인프라?
