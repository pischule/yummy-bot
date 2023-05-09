FROM node:20-slim
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
CMD ["node", "build"]
