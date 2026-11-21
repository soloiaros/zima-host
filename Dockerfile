# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/
COPY packages/server/ packages/server/
COPY tsconfig.base.json ./

# Build in dependency order: shared → client → server
RUN npm run build --workspace=packages/shared && \
    npm run build --workspace=packages/client && \
    npm run build --workspace=packages/server

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install git and ca-certificates for cloning repositories
RUN apk add --no-cache git ca-certificates

# Copy package files for production install
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/client/dist packages/client/dist

# Copy Docker build templates
COPY docker/ /app/docker/

EXPOSE 3000

CMD ["node", "packages/server/dist/index.js"]
