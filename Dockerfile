FROM oven/bun:1.0
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
CMD ["bun", "./build/index.js"]
