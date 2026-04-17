import { TransportError } from "engine.io-client";
import { io, Socket as IOSocket } from "socket.io-client";
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
  MonitorMap,
  Notification,
  Tag,
} from "../uptime-kuma-io-types";

export type Socket = ReturnType<typeof createSocket>;

export const createSocket = (socketAddress: string) => {
  console.log("io: socket created with address", socketAddress);
  const sio = io(socketAddress, {
    autoConnect: false,
    retries: 0,
    reconnectionAttempts: 3,
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

  const getErrorLogger = (eventName: string) => (error: Error) => {
    if (error instanceof TransportError) {
      console.warn(
        `io [${sio.id}]: ${eventName} [TransportError]`,
        error.name,
        error.message,
        "- description:",
        error.description
      );
    } else {
      console.warn(
        `io [${sio.id}]: ${eventName}`,
        error.name,
        error.message,
        error.stack
      );
    }
  };

  sio.io.on("error", getErrorLogger("error"));

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
      createOn<(reason: IOSocket.DisconnectReason) => void>("disconnect"),

    monitorList: createOn<(data: MonitorMap) => void>("monitorList"),
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
  ) => {
    const startTime = Date.now();
    return new Promise<D>((resolve, reject) =>
      sio!.emit(name, ...body, (data: D) => {
        const duration = Date.now() - startTime;
        console.log("io:", name, data, `duration=${duration}ms`);
        data.ok ? resolve(data) : reject(data);
      })
    ).catch(async (data: DefaultResponse): Promise<D> => {
      if (data.msg === "You are not logged in.") {
        await login();

        return emitFn<D>(name, body);
      }

      return Promise.reject<D>(data);
    });
  };

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
      password: "xxx",
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

  /**
   * Can be quite slow if there is lot of monitors
   */
  const getMonitorList = () =>
    new Promise<MonitorMap>(async (resolve, reject) => {
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

  const addMonitor = (monitor: Partial<Omit<Monitor, "id" | "tags">>) =>
    emitFn<AddMonitor>("add", {
      maxretries: 2,
      interval: 60,
      retryInterval: 60,
      resendInterval: 0,
      timeout: 48,
      ignoreTls: false,
      upsideDown: false,
      packetSize: 56,
      maxredirects: 10,
      accepted_statuscodes: [ "200-299" ],
      dns_resolve_type: "A",
      dns_resolve_server: "1.1.1.1",
      oauth_auth_method: "client_secret_basic",
      httpBodyEncoding: "json",
      kafkaProducerBrokers: [],
      kafkaProducerSaslOptions: {
        mechanism: "None",
      },
      kafkaProducerSsl: false,
      kafkaProducerAllowAutoTopicCreation: false,
      gamedigGivenPortOnly: true,

      ...monitor,
    });

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
        console.log("io: connect attempt");

        sio.on("connect_error", (err) => {
          getErrorLogger("connect_error")(err);
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
