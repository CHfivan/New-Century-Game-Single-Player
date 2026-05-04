# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy server package files and install dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# Copy server source and shared src/ code (engine, types, data)
COPY server/tsconfig.json ./server/
COPY server/src/ ./server/src/
COPY src/engine/ ./src/engine/
COPY src/types/ ./src/types/
COPY src/data/ ./src/data/
COPY src/utils/assetUrl.ts ./src/utils/assetUrl.ts

# Build TypeScript (rootDir is "..", output goes to server/dist/)
RUN cd server && npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/server/package.json /app/server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy compiled output (includes JSON data files)
COPY --from=builder /app/server/dist/ ./server/dist/

WORKDIR /app/server

EXPOSE 3001

CMD ["node", "dist/server/src/index.js"]
