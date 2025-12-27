FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=development

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile=false

CMD ["pnpm", "--filter", "telegram-bot", "run", "dev"]