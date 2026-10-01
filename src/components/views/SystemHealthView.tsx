import React, { useState } from 'react';
import { MQTTBrokerStatus, MQTTMessageLog, SQLiteTableStats } from '../../mqtt/brokerSimulator';
import { 
  Network, 
  Database, 
  CheckCircle2, 
  Radio, 
  ShieldCheck, 
  RefreshCw, 
  Server, 
  Terminal, 
  FileText,
  Clock,
  Layers
} from 'lucide-react';

interface SystemHealthViewProps {
  brokerStatus: MQTTBrokerStatus;
  messageLogs: MQTTMessageLog[];
  tableStats: SQLiteTableStats[];
  onToggleBrokerMode: (mode: 'local' | 'cloud') => void;
  onToggleConnection: () => void;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({
  brokerStatus,
  messageLogs,
  tableStats,
  onToggleBrokerMode,
  onToggleConnection,
}) => {
  const [selectedLog, setSelectedLog] = useState<MQTTMessageLog | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          MQTT Ingestion Service & SQLite WAL Health
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Real-time HiveMQ broker connectivity, QoS 1 delivery assurances, and edge storage statistics.
        </p>
      </div>

      {/* Broker & Ingestion Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 text-xs font-mono">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-neutral-400 uppercase text-[10px] flex items-center justify-between">
            <span>Broker Connection</span>
            <span className={`w-2 h-2 rounded-full ${brokerStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          </div>
          <div className="text-xl font-bold text-white my-1 truncate">
            {brokerStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <div className="text-[11px] text-neutral-400 truncate">
            {brokerStatus.host}:{brokerStatus.port}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-neutral-400 uppercase text-[10px]">Ingestion Throughput</div>
          <div className="text-2xl font-bold text-sky-400 my-1 tabular-nums">
            {brokerStatus.messagesPerSec} msg/s
          </div>
          <div className="text-[11px] text-neutral-400">Total: {brokerStatus.totalMessagesPublished}</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-neutral-400 uppercase text-[10px]">QoS 1 Delivery Rate</div>
          <div className="text-2xl font-bold text-emerald-400 my-1 tabular-nums">
            100.0%
          </div>
          <div className="text-[11px] text-neutral-400">0 Packets Dropped</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-neutral-400 uppercase text-[10px]">Gateway Pipeline Lag</div>
          <div className="text-2xl font-bold text-amber-400 my-1 tabular-nums">
            {brokerStatus.lagMs} ms
          </div>
          <div className="text-[11px] text-neutral-400">&lt; 5000ms SLA Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-neutral-400 uppercase text-[10px]">Last Will & Testament</div>
          <div className="text-xl font-bold text-white my-1">
            ARMED
          </div>
          <div className="text-[11px] text-emerald-400">Auto offline detection</div>
        </div>
      </div>

      {/* Broker Switcher & Topic Hierarchy Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Broker Mode Switcher */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              HiveMQ Broker Configuration
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">.env: BROKER_MODE</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-300 font-semibold">Broker Endpoint:</span>
                <span className="text-amber-400">{brokerStatus.mode.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleBrokerMode('local')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    brokerStatus.mode === 'local'
                      ? 'bg-neutral-800 text-white border-amber-500/50'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Local CE (1883)
                </button>
                <button
                  onClick={() => onToggleBrokerMode('cloud')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    brokerStatus.mode === 'cloud'
                      ? 'bg-neutral-800 text-white border-amber-500/50'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  HiveMQ Cloud (8883 TLS)
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
              <div className="text-neutral-400 text-[10px]">Client ID</div>
              <div className="text-white font-semibold truncate">{brokerStatus.clientId}</div>
            </div>

            <button
              onClick={onToggleConnection}
              className={`w-full py-2.5 rounded-xl font-bold border transition-colors ${
                brokerStatus.connected
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {brokerStatus.connected ? 'Disconnect HiveMQ Session' : 'Reconnect HiveMQ Session'}
            </button>
          </div>
        </div>

        {/* MQTT Topic Tree Structure */}
        <div className="xl:col-span-2 p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-sky-400" />
              Production Line MQTT Topic Tree (QoS 1)
            </h3>
            <span className="text-xs font-mono text-emerald-400">paho-mqtt v2.0 API</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-amber-300 font-bold">factory/line1/+/telemetry</div>
                <div className="text-[11px] text-neutral-400">Published every 1s per machine: temp, vib, curr, pressure, rpm, power, cycle_time</div>
              </div>
              <span className="text-[10px] text-neutral-300 px-2 py-0.5 rounded bg-neutral-800">QoS 1</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-sky-300 font-bold">factory/line1/+/status</div>
                <div className="text-[11px] text-neutral-400">State publication (RUNNING, IDLE, WARNING, FAULT, MAINTENANCE) + LWT fallback</div>
              </div>
              <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">RETAINED</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-red-300 font-bold">factory/line1/alerts</div>
                <div className="text-[11px] text-neutral-400">Broadcasts instant incident dispatch, recommended mitigation, and auto-escalations</div>
              </div>
              <span className="text-[10px] text-neutral-300 px-2 py-0.5 rounded bg-neutral-800">QoS 1</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-emerald-300 font-bold">factory/line1/predictions/+</div>
                <div className="text-[11px] text-neutral-400">Inference stream: P(failure in 30m), TTF regression, anomaly score, SHAP factors</div>
              </div>
              <span className="text-[10px] text-neutral-300 px-2 py-0.5 rounded bg-neutral-800">QoS 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live MQTT Packet Stream Inspector & SQLite Table Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Packet Stream (2 Cols) */}
        <div className="xl:col-span-2 p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live MQTT Packet Inspector (factory/line1/#)
              </h3>
              <p className="text-xs text-neutral-400">
                Incoming paho-mqtt v2 message stream decoded in real time.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">Buffering Last 40 Packets</span>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {messageLogs.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedLog(msg)}
                className="p-2.5 rounded-xl bg-neutral-950/70 hover:bg-neutral-800/60 border border-neutral-800/70 cursor-pointer text-xs font-mono flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-neutral-500 text-[10px] tabular-nums">{msg.timestamp}</span>
                  <span className="text-amber-400 font-bold truncate">{msg.topic}</span>
                  <span className="text-neutral-500 truncate max-w-xs">{msg.payload}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 shrink-0">
                  <span className="px-1.5 py-0.5 bg-neutral-800 rounded">QoS {msg.qos}</span>
                  <span className="tabular-nums">{msg.sizeBytes} B</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SQLite Database Schema Inspector */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              SQLite WAL Mode Tables
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">WAL ACTIVE</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Relational storage with WAL (Write-Ahead Logging) enabled for zero-lock concurrent batch writes.
          </p>

          <div className="space-y-2 text-xs font-mono">
            {tableStats.map((tbl) => (
              <div
                key={tbl.tableName}
                className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-neutral-200 font-bold">{tbl.tableName}</div>
                  <div className="text-[10px] text-neutral-400">Indexed on (machine_id, ts)</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold tabular-nums">{tbl.rowCount} rows</div>
                  <div className="text-[10px] text-neutral-400 tabular-nums">{tbl.sizeKb} KB</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400">
            Automated retention pruner active: raw telemetry pruned after 30 days.
          </div>
        </div>
      </div>
    </div>
  );
};
