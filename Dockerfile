FROM node:22-alpine AS backend-builder

WORKDIR /app

RUN apk add --no-cache protobuf

COPY backend/package*.json ./
RUN npm install
COPY backend/ .

COPY ./protos ./protos

RUN protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./src/grpc/generated/ --ts_proto_opt=outputServices=grpc-js ./protos/*.proto -I./protos

RUN npm run build

RUN npm prune --omit=dev

FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .

ENV VITE_BACKEND_API=/api

ENV VITE_STATIC_DEVICES_PATH=PLACEHOLDER_VITE_STATIC_DEVICES_PATH
ENV VITE_STATIC_METADATA_PATH=PLACEHOLDER_VITE_STATIC_METADATA_PATH

RUN npm run build

FROM alpine:latest AS frontend-only

LABEL org.opencontainers.image.title="Homenet frontend" \
    org.opencontainers.image.url="https://github.com/Chnapy/homenet" \
    org.opencontainers.image.source="https://github.com/Chnapy/homenet" \
    org.opencontainers.image.authors="Richard Haddad" \
    org.opencontainers.image.base.name="alpine:latest"

RUN apk add --no-cache \
    nginx \
    curl \
    && rm -rf /var/cache/apk/*
WORKDIR /app

# setup logs folders
RUN mkdir -p /var/log/nginx /var/run/nginx \
    && chown -R 755 /var/log/nginx /var/run/nginx

COPY --from=frontend-builder /app/dist /app/frontend

COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY frontend/entrypoint.sh /app/entrypoint.sh

VOLUME [ "/app" ]

EXPOSE 3000

# CMD ["nginx", "-g", "daemon off;"]
CMD ["/bin/sh", "/app/entrypoint.sh"]

FROM node:22-alpine AS monolith

WORKDIR /app

RUN apk add --no-cache nginx

# Frontend
COPY nginx/ /etc/nginx/
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Backend
COPY --from=backend-builder /app/dist/ ./dist
COPY --from=backend-builder /app/protos/ ./protos
COPY --from=backend-builder /app/node_modules/ ./node_modules

COPY --chmod=755 start.sh /start.sh

ENV HOMENET_GRPC_PORT=50051

EXPOSE 80 8081 50051

CMD ["/start.sh"]
