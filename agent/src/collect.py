from src.grpc.agent_pb2 import AgentOS, AgentInstance
from src.exec.exec import Exec
from src.provider.debian import Debian

from src.provider.haos import HAOS
from src.provider.proxmox import Proxmox
from src.utils.get_properties import get_properties


def get_current_instance(exec: Exec) -> AgentInstance:
    uname = exec.exec("uname -a")

    if "-haos" in uname:
        return HAOS(exec).get_instance()

    if exec.isDir("/etc/pve"):
        return Proxmox(exec).get_instance()

    osReleasePath = "/etc/os-release"
    if exec.isFile(osReleasePath):
        config_file = exec.open(osReleasePath)
        configs = get_properties(config_file)
        osName = configs["NAME"]
        if osName and "debian" in osName.lower():
            return Debian(exec).get_instance()

    return AgentInstance(
        os=AgentOS.UNKNOWN_OS,
        unknownOS=uname,
        lan="",
        web=[],
        apps=[],
        instances=[],
    )
