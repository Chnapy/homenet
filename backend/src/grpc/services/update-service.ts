import { handleUnaryCall } from "@grpc/grpc-js";
import { openAgentMetadataDB } from "../../db/agent-metadata";
import { openRootDB } from "../../db/db";
import { getDeviceWithId, openDeviceDB } from "../../db/device";
import { AgentUpdateRequest, AgentUpdateResponse } from "../generated/agent";
import { openDeviceUserMetadataDB } from "../../db/device-user-metadata";

export const updateService: handleUnaryCall<
  AgentUpdateRequest,
  AgentUpdateResponse
> = async (call, callback) => {
  const { device, agentMetadata } = call.request;

  if (!device || !agentMetadata) {
    throw new Error("Device not defined");
  }

  const now = Date.now();

  const deviceId = call.getPeer().split(":")[0];

  const cleanDevice = getDeviceWithId(device, deviceId);

  const db = openRootDB();

  const deviceDB = openDeviceDB(db);
  const agentMetadataDB = openAgentMetadataDB(db);
  const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

  await db.transaction(() => {
    deviceDB.put(deviceId, cleanDevice);

    agentMetadataDB.put(`${deviceId}:${now}`, agentMetadata);

    const userMetadata = deviceUserMetadataDB.get(deviceId);
    if (!userMetadata) {
      deviceUserMetadataDB.put(deviceId, {
        deviceId,
        theme: "default",
      });
    }
  });

  callback(null, {
    foo: "bar",
  });

  console.log(deviceDB.getKeys().asArray, deviceDB.get(deviceId));
};
