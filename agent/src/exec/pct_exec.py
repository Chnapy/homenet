
from src.exec.exec import Exec

class PCTExec(Exec):
    def __init__(self, parentExec: 'Exec', id: str):
        super(PCTExec, self).__init__(parentExec)
        self.id = id

    def exec(self, command: str):
        print(f'pct {command}')
        return self.parentExec.exec(f"pct exec {self.id} -- {command}")
