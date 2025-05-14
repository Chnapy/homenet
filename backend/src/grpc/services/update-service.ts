import { handleUnaryCall } from "@grpc/grpc-js";
import { openAgentMetadataDB } from "../../db/agent-metadata";
import { openRootDB } from "../../db/db";
import { getDeviceWithId, openDeviceDB } from "../../db/device";
import {
  DeviceUserMetadata,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { uptimeRoutine } from "../../uptime/uptime";
import { AgentUpdateRequest, AgentUpdateResponse } from "../generated/agent";

export const updateService: handleUnaryCall<
  AgentUpdateRequest,
  AgentUpdateResponse
> = async (call, callback) => {
  try {
    console.log("grpc: AgentUpdateRequest received", call.request);

    const { device, agentMetadata } = call.request;

    if (!device || !agentMetadata) {
      throw new Error("grpc: device not defined");
    }

    const now = Date.now();

    const deviceId = device.lan; //call.getPeer().split(":")[0];

    const cleanDevice = getDeviceWithId(device, deviceId);

    const db = openRootDB();

    const deviceDB = openDeviceDB(db);
    const agentMetadataDB = openAgentMetadataDB(db);
    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    const userMetadata = deviceUserMetadataDB.get(deviceId);

    const agentMetadataId = `${deviceId}:${now}`;

    const userMetadataDefaultValues: DeviceUserMetadata = {
      deviceId,
      theme: "default",
    };

    db.transactionSync(() => {
      deviceDB.putSync(deviceId, cleanDevice);

      agentMetadataDB.putSync(agentMetadataId, agentMetadata);

      if (!userMetadata) {
        deviceUserMetadataDB.putSync(deviceId, userMetadataDefaultValues);
      }
    });

    console.log("grpc: stored in deviceDB", deviceId, cleanDevice);
    console.log(
      "grpc: stored in agentMetadataDB",
      agentMetadataId,
      agentMetadata
    );
    if (!userMetadata) {
      console.log(
        "grpc: stored in deviceUserMetadataDB",
        deviceId,
        userMetadataDefaultValues
      );
    }

    callback(null, {
      message: "OK - everything's fine",
    });

    await uptimeRoutine.setup().catch((err) => {
      console.error("grpc: update-service - uptimeRoutine setup error", err);
    });
  } catch (err) {
    console.error("grpc: AgentUpdateRequest error", err);

    const error = err instanceof Error ? err : new Error(String(err));

    callback(error, {
      message: "KO - error happened",
    });
  }
};
