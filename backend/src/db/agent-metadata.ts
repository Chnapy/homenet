import { AgentMetadata } from "../grpc/generated/agent";
import { prepareDBToOpen } from "./db";

export const openAgentMetadataDB =
  prepareDBToOpen<AgentMetadata>("agent-metadata");
