// api_key
export type ApiKey = {
  id: number;
  key: string;
  name: string;
  user_id: number;
  created_date: string;
  active: boolean;
  expires?: string;
};

// docker_host
export type DockerHost = {
  id: number;
  user_id: number;
  docker_daemon?: string;
  docker_type?: string;
  name?: string;
};

// group
export type Group = {
  id: number;
  name: string;
  created_date: string;
  public: boolean;
  active: boolean;
  weight: boolean;
  status_page_id?: number;
};

// heartbeat
export type Heartbeat = {
  id: number;
  important: boolean;
  monitor_id: number;
  status: 0 | 1 | 2;
  msg?: string;
  time: string;
  ping?: number;
  duration: number;
  down_count: number;
};

// incident
export type Incident = {
  id: number;
  title: string;
  content: string;
  style: string;
  created_date: string;
  last_updated_date?: string;
  pin: boolean;
  active: boolean;
  status_page_id?: number;
};

// maintenance
export type Maintenance = {
  id: number;
  title: string;
  description: string;
  user_id?: number;
  active: boolean;
  strategy: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  weekdays?: string;
  days_of_month?: string;
  interval_day?: number;
  cron?: string;
  timezone?: string;
  duration?: number;
};

// maintenance_status_page
export type MaintenanceStatusPage = {
  id: number;
  status_page_id: number;
  maintenance_id: number;
};

// monitor
export type Monitor = {
  id: number;
  name?: string;
  active: boolean;
  user_id?: number;
  interval: number;
  url?: string;
  type?: string;
  weight?: number;
  hostname?: string;
  port?: number;
  created_date: string;
  keyword?: string;
  maxretries: number;
  ignore_tls: boolean;
  upside_down: boolean;
  maxredirects: number;
  accepted_statuscodes_json: string;
  dns_resolve_type?: string;
  dns_resolve_server?: string;
  dns_last_result?: string;
  retry_interval: number;
  push_token?: string;
  method: string;
  body?: string;
  headers?: string;
  basic_auth_user?: string;
  basic_auth_pass?: string;
  docker_host?: number;
  docker_container?: string;
  proxy_id?: number;
  expiry_notification?: boolean;
  mqtt_topic?: string;
  mqtt_success_message?: string;
  mqtt_username?: string;
  mqtt_password?: string;
  database_connection_string?: string;
  database_query?: string;
  auth_method?: string;
  auth_domain?: string;
  auth_workstation?: string;
  grpc_url?: string;
  grpc_protobuf?: string;
  grpc_body?: string;
  grpc_metadata?: string;
  grpc_method?: string;
  grpc_service_name?: string;
  grpc_enable_tls: boolean;
  radius_username?: string;
  radius_password?: string;
  radius_calling_station_id?: string;
  radius_called_station_id?: string;
  radius_secret?: string;
  resend_interval: number;
  packet_size: number;
  game?: string;
  http_body_encoding?: string;
  description?: string;
  tls_ca?: string;
  tls_cert?: string;
  tls_key?: string;
  parent?: number;
  invert_keyword: boolean;
  json_path?: string;
  expected_value?: string;
  kafka_producer_topic?: string;
  kafka_producer_brokers?: string;
  kafka_producer_sasl_options?: string;
  kafka_producer_message?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_token_url?: string;
  oauth_scopes?: string;
  oauth_auth_method?: string;
  timeout: number;
  gamedig_given_port_only: boolean;
  kafka_producer_ssl: boolean;
  kafka_producer_allow_auto_topic_creation: boolean;
};

// monitor_group
export type MonitorGroup = {
  id: number;
  monitor_id: number;
  group_id: number;
  weight: boolean;
  send_url: boolean;
};

// monitor_maintenance
export type MonitorMaintenance = {
  id: number;
  monitor_id: number;
  maintenance_id: number;
};

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
  value?: string;
};

// monitor_tls_info
export type MonitorTlsInfo = {
  id: number;
  monitor_id: number;
  info_json?: string;
};

// notification
export type Notification = {
  id: number;
  name?: string;
  active: boolean;
  user_id: number;
  is_default: boolean;
  config?: string;
};

// notification_sent_history
export type NotificationSentHistory = {
  id: number;
  type: string;
  monitor_id: number;
  days: number;
};

// proxy
export type Proxy = {
  id: number;
  user_id: number;
  protocol: string;
  host: string;
  port: number;
  auth: boolean;
  username?: string;
  password?: string;
  active: boolean;
  default: boolean;
  created_date: string;
};

// setting
export type Setting = {
  id?: number;
  key: string;
  value?: string;
  type?: string;
};

// status_page
export type StatusPage = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  icon: string;
  theme: string;
  published: boolean;
  search_engine_index: boolean;
  show_tags: boolean;
  password?: string;
  created_date: string;
  modified_date: string;
  footer_text?: string;
  custom_css?: string;
  show_powered_by: boolean;
  google_analytics_tag_id?: string;
  show_certificate_expiry: boolean;
};

// status_page_cname
export type StatusPageCname = {
  id: number;
  status_page_id: number;
  domain: string;
};

// tag
export type Tag = {
  id: number;
  name: string;
  color: string;
  created_date: string;
};

// user
export type User = {
  id: number;
  username: string;
  password?: string;
  active: boolean;
  timezone?: string;
  twofa_secret?: string;
  twofa_status: boolean;
  twofa_last_token?: string;
};
