
# install:
#     pip install -r requirements.txt

start:
	python3 launcher.py

dev:
	python3 -m src

build-all:
	make gen-grpc && make build-launcher && make build-agent

build-agent:
	pyinstaller -n agent --onefile --windowed src/__main__.py

build-launcher:
	pyinstaller -n launcher --onefile --windowed launcher.py

check:
	mypy --check-untyped-defs src

gen-grpc:
	python -m grpc_tools.protoc -I../protos --python_out=./src/grpc --pyi_out=./src/grpc --mypy_grpc_out=./src/grpc --grpc_python_out=./src/grpc ../protos/* \
	&& sed -i 's/import agent_pb2/from . import agent_pb2/' src/grpc/agent_pb2_grpc.py

# scp ./dist/launcher root@proxmox.lan:/root/homenet/
