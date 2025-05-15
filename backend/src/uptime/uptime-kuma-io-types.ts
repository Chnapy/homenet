export type DefaultResponse = {
  ok: boolean;
  msg?: string;
};

export type Login = DefaultResponse & {
  token: string;
};

export type LoginByToken = DefaultResponse;

export type GetTags = DefaultResponse & {
  tags: Tag[];
};

export type AddMonitor = DefaultResponse & {
  monitorID: number;
};

export type AddTag = DefaultResponse & {
  tag: Tag;
};

export type AddMonitorTag = DefaultResponse;

// heartbeat
export type Heartbeat = {
  monitorID: number;
  status: 0 | 1 | 2;
  time: string;
  msg?: string;
  important: boolean;
  duration: number;
};

// monitor
export type Monitor = {
  id: number;
  name?: string;
  description?: string;
  pathName?: string;
  parent?: number;
  childrenIDs?: number[];
  url?: string;
  method: string;
  hostname?: string;
  port?: number;
  maxretries: number;
  weight?: number;
  active: boolean;
  forceInactive?: boolean;
  type?: string;
  timeout: number;
  interval: number;
  retryInterval: number;
  resendInterval: number;
  keyword?: string;
  invertKeyword?: boolean;
  expiryNotification?: boolean;
  ignoreTls: boolean;
  upsideDown: boolean;
  packetSize: number;
  maxredirects: number;
  accepted_statuscodes: string[];
  dns_resolve_type?: string;
  dns_resolve_server?: string;
  dns_last_result?: string;
  docker_container?: string;
  docker_host?: number;
  proxyId?: number;
  notificationIDList: Record<string, boolean>;
  tags?: (Tag & MonitorTag)[];
  maintenance?: boolean;
  mqttTopic?: string;
  mqttSuccessMessage?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  databaseQuery?: string;
  authMethod?: string;
  grpcUrl?: string;
  grpcProtobuf?: string;
  grpcMethod?: string;
  grpcServiceName?: string;
  grpcEnableTls?: boolean;
  radiusCalledStationId?: string;
  radiusCallingStationId?: string;
  game?: string;
  gamedigGivenPortOnly: boolean;
  httpBodyEncoding?: string;
  jsonPath?: string;
  expectedValue?: string;
  kafkaProducerTopic?: string;
  kafkaProducerBrokers: unknown[];
  kafkaProducerSsl: boolean;
  kafkaProducerAllowAutoTopicCreation: boolean;
  kafkaProducerMessage?: string;
  screenshot?: unknown;
  headers?: string;
  body?: string;
  grpcBody?: string;
  grpcMetadata?: string;
  basic_auth_user?: string;
  basic_auth_pass?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_token_url?: string;
  oauth_scopes?: string;
  oauth_auth_method?: string;
  pushToken?: string;
  databaseConnectionString?: string;
  radiusUsername?: string;
  radiusPassword?: string;
  radiusSecret?: string;
  authWorkstation?: string;
  authDomain?: string;
  tlsCa?: string;
  tlsCert?: string;
  tlsKey?: string;
  kafkaProducerSaslOptions?: unknown;
  includeSensitiveData?: boolean;
};

export type MonitorMap = Record<string, Monitor>;

// monitor_notification
export type MonitorNotification = {
  id: number;
  monitor_id: number;
  notification_id: number;
};

// monitor_tag
export type MonitorTag = {
  id: number;
  monitor_id: number;
  tag_id: number;
  value: string;
};

// notification
export type Notification = {
  id: number;
  name?: string;
  active: boolean;
  userId: number;
  isDefault: boolean;
  config?: string;
};

// tag
export type Tag = {
  id: number;
  name: string;
  color: string;
  // created_date: string;
};
