import { useDevicesFullQuery } from "../../../data/query/use-devices-full-query";
import { AgentMetadata } from "../../../data/types/get-devices";
import { DeviceContext } from "../provider/device-provider";
import { CronExpressionParser } from "cron-parser";

type AgentHealth = {
  state: "error" | "warning" | "healthy";
  description?: string;
};

export const useAgentHealth = (): AgentHealth => {
  const { device } = DeviceContext.useValue();

  const devicesFullQuery = useDevicesFullQuery();

  const agentMetadataList =
    devicesFullQuery.data?.agentMetadataList.filter(
      (metadata) => metadata.deviceId === device.id
    ) ?? [];

  const lastAgentMetadata = agentMetadataList[0] as AgentMetadata | undefined;

  if (!lastAgentMetadata) {
    return {
      state: "error",
      description: "No agent metadata",
    };
  }

  const { time, computeDuration, env } = lastAgentMetadata;

  const updateCron = env.UpdateCron as string | undefined;
  if (!updateCron) {
    return {
      state: "error",
      description: "Env UPDATE_CRON not defined",
    };
  }

  const interval = CronExpressionParser.parse(updateCron, {
    currentDate: new Date(time),
    tz: "Europe/Paris",
  });

  const nextUseTime = interval.next().getTime();
  const afterNextUseTime = interval.next().getTime();
  const diffTime = afterNextUseTime - nextUseTime;
  const expectedNextTime = time + diffTime;

  const todayTime = new Date().getTime();

  if (expectedNextTime < todayTime) {
    return {
      state: "error",
      description: "Cron unexpectedly did not run agent",
    };
  }

  if (computeDuration > 45000) {
    return {
      state: "warning",
      description: "High compute duration",
    };
  }

  return {
    state: "healthy",
  };
};
