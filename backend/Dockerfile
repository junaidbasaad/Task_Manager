FROM node:20-alpine AS base
WORKDIR /app
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN mkdir -p uploads && chown -R app:app /app

USER app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
