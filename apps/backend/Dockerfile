FROM node:20-slim

# Configura variáveis de ambiente para o pnpm e node
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# CORREÇÃO: Instala curl, openssl e gosu.
# Curl é obrigatório para o HEALTHCHECK do docker-compose.
# OpenSSL e Procps são úteis para o Prisma e monitoramento.
RUN apt-get update && apt-get install -y curl openssl gosu procps && rm -rf /var/lib/apt/lists/*

# Habilita o pnpm
RUN corepack enable

# Cria usuário não-root
RUN groupadd -r appuser && useradd -r -m -g appuser appuser

WORKDIR /app

# Copia e instala
COPY --chown=appuser:appuser . .
RUN pnpm install --frozen-lockfile=false

# NOTA: prisma generate é executado em runtime pelo start.sh
# quando as variáveis de ambiente (.env) estão disponíveis

# Configura permissões finais
RUN mkdir -p /home/appuser/.cache/node/corepack && \
    chown -R appuser:appuser /home/appuser/.cache && \
    chown -R appuser:appuser /app

COPY apps/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY apps/backend/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/start.sh

EXPOSE 3333

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/start.sh"]