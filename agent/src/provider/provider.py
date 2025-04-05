from abc import ABC, abstractmethod
from src.exec.exec import Exec
from typing import TypedDict

class ProviderWebItem(TypedDict):
    port: int
    ssl: bool

class ProviderSSHItem(TypedDict):
    ports: list[int]

class ProviderPayload(TypedDict):
    os: str
    lan: str
    web: list[ProviderWebItem]
    ssh: ProviderSSHItem | None
    apps: list[object]
    instances: list[object]

class Provider(ABC):
    def __init__(self, exec: 'Exec'):
        self.exec = exec
        
    def get_all(self) -> ProviderPayload:
        return {
            "os": self.get_os(),
            "lan": self.get_lan(),
            "web": self.get_web(),
            "ssh": self.get_ssh(),
            "apps": self.get_apps(),
            "instances": self.get_instances(),
        }

    @abstractmethod
    def get_os(self) -> str:
        pass

    @abstractmethod
    def get_lan(self) -> str:
        pass

    @abstractmethod
    def get_web(self) -> list[ProviderWebItem]:
        pass

    @abstractmethod
    def get_ssh(self) -> ProviderSSHItem | None:
        pass

    @abstractmethod
    def get_apps(self) -> list[object]:
        pass

    def get_instances(self) -> list[object]:
        return []
