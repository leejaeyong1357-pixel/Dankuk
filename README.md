# 단국대 OPIc AI 학습 트레이너

단국대학교 재학생을 위한 OPIc 개인 맞춤 학습 웹 서비스.
Background Survey 응답으로 개인별 문항을 출제하고, 답변을 녹음해 AI 첨삭을 받습니다.

설계 근거와 결정 사항은 **[`docs/SPEC.md`](docs/SPEC.md)** 에 있습니다.

## 빠르게 실행하기

```bash
npm install
npm run seed     # 문항 뱅크 생성 (data/questions.json)
npm run dev      # http://localhost:3000
```

API 키 없이도 목업 채점으로 전체 화면이 동작합니다.

## 구성

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript + Tailwind | |
| 채점 LLM | **Claude Sonnet 5** | 교체 가능한 인터페이스 (`lib/llm.ts`) |
| STT | **faster-whisper large-v3** (MIT) | `services/stt` · 자체 호스팅 |
| TTS | **Kokoro-82M** (Apache-2.0) | `services/tts` · 오프라인 배치, 런타임 비용 0 |

### 환경 변수

`.env.example` 을 `.env.local` 로 복사해 채웁니다. 둘 다 없으면 목업으로 폴백합니다.

- `ANTHROPIC_API_KEY` — 없으면 목업 채점
- `STT_URL` — 없으면 목업 전사

### 음성 서비스 띄우기

```bash
# STT (런타임 필요)
cd services/stt && pip install -r requirements.txt
uvicorn main:app --port 8000

# TTS (오프라인 1회. 문항이 고정이라 생성 후 재사용)
cd services/tts && pip install -r requirements.txt
python generate.py
cd ../.. && npm run link-audio
```

## 핵심 구조

### 출제 로직 (`lib/exam-engine.ts`)

15문항 골격은 고정입니다. 기출 9세트 135문항을 파싱해 확인한 구조입니다.

```
1      자기소개 (채점 제외)
2-4    콤보 A   \
5-7    콤보 B    >  묘사 -> 습관 -> 경험, 설문:돌발 = 2:1
8-10   콤보 C   /
11-13  롤플레이  (질문하기 -> 대안 제시 -> 유사 경험)
14-15  난이도 3·4 -> 롤플레이 2세트 / 난이도 5·6 -> 어드밴스(비교·이슈)
```

돌발 주제는 설문과 무관하게 반드시 섞입니다.

### 모의고사 (`app/mock/`)

시험 중에는 **LLM 을 부르지 않는다.** 문항 재생(TTS)과 녹음·전사(STT)만 돌고,
종료 후 전체 답변을 한 번에 넘겨 Sonnet 5 를 **1회만** 호출한다.
문항별로 부르는 것보다 싸고, 답변 전체를 보고 판정하므로 총체적 평가라는 ACTFL 원칙에도 맞다.

전사는 다음 문항 진행과 겹쳐 백그라운드로 돌리므로 종료 후 대기 시간이 짧다.

```
/mock          헤드셋·마이크 점검, 진행 방식 안내
/mock/exam     Ava 오리엔테이션 → 문항 1~7 → 2차 난이도 선택 → 8~15 → 채점
/mock/result   OPIc 성적표 형식 결과지 (등급·유효기간·4대 준거·취약 유형)
```

### 채점 파이프라인 (`lib/metrics.ts` + `lib/llm.ts`)

채점을 통째로 LLM 에 맡기지 않습니다. 절반은 계산으로 처리해 재현성을 확보합니다.

| 항목 | 방식 |
|---|---|
| 발화량 · WPM · 침묵 구간 | STT word timestamps -> 계산 |
| 필러 · 연결어 · 과거시제 · 어휘 다양성 | 전사 파싱 -> 계산 |
| 한국어 이탈 탐지 | Whisper 언어 태그 -> 계산 |
| ACTFL 준거 점수 · 첨삭 · 모범답안 | Claude Sonnet 5 |

### 문항 뱅크 (`scripts/`)

외부 자료의 문항 원문을 쓰지 않습니다 (저작권 방침: `docs/SPEC.md` §0).
`주제 55종 × 기능 8종 × 난이도밴드 3` 조합으로 자체 생성합니다.

```bash
npm run seed
```

## 현재 상태

- [x] 온보딩 (목표 등급 · 시험일 · Background Survey · 자가평가)
- [x] 대시보드 (D-day · 진척도 · 내 출제 주제)
- [x] 유형별 학습 (사전 hover · 문제 듣기 · 녹음 · AI 피드백)
- [x] 단어장
- [x] 출제 엔진 + 문항 뱅크 881문항
- [x] 모의고사 실전 진행 (헤드셋·마이크 점검 → Ava 오리엔테이션 → 7번 후 2차 난이도 선택 → 성적표)
- [ ] DB 전환 (인증 방식 확정 후)
- [ ] Kokoro 음성 배치 생성 및 배포 (지금은 브라우저 음성으로 대체 재생)
