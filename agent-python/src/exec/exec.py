from abc import ABC, abstractmethod


class Exec(ABC):
    def __init__(self, parentExec: "Exec"):
        self.parentExec = parentExec

    @abstractmethod
    def exec(self, command: str) -> str:
        pass

    def isDir(self, path: str) -> bool:
        return bool(self.exec(f"test -d {path} && echo 1"))

    def isFile(self, path: str) -> bool:
        return bool(self.exec(f"test -f {path} && echo 1"))

    def isWritable(self, path: str) -> bool:
        return bool(self.exec(f"test -w {path} && echo 1"))

    def open(self, path: str) -> str:
        return self.exec(f"cat {path}")

    def formatOutputForLog(self, output: str) -> str:
        return "\n".join(output.splitlines()[:20])[:1000]
