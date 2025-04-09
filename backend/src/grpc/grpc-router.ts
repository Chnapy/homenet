import { updateService } from "./services/update-service";
import { AgentServer } from "./generated/agent";

export const gRPCRouter: AgentServer = {
  update: updateService,
};
