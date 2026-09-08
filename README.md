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

이메일로 **인증 코드를 확인해야** 계정이 만들어집니다. 도메인은 제한하지 않습니다.
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
- `SMTP_HOST` 가 없을 때 코드를 화면에 표시하는 것은 **개발 모드뿐**입니다.
  운영(`NODE_ENV=production`)에서 SMTP 가 없으면 코드를 아예 발급하지 않고
  503 을 돌려줍니다. 발급해 봐야 학생에게 닿지 않고, 노출된 코드는
  이메일만 알면 남의 계정으로 들어갈 수 있는 통로가 되기 때문입니다.

### SMTP 설정

운영에서는 반드시 필요합니다. 없으면 인증 코드를 발급하지 않으므로 아무도 로그인할 수 없습니다.

```bash
cp .env.example .env        # SMTP_* 채우기
npm run check:smtp                          # 접속·인증만 확인
npm run check:smtp -- 본인주소@dankook.ac.kr  # 실제로 한 통 보내 확인
```

선택지는 셋입니다.

| | 발신 주소 | 준비 | 적합 |
|---|---|---|---|
| **학교 메일 릴레이** | `@dankook.ac.kr` 그대로 | 정보처에 릴레이 계정 신청 | 정식 운영 |
| **Google Workspace** | 학교 Google 계정 | 2단계 인증 → **앱 비밀번호** 발급 | 가장 빠른 시작 |
| **Amazon SES · Resend** | 인증한 도메인 | 도메인 DNS 권한 필요 | 대량 발송 |

```bash
# 학교 릴레이 (주소·포트는 정보처에서 받으세요)
SMTP_HOST=smtp.dankook.ac.kr
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM="단국대 OPIc 트레이너 <no-reply@dankook.ac.kr>"

# Google Workspace — 계정 비밀번호가 아니라 앱 비밀번호입니다
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=계정@dankook.ac.kr
SMTP_PASS=앱비밀번호16자리
SMTP_FROM="단국대 OPIc 트레이너 <계정@dankook.ac.kr>"

# Amazon SES (서울 리전)
SMTP_HOST=email-smtp.ap-northeast-2.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=SES_SMTP_사용자이름     # IAM 액세스 키가 아닙니다
SMTP_PASS=SES_SMTP_비밀번호
```

주의할 점:

- **포트와 `SMTP_SECURE` 는 짝입니다.** 587 이면 `false`(STARTTLS), 465 면 `true`.
  `check:smtp` 가 어긋난 조합을 경고합니다.
- **`SMTP_FROM` 은 인증한 계정이 보낼 수 있는 주소여야 합니다.** DNS 권한 없이
  `@dankook.ac.kr` 로 보내면 스팸으로 분류되거나 서버가 거부합니다(550).
  학교 도메인으로 보내려면 SPF·DKIM 에 발송 서비스를 추가해야 하고,
  그건 학교 DNS 권한이 있어야 합니다.
- SES 는 처음에 샌드박스라 인증한 주소로만 발송됩니다.
  학생 전체에게 보내려면 **프로덕션 액세스**를 따로 신청해야 합니다.
- 첫 메일은 스팸함부터 확인하세요.

### 시연 계정 (SMTP 전 임시)

메일 릴레이가 열리기 전에도 시연과 파일럿을 돌릴 수 있게, 지정한 주소 몇 개만
메일 없이 고정 코드로 로그인시킵니다.

```bash
DEMO_ACCOUNTS="dankuk1@dankook.ac.kr:481902,dankuk2@dankook.ac.kr:735164"
```

- 목록에 있는 주소만 예외입니다. 나머지는 평소대로 메일 인증을 거칩니다.
- 코드는 **응답에도 화면에도 실리지 않습니다.** 운영자가 직접 알려 줍니다.
- 형식이 어긋나거나(`이메일:코드`), 이메일 형식이 아니거나, 코드가 6자 미만이거나
  뻔한 숫자(`123456` 등)면 그 항목은 **무시하고 서버 로그에 이유를 남깁니다.**
