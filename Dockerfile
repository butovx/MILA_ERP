# Install dependencies only when needed
FROM node:18-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
# Install build tools needed for native modules like 'canvas'
# build-base includes make and g++
# Add 'cairo' runtime library explicitly
RUN apk add --no-cache python3 pkgconfig build-base cairo cairo-dev jpeg-dev pango-dev giflib-dev
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Set PYTHON env variable for node-gyp
ENV PYTHON=/usr/bin/python3
# Use --legacy-peer-deps to resolve peer dependency conflicts (e.g., with React 19)
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Pass DATABASE_URL as a build argument
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Install runtime dependencies needed by native modules like 'canvas' during build
RUN apk add --no-cache cairo jpeg pango giflib

# Создаем директорию для загрузок
RUN mkdir -p public/uploads
RUN chmod 777 public/uploads

RUN npm run build

# Production image, copy all the files and run next
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install runtime dependencies needed by native modules like 'canvas'
RUN apk add --no-cache cairo jpeg pango giflib

# Создаем директорию для загрузок
RUN mkdir -p public/uploads
RUN chown -R nextjs:nodejs public/uploads

COPY --from=builder /app/public ./public
# Ensure the nextjs user owns the public directory for runtime file uploads/serving
RUN chown -R nextjs:nodejs /app/public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем Next.js files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
