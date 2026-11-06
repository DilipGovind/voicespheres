# Multi-stage Docker build for VoiceSphere
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/standalone-server.js ./standalone-server.js

EXPOSE 3000

CMD ["node", "standalone-server.js"]