- 추측을 막기 위해 계정당 10분에 10회까지만 시도할 수 있습니다.
- 로그인 뒤에는 일반 계정과 완전히 같습니다 — 세션·시험 이력·단어장 모두 정상.

고정 코드라 새어 나가면 그대로 로그인 통로가 됩니다. **SMTP 를 붙이면 지우세요.**
켜져 있는 동안 `/api/health` 가 차단 항목으로 계속 알려 줍니다.

### 접근 통제

비용이 들거나 문항이 새어 나갈 수 있는 라우트는 모두 세션을 요구합니다
(`lib/auth/guard.ts`). `DATABASE_URL` 이 없는 로컬 개발 모드에는 세션 자체가
없으므로 그때만 통과시킵니다.

| 라우트 | 요구 | 사용자별 상한 | 비고 |
|---|---|---|---|
| `POST /api/transcribe` | 세션 | 40회 / 10분 | STT 호출, 오디오 20MB 상한 |
| `POST /api/feedback` | 세션 | 30회 / 10분 | STT + LLM, 오디오 20MB 상한 |
| `POST /api/grade-exam` | 세션 | 5회 / 10분 | Sonnet 호출 |
| `GET /api/practice` | 세션 | — | 문항 뱅크 조회 |
| `POST /api/exams/generate` | 세션 | — | 출제 |
| `/api/history` `/api/vocab` `/api/exams*` | 세션 | — | 사용자 데이터 |

- 상한은 프로세스 메모리에 있어 인스턴스마다 따로 셉니다. 정확한 쿼터가 아니라
  폭주를 막는 방어선입니다. 인스턴스를 여러 대 띄우면 공유 저장소로 옮겨야 합니다.
- 서버 오류는 원문을 돌려주지 않습니다. 업스트림(STT·DB) 응답이 그대로 나가면
  내부 주소나 구성이 드러나므로, 상세는 서버 로그에만 남깁니다.

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
npm run verify:all       # 출제 엔진 + 지표 계산 + 문항 품질
npm run verify           # 출제 엔진 시나리오 (TEST A~E)
npm run verify:metrics   # 결정적 지표 회귀 테스트
npm run audit            # 문항 품질 (문법·정합·다양성)
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

`npm run audit` 은 문항 자체의 품질을 봅니다. 뱅크를 스크립트로 찍어 내므로
슬롯 치환이 어긋나면 문법이 깨진 문장이 조용히 수천 개 섞이고, 학생은 문항을
**듣기만** 하므로 어색한 한 문장이 곧 못 푸는 문항이 됩니다. 자세한 기준은
`docs/SPEC.md` §7.1 에 있습니다.

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

문항 5,651개 중 고유 문장은 4,064개입니다 (난이도 밴드가 겹치는 testlet 이 같은 문장을 씁니다).
**파일 이름이 문장 내용의 해시**라 같은 문장은 자연히 한 파일을 공유하고,
문항 뱅크를 다시 만들어도 기존 음성이 그대로 재사용됩니다.

MP3(모노)로 저장해 전체 약 200MB 입니다. WAV 로 두면 3GB 가 넘어 배포에 부담이 됩니다.

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

### 가장 간단한 길 — Cloudflare Pages (내 컴퓨터에서 아무것도 실행하지 않음)

서버도, DB도, 로그인도 필요 없습니다. 터미널을 열 일도 없습니다.
Cloudflare 가 GitHub 저장소를 직접 받아서 빌드하고 배포합니다.

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. **Pages** 탭 → **Connect to Git** → 이 저장소 선택
3. 빌드 설정 (대부분 자동으로 잡힙니다)

   | 항목 | 값 |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build:static` |
   | Build output directory | `out` |

4. **Save and Deploy**

몇 분 뒤 `https://프로젝트이름.pages.dev` 주소가 나옵니다. 그 주소를 학생에게
주면 됩니다. 24시간 열려 있고, 내 컴퓨터를 꺼도 상관없습니다.
이후 저장소에 푸시할 때마다 자동으로 다시 배포됩니다.

