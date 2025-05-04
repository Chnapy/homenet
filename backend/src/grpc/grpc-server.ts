import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ReflectionService } from "@grpc/reflection";
import path from "node:path";
import { AgentService } from "./generated/agent";
import { gRPCRouter } from "./grpc-router";

export const setupGRPCServer = () => {
  const gRPCServer = new grpc.Server();

  const protoPath = path.resolve("./protos/agent.proto");
  const packageDefinition = protoLoader.loadSync(protoPath);
  const reflection = new ReflectionService(packageDefinition);
  reflection.addToServer(gRPCServer);

  gRPCServer.addService(AgentService, gRPCRouter);

  gRPCServer.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("gRPC server error:", error);
      } else {
        console.log("gRPC server listening on port", port);
      }
    }
  );
};
