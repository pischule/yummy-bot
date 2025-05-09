FROM node:20-alpine
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
RUN mkdir -p /usr/src/app/data
CMD ["node", "build"]
