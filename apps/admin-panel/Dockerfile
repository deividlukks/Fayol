FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN corepack enable

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --chown=appuser:appuser . .

RUN pnpm install --frozen-lockfile=false

USER appuser

EXPOSE 3001

CMD ["pnpm", "--filter", "admin-panel", "run", "dev"]
