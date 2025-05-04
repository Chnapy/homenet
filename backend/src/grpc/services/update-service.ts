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
  try {
    console.log("AgentUpdateRequest received:", call.request);

    const { device, agentMetadata } = call.request;

    if (!device || !agentMetadata) {
      throw new Error("Device not defined");
    }

    const now = Date.now();

    const deviceId = device.lan; //call.getPeer().split(":")[0];

    const cleanDevice = getDeviceWithId(device, deviceId);

    const db = openRootDB();

    const deviceDB = openDeviceDB(db);
    const agentMetadataDB = openAgentMetadataDB(db);
    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    const userMetadata = deviceUserMetadataDB.get(deviceId);

    db.transactionSync(() => {
      deviceDB.putSync(deviceId, cleanDevice);

      agentMetadataDB.putSync(`${deviceId}:${now}`, agentMetadata);

      if (!userMetadata) {
        deviceUserMetadataDB.putSync(deviceId, {
          deviceId,
          theme: "default",
        });
      }
    });

    callback(null, {
      foo: "bar",
    });

    console.log(deviceDB.getKeys().asArray, deviceDB.get(deviceId));
  } catch (err) {
    console.error(err);

    const error = err instanceof Error ? err : new Error(String(err));

    callback(error, {
      foo: "bar",
    });
  }
};
