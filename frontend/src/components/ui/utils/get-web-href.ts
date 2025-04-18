import { NetAccess } from "../../../data/types/get-devices";

export const getAccessWebHref = ({
  address,
  port,
  ssl,
}: Omit<NetAccess, "type" | "scope">) => {
  const getPort = () => {
    if (!port || (port === 80 && !ssl) || (port === 443 && ssl)) {
      return "";
    }

    return ":" + port;
  };

  return `${ssl ? "https" : "http"}://${address}${getPort()}`;
};
