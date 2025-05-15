import { grpcHealthcheckData } from "../../../grpc/grpc-healthcheck";
import { Monitor } from "../../uptime-kuma-io-types";
import { NetList } from "./get-net-list";

type NetMonitorFns = {
  matchMonitor: (monitor: Monitor) => boolean;
  getMonitorProps: () => Partial<Monitor>;
};

export const getNetMonitorFns = (net: NetList[number]): NetMonitorFns => {
  const getNamePart = () => {
    switch (net.scope) {
      case "dns-domain":
        return "";
      case "lan":
        return "by lan";
      case "vpn":
        return "by vpn";
      case "wan":
        return "by wan";
    }
  };

  switch (net.type) {
    case "web": {
      const webRequiredFields: Partial<Monitor> = {
        type: "http",
        url: net.href,
      };

      return {
        matchMonitor: (monitor) =>
          Object.entries(webRequiredFields).every(
            ([key, value]) => monitor[key as keyof Monitor] === value
          ),
        getMonitorProps: () => ({
          name: [net.name, getNamePart()].filter(Boolean).join(" "),
          method: "GET",
          expiryNotification: net.href.startsWith("https://"),
          ignoreTls: net.href.startsWith("https://"),
          ...webRequiredFields,
        }),
      };
    }

    case "ssh": {
      const sshRequiredFields: Partial<Monitor> = {
        type: "port",
        hostname: net.address,
        port: net.port,
      };

      return {
        matchMonitor: (monitor) =>
          Object.entries(sshRequiredFields).every(
            ([key, value]) => monitor[key as keyof Monitor] === value
          ),
        getMonitorProps: () => ({
          name: [net.name, "SSH", getNamePart()].filter(Boolean).join(" "),
          method: "GET",
          ...sshRequiredFields,
        }),
      };
    }

    case "grpc": {
      const grpcRequiredFields: Partial<Monitor> = {
        type: "grpc-keyword",
        grpcUrl: net.href,
        grpcServiceName: grpcHealthcheckData.service,
        grpcMethod: grpcHealthcheckData.method,
      };

      return {
        matchMonitor: (monitor) =>
          Object.entries(grpcRequiredFields).every(
            ([key, value]) => monitor[key as keyof Monitor] === value
          ),
        getMonitorProps: () => ({
          name: [net.name, "gRPC", getNamePart()].filter(Boolean).join(" "),
          grpcProtobuf: grpcHealthcheckData.protobuf,
          grpcEnableTls: grpcHealthcheckData.tls,
          grpcBody: grpcHealthcheckData.expectedRequestBody,
          keyword: `"${grpcHealthcheckData.expectedResponseValue}"`,
          ...grpcRequiredFields,
        }),
      };
    }
  }
};
