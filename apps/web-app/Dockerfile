FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ARG permite sobrescrever via docker-compose ou docker build --build-arg
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN corepack enable

# Cria usuário não-root para rodar a aplicação (segurança)
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --chown=appuser:appuser . .

# Instala dependências com lockfile fixo para garantir versões controladas
RUN pnpm install --frozen-lockfile=false

# Muda para usuário não-root
USER appuser

EXPOSE 3000

CMD ["pnpm", "--filter", "web-app", "run", "dev"]