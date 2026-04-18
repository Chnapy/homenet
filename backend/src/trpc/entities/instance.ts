import { AgentInstanceWithId } from "../../db/device";
import {
  AgentInstance_AgentInstanceType,
  AgentOS,
  agentInstance_AgentInstanceTypeToJSON,
  agentOSToJSON,
} from "../../grpc/generated/agent";
import { getOSMeta } from "./utils/get-os-meta";
import { Meta } from "./utils/meta";

export type Instance = Omit<
  AgentInstanceWithId,
  "os" | "type" | "apps" | "instances"
> & {
  os: keyof typeof AgentOS | string;
  type: keyof typeof AgentInstance_AgentInstanceType;
  meta: Meta;
};

export const getInstanceFromAgentInstance = (
  agentInstance: AgentInstanceWithId
): Instance => {
  const os = agentOSToJSON(agentInstance.os) as keyof typeof AgentOS;

  const instance: Instance & {
    apps?: unknown;
    instances?: unknown;
  } = {
    ...agentInstance,
    os,
    type: agentInstance_AgentInstanceTypeToJSON(
      agentInstance.type
    ) as keyof typeof AgentInstance_AgentInstanceType,
    meta: getOSMeta(os),
  };
  delete instance.apps;
  delete instance.instances;

  return instance;
};
