# ================================
# MULTI-STAGE BUILD
# ================================

# ================================
# Stage 1: Builder
# ================================
FROM node:20-alpine AS builder

LABEL maintainer="Fayol Team"
LABEL description="Fayol WhatsApp Bot - Híbrido (Baileys + Twilio)"

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instala dependências
RUN pnpm install --frozen-lockfile --prod=false

# Copia código fonte
COPY . .

# Build TypeScript
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

# ================================
# Stage 2: Production
# ================================
FROM node:20-alpine

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia node_modules e build do stage anterior
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Cria diretórios necessários
RUN mkdir -p sessions logs && \
    chown -R nodejs:nodejs sessions logs

# Muda para usuário não-root
USER nodejs

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV SERVER_PORT=3002
ENV LOG_LEVEL=info

# Expõe porta do servidor
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["node", "dist/index.js"]
