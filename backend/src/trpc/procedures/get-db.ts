import { openAgentMetadataDB } from "../../db/agent-metadata";
import { openRootDB } from "../../db/db";
import { openDeviceDB } from "../../db/device";
import { openDeviceUserMetadataDB } from "../../db/device-user-metadata";
import { publicProcedure } from "../trpc";

export const getDB = publicProcedure.query(
  async (): Promise<
    Record<
      "device" | "deviceUserMetadata" | "agentMetadata",
      {
        key: unknown;
        value: unknown;
        version?: number;
      }[]
    >
  > => {
    // if (process.env.NODE_ENV != "development") {
    //   throw new Error("Route allowed in development only");
    // }

    const db = openRootDB();

    const device = openDeviceDB(db).getRange().asArray;
    const deviceUserMetadata = openDeviceUserMetadataDB(db).getRange().asArray;
    const agentMetadata = openAgentMetadataDB(db).getRange().asArray;

    return {
      device,
      deviceUserMetadata,
      agentMetadata,
    };
  }
);
