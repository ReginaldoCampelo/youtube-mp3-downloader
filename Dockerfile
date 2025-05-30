# Dockerfile para o backend NestJS com yt-dlp e ffmpeg no Railway

# Etapa 1 - Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2 - Runtime com yt-dlp e ffmpeg via APK (sem pip)
FROM node:20-alpine

# Instala dependências essenciais e yt-dlp + ffmpeg
RUN apk add --no-cache ffmpeg python3 yt-dlp

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD [ "node", "dist/main" ]
