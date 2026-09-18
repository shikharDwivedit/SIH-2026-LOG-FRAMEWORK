# SIH 2026 Universal Log Normalization Framework Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code & configurations
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY src/ ./src/
COPY public/ ./public/
COPY parsers/ ./parsers/
COPY schemas/ ./schemas/
COPY samples/ ./samples/
COPY scripts/ ./scripts/
COPY frontend/ ./frontend/

RUN npm run build && npm prune --omit=dev

EXPOSE 8000 5140

ENV NODE_ENV=production
ENV PORT=8000

CMD ["node", "src/index.js"]
