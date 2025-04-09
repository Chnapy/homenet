import { AgentAppWithId } from "../../db/device";
import {
  AgentApp_AgentAppSlug,
  AgentApp_AgentVpnMode,
  agentApp_AgentAppSlugToJSON,
  agentApp_AgentVpnModeToJSON,
} from "../../grpc/generated/agent";

export type App = Omit<AgentAppWithId, "slug" | "vpnMode"> & {
  slug: keyof typeof AgentApp_AgentAppSlug;
  vpnMode: keyof typeof AgentApp_AgentVpnMode;
};

export const getAppFromAgentApp = (agentApp: AgentAppWithId): App => {
  return {
    ...agentApp,
    slug: agentApp_AgentAppSlugToJSON(
      agentApp.slug
    ) as keyof typeof AgentApp_AgentAppSlug,
    vpnMode: agentApp_AgentVpnModeToJSON(
      agentApp.vpnMode ?? AgentApp_AgentVpnMode.UNRECOGNIZED
    ) as keyof typeof AgentApp_AgentVpnMode,
  };
};
