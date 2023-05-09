FROM node:20-alpine
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
CMD ["node", "build"]
