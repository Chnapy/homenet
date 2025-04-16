import re
import yaml
from src.provider.debian import Debian
from src.utils.get_properties import get_properties
from src.grpc.agent_pb2 import AgentApp, AgentWebItem, AgentOS
from src.provider.provider import Provider


class OpenWRT(Provider):
    def check(self):
        if not self.exec.isFile("/etc/glversion"):
            return False

        osReleasePath = "/etc/os-release"
        if not self.exec.isFile(osReleasePath):
            return False

        config_file = self.exec.open(osReleasePath)
        configs = get_properties(config_file)
        osName = configs["NAME"]
        return bool(osName and "openwrt" in osName.lower())

    def get_os(self):
        return AgentOS.OPENWRT_GLINET

    def get_lan(self):
        return Debian(self.exec).get_lan()

    def get_wan(self):
        return Debian(self.exec).get_wan()

    def get_ddns(self):
        ddnsFilePath = "/etc/config/gl_ddns"
        if not self.exec.isFile(ddnsFilePath):
            return None

        ddnsFile = self.exec.open(ddnsFilePath)

        enabled = False
        domain = None

        for lineRaw in ddnsFile.splitlines():
            line = lineRaw.strip()
            if line.startswith("config service"):
                enabled = False
                domain = None

            if line.startswith("option domain"):
                domain = line.split(" ")[2].replace("'", "")

            if line.startswith("option enabled"):
                enabled = bool(int(line.split(" ")[2].replace("'", "")))

            if enabled and domain:
                return domain

        if enabled and domain:
            return domain
        return None

    def get_dhcp(self):
        return Debian(self.exec).get_dhcp()

    def get_web(self) -> list[AgentWebItem]:
        # extract from nginx too complex (lua scripts)
        # TODO user defined
        return []

    def get_ssh(self):
        return Debian(self.exec).get_ssh()

    def get_apps(self) -> list[AgentApp]:
        return list(
            filter(
                None,
                [
                    self.get_wireguard(),
                    self.get_nginx(),
                    self.get_adguard_home(),
                ],
            )
        )

    def get_wireguard(self) -> AgentApp | None:
        configFilePath = "/etc/config/wireguard_server"
        if not self.exec.isFile(configFilePath):
            return None

        configFile = self.exec.open(configFilePath)

        vpnAddress = ""
        vpnClients: list[str] = []

        for lineRaw in configFile.splitlines():
            line = lineRaw.strip()
            lineParts = line.split(" ")

            if lineParts[0] == "option":
                optionValue = lineParts[2].replace("'", "")
                if lineParts[1] == "address_v4":
                    vpnAddress = optionValue.split("/")[0]

                if lineParts[1] == "client_ip":
                    vpnClients.append(optionValue.split("/")[0])

        return AgentApp(
            slug=AgentApp.AgentAppSlug.WIREGUARD,
            vpnMode=AgentApp.AgentVpnMode.SERVER,
            vpnAddress=vpnAddress,
            vpnClients=vpnClients,
        )

    def get_nginx(self) -> AgentApp | None:
        reverseProxy: list[AgentApp.AgentReverseProxy] = []

        configFolderPath = "/etc/nginx"
        if not self.exec.isDir(configFolderPath):
            return None

        configFilesPaths = self.exec.exec(
            f"find {configFolderPath} -type f -name '*.conf'"
        ).splitlines()

        configFiles: list[str] = []

        for path in configFilesPaths:
            content = self.exec.open(path)
            configFiles.append(content)

        pattern = re.compile(
            r"[^#]*?listen\s+(\d+)[^#]*?server_name\s+([^\s]+)\s*;[^#]*?proxy_pass\s+([^\s]+);",
            re.DOTALL,
        )

        for fileContent in configFiles:
            matches: list[tuple[str, str, str]] = pattern.findall(fileContent)
            for match in matches:
                fromPort, domain, fullAddress = match
                addressParts = fullAddress.split("://")
                ssl = addressParts[0] == "https"
                address, port = addressParts[1].split(":")
                reverseProxy.append(
                    AgentApp.AgentReverseProxy(
                        fromDomain=AgentApp.AgentReverseProxy.From(
                            domain=domain,
                            ssl=int(fromPort) == 443,
                        ),
                        toAddress=AgentApp.AgentReverseProxy.To(
                            address=address, ssl=ssl, port=int(port) if port else None
                        ),
                    )
                )

        # print(reverseProxy)

        return AgentApp(slug=AgentApp.AgentAppSlug.NGINX, reverseProxy=reverseProxy)

    def get_adguard_home(self) -> AgentApp | None:
        configFilePath = "/etc/AdGuardHome/config.yaml"
        if not self.exec.isFile(configFilePath):
            return None

        config = yaml.safe_load(self.exec.open(configFilePath))

        web: list[AgentWebItem] = []

        if "http" in config and "address" in config["http"]:
            address: str = config["http"]["address"]
            port = address.split(":")[1]
            web.append(AgentWebItem(port=int(port)))

        return AgentApp(slug=AgentApp.AgentAppSlug.ADGUARD_HOME, web=web)
