FROM node:22-alpine AS build
LABEL stage=builder

WORKDIR /app

RUN apk add --no-cache protobuf

COPY backend/package*.json ./
RUN npm install
COPY backend/ .

COPY ./protos ./protos

# RUN curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v30.2/protoc-30.2-linux-x86_64.zip
# RUN unzip protoc-30.2-linux-x86_64.zip -d $HOME/.local
# RUN export PATH="$PATH:$HOME/.local/bin"
# ENV PATH="$PATH:$HOME/.local/bin"

RUN which protoc && protoc --version
RUN protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./src/grpc/generated/ --ts_proto_opt=outputServices=grpc-js ./protos/*.proto -I./protos

RUN npm run build

# RUN apk --purge del protobuf
RUN npm prune --omit=dev
# RUN rm -R ./src

FROM node:22-alpine

WORKDIR /app

# COPY backend/package*.json ./
# RUN npm install --omit=dev

COPY --from=build /app/dist/ ./dist
COPY --from=build /app/node_modules/ ./node_modules

EXPOSE 8081
EXPOSE 50051

CMD ["node", "dist"]
