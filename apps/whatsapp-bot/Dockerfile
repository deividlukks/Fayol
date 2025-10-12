# ================================
# MULTI-STAGE BUILD - WhatsApp Bot
# ================================

# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# Instala todas as dependências
RUN pnpm install --frozen-lockfile

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

LABEL maintainer="Fayol Team"
LABEL description="Fayol WhatsApp Bot - Híbrido (Baileys + Twilio)"

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia node_modules do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia código fonte
COPY . .

# Build TypeScript
RUN pnpm build

# ================================
# Stage 3: Production Runtime
# ================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Instala pnpm
RUN npm install -g pnpm

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia arquivos de configuração
COPY package.json pnpm-lock.yaml* ./

# Instala apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile

# Copia build do estágio anterior
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Cria diretórios necessários
RUN mkdir -p sessions logs && \
    chown -R nodejs:nodejs /app

# Muda para usuário não-root
USER nodejs

# Variáveis de ambiente padrão
ENV SERVER_PORT=3002
ENV LOG_LEVEL=info

# Expõe porta do servidor
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["node", "dist/index.js"]
