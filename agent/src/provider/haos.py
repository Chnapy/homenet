import json
import yaml
from src.grpc.agent_pb2 import AgentApp, AgentOS, AgentSSH, AgentWebItem
from src.provider.debian import Debian
from src.provider.provider import Provider


class HAOS(Provider):
    def get_os(self):
        return AgentOS.HAOS

    def get_lan(self):
        return Debian(self.exec).get_lan()

    def get_web(self) -> list[AgentWebItem]:
        webList: list[AgentWebItem] = []

        haInfo = self.exec.exec("ha core info")
        properties = yaml.safe_load(haInfo)

        if properties["port"]:
            webList.append(
                AgentWebItem(
                    port=int(properties["port"]),
                    ssl=True if properties["ssl"] == "true" else False,
                )
            )

        haObserver = self.exec.exec("docker inspect hassio_observer")
        observerConfig = json.loads(haObserver)

        observerPort = observerConfig[0]["HostConfig"]["PortBindings"]["80/tcp"][0][
            "HostPort"
        ]
        if observerPort:
            webList.append(
                AgentWebItem(
                    port=int(observerPort),
                    ssl=False,
                )
            )

        return webList

    def get_ssh(self) -> AgentSSH | None:
        ports: list[int] = []

        addonListOutput = self.exec.exec("ha addons --raw-json")
        addonList: list[dict[str, str]] = json.loads(addonListOutput)["data"]["addons"]

        for addon in addonList:
            addonInfoOutput = self.exec.exec(
                f'ha addons info {addon["slug"]} --raw-json'
            )
            addonInfo = json.loads(addonInfoOutput)["data"]
            network: dict[str, str] | None = addonInfo["network"]
            if not network:
                continue
            for key in network.keys():
                value = network[key]
                if int(value) == 22:
                    port = int(key.split("/")[0])
                    ports.append(port)

        if len(ports) > 0:
            return AgentSSH(ports=ports)

        return None

    def get_apps(self) -> list[AgentApp]:
        apps: list[AgentApp] = []

        addonListOutput = self.exec.exec("ha addons --raw-json")
        addonList: list[dict[str, str]] = json.loads(addonListOutput)["data"]["addons"]

        for addon in addonList:
            addonInfoOutput = self.exec.exec(
                f'ha addons info {addon["slug"]} --raw-json'
            )
            addonInfo = json.loads(addonInfoOutput)["data"]
            network: dict[str, str] | None = addonInfo["network"]
            if not network:
                continue

            ingressPort = addonInfo["ingress_port"]
            port = ingressPort
            if not ingressPort or (
                not ingressPort in network and not f"{ingressPort}/tcp" in network
            ):
                ingressPort = "80"
                port = network.get("80") or network.get("80/tcp")

            if not port:
                continue

            slugStr: str = addonInfo["name"].lower()
            slug = AgentApp.AgentAppSlug.UNKNOWN_APP

            match slugStr:
                case "zigbee2mqtt":
                    slug = AgentApp.AgentAppSlug.ZIGBEE2MQTT
                case "node-red":
                    slug = AgentApp.AgentAppSlug.NODE_RED
                case _:
                    pass

            web = [AgentWebItem(port=int(port), ssl=False)]
            apps.append(
                AgentApp(
                    slug=slug,
                    web=web,
                )
            )

        return apps
