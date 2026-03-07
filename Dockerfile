FROM node:24-alpine

RUN addgroup -S app \
    && adduser -S -s /sbin/nologin -G app app

WORKDIR /app

COPY --chown=app build build
RUN mkdir data && chown -R app data

USER app:app

EXPOSE 3000

CMD ["node", "build"]

