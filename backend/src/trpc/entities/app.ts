import { AgentAppWithId } from "../../db/device";
import {
  AgentApp_AgentAppSlug,
  AgentApp_AgentVpnMode,
  agentApp_AgentAppSlugToJSON,
  agentApp_AgentVpnModeToJSON,
} from "../../grpc/generated/agent";
import { getAppMeta } from "./utils/get-app-meta";
import { Meta } from "./utils/meta";

export type App = Omit<AgentAppWithId, "slug" | "vpnMode"> & {
  slug: keyof typeof AgentApp_AgentAppSlug;
  vpnMode: keyof typeof AgentApp_AgentVpnMode;
  meta: Meta;
};

export const getAppFromAgentApp = (agentApp: AgentAppWithId): App => {
  const appPartial: Omit<App, "meta"> = {
    ...agentApp,
    slug: agentApp_AgentAppSlugToJSON(
      agentApp.slug
    ) as keyof typeof AgentApp_AgentAppSlug,
    vpnMode: agentApp_AgentVpnModeToJSON(
      agentApp.vpnMode ?? AgentApp_AgentVpnMode.UNRECOGNIZED
    ) as keyof typeof AgentApp_AgentVpnMode,
  };

  return {
    ...appPartial,
    meta: getAppMeta(appPartial),
  };
};
