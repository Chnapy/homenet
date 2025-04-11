from src.provider.openwrt import OpenWRT
from src.grpc.agent_pb2 import AgentOS, AgentInstance
from src.exec.exec import Exec
from src.provider.debian import Debian
from src.provider.haos import HAOS
from src.provider.proxmox import Proxmox


def get_current_instance(exec: Exec) -> AgentInstance:

    providerList = [
        HAOS,
        Proxmox,
        OpenWRT,
        Debian,
    ]

    for providerClass in providerList:
        provider = providerClass(exec)
        if provider.check():
            return provider.get_instance()

    uname = exec.exec("uname -a")
    return AgentInstance(
        os=AgentOS.UNKNOWN_OS,
        unknownOS=uname,
        lan="",
        web=[],
        apps=[],
        instances=[],
    )
