# 단국대 OPIc 트레이너 — 웹 애플리케이션
#
# 문항 음성(public/audio/questions)은 이미지에 포함한다.
# 빌드 전에 반드시 아래를 실행해 음성을 생성해 두어야 한다.
#   python3 services/tts/generate.py && npm run link-audio
#
# 음성 파일은 저장소에 없으므로(.gitignore) 새로 클론한 서버에서 그냥
# 빌드하면 비어 있다. 그 상태로도 앱은 뜨지만 모든 문항이 브라우저 음성으로
# 떨어져 학생마다 다른 목소리를 듣게 된다. 조용히 그렇게 되는 것이 가장 나쁘므로
# 아래 build 단계에서 빌드를 실패시킨다.

FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 문항 음성이 실려 있는지 확인한다. 없으면 여기서 멈춘다.
RUN node -e "\
const fs=require('fs');\
const bank=JSON.parse(fs.readFileSync('data/testlets.json','utf8'));\
const need=new Set(bank.flatMap(t=>t.questions.map(q=>q.promptAudio)).filter(Boolean));\
const dir='public/audio/questions';\
const have=fs.existsSync(dir)?new Set(fs.readdirSync(dir)):new Set();\
const missing=[...need].filter(p=>!have.has(p.split('/').pop()));\
if(missing.length){\
  console.error('문항 음성이 '+missing.length+'개 없습니다 (필요 '+need.size+', 있음 '+have.size+').');\
  console.error('빌드 전에 실행하세요:  python3 services/tts/generate.py && npm run link-audio');\
  console.error('음성 없이 올리면 모든 문항이 브라우저 음성으로 재생됩니다.');\
  process.exit(1);\
}\
console.log('문항 음성 '+need.size+'개 확인');"

RUN npx prisma generate && npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/data ./data
COPY package.json ./
EXPOSE 3000
# 컨테이너 기동 시 마이그레이션을 적용한 뒤 서버를 띄운다
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p 3000"]
