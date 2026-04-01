import { openRootDB } from "../../db/db";
import {
  DeviceUserMetadata,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { anonymizeIfNeeded } from '../public-safe-mode';
import { publicProcedure } from "../trpc";

export const getDevicesUserMetadata = publicProcedure.query(
  async (): Promise<Record<string, DeviceUserMetadata>> => {
    const db = openRootDB();

    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    const deviceUserMetadataList = await deviceUserMetadataDB
      .getMany(deviceUserMetadataDB.getKeys().asArray)
      .then((metadata) => metadata.filter((value) => value !== undefined));

    const deviceUserMetaMap = Object.fromEntries(
      deviceUserMetadataList.map((data) => [data!.deviceId, data!])
    );

    return anonymizeIfNeeded(deviceUserMetaMap);
  }
);
