FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache protobuf

COPY backend/package*.json ./
RUN npm install
COPY backend/ .

COPY ./protos ./protos

RUN which protoc && protoc --version
RUN protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./src/grpc/generated/ --ts_proto_opt=outputServices=grpc-js ./protos/*.proto -I./protos

RUN npm run build

RUN npm prune --omit=dev

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/dist/ ./dist
COPY --from=build /app/protos/ ./protos
COPY --from=build /app/node_modules/ ./node_modules

EXPOSE 8081
EXPOSE 50051

CMD ["node", "./dist/index.js"]
