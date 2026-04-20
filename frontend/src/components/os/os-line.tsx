import React from "react";
import { DeviceContext } from "../device/provider/device-provider";
import { InstanceContext } from "../instance/provider/instance-provider";
import { useNetEntityMap } from "../network/hooks/use-net-entity-map";
import { AppOSLine } from "../ui/app-os-line";

export const OSLine: React.FC = () => {
  const { device } = DeviceContext.useValue();
  const instance = InstanceContext.useValueNullable();

  const { data, isLoading } = useNetEntityMap();

  if (isLoading) {
    return "loading";
  }

  if (!data || instance?.type === "DOCKER") {
    return null;
  }

  const entity = instance ?? device;

  const netEntityAccess = data[entity.id].os;

  const { name, description } = entity.meta;

  const osMainAccess = netEntityAccess[0];
  const osOthersAccessList = netEntityAccess.filter(
    (access) => access !== osMainAccess,
  );

  return (
    <AppOSLine
      slug={entity.os}
      metaIcon={entity.meta.icon}
      name={name}
      description={description}
      mainAccess={osMainAccess}
      accessList={osOthersAccessList}
      fullSize
    />
  );
};
