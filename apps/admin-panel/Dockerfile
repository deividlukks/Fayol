# ================================
# MULTI-STAGE BUILD - Admin Panel (Next.js)
# ================================

# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia arquivos de configuração do workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/*/package.json ./packages/
COPY apps/admin-panel/package.json ./apps/admin-panel/

# Instala dependências
RUN pnpm install --frozen-lockfile --shamefully-hoist

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder
WORKDIR /app

ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL

ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Instala pnpm
RUN npm install -g pnpm

# Copia node_modules do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copia código fonte
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin-panel ./apps/admin-panel

# Build da aplicação (gera output standalone)
RUN pnpm --filter admin-panel run build

# ================================
# Stage 3: Production Runtime
# ================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia o output standalone do Next.js
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin-panel/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin-panel/.next/static ./apps/admin-panel/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin-panel/public ./apps/admin-panel/public

# Muda para usuário não-root
USER nodejs

# Expõe porta
EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Inicia o servidor
CMD ["node", "apps/admin-panel/server.js"]
