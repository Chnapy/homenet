import json
from grpc import insecure_channel
from src.check.check_cron import check_cron
from src.exec.local_exec import LocalExec
from src.collect import get_current_instance
from src.env import env, envStr
from src.grpc.agent_pb2 import AgentInstance, AgentUpdateRequest, AgentMetadata
from src.grpc.agent_pb2_grpc import AgentStub
from google.protobuf.json_format import MessageToDict
import time

# from src.exec.ssh_exec import SSHExec


def getExec():
    # exec = SSHExec(LocalExec())
    # exec.connect(
    #     hostname="proxmox.lan",
    #     username="root",
    #     password="gringolo1",
    # )
    # return exec
    return LocalExec()


def sendData():

    route = env.get("ACTIVE_BACKEND_ROUTE")
    if not route:
        raise RuntimeError("Missing env: ACTIVE_BACKEND_ROUTE")

    startTime = time.time() * 1000

    exec = getExec()

    device = get_current_instance(exec)

    device.type = AgentInstance.AgentInstanceType.DEVICE

    with insecure_channel(route) as channel:
        stub = AgentStub(channel)

        duration = time.time() * 1000 - startTime

        request = AgentUpdateRequest(
            agentMetadata=AgentMetadata(
                releaseID=123,
                computeStartTime=int(startTime),
                computeDuration=int(duration),
                env=envStr,
            ),
            device=device,
        )

        print(
            "Startup collected info",
            json.dumps(
                MessageToDict(
                    message=request, always_print_fields_with_no_presence=True
                ),
                indent=2,
            ),
        )

        response = stub.update(request)

        print(f"Agent client received: {response.foo}")


def run():
    check_cron()
    sendData()
