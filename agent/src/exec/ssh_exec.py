import paramiko
from src.env import env

from src.exec.exec import Exec


class SSHExec(Exec):
    def connect(
        self,
        hostname: str,
        username: str,
        password: str,
        port: int = 22,
    ):
        self.ssh_client = paramiko.SSHClient()

        if env["LOG_LEVEL"] == "debug":
            print(
                f"ssh-connect -> hostname={hostname} port={port} username={username} password=***"
            )

        self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.ssh_client.connect(hostname, port, username, password)

    def exec(self, command: str):
        if env["LOG_LEVEL"] == "debug":
            print(f"ssh-in <- {command}")

        std = self.ssh_client.exec_command(command, get_pty=True)

        stdout = std[1]
        # stderr = std[2]

        # if stderr:
        #     print(stderr)

        output = ""
        for line in iter(stdout.readline, ""):
            output = output + line

        if env["LOG_LEVEL"] == "debug":
            print(f"ssh-out -> {self.formatOutputForLog(output)}")

        return output
