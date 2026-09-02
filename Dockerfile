# 단국대 OPIc 트레이너 — 웹 애플리케이션
#
# 문항 음성(public/audio/questions)은 이미지에 포함한다.
# 빌드 전에 반드시 아래를 실행해 음성을 생성해 두어야 한다.
#   python3 services/tts/generate.py && npm run link-audio

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
