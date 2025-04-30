import { ListItem, ListItemButton, ListItemIcon } from "@mui/material";
import React from "react";
import { useCurrentPage } from "./hooks/use-current-page";

export const SidebarItemHome: React.FC = () => {
  const selected = !useCurrentPage();

  return (
    <ListItem disablePadding>
      <ListItemButton href="#" selected={selected}>
        <ListItemIcon sx={{ minWidth: 24, maxWidth: 24 }}>HN</ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
};
