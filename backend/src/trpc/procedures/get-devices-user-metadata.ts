import { openRootDB } from "../../db/db";
import {
  DeviceUserMetadata,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { publicProcedure } from "../trpc";

export const getDevicesUserMetadata = publicProcedure.query(
  async (): Promise<Record<string, DeviceUserMetadata>> => {
    const db = openRootDB();

    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    const deviceUserMetadataList = await deviceUserMetadataDB
      .getMany(deviceUserMetadataDB.getKeys().asArray)
      .then((metadata) => metadata.filter((value) => value !== undefined));

    return Object.fromEntries(
      deviceUserMetadataList.map((data) => [ data!.deviceId, data! ])
    );
  }
);
