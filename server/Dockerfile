FROM node:20-alpine

WORKDIR /app

# Copy server package files and install all dependencies (including tsx)
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# Copy server source and shared src/ code (engine, types, data)
COPY server/tsconfig.json ./server/
COPY server/src/ ./server/src/
COPY src/engine/ ./src/engine/
COPY src/types/ ./src/types/
COPY src/data/ ./src/data/
COPY src/utils/assetUrl.ts ./src/utils/assetUrl.ts

WORKDIR /app/server

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
