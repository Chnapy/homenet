import { Server, ServerCredentials } from "@grpc/grpc-js";
import { AgentService } from "./generated/agent";
import { gRPCRouter } from "./grpc-router";

export const setupGRPCServer = () => {
  const gRPCServer = new Server();

  gRPCServer.addService(AgentService, gRPCRouter);

  gRPCServer.bindAsync(
    "0.0.0.0:50051",
    ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error(error);
      } else {
        console.log("gRPC server listening on port", port);
      }
    }
  );
};
