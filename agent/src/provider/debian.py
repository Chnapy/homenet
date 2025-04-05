import os
import yaml

from src.provider.provider import Provider, ProviderSSHItem, ProviderWebItem


class Debian(Provider):
    def get_os(self):
        return "debian"

    def get_lan(self):
        try:
            result = self.exec.exec("ip addr")
            for line in result.splitlines():
                if "inet " in line and "scope global" in line:
                    ip_address = line.split()[1].split("/")[0]
                    return ip_address
            return "No IP found"
        except Exception as e:
            return f"Error retrieving IP: {e}"

    def get_web(self) -> list[ProviderWebItem]:
        return []

    def get_ssh(self):
        """Extrait le(s) port(s) SSH configurés depuis sshd_config"""
        file_path = "/etc/ssh/sshd_config"
        ports: list[int] = []

        if not self.exec.isFile(file_path):
            return None

        f = self.exec.open(file_path)
        for line in f:
            # Ignore les commentaires et les espaces
            config_part = line.split("#", 1)[0].strip()

            if config_part.startswith("Port "):
                parts = config_part.split()
                if len(parts) >= 2:
                    try:
                        ports.append(int(parts[1]))
                    except ValueError:
                        continue  # Port invalide ignoré

        if ports.__len__() > 0:
            return ProviderSSHItem(ports=ports)

        return ProviderSSHItem(ports=[22])

    def get_apps(self):
        return list(filter(None, [self.get_code_server()]))

    def get_code_server(self) -> object:
        if not self.exec.isFile("/bin/code-server"):
            return None

        baseObj = {
            "slug": "code-server",
        }

        home_dir = os.path.expanduser("~")
        configPath = f"{home_dir}/.config/code-server/config.yaml"
        if not self.exec.isFile(configPath):
            return baseObj

        stream = self.exec.open(configPath)
        try:
            config = yaml.safe_load(stream)

            port = config["bind-addr"].split(":")[1]

            return {**baseObj, "web": [{"port": port}]}
        except yaml.YAMLError as exc:
            print(exc)
            return baseObj
