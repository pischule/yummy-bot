FROM node:26-alpine

RUN addgroup -S app \
    && adduser -S -s /sbin/nologin -G app app

WORKDIR /app

COPY --chown=app build build
COPY --chown=app package.json pnpm-lock.yaml ./
COPY --chown=app drizzle drizzle
RUN corepack enable && pnpm install --frozen-lockfile --prod
RUN mkdir data && chown -R app data

USER app:app

EXPOSE 3000

CMD ["node", "build"]
