import HelpIcon from "@mui/icons-material/Help";
import { Box, BoxProps } from "@mui/material";
import React, { BaseSyntheticEvent } from "react";
import { DeviceAppSlug, DeviceOSSlug } from "../../../data/types/get-devices";
import { getDashboardIconAny } from "./utils/get-dashboard-icon";

export type AppOSIconProps = {
  slug: DeviceAppSlug | DeviceOSSlug;
  metaIcon?: string;
} & BoxProps;

export const AppOSIcon: React.FC<AppOSIconProps> = ({
  slug,
  metaIcon,
  ...boxProps
}) => {
  const icons = getDashboardIconAny(metaIcon ?? slug);

  if (!icons[0]) {
    return <Box component={HelpIcon} {...boxProps} />;
  }

  return (
    <Box
      component="img"
      src={icons[0]}
      onError={
        icons[1] &&
        ((
          ev: BaseSyntheticEvent<unknown, HTMLImageElement, HTMLImageElement>,
        ) => {
          if (ev.target.dataset["error"]) return;
          ev.target.src = icons[1];
          ev.target.dataset["error"] = "true";
        })
      }
      {...boxProps}
    />
  );
};
