import { NetAccess } from "../../../data/types/get-devices";

export const getAccessWebHref = ({
  address,
  port,
  ssl,
}: Omit<NetAccess, "type" | "scope">) =>
  `${ssl ? "https" : "http"}://${address}${port ? ":" + port : ""}`;
