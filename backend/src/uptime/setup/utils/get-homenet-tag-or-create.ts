import { Socket } from "../../socket/create-socket";
import { Monitor } from "../../uptime-kuma-io-types";

export type IsHomenetMonitor = (monitor: Monitor) => boolean;

export type GetHomenetMonitorTagsLength = (monitor: Monitor) => number;

const tagName = "homenet";
const tagColor = "#362236";

export const getHomenetTagOrCreate = async (socket: Socket) => {
  const homenetTag = await socket.emit.getTags().then(async ({ tags }) => {
    const foundTag = tags.find((t) => t.name === tagName);
    if (foundTag) {
      return foundTag;
    }

    const { tag } = await socket.emit.addTag({
      name: tagName,
      color: tagColor,
    });

    return tag;
  });

  const isHomenetMonitor: IsHomenetMonitor = (monitor) =>
    Boolean(monitor.tags?.some(({ tag_id }) => tag_id === homenetTag.id));

  const getHomenetMonitorTagsLength: GetHomenetMonitorTagsLength = (monitor) =>
    monitor.tags?.filter(({ tag_id }) => tag_id === homenetTag.id)?.length ?? 0;

  return {
    homenetTag,
    isHomenetMonitor,
    getHomenetMonitorTagsLength,
  };
};
