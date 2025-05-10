import { Box } from "@mui/material";
import React from "react";
import { AccessLine } from "../ui/access-line";
import { useNetEntityMap } from "../network/hooks/use-net-entity-map";
import { DeviceContext } from "./provider/device-provider";
import { InstanceContext } from "../instance/provider/instance-provider";

export const DeviceAccessLineList: React.FC = () => {
  const { device } = DeviceContext.useValue();
  const instance = InstanceContext.useValueNullable();

  const entity = instance ?? device;

  const netEntityMap = useNetEntityMap();

  if (netEntityMap.isLoading) {
    return "loading";
  }

  if (!netEntityMap.data) {
    return null;
  }

  const netEntity = netEntityMap.data[entity.id];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {netEntity.addressList.map(({ type, scope, address }, i) => (
        <AccessLine
          key={i}
          type={type}
          scope={scope}
          href={address}
          disablePadding
        />
      ))}
    </Box>
  );
};
