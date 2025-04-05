import json
import yaml
from src.provider.debian import Debian
from src.provider.provider import Provider, ProviderSSHItem, ProviderWebItem


class HAOS(Provider):
    def get_os(self):
        return "haos"

    def get_lan(self):
        return Debian(self.exec).get_lan()

    def get_web(self) -> list[ProviderWebItem]:
        webList: list[ProviderWebItem] = []

        haInfo = self.exec.exec("ha core info")
        properties = yaml.safe_load(haInfo)

        if properties["port"]:
            webList.append(
                ProviderWebItem(
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
                ProviderWebItem(
                    port=int(observerPort),
                    ssl=False,
                )
            )

        return webList

    def get_ssh(self):
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
            return ProviderSSHItem(ports=ports)

        return None

    def get_apps(self) -> list[object]:
        apps: list[object] = []

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

            web: list[ProviderWebItem] = [ProviderWebItem(port=int(port), ssl=False)]
            apps.append(
                {
                    "slug": addonInfo["name"].lower(),
                    "web": web,
                }
            )

        return apps
