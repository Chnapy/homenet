import { io, Socket } from "socket.io-client";
import {
  AddMonitor,
  AddMonitorTag,
  AddTag,
  DefaultResponse,
  GetTags,
  Heartbeat,
  Login,
  LoginByToken,
  Monitor,
  Notification,
  Tag,
} from "./uptime-kuma-io-types";

export const createSocket = (socketAddress: string) => {
  console.log("Socket created with address", socketAddress);
  const sio = io(socketAddress, {
    autoConnect: false,
  });

  let currentToken = "";

  // var onevent = socket.onevent;
  // socket.onevent = function (packet) {
  //   var args = packet.data || [];
  //   onevent.call(this, packet); // original call
  //   packet.data = ["*"].concat(args);
  //   onevent.call(this, packet); // additional call to catch-all
  // };
  // socket.on("*", function (event, data, ...extra) {
  //   if (event !== "monitorList" && event !== "certInfo")
  //     console.log("io: *", event, data, ...extra);
  // });

  sio.io.on("error", (error) => {
    console.log("io: error", error);
  });

  const createOn =
    <C extends (...data: any[]) => void>(name: string) =>
    (callback: C, startOn: boolean = true) => {
      //   callback = () => console.log("io:", name);
      const turnOn = () => sio.on(name, callback);

      if (startOn) {
        turnOn();
      }

      return {
        turnOn,
        turnOff: () => sio.off(name, callback),
      };
    };

  const on = {
    disconnect:
      createOn<(reason: Socket.DisconnectReason) => void>("disconnect"),

    monitorList:
      createOn<(data: Record<string, Monitor>) => void>("monitorList"),
    notificationList:
      createOn<(data: Notification[]) => void>("notificationList"),
    heartbeatList:
      createOn<(monitorId: string, heartbeatList: Heartbeat[]) => void>(
        "heartbeatList"
      ),
    heartbeat: createOn<(data: Heartbeat) => void>("heartbeat"),
  };

  const emitFn = <D extends DefaultResponse>(
    name: string,
    ...body: unknown[]
  ) =>
    new Promise<D>((resolve, reject) =>
      sio!.emit(name, ...body, (data: D) => {
        console.log("io:", name, data);
        data.ok ? resolve(data) : reject(data);
      })
    ).catch(async (data: DefaultResponse): Promise<D> => {
      if (data.msg === "You are not logged in.") {
        await login();

        return emitFn<D>(name, body);
      }

      return Promise.reject<D>(data);
    });

  const loginByToken = () =>
    emitFn<LoginByToken>("loginByToken", currentToken).catch(
      async (data: DefaultResponse): Promise<LoginByToken | Login> => {
        if (data.msg === "Invalid token.") {
          return await loginBasic();
        }

        return Promise.reject<LoginByToken>(data);
      }
    );

  const loginBasic = () =>
    emitFn<Login>("login", {
      username: "chnapy",
      password: "Xlp9d4Wmdda5cA",
      token: "",
    }).then((data) => {
      currentToken = data.token;
      return data;
    });

  const login = async () => {
    if (currentToken) {
      await loginByToken();
    } else {
      await loginBasic();
    }
  };

  const getTags = () => emitFn<GetTags>("getTags");

  const getMonitorList = () =>
    new Promise<Record<string, Monitor>>(async (resolve, reject) => {
      const listener = on.monitorList((data) => {
        listener.turnOff();
        resolve(data);
      });
      const result = await emitFn("getMonitorList");
      if (!result.ok) {
        listener.turnOff();
        reject(result);
      }
    });

  const addMonitor = (monitor: Omit<Monitor, "id" | "tags">) =>
    emitFn<AddMonitor>("add", monitor);

  const addTag = (tag: Omit<Tag, "id">) => emitFn<AddTag>("addTag", tag);

  const addMonitorTag = (tagId: number, monitorId: number, value: string) =>
    emitFn<AddMonitorTag>("addMonitorTag", tagId, monitorId, value);

  const deleteMonitor = (monitorId: number) =>
    emitFn("deleteMonitor", monitorId);

  const emit = {
    login,

    getTags,
    getMonitorList,

    addMonitor,
    addTag,
    addMonitorTag,

    deleteMonitor,
  };

  return {
    isConnected: () => sio.connected,
    connect: () =>
      new Promise<void>((resolve, reject) => {
        sio.on("connect_error", (err) => {
          console.log(`io: connect_error`, err);
          reject(err);
        });

        sio.on("connect", async () => {
          console.log("io: connected");
          resolve();
        });

        sio.connect();
      }),
    disconnect: () => {
      if (sio.connected) {
        sio.disconnect();
      }
    },
    emit,
    on,
  };
};
