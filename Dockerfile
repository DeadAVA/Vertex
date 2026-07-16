FROM node:20-slim AS base

# ─── Stage 1: Instalar dependencias ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Clave pública de Stripe — necesaria en tiempo de build (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npx prisma generate

# Prisma falla si DATABASE_URL no existe al importar los módulos durante el build.
# Este placeholder es solo para satisfacer la validación en tiempo de build;
# el valor real viene de .env.prod en runtime.
ENV DATABASE_URL=postgresql://localhost/build_placeholder
ENV NEXTAUTH_SECRET=build_placeholder
RUN npx next build

# ─── Stage 3: Runner de producción ─────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
