import React from 'react';
import { MachineState } from '../../types';
import { BarChart3, PieChart, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalyticsViewProps {
  machines: Map<string, MachineState>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ machines }) => {
  // Downtime cause distribution for Pareto analysis
  const paretoData = [
    { cause: 'Bearing Wear & Pitting', minutes: 142, pct: 38, cumPct: 38 },
    { cause: 'Spindle / Motor Overload', minutes: 98, pct: 26, cumPct: 64 },
    { cause: 'Cooling / Thermal Overrun', minutes: 64, pct: 17, cumPct: 81 },
    { cause: 'Hydraulic Seal Decay', minutes: 42, pct: 11, cumPct: 92 },
    { cause: 'Tool Chipping & Wear', minutes: 20, pct: 5, cumPct: 97 },
    { cause: 'Random / Unheralded Trip', minutes: 12, pct: 3, cumPct: 100 },
  ];

  // MTBF and MTTR metrics per machine
  const reliabilityData = [
    { id: 'cut_01', name: 'Cutting Machine', mtbf: 168.4, mttr: 24.2, availability: 98.4, failures: 3 },
    { id: 'cnc_01', name: 'CNC Milling', mtbf: 112.0, mttr: 42.5, availability: 96.2, failures: 7 },
    { id: 'weld_01', name: 'Welding Robot', mtbf: 184.2, mttr: 18.0, availability: 99.0, failures: 2 },
    { id: 'paint_01', name: 'Painting Booth', mtbf: 240.0, mttr: 35.0, availability: 97.8, failures: 4 },
    { id: 'pack_01', name: 'Packaging Unit', mtbf: 195.5, mttr: 21.4, availability: 98.9, failures: 3 },
  ];

  // Shift Downtime breakdown
  const shiftData = [
    { shift: 'Shift 1 · Morning (06:00 - 14:00)', totalDowntimeMin: 74, share: 22, color: 'bg-emerald-500' },
    { shift: 'Shift 2 · Evening (14:00 - 22:00)', totalDowntimeMin: 186, share: 56, color: 'bg-amber-500' },
    { shift: 'Shift 3 · Night (22:00 - 06:00)', totalDowntimeMin: 72, share: 22, color: 'bg-sky-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Downtime Analytics & Reliability Engineering
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Pareto analysis, Mean Time Between Failures (MTBF), Mean Time To Repair (MTTR), and shift variance.
        </p>
      </div>

      {/* Top 3 High Level KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
            <span>Fleet Average MTBF</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tabular-nums">180.0</span>
            <span className="text-xs text-neutral-400 font-mono">Hours</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            Target benchmark: &gt; 160h continuous operation
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
            <span>Fleet Average MTTR</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tabular-nums">28.2</span>
            <span className="text-xs text-neutral-400 font-mono">Minutes</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            Predictive warnings reduced MTTR by 41%
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
            <span>Root-Cause Concentration</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tabular-nums">81%</span>
            <span className="text-xs text-amber-400 font-mono">Top 3 Causes</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            Bearing wear + Overload + Overheating dominate
          </p>
        </div>
      </div>

      {/* Pareto Chart & Shift Analysis Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pareto Chart Container (2 Cols) */}
        <div className="xl:col-span-2 p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Downtime Causes Pareto Distribution
              </h3>
              <p className="text-xs text-neutral-400">
                Cumulative percentage curve revealing top 80/20 root cause drivers.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">30-Day Aggregated</span>
          </div>

          <div className="space-y-3 pt-2">
            {paretoData.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-bold">0{idx + 1}</span>
                    <span className="font-semibold text-white">{item.cause}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-400">
                    <span className="tabular-nums">{item.minutes} min ({item.pct}%)</span>
                    <span className="text-amber-400 font-bold tabular-nums">Cum. {item.cumPct}%</span>
                  </div>
                </div>

                {/* Progress bar representing share and cumulative line */}
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden flex border border-neutral-800/80">
                  <div
                    className={`h-full ${idx < 3 ? 'bg-amber-500' : 'bg-neutral-600'}`}
                    style={{ width: `${item.pct * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Total Downtime Recorded: 378 min</span>
            <span className="text-emerald-400">80/20 Rule: Focus maintenance on Bearings & Motor Drives</span>
          </div>
        </div>

        {/* Shift Breakdown Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Downtime Distribution by Shift
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Comparing operator shift schedules to identify ergonomic and environmental fatigue factors.
            </p>

            <div className="space-y-4">
              {shiftData.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-xs font-mono">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-neutral-200 font-semibold">{s.shift}</span>
                    <span className="text-amber-400 font-bold tabular-nums">{s.share}%</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mb-2">
                    Total Downtime: <span className="text-white font-semibold">{s.totalDowntimeMin} min</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color}`} style={{ width: `${s.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400">
            Shift 2 shows highest thermal stress due to peak outdoor ambient temperatures (14:00-17:00).
          </div>
        </div>
      </div>

      {/* Machine Reliability & Availability Table */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-neutral-800/80">
          <h3 className="text-sm font-bold text-white">
            Station Reliability Benchmarks (MTBF / MTTR)
          </h3>
        </div>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-950/80 text-[11px] text-neutral-400 uppercase tracking-wider border-b border-neutral-800/80">
            <tr>
              <th className="py-3 px-4">Station ID</th>
              <th className="py-3 px-4">Machine Name</th>
              <th className="py-3 px-4">MTBF (Hours)</th>
              <th className="py-3 px-4">MTTR (Minutes)</th>
              <th className="py-3 px-4">Operational Availability</th>
              <th className="py-3 px-4 text-right">30-Day Trips</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {reliabilityData.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="py-3.5 px-4 text-neutral-400 font-bold">{row.id}</td>
                <td className="py-3.5 px-4 text-white font-medium">{row.name}</td>
                <td className="py-3.5 px-4 text-emerald-400 tabular-nums">{row.mtbf.toFixed(1)} h</td>
                <td className="py-3.5 px-4 text-sky-400 tabular-nums">{row.mttr.toFixed(1)} min</td>
                <td className="py-3.5 px-4 text-neutral-200 tabular-nums">{row.availability.toFixed(1)}%</td>
                <td className="py-3.5 px-4 text-right tabular-nums text-neutral-400">{row.failures}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
