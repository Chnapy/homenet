import os
import yaml
from src.utils.is_ip_lan import is_ip_lan
from src.utils.get_properties import get_properties
from src.grpc.agent_pb2 import AgentApp, AgentInstance, AgentSSH, AgentWebItem, AgentOS
from src.provider.provider import Provider


class Debian(Provider):
    def check(self):
        osReleasePath = "/etc/os-release"
        if not self.exec.isFile(osReleasePath):
            return False

        config_file = self.exec.open(osReleasePath)
        configs = get_properties(config_file)
        osName = configs["NAME"]
        return bool(osName and "debian" in osName.lower())

    def get_os(self):
        return AgentOS.DEBIAN

    def get_lan(self):
        try:
            result = self.exec.exec("ip addr")
            for line in result.splitlines():
                if "inet " in line and "scope global" in line:
                    ip_address = line.split()[1].split("/")[0]
                    if is_ip_lan(ip_address):
                        # print(ip_address, line)
                        return ip_address
            return "No IP found"
        except Exception as e:
            return f"Error retrieving IP: {e}"

    def get_wan(self):
        try:
            result = self.exec.exec("ip addr")
            for line in result.splitlines():
                if "inet " in line and "scope global" in line:
                    ip_address = line.split()[1].split("/")[0]
                    if not is_ip_lan(ip_address):
                        return ip_address
            return None
        except Exception as e:
            return f"Error retrieving IP: {e}"

    def get_ddns(self):
        pass

    def get_dhcp(self):
        dhcpFilePath = "/etc/config/dhcp"
        if not self.exec.isFile(dhcpFilePath):
            return None

        dhcpFile = self.exec.open(dhcpFilePath)

        dhcpList: list[AgentInstance.AgentDHCPItem] = []
        domain = ""
        currentItem: AgentInstance.AgentDHCPItem | None = None

        for lineRaw in dhcpFile.splitlines():
            line = lineRaw.strip()
            lineParts = line.split(" ")
            if lineParts[0] == "config":
                currentItem = AgentInstance.AgentDHCPItem()

            if lineParts[0] == "option":
                optionValue = lineParts[2].replace("'", "")
                if lineParts[1] == "domain":
                    domain = optionValue

                if lineParts[1] == "ip" and ":ffff" not in optionValue and currentItem:
                    currentItem.address = optionValue

                if lineParts[1] == "name" and currentItem:
                    currentItem.alias = optionValue + "." + domain

            if currentItem and currentItem.address and currentItem.alias:
                dhcpList.append(currentItem)
                currentItem = None

        if len(dhcpList) > 0:
            return dhcpList
        return None

    def get_web(self) -> list[AgentWebItem]:
        return []

    def get_ssh(self) -> AgentSSH | None:
        """Extrait le(s) port(s) SSH configurés depuis sshd_config"""
        sshd_file_path = "/etc/ssh/sshd_config"
        dropbear_file_path = "/etc/config/dropbear"
        ports: list[int] = []

        if self.exec.isFile(sshd_file_path):
            f = self.exec.open(sshd_file_path)
            for line in f.splitlines():
                # Ignore les commentaires et les espaces
                config_part = line.split("#", 1)[0].strip()

                if config_part.startswith("Port "):
                    parts = config_part.split()
                    if len(parts) >= 2:
                        try:
                            ports.append(int(parts[1]))
                        except ValueError:
                            continue  # Port invalide ignoré
            if len(ports) == 0:
                ports.append(22)

        if self.exec.isFile(dropbear_file_path):
            f = self.exec.open(dropbear_file_path)
            for line in f.splitlines():
                lineParts = list(filter(lambda s: len(s) > 0, line.strip().split(" ")))
                if (
                    len(lineParts) > 2
                    and lineParts[0] == "option"
                    and lineParts[1] == "Port"
                ):
                    optionValue = lineParts[2].replace("'", "")
                    ports.append(int(optionValue))
                    break

        if ports.__len__() > 0:
            return AgentSSH(ports=ports)

        return None

    def get_apps(self) -> list[AgentApp]:
        return list(filter(None, [self.get_code_server()]))

    def get_code_server(self) -> AgentApp | None:
        if not self.exec.isFile("/bin/code-server"):
            return None

        app = AgentApp(
            slug=AgentApp.AgentAppSlug.CODE_SERVER,
        )

        home_dir = os.path.expanduser("~")
        configPath = f"{home_dir}/.config/code-server/config.yaml"
        if not self.exec.isFile(configPath):
            return app

        stream = self.exec.open(configPath)
        try:
            config = yaml.safe_load(stream)

            port: str = config["bind-addr"].split(":")[1]

            app.web.append(AgentWebItem(port=int(port), ssl=False))
        except yaml.YAMLError as exc:
            print(exc)

        return app
