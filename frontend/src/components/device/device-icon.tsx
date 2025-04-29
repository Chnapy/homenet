import CloudIcon from "@mui/icons-material/Cloud";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import DnsIcon from "@mui/icons-material/Dns";
import RouterIcon from "@mui/icons-material/Router";
import TvIcon from "@mui/icons-material/Tv";
import HelpIcon from "@mui/icons-material/Help";
import React from "react";
import { DeviceUserMetaType } from "../../data/types/get-devices-user-meta";
import { DeviceContext } from "./provider/device-provider";

const iconMap: Record<NonNullable<DeviceUserMetaType>, typeof RouterIcon> = {
  server: DnsIcon,
  router: RouterIcon,
  mediacenter: TvIcon,
  desktop: DesktopWindowsOutlinedIcon,
  cloud: CloudIcon,
};

export const DeviceIcon: React.FC = () => {
  const { deviceUserMeta } = DeviceContext.useValue();

  const Icon = deviceUserMeta.type ? iconMap[deviceUserMeta.type] : HelpIcon;

  return <Icon fontSize="inherit" />;
};
