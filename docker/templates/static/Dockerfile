# Stage 1: Build if package.json exists
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN if [ -f package.json ]; then \
      if [ -f package-lock.json ]; then npm ci || npm install; \
      elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install; \
      elif [ -f yarn.lock ]; then yarn install; \
      else npm install; \
      fi && \
      if grep -q '"build":' package.json; then npm run build; fi; \
    fi

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app /tmp/src

# Auto-detect web root: dist/client/, dist/, build/, out/, website/, public/, or root
RUN mkdir -p /usr/share/nginx/html && \
    if [ -f /tmp/src/dist/client/index.html ]; then \
      cp -r /tmp/src/dist/client/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/dist/index.html ]; then \
      cp -r /tmp/src/dist/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/build/index.html ]; then \
      cp -r /tmp/src/build/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/out/index.html ]; then \
      cp -r /tmp/src/out/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/website/index.html ]; then \
      cp -r /tmp/src/website/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/public/index.html ]; then \
      cp -r /tmp/src/public/* /usr/share/nginx/html/; \
    else \
      cp -r /tmp/src/* /usr/share/nginx/html/; \
    fi && rm -rf /tmp/src

CMD ["/bin/sh", "-c", "sed -i \"s/listen [0-9]\\+;/listen ${PORT:-80};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
