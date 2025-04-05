import json
from src.exec.exec import Exec


class QMExec(Exec):
    def __init__(self, parentExec: "Exec", id: str):
        super(QMExec, self).__init__(parentExec)
        self.id = id

    def exec(self, command: str):
        print(f"qm {command}")
        output = self.parentExec.exec(f"qm guest exec {self.id} -- {command}")
        obj = json.loads(output)
        # print(output, obj, obj['out-data'])

        if "err-data" in obj:
            raise RuntimeError(obj["err-data"])

        if "out-data" in obj:
            value: str = obj["out-data"]
            return value.strip()
        return ""

    def isDir(self, path: str):
        output = self.parentExec.exec(f"qm guest exec {self.id} -- test -d {path}")
        obj = json.loads(output)
        print(output, obj)
        return not (bool(int(obj["exitcode"])))

    def isFile(self, path: str):
        output = self.parentExec.exec(f"qm guest exec {self.id} -- test -f {path}")
        obj = json.loads(output)
        print(output, obj)
        return not (bool(int(obj["exitcode"])))
