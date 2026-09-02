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

## 인증

단국대 이메일로 **인증 코드를 확인해야** 계정이 만들어집니다.
쿼리스트링의 이메일을 신뢰하지 않으므로 타인의 기록에 접근할 수 없습니다.

```
POST /api/auth/request   6자리 코드 발급 (10분 유효, 1분 재발송 제한)
POST /api/auth/verify    코드 확인 -> 세션 생성 (httpOnly 쿠키)
GET  /api/auth/me        현재 세션 사용자
POST /api/auth/logout    세션 폐기
```

- 코드와 세션 토큰은 **해시만 DB 에 저장**합니다.
- 코드는 1회용이며 5회 틀리면 재발급해야 합니다.
- 사용자 데이터 API 는 전부 세션으로만 식별하며, 시험 저장 시 소유자를 확인합니다.
- `SMTP_HOST` 가 없으면 코드가 서버 로그에만 남고 화면에 표시됩니다. **개발 전용**입니다.

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
npm run verify:all       # 출제 엔진 + 지표 계산
npm run verify           # 출제 엔진 시나리오 (TEST A~E)
npm run verify:metrics   # 결정적 지표 회귀 테스트
python3 services/stt/test_contract.py   # STT 서비스 계약
```

| | 시나리오 |
|---|---|
| TEST A | 난이도 3 → 비슷함 → 3-3, 15문항 정상 종료 |
| TEST B | 난이도 5 → 어려움 → 5-6, 후반부 상위 Function 실제 증가 |
| TEST C | 난이도 6 → 어려움 → 6-6 유지 |
| TEST D | 난이도 1 → 쉬움 → 1-1 유지, 12문항, 추상 기능 0건 |
| TEST E | 2회 응시 시 testlet·문항 중복 0건 |

지표 계산에는 별도 회귀 테스트가 있습니다. 이 값들은 LLM 을 거치지 않고 채점에
직접 들어가므로, 회귀가 생기면 학생 점수가 조용히 틀어집니다. 필러 오탐(like/well/actually),
한국어 이탈 탐지, 무응답의 0 나눗셈 같은 경계 사례를 고정해 두었습니다.

STT 서비스는 모델 가중치 없이도 응답 형태가 앱의 기대와 맞는지 계약 테스트로 확인합니다.
`words` 와 `segments[].language` 가 빠지면 발화량 지표와 한국어 이탈 탐지가 통째로 무너집니다.

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

### TTS — 문항 음성은 미리 만들어 정적 파일로 서빙합니다

**브라우저 내장 음성(speechSynthesis)은 운영에 쓰지 않습니다.**
OS·브라우저마다 목소리가 다르고 en-US 음성이 아예 없는 환경도 있어,
학생마다 다른 문제를 듣게 되기 때문입니다. 시험에서는 음성이 곧 문제입니다.

**Kokoro-82M** (Apache-2.0) 으로 오프라인에서 한 번만 생성합니다.
문항이 고정이라 런타임 추론도, 런타임 비용도 없습니다. GPU 도 필요 없습니다.

```bash
cd services/tts
pip install -r requirements.txt
mkdir -p models && cd models
curl -L -O https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -O https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ../../.. && npm run tts && npm run link-audio
```

문항 2,915개 중 고유 문장은 1,443개입니다 (서로 다른 testlet 이 같은 문장을 씁니다).
문장 단위로 한 번만 합성하고 나머지는 복사해 재사용하므로 생성 시간이 절반으로 줄어듭니다.

음성이 없는 문항은 브라우저 음성으로 대체 재생되지만, 이는 개발 중 폴백입니다.
`GET /api/health` 가 미생성 문항 수를 배포 차단 항목으로 보고합니다.

### STT — 세 가지 중 선택

`STT_PROVIDER` 로 고릅니다.

| 값 | 구현 | 특징 |
|---|---|---|
| `faster-whisper` (기본) | 자체 호스팅 (`services/stt`) | GPU 필요, 종량 비용 0, 99개 언어 |
| `muse` | Meta Model API | GPU 불필요, 분당 과금, 오픈 웨이트 없음 |
| `mock` | 목업 | 개발용 |

둘 다 **다국어**라는 점이 중요합니다. 학생이 중간에 한국어로 새는 것을 탐지해야
"언어 선택" 항목을 채점할 수 있는데, 영어 전용 모델은 한국어를 깨진 영어로 뱉습니다.

```bash
cd services/stt && pip install -r requirements.txt && uvicorn main:app --port 8000
```

### 면접관

실제 OPIc 캐릭터를 복제하지 않은 자체 캐릭터(Ariel)입니다.
정해진 문항을 순서대로 읽어주는 역할이며, 자유 대화를 하는 챗봇이 아닙니다.

## 환경 변수

`.env.example` 을 `.env.local` 로 복사합니다. 없으면 폴백으로 동작합니다.

- `ANTHROPIC_API_KEY` — 없으면 지표 기반 폴백 채점
- `STT_URL` — 없으면 목업 전사

## 배포

```bash
cp .env.example .env      # 값 채우기
docker compose up -d      # web + db + stt
curl localhost:3000/api/health
```

`GET /api/health` 가 구성 상태와 **운영 차단 항목**을 알려줍니다.

```json
{
  "ok": false,
  "checks": { "db": "ok", "grader": "claude-sonnet-5", "stt": "faster-whisper",
              "mailer": "console(개발용)", "questionAudio": "2915/2915" },
  "blockers": ["SMTP 미설정 — 인증 코드가 메일로 발송되지 않습니다"]
}
```

`blockers` 가 빈 배열이 되어야 운영에 올릴 준비가 된 것입니다.

## 현재 상태

- [x] Background Survey · Self Assessment 1~6 · 마이크 테스트 · Sample Question
- [x] Exam Generation Engine (Testlet / Level Check / Probe / 가중치 추출 / 이력)
- [x] 1st Session → 중간 난이도 재조정 → 2nd Session
- [x] 40분 타이머 · 문항 최대 2회 재생 · 녹음 저장
- [x] 시험 종료 후 일괄 분석 · AI 예상 등급 리포트
- [x] 문제별 AI 연습 (사전 hover · 첨삭 · 모범답안)
- [x] PostgreSQL 영속 계층 · 서버측 출제 이력
- [x] 이메일 인증 로그인 (세션 쿠키, 코드 해시 저장, 소유자 검증)
- [x] Kokoro 문항 음성 사전 생성
- [x] Docker 배포 구성 · `/api/health` 점검 엔드포인트
