# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Cache deps layer
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build with standalone output (smallest possible image)
ENV NEXT_TELEMETRY_DISABLED=1
# BACKEND_INTERNAL_URL is used by Next.js rewrite proxy at runtime (server-side)
# It is NOT baked into the build - set it as a container env var
RUN npm run build && mkdir -p /app/public

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what Next.js standalone output needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# BACKEND_INTERNAL_URL will be injected at runtime via container app env vars
# Default fallback (overridden by container env var at runtime)
ENV BACKEND_INTERNAL_URL=https://cinema-backend.thankfulsky-96591df5.southeastasia.azurecontainerapps.io

CMD ["node", "server.js"]
