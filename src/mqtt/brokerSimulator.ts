import { AlertItem, PredictionResult, TelemetryReading } from '../types';

export interface MQTTMessageLog {
  id: string;
  topic: string;
  qos: 0 | 1 | 2;
  retained: boolean;
  timestamp: string;
  payload: string;
  sizeBytes: number;
}

export interface MQTTBrokerStatus {
  mode: 'local' | 'cloud';
  host: string;
  port: number;
  connected: boolean;
  clientId: string;
  messagesPerSec: number;
  totalMessagesPublished: number;
  totalMessagesDeliveredQoS1: number;
  lagMs: number;
  activeTopicsCount: number;
  lwtRegistered: boolean;
}

export interface SQLiteTableStats {
  tableName: string;
  rowCount: number;
  sizeKb: number;
  lastInsertTs: string;
}

export class HiveMQBrokerSimulator {
  private status: MQTTBrokerStatus;
  private messageLogs: MQTTMessageLog[] = [];
  private listeners: ((status: MQTTBrokerStatus, logs: MQTTMessageLog[]) => void)[] = [];
  private msgCountWindow: number[] = [];
  private dbTables: Map<string, any[]> = new Map();

  constructor() {
    this.status = {
      mode: 'local',
      host: 'localhost',
      port: 1883,
      connected: true,
      clientId: 'fastapi_dashboard_gw_01',
      messagesPerSec: 5.0,
      totalMessagesPublished: 1420,
      totalMessagesDeliveredQoS1: 1420,
      lagMs: 12,
      activeTopicsCount: 16,
      lwtRegistered: true,
    };

    // Initialize mock database tables
    this.dbTables.set('machines', []);
    this.dbTables.set('telemetry', []);
    this.dbTables.set('features', []);
    this.dbTables.set('predictions', []);
    this.dbTables.set('alerts', []);
    this.dbTables.set('downtime_events', []);
    this.dbTables.set('model_registry', [
      {
        version: 'v2.4-xgb-calibrated',
        trained_at: '2026-09-28T14:22:00Z',
        metrics_json: '{"f1": 0.882, "recall": 0.894, "precision": 0.871, "pr_auc": 0.912, "roc_auc": 0.946, "mean_lead_time_min": 28.4}',
        path: 'models/xgb_downtime_v2.4.joblib',
      },
      {
        version: 'v2.3-lgbm-baseline',
        trained_at: '2026-09-14T09:15:00Z',
        metrics_json: '{"f1": 0.841, "recall": 0.852, "precision": 0.830, "pr_auc": 0.879, "roc_auc": 0.918, "mean_lead_time_min": 24.1}',
        path: 'models/lgbm_downtime_v2.3.joblib',
      },
    ]);

    // Recalculate msgs/sec every second
    setInterval(() => {
      const now = Date.now();
      this.msgCountWindow = this.msgCountWindow.filter((t) => now - t <= 2000);
      this.status.messagesPerSec = Number((this.msgCountWindow.length / 2).toFixed(1));
      this.notify();
    }, 1000);
  }

  public subscribe(cb: (status: MQTTBrokerStatus, logs: MQTTMessageLog[]) => void): () => void {
    this.listeners.push(cb);
    cb(this.status, this.messageLogs);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public setBrokerMode(mode: 'local' | 'cloud', host?: string, port?: number): void {
    this.status.mode = mode;
    if (mode === 'cloud') {
      this.status.host = host || 'hivemq-cluster-prod.s1.eu.hivemq.cloud';
      this.status.port = port || 8883;
    } else {
      this.status.host = host || 'localhost';
      this.status.port = port || 1883;
    }
    this.notify();
  }

  public toggleConnection(): boolean {
    this.status.connected = !this.status.connected;
    this.notify();
    return this.status.connected;
  }

  public publishTelemetry(reading: TelemetryReading): void {
    if (!this.status.connected) return;

    const topic = `factory/line1/${reading.machine_id}/telemetry`;
    const payload = JSON.stringify(reading);
    this.recordMessage(topic, payload, 1, false);

    // Store in SQLite telemetry table
    const tel = this.dbTables.get('telemetry') || [];
    tel.push(reading);
    if (tel.length > 500) tel.shift();
    this.dbTables.set('telemetry', tel);
  }

  public publishPrediction(pred: PredictionResult): void {
    if (!this.status.connected) return;

    const topic = `factory/line1/predictions/${pred.machine_id}`;
    const payload = JSON.stringify(pred);
    this.recordMessage(topic, payload, 1, false);

    const preds = this.dbTables.get('predictions') || [];
    preds.push(pred);
    if (preds.length > 300) preds.shift();
    this.dbTables.set('predictions', preds);
  }

  public publishAlert(alert: AlertItem): void {
    if (!this.status.connected) return;

    const topic = `factory/line1/alerts`;
    const payload = JSON.stringify(alert);
    this.recordMessage(topic, payload, 1, false);

    const alts = this.dbTables.get('alerts') || [];
    alts.push(alert);
    if (alts.length > 200) alts.shift();
    this.dbTables.set('alerts', alts);
  }

  private recordMessage(topic: string, payload: string, qos: 0 | 1 | 2, retained: boolean): void {
    const sizeBytes = new TextEncoder().encode(payload).length;
    const now = Date.now();
    this.msgCountWindow.push(now);
    this.status.totalMessagesPublished += 1;
    this.status.totalMessagesDeliveredQoS1 += 1;
    this.status.lagMs = Math.floor(8 + Math.random() * 9);

    const log: MQTTMessageLog = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      topic,
      qos,
      retained,
      timestamp: new Date().toLocaleTimeString(),
      payload,
      sizeBytes,
    };

    this.messageLogs.unshift(log);
    if (this.messageLogs.length > 40) {
      this.messageLogs.pop();
    }
  }

  public getTableStats(): SQLiteTableStats[] {
    const result: SQLiteTableStats[] = [];
    const nowIso = new Date().toISOString();
    for (const [name, rows] of this.dbTables.entries()) {
      const rowCount = rows.length > 0 ? rows.length : name === 'machines' ? 5 : 0;
      result.push({
        tableName: name,
        rowCount: rowCount,
        sizeKb: Number((rowCount * 0.42 + 12).toFixed(1)),
        lastInsertTs: rows.length > 0 ? nowIso : 'Static / Seed',
      });
    }
    return result;
  }

  public getTableRows(name: string): any[] {
    return this.dbTables.get(name) || [];
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb({ ...this.status }, [...this.messageLogs]);
    }
  }
}

export const mqttBroker = new HiveMQBrokerSimulator();
