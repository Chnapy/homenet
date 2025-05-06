import crypto from "crypto";
import sqlite3raw, { Database } from "sqlite3";
import { Heartbeat, Monitor, MonitorTag, Tag } from "./uptime-kuma-db-types";

const sqlite3 = sqlite3raw.verbose();

export class UptimeKumaDB {
  db: Database;

  constructor(filename: string) {
    this.db = new sqlite3.Database(filename);
  }

  run = (sql: string, params: unknown) =>
    new Promise<number>((resolve, reject) =>
      this.db.run(sql, params, function (this, err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      })
    );

  all = <O>(sql: string) =>
    new Promise<O[]>((resolve, reject) =>
      this.db.all<O>(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      })
    );

  get = <O>(sql: string) =>
    new Promise<O | undefined>((resolve, reject) =>
      this.db.get<O>(sql, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      })
    );

  close = () =>
    new Promise<void>((resolve, reject) =>
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    );

  getInsertIntoParams = (params: Record<string, unknown>) => {
    const names = Object.keys(params);
    const values = names.map((name) => params[name]);

    return {
      names: `(${names.join(", ")})`,
      valuesPlaceholder: `(${values.map(() => "?").join(", ")})`,
      values,
    };
  };

  async getHomenetMonitors() {
    try {
      return await this.all<
        Monitor & Partial<Pick<Heartbeat, "status" | "msg" | "duration">>
      >(
        `SELECT m.*, h.status, h.msg, h.duration, h.time
        FROM monitor m
        INNER JOIN monitor_tag mt ON m.id = mt.monitor_id
        INNER JOIN tag t ON t.id = mt.tag_id
        LEFT JOIN (
            SELECT monitor_id, MAX(time) AS max_time
            FROM heartbeat
            GROUP BY monitor_id
        ) beat ON beat.monitor_id = m.id
        LEFT JOIN heartbeat h ON h.monitor_id = m.id AND h.time = beat.max_time
        WHERE t.name = "homenet"`
      );
    } finally {
      //   this.db.close();
    }
  }

  async getMonitor(id: number) {
    try {
      return await this.get<Monitor>(`SELECT * FROM monitor WHERE id = ${id}`);
    } finally {
      //   this.db.close();
    }
  }

  async createMonitorNotificationAssositation(params: {
    monitor_id: number;
    notification_id: number;
  }) {
    const { names, valuesPlaceholder, values } =
      this.getInsertIntoParams(params);
    try {
      return await this.run(
        `INSERT INTO monitor_notification${names} VALUES${valuesPlaceholder}`,
        values
      );
    } finally {
      //   connection.release();
    }
  }

  async createMonitorTagAssositation(params: Omit<MonitorTag, "id">) {
    const { names, valuesPlaceholder, values } =
      this.getInsertIntoParams(params);
    try {
      return await this.run(
        `INSERT INTO monitor_tag${names} VALUES${valuesPlaceholder}`,
        values
      );
    } finally {
      //   connection.release();
    }
  }

  async createTag(params: Pick<Tag, "name" | "color">) {
    const { names, valuesPlaceholder, values } =
      this.getInsertIntoParams(params);
    try {
      return await this.run(
        `INSERT INTO tag${names} VALUES${valuesPlaceholder}`,
        values
      );
    } finally {
      //   connection.release();
    }
  }

  async getTagByName(name: string) {
    try {
      return await this.get<Tag>(`SELECT * FROM tag WHERE name = "${name}"`);
    } finally {
      //   this.db.close();
    }
  }

  async createMonitor(params: Partial<Monitor>) {
    params.push_token =
      params.push_token || crypto.randomBytes(16).toString("hex");

    const finalParams: Omit<Monitor, "id" | "created_date"> = {
      active: true,
      user_id: 1,
      interval: 60,
      type: "push",
      weight: 2000,
      maxretries: 0,
      ignore_tls: false,
      upside_down: false,
      maxredirects: 10,
      accepted_statuscodes_json: '["200-299"]',
      dns_resolve_type: "A",
      dns_resolve_server: "1.1.1.1",
      retry_interval: 60,
      method: "GET",
      docker_container: "",
      expiry_notification: false,
      mqtt_topic: "",
      mqtt_success_message: "",
      mqtt_username: "",
      mqtt_password: "",
      grpc_enable_tls: false,
      resend_interval: 0,
      packet_size: 56,
      parent: 1,
      invert_keyword: false,
      json_path: "$",
      kafka_producer_brokers: "[]",
      kafka_producer_ssl: false,
      kafka_producer_allow_auto_topic_creation: false,
      kafka_producer_sasl_options: '{"mechanism":"None"}',
      oauth_auth_method: "client_secret_basic",
      timeout: 48,
      gamedig_given_port_only: true,
      ...params,
    };

    const { names, valuesPlaceholder, values } =
      this.getInsertIntoParams(finalParams);
    try {
      return await this.run(
        `INSERT INTO monitor${names} VALUES${valuesPlaceholder}`,
        values
      );
    } finally {
      //   connection.release();
    }
  }

  async deleteMonitor(id: number) {
    try {
      await this.run(`DELETE FROM monitor WHERE id = ?`, [id]);
    } finally {
      //   connection.release();
    }
  }

  async startMonitor(id: number) {
    try {
      await this.run(`UPDATE monitor SET active = 1 WHERE id = ?`, [id]);
    } finally {
      //   connection.release();
    }
  }

  async pauseMonitor(id: number) {
    try {
      await this.run(`UPDATE monitor SET active = 0 WHERE id = ?`, [id]);
    } finally {
      //   connection.release();
    }
  }

  async temp() {
    try {
      return await this.all(
        `SELECT * FROM heartbeat WHERE monitor_id = 17 ORDER BY time DESC LIMIT 1`
      );
    } finally {
      //   connection.release();
    }
  }

  async listTables() {
    return await this.all<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table';`
    );
  }

  async tableAttributes(table: string) {
    return await this.all<{
      cid: number;
      name: string;
      type: "INTEGER";
      notnull: 0 | 1;
      dflt_value?: string;
      pk: 0 | 1;
    }>(`PRAGMA table_info("${table}");`);
  }

  async mapTables() {
    const tables = await this.listTables();

    return Object.fromEntries(
      await Promise.all(
        tables
          .map((table) => table.name)
          .sort()
          .map(async (tableName) => {
            const attributes = await this.tableAttributes(tableName);

            return [
              tableName,
              attributes
                .sort((a1, a2) => {
                  return a1.pk ? -1 : 1;
                })
                .map(
                  (a) =>
                    `${a.name}${a.pk ? "!" : ""}${a.notnull ? "" : "?"}:${
                      a.type
                    }`
                ),
            ];
          })
      )
    );
  }
}
