FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm install (não ci): o lock gerado no Windows/npm 11 pode divergir em
# optional deps (@emnapi/*) do npm 10 do Alpine, quebrando o deploy.
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# Já rodamos como USER nginx; a diretiva `user` do conf base falha sem root.
RUN sed -i 's/^user /#user /' /etc/nginx/nginx.conf \
    && sed -i 's|pid .*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf

# Upstream da API (produção por default; develop sobrescreve via ENV no Railway).
ARG API_UPSTREAM=https://api-registro-financeiro-production.up.railway.app
ENV API_UPSTREAM=${API_UPSTREAM}

# Fora de /etc/nginx/templates para não passar pelo envsubst automático do entrypoint.
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && chown nginx:nginx /etc/nginx/nginx.conf.template \
    && touch /tmp/nginx.pid \
    && chown nginx:nginx /tmp/nginx.pid

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

# Gera conf com API_UPSTREAM/API_HOST; demais $vars do nginx permanecem intactas.
ENTRYPOINT ["/bin/sh", "-c", "export API_HOST=$(echo \"$API_UPSTREAM\" | sed -E 's|^https?://||; s|/.*||'); envsubst '$API_UPSTREAM $API_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
