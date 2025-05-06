import CloudIcon from "@mui/icons-material/Cloud";
import LanIcon from "@mui/icons-material/Lan";
import LinkIcon from "@mui/icons-material/Link";
import TerminalIcon from "@mui/icons-material/Terminal";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
  Badge,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { UptimeMap } from "../../data/query/use-listen-uptime";
import { NetAccess } from "../../data/types/get-devices";

type AccessLineProps = Pick<NetAccess, "type" | "scope" | "href"> & {
  link?: boolean;
  onClick?: () => void;
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
  onClick,
  disablePadding,
  uptime,
}) => {
  const Icon = type === "ssh" ? TerminalIcon : iconMap[scope];

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
      <ListItemIcon sx={{ minWidth: 0, mb: "1px" }}>
        <Badge
          variant="dot"
          color={uptime === "on" ? "success" : "error"}
          invisible={!uptime}
        />
      </ListItemIcon>
    </>
  );

  if (link) {
    return (
      <ListItemButton
        onClick={onClick}
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
