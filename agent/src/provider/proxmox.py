from src.exec.qm_exec import QMExec
from src.provider.debian import Debian
from src.exec.pct_exec import PCTExec
from src.provider.provider import Provider, ProviderWebItem

class Proxmox(Provider):
    def get_os(self):
        return 'proxmox' 

    def get_lan(self):
        return Debian(self.exec).get_lan()

    def get_web(self):
        return [
            ProviderWebItem(port=8006, ssl=True)
        ]

    def get_ssh(self):
        return Debian(self.exec).get_ssh()

    def get_apps(self) -> list[object]:
        return []

    def get_instances(self) -> list[object]:
        instances: list[object] = []

        qmList = self.exec.exec('qm list')
        for line in qmList.splitlines():
            id = line.split()[0]

            if id.startswith('VMID'):
                continue

            qmExec = QMExec(self.exec, id)

            from src.collect import collect
            
            instances.append({
                "type": "proxmox",
                **collect(qmExec) # type: ignore
            })

        pctList = self.exec.exec('pct list')
        for line in pctList.splitlines():
            id = line.split()[0]

            if id.startswith('VMID'):
                continue

            pctExec = PCTExec(self.exec, id)

            from src.collect import collect
            
            instances.append({
                "type": "proxmox",
                **collect(pctExec) # type: ignore
            })

        return instances
