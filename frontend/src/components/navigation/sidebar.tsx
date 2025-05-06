import { Divider, Drawer, List } from "@mui/material";
import React from "react";
import { useDevicesFullQuery } from "../../data/query/use-devices-full-query";
import { DeviceAppSlug } from "../../data/types/get-devices";
import { SidebarItem } from "./sidebar-item";
import { SidebarItemHome } from "./sidebar-item-home";
import { getPageOrigin } from "./utils/get-page-origin";

type SidebarProps = {
  pageList: string[];
};

export const Sidebar: React.FC<SidebarProps> = ({ pageList }) => {
  const devicesFullQuery = useDevicesFullQuery();

  const allInstances = [
    ...(devicesFullQuery.data?.deviceList ?? []),
    ...(devicesFullQuery.data?.instanceList ?? []),
  ];

  const netEntityMap = devicesFullQuery.data?.netEntityMap;

  return (
    <Drawer variant="permanent" anchor="left" sx={{ width: 56 }}>
      <List>
        <SidebarItemHome />

        <Divider variant="middle" />

        {netEntityMap &&
          Object.entries(netEntityMap).map(([instanceId, netEntity]) => {
            const getOSItem = () => {
              const osWeb = netEntity.os.filter((web) => web.type === "web");

              const osSlug = allInstances.find(
                (instance) => instance.id === instanceId
              )?.os;

              if (osWeb.length === 0 || !osSlug) {
                return null;
              }

              const osHref = osWeb[0].href;

              if (osHref === getPageOrigin()) {
                return null;
              }

              return (
                <SidebarItem
                  slug={osSlug}
                  href={osHref}
                  loaded={pageList.includes(osHref)}
                />
              );
            };

            const appsItems = Object.entries(netEntity.apps).map(
              ([slug, appWeb]) => {
                const web = appWeb.filter((web) => web.type === "web");

                if (web.length === 0) {
                  return null;
                }

                const appHref = web[0].href;

                if (appHref === getPageOrigin()) {
                  return null;
                }

                return (
                  <SidebarItem
                    key={slug}
                    slug={slug as DeviceAppSlug}
                    href={appHref}
                    loaded={pageList.includes(appHref)}
                  />
                );
              }
            );

            return (
              <React.Fragment key={instanceId}>
                {getOSItem()}
                {appsItems}
              </React.Fragment>
            );
          })}
      </List>
    </Drawer>
  );
};
