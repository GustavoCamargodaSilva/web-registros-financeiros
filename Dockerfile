FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# Já rodamos como USER nginx; a diretiva `user` do conf base falha sem root.
RUN sed -i 's/^user /#user /' /etc/nginx/nginx.conf \
    && sed -i 's|pid .*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /tmp/nginx.pid \
    && chown nginx:nginx /tmp/nginx.pid

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
