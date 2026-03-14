FROM denoland/deno:alpine-2.7.5

RUN addgroup -S app \
    && adduser -S -s /sbin/nologin -G app app

WORKDIR /app

COPY --chown=app .deno-deploy .deno-deploy
RUN mkdir data && chown -R app data

USER app:app

EXPOSE 8000

ENTRYPOINT [ \
  "deno", "run", \
  "--allow-env", \
  "--allow-sys=hostname", \
  "--allow-read=.", "--allow-write=data", \
  "--allow-net=0.0.0.0:8000,api.telegram.org", \
  "./.deno-deploy/server.ts" \
]
