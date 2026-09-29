# syntax=docker/dockerfile:1
# Multi-stage build -> minimal `next start` runtime via Next.js standalone output.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# No lockfile committed yet, so `npm install` (not `npm ci`). Add a lockfile
# later and switch to `npm ci` for reproducible builds.
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Same-origin API through nginx by default; overridable at build time.
ARG NEXT_PUBLIC_API_BASE=/api
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Standalone bundle + static assets + public dir.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
