import subprocess
from src.env import env
from src.exec.exec import Exec


class LocalExec(Exec):
    def __init__(self):
        super(LocalExec, self).__init__(self)

    def exec(self, command: str):
        if env["LOG_LEVEL"] == "debug":
            print(f"local-in <- {command}")

        process = subprocess.Popen(
            [command],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True,
        )
        stdout, stderr = process.communicate()

        if stderr:
            if env["LOG_LEVEL"] == "debug":
                print(stderr)
            raise RuntimeError(f"command [{command}]\n" + stderr)

        if env["LOG_LEVEL"] == "debug":
            print(f"local-out -> {self.formatOutputForLog(stdout)}")

        return stdout
