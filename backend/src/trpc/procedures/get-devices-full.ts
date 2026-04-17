import { openAgentMetadataDB } from "../../db/agent-metadata";
import { openRootDB } from "../../db/db";
import { openDeviceDB } from "../../db/device";
import {
  AgentMetadataFull,
  getAgentMetadataFullFromAgentMetadata,
} from "../entities/agent-metadata";
import { App, getAppFromAgentApp } from "../entities/app";
import { getInstanceFromAgentInstance, Instance } from "../entities/instance";
import { publicProcedure } from "../trpc";
import { getNetEntityMap, NetEntityMap } from "../utils/get-net-entity-map";

export type GetDeviceFull = {
  deviceList: Instance[];
  instanceList: Instance[];
  appList: App[];
  agentMetadataList: AgentMetadataFull[];
  netEntityMap: NetEntityMap;
};

export const getDevicesFullData = async (): Promise<
  Omit<GetDeviceFull, "agentMetadataList">
> => {
  const db = openRootDB();

  const deviceDB = openDeviceDB(db);

  const agentDeviceList = await deviceDB
    .getMany(deviceDB.getKeys().asArray)
    .then((instances) => instances.filter((value) => value !== undefined));

  const deviceList = agentDeviceList.map(getInstanceFromAgentInstance);

  const instanceList = agentDeviceList
    .flatMap((agentDevice) => agentDevice.instances)
    .map(getInstanceFromAgentInstance);

  const appList = agentDeviceList
    .flatMap((agentDevice) => [ agentDevice, ...agentDevice.instances ])
    .flatMap((agentInstance) => agentInstance.apps)
    .map(getAppFromAgentApp);

  const netEntityMap = getNetEntityMap(deviceList, instanceList, appList);

  const duplicatedIds = checkIDDuplicates([
    ...deviceList,
    ...instanceList,
    ...appList,
  ]);
  const duplicatedLans = checkLanDuplicates([ ...deviceList, ...instanceList ]);

  if (duplicatedIds.length > 0) {
    console.error("trpc: getDevicesFull - duplicated IDs", duplicatedIds);
  }

  if (duplicatedLans.length > 0) {
    console.error("trpc: getDevicesFull - duplicated Lans", duplicatedLans);
  }

  return {
    deviceList,
    instanceList,
    appList,
    netEntityMap,
  };
};

export const getDevicesFull = publicProcedure.query(
  async (): Promise<GetDeviceFull> => {
    const db = openRootDB();

    const agentMetadataDB = openAgentMetadataDB(db);

    const [ agentMetadataList, devicesFull ] = await Promise.all([
      agentMetadataDB
        .getRange({ reverse: true })
        .asArray.map(({ key, value }) =>
          getAgentMetadataFullFromAgentMetadata(key, value)
        ),
      getDevicesFullData(),
    ]);

    return {
      agentMetadataList,
      ...devicesFull,
    };
  }
);

const checkIDDuplicates = (list: { id: string }[]) => {
  const duplicatedItems = list
    .filter((item) => {
      return list.some((item2) => {
        if (item === item2) {
          return false;
        }

        return item.id === item2.id;
      });
    })
    .map((item) => item.id);

  return [ ...new Set(duplicatedItems) ];
};

const checkLanDuplicates = (list: { lan: string }[]) => {
  const duplicatedItems = list
    .filter((item) => {
      return list.some((item2) => {
        if (item === item2) {
          return false;
        }

        return item.lan === item2.lan;
      });
    })
    .map((item) => item.lan);

  return [ ...new Set(duplicatedItems) ];
};
