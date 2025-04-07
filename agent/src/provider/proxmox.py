from src.grpc.agent_pb2 import AgentApp, AgentInstance, AgentOS, AgentWebItem
from src.exec.qm_exec import QMExec
from src.provider.debian import Debian
from src.exec.pct_exec import PCTExec
from src.provider.provider import Provider


class Proxmox(Provider):
    def get_os(self):
        return AgentOS.PROXMOX

    def get_lan(self):
        return Debian(self.exec).get_lan()

    def get_web(self):
        return [AgentWebItem(port=8006, ssl=True)]

    def get_ssh(self):
        return Debian(self.exec).get_ssh()

    def get_apps(self) -> list[AgentApp]:
        return []

    def get_instances(self) -> list[AgentInstance]:
        instances: list[AgentInstance] = []

        qmList = self.exec.exec("qm list")
        for line in qmList.splitlines():
            id = line.split()[0]

            if id.startswith("VMID"):
                continue

            qmExec = QMExec(self.exec, id)

            from src.collect import get_current_instance

            qmInstance = get_current_instance(qmExec)

            qmInstance.type = AgentInstance.AgentInstanceType.PROXMOX

            instances.append(qmInstance)

        pctList = self.exec.exec("pct list")
        for line in pctList.splitlines():
            id = line.split()[0]

            if id.startswith("VMID"):
                continue

            pctExec = PCTExec(self.exec, id)

            from src.collect import get_current_instance

            pctInstance = get_current_instance(pctExec)

            pctInstance.type = AgentInstance.AgentInstanceType.PROXMOX

            instances.append(pctInstance)

        return instances
