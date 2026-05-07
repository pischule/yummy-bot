FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build


FROM node:24-alpine

RUN addgroup -S app \
    && adduser -S -s /sbin/nologin -G app app

WORKDIR /app

COPY --from=builder --chown=app /app/build build
COPY --from=builder --chown=app /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder --chown=app /app/drizzle drizzle
RUN corepack enable && pnpm install --frozen-lockfile --prod
RUN mkdir data && chown -R app data

USER app:app

EXPOSE 3000

CMD ["node", "build"]
