import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ReflectionService } from "@grpc/reflection";
import { AgentService } from "./generated/agent";
import { gRPCRouter } from "./grpc-router";

export const setupGRPCServer = () => {
  const gRPCServer = new grpc.Server();

  const packageDefinition = protoLoader.loadSync("./protos/agent.proto");
  const reflection = new ReflectionService(packageDefinition);

  reflection.addToServer(gRPCServer);

  gRPCServer.addService(AgentService, gRPCRouter);

  gRPCServer.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error(error);
      } else {
        console.log("gRPC server listening on port", port);
      }
    }
  );
};
