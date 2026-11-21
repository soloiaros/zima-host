FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci || npm install; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm install; \
    fi

COPY . .

RUN if grep -q '"build"': package.json; then npm run build; fi

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
