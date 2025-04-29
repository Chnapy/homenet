import { Box, Card, CardContent, Typography } from "@mui/material";
import React from "react";
import { useDevicesFullQuery } from "../../data/query/use-devices-full-query";
import { AppLine } from "../app/app-line";
import { AppContext } from "../app/provider/app-provider";
import { InstanceCard } from "../instance/instance-card";
import { InstanceContext } from "../instance/provider/instance-provider";
import { OSLine } from "../os/os-line";
import { DeviceAccessLineList } from "./device-access-line-list";
import { DeviceIcon } from "./device-icon";
import { DeviceDialogBtn } from "./dialog/device-dialog-btn";
import { DeviceContext } from "./provider/device-provider";

export const DeviceCard: React.FC = () => {
  const { device, deviceUserMeta } = DeviceContext.useValue();
  const devicesFullQuery = useDevicesFullQuery();

  if (!devicesFullQuery.data) {
    return null;
  }

  const { appList, instanceList } = devicesFullQuery.data;

  const apps = appList.filter((app) => app.parentId === device.id);
  const instances = instanceList.filter(
    (instance) => instance.parentId === device.id
  );

  return (
    <Box>
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
            fontSize: 72,
            marginBottom: "-24px",
          }}
        >
          <DeviceIcon />
        </Box>

        <DeviceAccessLineList />
      </Box>

      <Card variant="outlined">
        <Typography
          variant="h6"
          display="flex"
          justifyContent="space-between"
          sx={{ ml: "72px", px: 2, pl: 4 }}
        >
          {deviceUserMeta.name ?? device.id}
          <DeviceDialogBtn />
        </Typography>

        <OSLine />

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pb: "16px !important",
          }}
        >
          {apps.map((app) => {
            return (
              <AppContext.Provider key={app.slug} value={app}>
                <AppLine />
              </AppContext.Provider>
            );
          })}

          {instances.map((instance) => {
            return (
              <InstanceContext.Provider key={instance.id} value={instance}>
                <InstanceCard />
              </InstanceContext.Provider>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
};
