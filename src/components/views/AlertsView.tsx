import React, { useState } from 'react';
import { AlertItem, AlertSeverity } from '../../types';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Check, 
  Filter, 
  Download, 
  UserCheck, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string, byName: string, notes?: string) => void;
  onResolve: (id: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onAcknowledge, onResolve }) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [selectedAlertForAck, setSelectedAlertForAck] = useState<AlertItem | null>(null);
  const [ackName, setAckName] = useState('Shift Engineer Alex');
  const [ackNotes, setAckNotes] = useState('Inspection scheduled; lube level verified.');

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter === 'ACTIVE' && (a.acknowledged || a.resolved)) return false;
    if (statusFilter === 'ACKNOWLEDGED' && (!a.acknowledged || a.resolved)) return false;
    if (statusFilter === 'RESOLVED' && !a.resolved) return false;
    return true;
  });

  const exportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Machine', 'Severity', 'Type', 'FailureProb', 'TTF_Min', 'Status', 'Message'];
    const rows = alerts.map((a) => [
      a.id,
      a.ts,
      a.machine_name,
      a.severity,
      a.type,
      (a.failure_prob * 100).toFixed(0) + '%',
      a.predicted_ttf_min,
      a.resolved ? 'RESOLVED' : a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE',
      `"${a.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `factory_alerts_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Incident Management & Alert Dispatch
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Automated multi-tier notification engine with 3-minute auto-escalation and cooldown deduplication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-3xl bg-white/80 border border-white/70 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500 flex items-center gap-1 font-sans font-medium">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-neutral-950 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500 font-sans font-medium">Status:</span>
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-neutral-950 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table / Feed */}
      <div className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-100/70 border-b border-neutral-200/80 text-[11px] text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Severity</th>
                <th className="py-3.5 px-4 font-bold">Timestamp</th>
                <th className="py-3.5 px-4 font-bold">Machine</th>
                <th className="py-3.5 px-4 font-bold">Alert & Root Cause</th>
                <th className="py-3.5 px-4 font-bold">P(Fail) / TTF</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono">
                    No incident records match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alt) => (
                  <tr
                    key={alt.id}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      alt.escalated ? 'bg-red-50/50' : ''
                    }`}
                  >
                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {alt.severity === 'CRITICAL' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                          <AlertOctagon className="w-3 h-3" />
                          CRITICAL
                        </span>
                      ) : alt.severity === 'WARNING' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          WARNING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px]">
                          <Info className="w-3 h-3" />
                          INFO
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-neutral-500 tabular-nums font-semibold">
                      {new Date(alt.ts).toLocaleTimeString()}
                    </td>

                    {/* Machine */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-neutral-900">
                      {alt.machine_name}
                    </td>

                    {/* Message & Action */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="text-neutral-900 font-semibold font-sans text-xs">
                        {alt.message}
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5 font-mono">
                        Action: {alt.recommended_action}
                      </div>
                      {alt.top_contributor && (
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          Trigger: {alt.top_contributor}
                        </div>
                      )}
                    </td>

                    {/* Risk / TTF */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-neutral-950 tabular-nums">
                        {(alt.failure_prob * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-neutral-500 tabular-nums">
                        TTF: {alt.predicted_ttf_min} min
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {alt.resolved ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : alt.acknowledged ? (
                        <span className="text-sky-600 font-bold flex items-center gap-1 text-[11px]">
                          <UserCheck className="w-3.5 h-3.5" /> Ack by {alt.acknowledged_by}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold animate-pulse text-[11px]">
                          ● Open ({alt.escalated ? 'Escalated' : 'Pending'})
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {!alt.resolved && (
                        <div className="flex items-center justify-end gap-1.5">
                          {!alt.acknowledged && (
                            <button
                              onClick={() => setSelectedAlertForAck(alt)}
                              className="px-3 py-1 rounded-full text-[11px] font-bold bg-neutral-950 text-white hover:bg-neutral-800 transition-colors shadow-sm"
                            >
                              Ack
                            </button>
                          )}
                          <button
                            onClick={() => onResolve(alt.id)}
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acknowledge Modal */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Acknowledge Alert #{selectedAlertForAck.id.slice(-6)}
              </h3>
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="text-neutral-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Acknowledging this alert halts auto-escalation timer and notifies the control room.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">Operator Signature / Name</label>
                <input
                  type="text"
                  value={ackName}
                  onChange={(e) => setAckName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Investigation Notes</label>
                <textarea
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAcknowledge(selectedAlertForAck.id, ackName, ackNotes);
                  setSelectedAlertForAck(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors"
              >
                Confirm Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
