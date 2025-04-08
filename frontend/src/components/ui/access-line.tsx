import CloudIcon from "@mui/icons-material/Cloud";
import LanIcon from "@mui/icons-material/Lan";
import LinkIcon from "@mui/icons-material/Link";
import TerminalIcon from "@mui/icons-material/Terminal";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { getAccessWebHref } from "./utils/get-web-href";
import { NetAccess } from "../../data/types/get-devices";

type AccessLineProps = NetAccess & {
  link?: boolean;
  disablePadding?: boolean;
};

const iconMap: Record<NetAccess["scope"], typeof CloudIcon> = {
  lan: LanIcon,
  wan: CloudIcon,
  "dns-domain": LinkIcon,
  vpn: VpnKeyIcon,
};

export const AccessLine: React.FC<AccessLineProps> = ({
  type,
  scope,
  address,
  port,
  ssl,
  link,
  disablePadding,
}) => {
  const Icon = type === "ssh" ? TerminalIcon : iconMap[scope];

  const value =
    type === "ssh"
      ? `ssh ${address}${port && port !== 22 ? " -p " + port : ""}`
      : getAccessWebHref({ address, port, ssl });

  const content = (
    <>
      <ListItemIcon sx={{ minWidth: 0 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={value}
        slotProps={{
          primary: {
            variant: "caption",
          },
        }}
      />
    </>
  );

  if (link) {
    return (
      <ListItemButton disableGutters={disablePadding} sx={{ gap: 1 }}>
        {content}
      </ListItemButton>
    );
  }

  return (
    <ListItem disablePadding={disablePadding} sx={{ gap: 1 }}>
      {content}
    </ListItem>
  );
};
