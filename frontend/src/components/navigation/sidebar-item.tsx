import { ListItem, ListItemButton, ListItemIcon } from "@mui/material";
import React from "react";
import { AppOSIcon, AppOSIconProps } from "../ui/app-os-icon/app-icon";
import { useCurrentPage } from "./hooks/use-current-page";

type SidebarItemProps = {
  slug: AppOSIconProps["slug"];
  href: string;
  loaded: boolean;
};

export const SidebarItem: React.FC<SidebarItemProps> = ({
  slug,
  href,
  loaded,
}) => {
  const currentPage = useCurrentPage();
  const selected = currentPage === href;
  //   const anchorRef = React.useRef<HTMLDivElement>(null);
  //   const [open, setOpen] = React.useState(false);

  //   const handleOpen = () => setOpen(true);
  //   const handleClose = () => setOpen(false);

  // const handleMiddleClick = () => {
  //   window.open(href, "_blank");
  // };

  return (
    <ListItem disablePadding>
      <ListItemButton
        href={"#" + href}
        selected={selected}
        // onClick={handleClick}
        // onAuxClick={handleMiddleClick}
        title={href}
        sx={{
          opacity: loaded ? 1 : 0.5,
          borderLeft: "4px solid transparent",
          borderLeftColor:
            loaded && !selected ? "rgba(228, 223, 216, 0.16)" : undefined,
          paddingLeft: "12px",
        }}
      >
        <ListItemIcon sx={{ minWidth: 24, maxWidth: 24 }}>
          <AppOSIcon slug={slug} sx={{ maxWidth: "100%" }} />
        </ListItemIcon>
      </ListItemButton>

      {/* <Menu anchorEl={anchorRef.current} open={open} onClose={handleClose}>
        {web.map((value, i) => (
          <AccessLine
            key={i}
            {...value}
            link
            onClick={() => {
              handleClose();
              onClick(getAccessWebHref(value));
            }}
          />
        ))}
      </Menu> */}
    </ListItem>
  );
};
