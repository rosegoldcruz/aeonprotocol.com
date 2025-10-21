# Multi-stage build for Next.js (standalone)
FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/web/package.json /app/apps/web/package.json
RUN cd /app/apps/web && npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/apps/web/node_modules /app/apps/web/node_modules
COPY apps/web /app/apps/web
RUN cd /app/apps/web && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/apps/web/.next/standalone /app
COPY --from=builder /app/apps/web/.next/static /app/apps/web/.next/static
COPY --from=builder /app/apps/web/public /app/apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
