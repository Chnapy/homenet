import { openRootDB } from "../../db/db";
import { openDeviceDB } from "../../db/device";
import {
  DeviceUserMetadata,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { App, getAppFromAgentApp } from "../entities/app";
import { getInstanceFromAgentInstance, Instance } from "../entities/instance";
import { publicProcedure } from "../trpc";
import { getNetEntityMap, NetEntityMap } from "../utils/get-net-entity-map";

export const getDevicesFull = publicProcedure.query(
  async (): Promise<{
    deviceUserMetaMap: Record<string, DeviceUserMetadata>;
    deviceList: Instance[];
    instanceList: Instance[];
    appList: App[];
    netEntityMap: NetEntityMap;
  }> => {
    const db = openRootDB();

    const deviceDB = openDeviceDB(db);
    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    const [agentDeviceList, deviceUserMetadataList] = await Promise.all([
      deviceDB
        .getMany(deviceDB.getKeys().asArray)
        .then((instances) => instances.filter((value) => value !== undefined)),
      deviceUserMetadataDB
        .getMany(deviceUserMetadataDB.getKeys().asArray)
        .then((metadata) => metadata.filter((value) => value !== undefined)),
    ]);

    const deviceUserMetaMap = Object.fromEntries(
      deviceUserMetadataList.map((data) => [data!.deviceId, data!])
    );

    const deviceList = agentDeviceList.map(getInstanceFromAgentInstance);

    const instanceList = agentDeviceList
      .flatMap((agentDevice) => agentDevice.instances)
      .map(getInstanceFromAgentInstance);

    const appList = agentDeviceList
      .flatMap((agentDevice) => [agentDevice, ...agentDevice.instances])
      .flatMap((agentInstance) => agentInstance.apps)
      .map(getAppFromAgentApp);

    const netEntityMap = getNetEntityMap(deviceList, instanceList, appList);

    const duplicatedIds = checkIDDuplicates([
      ...deviceList,
      ...instanceList,
      ...appList,
    ]);
    const duplicatedLans = checkLanDuplicates([...deviceList, ...instanceList]);

    if (duplicatedIds.length > 0) {
      console.error("Duplicated IDs", duplicatedIds);
    }

    if (duplicatedLans.length > 0) {
      console.error("Duplicated Lans", duplicatedLans);
    }

    return {
      deviceUserMetaMap,
      deviceList,
      instanceList,
      appList,
      netEntityMap,
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

  return [...new Set(duplicatedItems)];
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

  return [...new Set(duplicatedItems)];
};
