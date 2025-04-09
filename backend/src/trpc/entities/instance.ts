import { AgentInstanceWithId } from "../../db/device";
import {
  AgentInstance_AgentInstanceType,
  AgentOS,
  agentInstance_AgentInstanceTypeToJSON,
  agentOSToJSON,
} from "../../grpc/generated/agent";

export type Instance = Omit<
  AgentInstanceWithId,
  "os" | "type" | "apps" | "instances"
> & {
  os: keyof typeof AgentOS;
  type: keyof typeof AgentInstance_AgentInstanceType;
};

export const getInstanceFromAgentInstance = (
  agentInstance: AgentInstanceWithId
): Instance => {
  const instance: Instance & {
    apps?: unknown;
    instances?: unknown;
  } = {
    ...agentInstance,
    os: agentOSToJSON(agentInstance.os) as keyof typeof AgentOS,
    type: agentInstance_AgentInstanceTypeToJSON(
      agentInstance.type
    ) as keyof typeof AgentInstance_AgentInstanceType,
  };
  delete instance.apps;
  delete instance.instances;

  return instance;
};
