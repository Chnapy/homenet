import { Server } from "@grpc/grpc-js";
import * as grpcHealthcheck from "grpc-health-check";
import { readFileSync } from "node:fs";

const grpcHealthcheckServiceName = "";

export const grpcHealthcheckData = {
  protobuf: readFileSync(grpcHealthcheck.protoPath, "utf8"),
  service: "Health",
  method: "check",
  tls: false,
  expectedRequestBody: JSON.stringify({ service: grpcHealthcheckServiceName }),
  expectedResponseValue: "SERVING" satisfies grpcHealthcheck.ServingStatus,
};

export const setupGrpcHealthcheck = (gRPCServer: Server) => {
  const healthImpl = new grpcHealthcheck.HealthImplementation({
    [grpcHealthcheckServiceName]: "NOT_SERVING",
  });
  healthImpl.addToServer(gRPCServer);

  return {
    enableServing: () =>
      healthImpl.setStatus(grpcHealthcheckServiceName, "SERVING"),
  };
};
