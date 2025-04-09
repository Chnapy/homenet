import {
  AgentApp,
  AgentApp_AgentAppSlug,
  agentApp_AgentAppSlugToJSON,
  AgentInstance,
} from "../grpc/generated/agent";
import { prepareDBToOpen } from "./db";

export type AgentInstanceWithId = Omit<AgentInstance, "apps" | "instances"> & {
  id: string;
  parentId?: string;
  apps: AgentAppWithId[];
  instances: AgentInstanceWithId[];
};

export type AgentAppWithId = AgentApp & {
  parentId: string;
  id: string;
};

export const createInstanceId = (deviceId: string, index: number) =>
  `${deviceId}.instance[${index}]`;

export const createAppId = (parentId: string, appSlug: AgentApp_AgentAppSlug) =>
  `${parentId}.app=${agentApp_AgentAppSlugToJSON(appSlug)}`;

export const getDeviceWithId = (
  instance: AgentInstance,
  deviceId: string
): AgentInstanceWithId => {
  return {
    id: deviceId,
    ...instance,
    apps: instance.apps.map((app) => getAppWithId(app, deviceId)),
    instances: instance.instances.map((instance, i) =>
      getInstanceWithId(instance, deviceId, i)
    ),
  };
};

export const getInstanceWithId = (
  instance: AgentInstance,
  deviceId: string,
  index: number
): AgentInstanceWithId => {
  const id = createInstanceId(deviceId, index);

  return {
    id,
    parentId: deviceId,
    ...instance,
    apps: instance.apps.map((app) => getAppWithId(app, id)),
    instances: instance.instances.map((instance, i) =>
      getInstanceWithId(instance, id, i)
    ),
  };
};

export const getAppWithId = (
  app: AgentApp,
  parentId: string
): AgentAppWithId => ({
  id: createAppId(parentId, app.slug),
  parentId,
  ...app,
});

export const openDeviceDB = prepareDBToOpen<AgentInstanceWithId>("device");
