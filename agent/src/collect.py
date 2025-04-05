from src.provider.provider import ProviderPayload
from src.exec.exec import Exec
from src.provider.debian import Debian

from src.provider.haos import HAOS
from src.provider.proxmox import Proxmox
from src.utils.get_properties import get_properties


def collect(exec: Exec) -> ProviderPayload:
    if exec.exec("uname -r").endswith("-haos"):
        return HAOS(exec).get_all()

    if exec.isDir("/etc/pve"):
        return Proxmox(exec).get_all()

    osReleasePath = "/etc/os-release"
    if exec.isFile(osReleasePath):
        config_file = exec.open(osReleasePath)
        configs = get_properties(config_file)
        osName = configs["NAME"]
        if osName and "debian" in osName.lower():
            return Debian(exec).get_all()

    return {
        "os": "unknown",
        "lan": "unknown",
        "ssh": None,
        "web": [],
        "apps": [],
        "instances": [],
    }
