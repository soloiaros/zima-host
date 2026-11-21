FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /tmp/src

# Auto-detect static web root: website/, dist/, public/, build/, or root
RUN mkdir -p /usr/share/nginx/html && \
    if [ -f /tmp/src/website/index.html ]; then \
      cp -r /tmp/src/website/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/dist/index.html ]; then \
      cp -r /tmp/src/dist/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/public/index.html ]; then \
      cp -r /tmp/src/public/* /usr/share/nginx/html/; \
    elif [ -f /tmp/src/build/index.html ]; then \
      cp -r /tmp/src/build/* /usr/share/nginx/html/; \
    else \
      cp -r /tmp/src/* /usr/share/nginx/html/; \
    fi && rm -rf /tmp/src

CMD ["/bin/sh", "-c", "sed -i \"s/listen [0-9]\\+;/listen ${PORT:-80};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
