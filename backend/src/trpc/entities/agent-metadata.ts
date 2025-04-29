import { AgentMetadata } from "../../grpc/generated/agent";

export type AgentMetadataFull = AgentMetadata & {
  id: string;
  deviceId: string;
  time: number;
};

export const getAgentMetadataFullFromAgentMetadata = (
  key: string,
  agentMetadata: AgentMetadata
) => {
  return {
    id: key,
    deviceId: key.split(":")[0],
    time: +key.split(":")[1],
    ...agentMetadata,
  };
};
