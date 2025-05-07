import React from "react";
import { DeviceContext } from "../device/provider/device-provider";
import { InstanceContext } from "../instance/provider/instance-provider";
import { useNetEntityMap } from "../network/hooks/use-net-entity-map";
import { AppOSLine } from "../ui/app-os-line";
import { AppContext } from "./provider/app-provider";

export const AppLine: React.FC = () => {
  const { device } = DeviceContext.useValue();
  const instance = InstanceContext.useValueNullable();

  const entity = instance ?? device;

  const app = AppContext.useValue();

  const { data, isLoading } = useNetEntityMap();

  if (isLoading) {
    return "loading";
  }

  if (!data) {
    return null;
  }

  const { name, description } = app.meta;

  const netEntityAccess = data[entity.id].apps[app.slug];

  const appMainAccess = netEntityAccess[0];
  const appOthersAccessList = netEntityAccess.filter(
    (access) => access !== appMainAccess
  );

  return (
    <AppOSLine
      key={app.slug}
      slug={app.slug}
      name={name}
      description={description}
      mainAccess={appMainAccess}
      accessList={appOthersAccessList}
    />
  );
};
