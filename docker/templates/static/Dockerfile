FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

CMD ["/bin/sh", "-c", "sed -i \"s/listen [0-9]\\+;/listen ${PORT:-80};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
