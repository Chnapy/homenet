
dev:
	go run ./src

build-arm-32:
	GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=0 go build -o dist/agent_arm ./src

build-linux-64:
	GOOS=linux GOARCH=amd64 GOARM=7 CGO_ENABLED=0 go build -o dist/agent_linux ./src

build-windows-64:
	GOOS=windows GOARCH=amd64 go build -o dist/agent_windows.exe ./src

gen-grpc:
	protoc -I../protos --go_out=./src/grpc/generated --go_opt=paths=source_relative \
    --go-grpc_out=./src/grpc/generated --go-grpc_opt=paths=source_relative \
    ../protos/*
