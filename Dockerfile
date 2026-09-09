# SIH 2026 Universal Log Normalization Framework Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code & configurations
COPY packages/ ./packages/
COPY src/ ./src/
COPY public/ ./public/
COPY parsers/ ./parsers/
COPY schemas/ ./schemas/
COPY samples/ ./samples/
COPY scripts/ ./scripts/
COPY tsconfig.json ./

EXPOSE 8000 5140

ENV NODE_ENV=production
ENV PORT=8000

CMD ["node", "src/index.js"]
