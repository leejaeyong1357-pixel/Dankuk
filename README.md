# 단국대 OPIc AI 학습 트레이너

단국대학교 재학생을 위한 OPIc 모의고사·학습 웹 서비스.
문제를 무작위로 뿌리는 영어회화 앱이 아니라, **실제 OPIc 시험 구조를 모사하는
Exam Generation Engine** 을 중심으로 만들었습니다.

설계 근거와 결정 사항은 **[`docs/SPEC.md`](docs/SPEC.md)** 에 있습니다.

## 빠르게 실행하기

```bash
npm install
npm run seed      # Testlet 뱅크 생성 (data/testlets.json)
npm run verify    # Exam Engine 시나리오 검증 (TEST A~E)
npm run dev       # http://localhost:3000
```

DB·API 키 없이도 폴백 모드로 전체 흐름이 동작합니다.
데이터베이스를 붙이려면 `.env` 에 `DATABASE_URL` 을 넣고:

```bash
npm run db:migrate    # 스키마 적용
```

## 데이터 저장

`DATABASE_URL` 이 있으면 **PostgreSQL 이 정본**이고, 없으면 브라우저 저장소만 씁니다.
화면 코드는 둘을 구분하지 않습니다 — `lib/sync.ts` 가 폴백을 흡수합니다.

| 테이블 | 내용 |
|---|---|
| `User` | 이메일·이름·목표 등급·시험 일정 |
| `SurveyResponse` | 시험마다의 Background Survey 응답과 도출된 topic |
| `Exam` | 난이도 3종·문항 수·소요 시간·채점 결과·쓰인 testlet/문항 id |
| `ExamAnswer` | 문항별 전사와 결정적 지표 |
| `PracticeLog` | 연습 모드 답변과 피드백 |
| `VocabEntry` | 단어장 |

**출제 이력을 서버에 두는 이유**가 있습니다. 브라우저 데이터를 지워도 같은 문제가
다시 나오면 안 되기 때문입니다. `Exam.testletIds` / `Exam.questionIds` 를 근거로
다음 시험에서 회피합니다.

## 두 가지 모드

| | 실전 모의고사 | 문제별 AI 연습 |
|---|---|---|
| 경로 | `/mock` | `/study` |
| 문항 텍스트 | **표시하지 않음** (듣기만, 최대 2회) | 표시 + 단어 사전 |
| 시험 중 AI | **없음** — TTS/STT 만 동작 | 문항마다 첨삭·모범답안 |
| 산출물 | 종료 후 AI 예상 등급 리포트 | 문항별 즉시 피드백 |

실전 모드에서는 STT 결과·문법 교정·점수·모범답안을 **시험 중에 일절 표시하지 않습니다.**
분석은 시험이 끝난 뒤에만 실행됩니다.

## 실전 모의고사 흐름

```
Background Survey
  -> Self Assessment (난이도 1~6)
  -> 마이크 테스트
  -> Sample Question
  -> 면접관 등장
  -> 자기소개 (isWarmup, 등급 계산에서 분리)
  -> 1st Session (7문항)
  -> 중간 난이도 재조정 (더 쉬운 / 비슷한 / 더 어려운)
  -> 2nd Session (secondDifficulty 로 새로 생성)
  -> 시험 종료
  -> AI 분석
  -> 예상 등급 및 상세 리포트
```

전체 제한 시간 40분. 문항별 강제 제한은 없습니다.

## Exam Generation Engine

`lib/exam/` 에 모듈로 분리되어 있습니다. UI 컴포넌트 안에서 `Math.random()` 으로
문제를 고르지 않습니다.

| 파일 | 역할 |
|---|---|
| `config.ts` | `EXAM_CONFIG` — 문항 수, 세션 경계, 타이머, 재생 횟수 |
| `question-types.ts` | Difficulty 1~6, Question Type 23종, Probe Type, 난이도별 허용 기능 |
| `survey.ts` | Background Survey 7개 카테고리 → `selectedSurveyTopics[]` |
| `topics.ts` | 주제 43종 (설문 연동 + 돌발) · 세부 주제 · 롤플레이 상대 |
| `repository.ts` | Testlet / Question 스키마와 조회 |
| `generator.ts` | 1st/2nd Session 생성, 가중치 추출, fallback |
| `history.ts` | `userQuestionHistory` — 같은 문제 반복 방지 |
| `session.ts` | 진행 중 시험 상태 |

### 난이도

숫자 1~6을 직접 고릅니다 (Easy/Normal/Hard 아님). 난이도가 오를수록
**요구되는 Speaking Function 자체가 어려워집니다.**

```
1  묘사 · 선호 · 간단한 일상
2  + 간단한 과거 경험
3  + 기억에 남는 경험, 기초 비교, 롤플레이 질문하기
4  + 처음 경험, 변화, 비교, 롤플레이 문제 해결
5  + 확장 서술, 복합 롤플레이, 의견
6  + 이슈, 원인과 결과, 장단점, 가정 상황
```

