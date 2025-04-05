from abc import ABC, abstractmethod

# from src.exec.local_exec import LocalExec

class Exec(ABC):
    def __init__(self, parentExec: 'Exec'):
        self.parentExec = parentExec

    @abstractmethod
    def exec(self, command: str) -> str:
        pass

    def isDir(self, path: str) -> bool:
        return bool(self.exec(f'test -d {path} && echo 1'))

    def isFile(self, path: str) -> bool:
        return bool(self.exec(f'test -f {path} && echo 1'))

    def open(self, path: str) -> str:
        return self.exec(f'cat {path}')
