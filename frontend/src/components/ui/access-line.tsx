import CloudIcon from "@mui/icons-material/Cloud";
import LanIcon from "@mui/icons-material/Lan";
import LinkIcon from "@mui/icons-material/Link";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import TerminalIcon from "@mui/icons-material/Terminal";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { UptimeMap } from "../../data/query/use-listen-uptime";
import { NetAccess, NetAccessAddressOnly } from "../../data/types/get-devices";
import { BadgeUptime } from "./badge-uptime";

type AccessLineProps = {
  type: NetAccess["type"] | NetAccessAddressOnly["type"];
  scope: NetAccess["scope"];
  href: string;
  link?: boolean;
  disablePadding?: boolean;
  uptime?: UptimeMap[string];
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
  href,
  link,
  disablePadding,
  uptime,
}) => {
  const Icon =
    type === "ssh"
      ? TerminalIcon
      : type === "grpc"
      ? SettingsEthernetIcon
      : iconMap[scope];

  const content = (
    <>
      <ListItemIcon sx={{ minWidth: 0 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={href}
        slotProps={{
          primary: {
            variant: "caption",
          },
        }}
      />
      <ListItemIcon sx={{ minWidth: 0, mb: "2px" }}>
        <BadgeUptime uptime={uptime} />
      </ListItemIcon>
    </>
  );

  if (link) {
    return (
      <ListItemButton
        onClick={() => {
          if (type === "web") {
            window.open(href, "_blank");
          }
        }}
        disableGutters={disablePadding}
        sx={{ gap: 1 }}
      >
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