7번 문항 후 재조정하여 `initialDifficulty` / `secondDifficulty` /
`difficultySelection` 3개를 모두 저장합니다. 결과적으로 `3-3`, `4-4`, `5-6`,
`6-6` 같은 조합이 만들어집니다.

### Testlet

출제 단위는 문항 하나가 아니라 **같은 주제로 묶인 2~3문항 세트**입니다.
한 testlet 의 문항은 흩어지지 않고 연속 출제됩니다.

```
MOVIE-T0139
  1  DESCRIPTION_PLACE   LEVEL_CHECK
  2  ROUTINE             LEVEL_CHECK
  3  PAST_MEMORABLE      PROBE
```

롤플레이는 3문항이 같은 `roleplayGroupId` 를 가집니다
(`ROLEPLAY_ASK` → `ROLEPLAY_PROBLEM` → `ROLEPLAY_PAST_EXPERIENCE`).

### Level Check / Probe

모든 문항을 같은 난이도로 만들지 않습니다.
testlet 의 앞 문항은 `LEVEL_CHECK`(현재 난이도 수행 확인),
마지막 문항은 `PROBE`(한 단계 위 기능 확인)입니다.

### 출제 선택

가중치 기반 확률 추출입니다. 완전 랜덤도, 항상 같지도 않습니다.

```
surveyMatch        설문에서 고른 주제       +2.0
difficultyMatch    목표 난이도와의 거리     +1.5 ~ 0
questionFreshness  아직 안 풀어본 문제      +1.2
userHistoryPenalty 최근 N회에 나온 testlet  -3.0
frequencyWeight    출제 빈도 가중치
```

후보가 없으면 제약을 단계적으로 풀어 출제 실패를 막습니다
(이력 → 설문 한정 → 주제 중복 → 기능 제한 → 난이도만).

### 검증

```bash
npm run verify
```

| | 시나리오 |
|---|---|
| TEST A | 난이도 3 → 비슷함 → 3-3, 15문항 정상 종료 |
| TEST B | 난이도 5 → 어려움 → 5-6, 후반부 상위 Function 실제 증가 |
| TEST C | 난이도 6 → 어려움 → 6-6 유지 |
| TEST D | 난이도 1 → 쉬움 → 1-1 유지, 12문항, 추상 기능 0건 |
| TEST E | 2회 응시 시 testlet·문항 중복 0건 |

브라우저로도 네 가지 난이도 조합을 처음부터 끝까지 완주 검증했습니다.

## 채점

시험 중에는 LLM 을 부르지 않습니다. 종료 후 전체 답변을 한 번에 넘겨
**Claude Sonnet 5 를 1회만** 호출합니다.

채점의 절반은 LLM 없이 계산합니다. 결정적이라 같은 답변에 항상 같은 값이 나옵니다.

| 항목 | 방식 |
|---|---|
| 발화량 · WPM · 침묵 구간 | STT word timestamps → 계산 |
| 필러 · 연결어 · 과거시제 · 어휘 다양성 | 전사 파싱 → 계산 |
| 한국어 이탈 탐지 | Whisper 언어 태그 → 계산 |
| ACTFL 준거 점수 · 취약 유형 · 리포트 | Claude Sonnet 5 |

결과는 점수가 아니라 **AI 예상 등급**(NL~AL)으로 표시하며,
공식 OPIc 성적이 아님을 화면에 명시합니다.

## 음성

| | 선택 | 비고 |
|---|---|---|
| TTS | **Kokoro-82M** (Apache-2.0) | `services/tts` · 오프라인 배치, 런타임 비용 0 |
| STT | **faster-whisper large-v3** (MIT) | `services/stt` · word timestamps + 언어 태그 |

면접관은 실제 OPIc 캐릭터를 복제하지 않은 자체 캐릭터(Ariel)입니다.
정해진 문항을 순서대로 읽어주는 역할이며, 자유 대화를 하는 챗봇이 아닙니다.

```bash
cd services/stt && pip install -r requirements.txt && uvicorn main:app --port 8000
cd services/tts && pip install -r requirements.txt && python generate.py
```

## 환경 변수

`.env.example` 을 `.env.local` 로 복사합니다. 없으면 폴백으로 동작합니다.

- `ANTHROPIC_API_KEY` — 없으면 지표 기반 폴백 채점
- `STT_URL` — 없으면 목업 전사

## 현재 상태

- [x] Background Survey · Self Assessment 1~6 · 마이크 테스트 · Sample Question
- [x] Exam Generation Engine (Testlet / Level Check / Probe / 가중치 추출 / 이력)
- [x] 1st Session → 중간 난이도 재조정 → 2nd Session
- [x] 40분 타이머 · 문항 최대 2회 재생 · 녹음 저장
- [x] 시험 종료 후 일괄 분석 · AI 예상 등급 리포트
- [x] 문제별 AI 연습 (사전 hover · 첨삭 · 모범답안)
- [ ] DB 전환 (인증 방식 확정 후 — 현재 localStorage)
- [ ] Kokoro 음성 배치 생성 (현재 브라우저 음성으로 대체 재생)
