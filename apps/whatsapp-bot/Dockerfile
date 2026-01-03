# WhatsApp Bot Dockerfile
# Baseado em Node.js 20-slim para menor tamanho de imagem

FROM node:20-slim AS base

# Instalação de dependências do sistema necessárias para o Baileys
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Instalação do pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copia apenas arquivos de configuração do workspace primeiro (cache layer)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copia packages compartilhados
COPY packages ./packages

# Copia apenas package.json do whatsapp-bot primeiro
COPY apps/whatsapp-bot/package.json ./apps/whatsapp-bot/

# Instala dependências (usa cache se package.json não mudou)
RUN pnpm install --frozen-lockfile

# Copia código fonte do whatsapp-bot
COPY apps/whatsapp-bot ./apps/whatsapp-bot

# Build do TypeScript
RUN pnpm --filter whatsapp-bot run build

# Stage final - apenas runtime
FROM node:20-slim

# Reinstala dependências do sistema necessárias para runtime
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# Copia apenas arquivos necessários do build stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/whatsapp-bot/dist ./apps/whatsapp-bot/dist
COPY --from=base /app/apps/whatsapp-bot/package.json ./apps/whatsapp-bot/
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/package.json ./

# Cria diretório para persistir sessão do WhatsApp
RUN mkdir -p /app/auth_info_baileys
VOLUME ["/app/auth_info_baileys"]

# Expõe porta (se necessário para healthcheck)
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV WHATSAPP_SESSION_DIR=/app/auth_info_baileys

# Comando de inicialização
CMD ["pnpm", "--filter", "whatsapp-bot", "start"]
