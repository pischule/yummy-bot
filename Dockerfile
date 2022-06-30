# syntax=docker/dockerfile:1

FROM golang:1.18-alpine as builder

RUN apk add --no-cache gcc musl-dev g++ leptonica-dev tesseract-ocr-dev opencv-dev npm

WORKDIR /app

COPY ["go.mod", "go.sum", "./"]
RUN go mod download

COPY *.go ./

RUN go build -a -o yummy-bot-2

FROM alpine:3.16

RUN apk add --no-cache leptonica tesseract-ocr opencv tesseract-ocr-data-rus

WORKDIR /app

COPY --from=builder /app/yummy-bot-2 ./yummy-bot-2

COPY ./rects-tool /app/rects-tool

EXPOSE 8080

ENV GIN_MODE=release

ENTRYPOINT ["./yummy-bot-2"]