import os
from src.exec.exec import Exec


class LocalExec(Exec):
    def __init__(self):
        super(LocalExec, self).__init__(self)

    def exec(self, command: str):
        return os.popen(command).read()