문항 음성 4,064개는 저장소에 들어 있으므로 따로 준비할 것이 없습니다.

#### 직접 빌드해서 올리고 싶다면

```bash
npm install
npm run build:static     # out/ 생성 (음성 포함 약 214MB)
```

`out/` 폴더를 Cloudflare Pages 나 Netlify 에 끌어다 놓아도 됩니다.

동작 방식이 서버 모드와 다릅니다.

| | 서버 모드 | 정적 모드 |
|---|---|---|
| 출제 | 서버 | **브라우저** (뱅크를 정적 파일로 내려받음) |
| 전사 | faster-whisper | **브라우저 음성 인식** |
| 채점 | Claude (서버) | 지표 기반, 또는 Claude (키를 넣은 경우) |
| 기록 | PostgreSQL | 브라우저 저장소 |
| 로그인 | 이메일 인증 | 없음 |

알아 두어야 할 점:

- **파이어폭스에서는 음성 인식이 되지 않습니다.** 크롬·엣지·사파리를 쓰세요.
  브라우저 음성 인식은 Whisper 보다 정확도가 낮고, 한국어 이탈은 탐지하지 못합니다.
- 기록이 브라우저에만 남습니다. 다른 기기에서는 이어지지 않습니다.
- 주소를 아는 사람은 누구나 들어옵니다.

#### AI 채점을 켜려면

키 없이도 지표 기반 채점으로 등급과 리포트가 나옵니다. 첨삭·모범답안·표현 교체
제안까지 원하면 키를 넣습니다.

**어느 엔진을 쓸지는 넣은 키가 정합니다.** 둘 다 넣으면 OpenAI 를 씁니다.

Cloudflare Pages 라면 대시보드에서 넣습니다.
**Settings → Environment variables → Add variable**

| 이름 | 값 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_OPENAI_API_KEY` | `sk-...` | OpenAI 로 채점 |
| `NEXT_PUBLIC_OPENAI_MODEL` | 예: `gpt-4o-mini` | 안 넣으면 `gpt-4o-mini` |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | `sk-ant-...` | Claude 로 채점 |

넣은 뒤 **Deployments → Retry deployment** 로 다시 배포해야 반영됩니다.

직접 빌드한다면:

```bash
# OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=sk-... npm run build:static

# 모델을 지정할 때
NEXT_PUBLIC_OPENAI_API_KEY=sk-... NEXT_PUBLIC_OPENAI_MODEL=gpt-4o npm run build:static

