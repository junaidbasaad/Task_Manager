FROM node:20-alpine AS base
WORKDIR /app
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

# Prisma schema must exist before install (postinstall used to run prisma generate too early)
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts
RUN npx prisma generate

COPY src ./src
RUN mkdir -p uploads && chown -R app:app /app

USER app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
