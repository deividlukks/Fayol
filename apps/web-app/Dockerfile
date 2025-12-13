FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=development

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile=false

EXPOSE 3000

CMD ["pnpm", "--filter", "web-app", "run", "dev"]