# ================================
# MULTI-STAGE BUILD - Backend NestJS
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
COPY apps/backend/package.json ./apps/backend/

# Instala todas as dependências (incluindo dev)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Instala pnpm
RUN npm install -g pnpm

# Copia node_modules do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copia código fonte
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend ./apps/backend

# Gera Prisma Client
RUN pnpm --filter backend exec prisma generate

# Build da aplicação
RUN pnpm --filter backend run build

# ================================
# Stage 3: Production Runtime
# ================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Instala pnpm
RUN npm install -g pnpm

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia arquivos necessários para instalar deps de produção
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/*/package.json ./packages/
COPY apps/backend/package.json ./apps/backend/

# Instala apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist --filter backend...

# Copia artefatos de build
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/prisma ./apps/backend/prisma

# Cria diretórios necessários
RUN mkdir -p /app/apps/backend/logs && \
    chown -R nodejs:nodejs /app

# Muda para usuário não-root
USER nodejs

# Define working directory final
WORKDIR /app/apps/backend

# Expõe porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de start
CMD ["node", "dist/main.js"]
