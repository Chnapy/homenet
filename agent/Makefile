
install-deps:
	go get ./src

dev:
	BACKEND_ROUTE=code.lan:50051 go run -ldflags "-X main.releaseTag=${RELEASE_TAG}" ./src

build-arm-32:
	GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=0 go build -ldflags "-X main.releaseTag=${RELEASE_TAG}" -o dist/agent-linux-arm ./src

build-linux-64:
	GOOS=linux GOARCH=amd64 GOARM=7 CGO_ENABLED=0 go build -ldflags "-X main.releaseTag=${RELEASE_TAG}" -o dist/agent-linux-amd64 ./src

build-windows-64:
	GOOS=windows GOARCH=amd64 go build -ldflags "-X main.releaseTag=${RELEASE_TAG}" -o dist/agent-windows-amd64.exe ./src

gen-grpc:
	protoc -I../protos --go_out=./src/grpc/generated --go_opt=paths=source_relative \
    --go-grpc_out=./src/grpc/generated --go-grpc_opt=paths=source_relative \
    ../protos/*
