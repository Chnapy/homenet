import { Box, Card, CardContent } from "@mui/material";
import React from "react";
import { useDevicesFullQuery } from "../../data/query/use-devices-full-query";
import { AppLine } from "../app/app-line";
import { AppContext } from "../app/provider/app-provider";
import { DeviceAccessLineList } from "../device/device-access-line-list";
import { OSLine } from "../os/os-line";
import { SizingContext } from "../sizing/provider/sizing-provider";
import { InstanceIcon } from "./instance-icon";
import { InstanceContext } from "./provider/instance-provider";

export const InstanceCard: React.FC = () => {
  const instance = InstanceContext.useValue();
  const fullSizing = SizingContext.useValue() === "full";

  const devicesFullQuery = useDevicesFullQuery();

  if (!devicesFullQuery.data) {
    return null;
  }

  const { appList } = devicesFullQuery.data;

  const apps = appList.filter((app) => app.parentId === instance.id);

  return (
    <Box data-instanceid={instance.id}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: 32,
            marginBottom: "-16px",
            zIndex: 1,
          }}
        >
          <InstanceIcon />
        </Box>

        <DeviceAccessLineList />
      </Box>

      <Card variant="outlined">
        <OSLine />

        <CardContent
          sx={{
            display: "flex",
            flexDirection: fullSizing ? "column" : undefined,
            flexWrap: "wrap",
            gap: 1,
            pb: "16px !important",
          }}
        >
          {apps?.map((app) => {
            return (
              <AppContext.Provider key={app.slug} value={app}>
                <AppLine />
              </AppContext.Provider>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
};
