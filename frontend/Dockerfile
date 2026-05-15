FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
# Always empty at build: browser uses same-origin /api; nginx proxies via API_UPSTREAM at runtime.
# (Railway may inject VITE_API_URL into the build — ignore it.)
RUN VITE_API_URL= npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache curl gettext
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=80
ENV API_UPSTREAM=http://localhost:4000
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'curl -fsS "http://127.0.0.1:${PORT:-80}/" >/dev/null || exit 1'
ENTRYPOINT ["/docker-entrypoint.sh"]
