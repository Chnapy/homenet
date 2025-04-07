from abc import ABC, abstractmethod
from typing import Optional
from src.grpc.agent_pb2 import (
    AgentApp,
    AgentInstance,
    AgentOS,
    AgentSSH,
    AgentWebItem,
)
from src.exec.exec import Exec


class Provider(ABC):
    def __init__(self, exec: "Exec"):
        self.exec = exec

    def get_instance(self) -> AgentInstance:
        return AgentInstance(
            os=self.get_os(),
            lan=self.get_lan(),
            web=self.get_web(),
            ssh=self.get_ssh(),
            apps=self.get_apps(),
            instances=self.get_instances(),
        )

    @abstractmethod
    def get_os(self) -> AgentOS:
        pass

    @abstractmethod
    def get_lan(self) -> str:
        pass

    @abstractmethod
    def get_web(self) -> list[AgentWebItem]:
        pass

    @abstractmethod
    def get_ssh(self) -> Optional[AgentSSH]:
        pass

    @abstractmethod
    def get_apps(self) -> list[AgentApp]:
        pass

    def get_instances(self) -> list[AgentInstance]:
        return []
