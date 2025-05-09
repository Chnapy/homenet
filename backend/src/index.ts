import { setupGRPCServer } from "./grpc/grpc-server";
import { setupTRPCServer } from "./trpc/trpc-server";
import { uptimeRoutine } from "./uptime/uptime";

setupGRPCServer();
setupTRPCServer();

uptimeRoutine.setup();