# Claude
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-... npm run build:static
```

> **이 키는 공개됩니다.** `NEXT_PUBLIC_` 접두사가 붙은 값은 빌드 결과에 그대로
>박혀 브라우저로 나갑니다. 개발자도구에서 그대로 보이고, 공개 사이트의 API 키를
> 긁어가는 크롤러는 자동화되어 있습니다. 넣으려면 **한도를 건 임시 키**만 쓰고
> 시연이 끝나면 폐기하세요. 비워 두면 노출될 것이 없습니다.

### 관리자 로그인

로그인 화면의 **관리자 로그인** 버튼, 또는 아이디 `dku` / 비밀번호 `dku` 로
언제든 들어갈 수 있습니다. 브라우저 저장소가 비어 있어도(다른 기기, 시크릿 창,
새 배포 주소) 이 계정은 항상 동작합니다.

> 정적 사이트라 이 아이디와 비밀번호는 코드에 그대로 들어 있고 누구나 읽을 수
> 있습니다. 시연용 통로일 뿐이므로 개인 정보를 이 계정에 넣지 마세요.

---

## 서버로 배포하기

누구나 접속하는 공개 주소로 여는 것을 기준으로 씁니다. 두 가지 방법이 있습니다.

| | A. 내 컴퓨터 + Cloudflare Tunnel | B. 상시 서버 |
|---|---|---|
| 준비물 | 없음 | 서버 한 대 |
| 주소 | `아무이름.trycloudflare.com` | 도메인 또는 IP 기반 이름 |
| 조건 | **컴퓨터가 켜져 있는 동안만** | 24시간 |
| 적합 | 옆에서 보여 주는 시연 | 학생이 알아서 들어오는 파일럿 |

**학생이 아무 때나 들어와야 하면 A 는 안 됩니다.** 노트북을 닫는 순간 주소가
죽습니다. A 는 "지금 같이 보는" 자리에서만 쓰세요.

### 서버 크기 정하기

서버 비용을 정하는 것은 **STT 하나**입니다. 나머지는 다 합쳐도 가볍습니다.

| 조각 | 무게 |
|---|---|
| Next.js + Postgres | 합쳐서 1GB 미만 |
| 문항 음성 4,064개 | 디스크 200MB. 메모리는 안 씀 |
| **STT (whisper)** | **모델이 통째로 메모리에 올라감** |

그래서 선택지가 둘입니다.

- **STT 를 서버에서 돌린다** → 메모리 넉넉한 서버가 필요합니다.
  `WHISPER_MODEL` 로 조절합니다 (`small` 이면 작은 서버에서도 돕니다).
  종량 비용은 0원입니다.
- **STT 를 API 로 뺀다** (`STT_PROVIDER=muse`) → 남는 것은 Next.js + Postgres 뿐이라
  아주 작은 서버로 충분합니다. 대신 분당 과금이 붙습니다.

어느 쪽이든 `docker compose --profile domain up -d` 한 줄은 같습니다.
실제 사용량은 `docker stats` 로 확인하고 줄이면 됩니다.

**어느 쪽이든 HTTPS 는 선택이 아닙니다.** 세션 쿠키가 운영 모드에서 `secure` 로
발급되어 평문 HTTP 에서는 브라우저가 저장하지 않습니다. HTTP 로 열면 코드를
넣어도 로그인 화면으로 되돌아옵니다. A 는 터널이, B 는 `caddy` 가 처리합니다.

> **API 키를 프런트엔드에 두면 안 됩니다.** 정적 페이지에 넣으면 브라우저가 파일을
> 통째로 받아 가므로 개발자도구에서 그대로 보입니다. 공개 사이트의 API 키를 긁어
> 가는 크롤러는 자동화되어 있어 보통 몇 시간 안에 도용됩니다.
> 키는 서버에서 실행되는 쪽(`.env`)에만 둡니다.

## A. 내 컴퓨터 + Cloudflare Tunnel

앱은 내 컴퓨터에서 돌고, 터널이 공개 HTTPS 주소를 붙여 줍니다.
포트포워딩도 도메인도 필요 없습니다.

```bash
cp .env.example .env       # POSTGRES_PASSWORD, ANTHROPIC_API_KEY, DEMO_ACCOUNTS
docker compose up -d --build          # web + db + stt (127.0.0.1:3000)

# 다른 터미널에서
cloudflared tunnel --url http://localhost:3000
```

터널이 `https://무작위이름.trycloudflare.com` 을 찍어 줍니다. 그 주소를 학생에게
주면 됩니다. `cloudflared` 는 Cloudflare 가 배포하는 단일 실행 파일입니다.

- 터널을 끄면 주소도 사라집니다. 시연 중에는 켜 두세요
- 매번 주소가 바뀝니다. 고정하려면 Cloudflare 계정에 named tunnel 을 만듭니다
- `DOMAIN` 은 필요 없습니다 (caddy 를 띄우지 않으므로)

## B. 서버 + 도메인

### 1. 서버 준비

