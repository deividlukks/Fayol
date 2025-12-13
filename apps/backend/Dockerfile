FROM node:20-slim

# Configura variáveis de ambiente para o pnpm e node
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=development

# CORREÇÃO: Instala curl e openssl (necessários para healthcheck e Prisma engine)
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

# Habilita o pnpm
RUN corepack enable

WORKDIR /app

# Copia o código do monorepo
COPY . .

# Instala dependências (ignora lockfile para evitar conflitos de OS)
RUN pnpm install --frozen-lockfile=false

# Gera o cliente do Prisma
RUN pnpm --filter @fayol/database-models run generate

EXPOSE 3333

CMD ["pnpm", "--filter", "backend", "run", "dev"]