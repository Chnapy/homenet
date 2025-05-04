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

ENV NODE_ENV=production
ENV VITE_BACKEND_API=/api

RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache nginx

# Frontend
COPY nginx/ /etc/nginx/
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Backend
# COPY --from=backend-builder /app/dist /usr/share/nginx/api
COPY --from=backend-builder /app/dist/ ./dist
COPY --from=backend-builder /app/protos/ ./protos
COPY --from=backend-builder /app/node_modules/ ./node_modules

COPY --chmod=755 start.sh /start.sh

EXPOSE 80 8081 50051

CMD ["/start.sh"]
