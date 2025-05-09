import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ReflectionService } from "@grpc/reflection";
import * as grpcHealthcheck from "grpc-health-check";
import path from "node:path";
import { AgentService } from "./generated/agent";
import { setupGrpcHealthcheck } from "./grpc-healthcheck";
import { gRPCRouter } from "./grpc-router";

export const setupGRPCServer = () => {
  const port = process.env.HOMENET_GRPC_PORT;
  if (!port) {
    throw new Error("required env HOMENET_GRPC_PORT not defined");
  }

  const gRPCServer = new grpc.Server();

  const packageDefinition = protoLoader.loadSync([
    path.resolve("./protos/agent.proto"),
    grpcHealthcheck.protoPath,
  ]);
  const reflection = new ReflectionService(packageDefinition);
  reflection.addToServer(gRPCServer);

  const healthcheck = setupGrpcHealthcheck(gRPCServer);

  gRPCServer.addService(AgentService, gRPCRouter);

  gRPCServer.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("grpc: server error", error);
      } else {
        healthcheck.enableServing();

        console.log("grpc: server listening on port", port);
      }
    }
  );
};
