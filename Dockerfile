# Dockerfile para o backend NestJS com yt-dlp e ffmpeg no Railway

# Etapa 1 - Builder
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2 - Runtime com yt-dlp e ffmpeg
FROM node:18-alpine

# Instala dependências essenciais e yt-dlp + ffmpeg
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip install yt-dlp

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

ENV NODE_ENV=production

CMD [ "node", "dist/main" ]