- 2 vCPU / 4GB 이상. STT 모델이 메모리를 씁니다
- 80, 443 포트 개방. 그 외에는 열지 않습니다
- 도메인을 서버 IP 로 연결. 도메인이 없으면 IP 기반 이름을 써도 됩니다
  (IP 가 `203.0.113.10` 이면 `203-0-113-10.sslip.io`)

### 2. 문항 음성 준비

음성 파일은 저장소에 없습니다(200MB). **빌드하는 곳에서 먼저 만들어야 합니다.**

```bash
python3 services/tts/generate.py    # 약 1시간 (CPU)
npm run link-audio
```

빌드 머신에서 만든 뒤 서버로 옮겨도 됩니다.

```bash
rsync -av public/audio/questions/ 서버:~/Dankuk/public/audio/questions/
```

음성이 없으면 **도커 빌드가 실패합니다.** 없는 채로 올라가면 모든 문항이
브라우저 음성으로 재생되어 학생마다 다른 목소리를 듣게 되는데, 그게 조용히
일어나는 것이 가장 나쁘기 때문입니다.

### 3. 실행

```bash
cp .env.example .env      # DOMAIN, POSTGRES_PASSWORD 는 반드시 채워야 뜹니다
docker compose --profile domain up -d --build   # caddy 포함
curl https://$DOMAIN/api/health
```

### 4. 점검

`GET /api/health` 가 구성 상태와 **운영 차단 항목**을 알려줍니다.
상세 내역은 로그인했거나 `HEALTH_TOKEN` 을 아는 쪽에만 보입니다.

```bash
curl -H "x-health-token: $HEALTH_TOKEN" https://$DOMAIN/api/health
```

```json
{
  "ok": false,
  "checks": { "db": "ok", "grader": "claude-sonnet-5", "stt": "faster-whisper",
              "mailer": "smtp", "demoAccounts": [], "questionAudio": "5651/5651" },
  "blockers": []
}
```

`blockers` 가 빈 배열이 되어야 운영에 올릴 준비가 된 것입니다.

### 공개 주소로 여는 경우 주의

- **`DEMO_ACCOUNTS` 는 아무나 접속할 수 있는 주소에서도 로그인 통로가 됩니다.**
  코드를 추측하기 어렵게 잡고(6자리 이상, 뻔한 숫자 금지), SMTP 를 붙이면 지웁니다.
  계정당 10분에 10회로 시도를 제한하지만 고정 코드라는 사실은 변하지 않습니다.
- STT 컨테이너 포트는 밖으로 열지 않습니다. 열려 있으면 누구나 전사를 돌려
  서버 자원을 쓸 수 있습니다. `web` 만 내부망으로 접근합니다.
- `POSTGRES_PASSWORD` 는 기본값이 없습니다. 채우지 않으면 컨테이너가 뜨지 않습니다.

## 현재 상태

- [x] Background Survey · Self Assessment 1~6 · 마이크 테스트 · Sample Question
- [x] Exam Generation Engine (Testlet / Level Check / Probe / 가중치 추출 / 이력)
- [x] 1st Session → 중간 난이도 재조정 → 2nd Session
- [x] 40분 타이머 · 문항 최대 2회 재생 · 녹음 저장
- [x] 시험 종료 후 일괄 분석 · AI 예상 등급 리포트
- [x] 문제별 AI 연습 (사전 hover · 첨삭 · 모범답안)
- [x] PostgreSQL 영속 계층 · 서버측 출제 이력
- [x] 이메일 인증 로그인 (세션 쿠키, 코드 해시 저장, 소유자 검증)
- [x] Kokoro 문항 음성 사전 생성 (문장 해시 파일명 · MP3)
- [x] Docker 배포 구성 · `/api/health` 점검 엔드포인트
- [x] 유료 경로 접근 통제 (세션 요구 · 호출 상한 · 업로드 상한 · 오류 원문 비노출)
