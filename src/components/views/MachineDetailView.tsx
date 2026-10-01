import React, { useState } from 'react';
import { FailureType, MachineState } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { GaugeChart } from '../common/GaugeChart';
import { MiniSparkline } from '../common/MiniSparkline';
import { 
  Thermometer, 
  Radio, 
  Zap, 
  Gauge, 
  Activity, 
  Clock, 
  AlertCircle, 
  Sliders, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface MachineDetailViewProps {
  machines: Map<string, MachineState>;
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  onInjectFailure: (machineId: string, mode: FailureType) => void;
  onRecoverMachine: (machineId: string) => void;
}

export const MachineDetailView: React.FC<MachineDetailViewProps> = ({
  machines,
  selectedMachineId,
  onSelectMachine,
  onInjectFailure,
  onRecoverMachine,
}) => {
  const [activeChart, setActiveChart] = useState<'vibration' | 'temperature' | 'current' | 'pressure'>('vibration');
  const machine = machines.get(selectedMachineId) || Array.from(machines.values())[0];
  const t = machine.currentTelemetry;
  const pred = machine.latestPrediction;
  const deg = machine.currentDegradation;

  const failureOptions: { mode: FailureType; label: string }[] = [
    { mode: 'bearing_wear', label: 'Bearing Wear (Vibration ↑)' },
    { mode: 'overheating', label: 'Overheating / Chiller Block (Temp ↑)' },
    { mode: 'motor_overload', label: 'Motor Overload (Amps ↑, RPM ↓)' },
    { mode: 'hydraulic_leak', label: 'Hydraulic Seal Leak (Bar ↓)' },
    { mode: 'tool_wear', label: 'Tool Edge Chipping (Rejects ↑)' },
    { mode: 'random_breakdown', label: 'Instant Catastrophic Trip' },
  ];

  return (
    <div className="space-y-6">
      {/* Machine Selector Segmented Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from(machines.values()).map((m) => {
          const isSelected = m.config.id === machine.config.id;
          return (
            <button
              key={m.config.id}
              onClick={() => onSelectMachine(m.config.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-neutral-800 text-white border-amber-500/50 shadow-md'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <span className="font-mono text-[11px] text-amber-400">0{m.config.position}</span>
              <span>{m.config.name}</span>
              <RiskBadge level={m.latestPrediction.risk_level} compact />
            </button>
          );
        })}
      </div>

      {/* Main Machine Overview Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Machine Card & Fault Control */}
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white/80 border border-white/70 backdrop-blur-xl shadow-sm text-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">
                  Station 0{machine.config.position} · {machine.config.line}
                </span>
                <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
                  {machine.config.name}
                </h2>
              </div>
              <RiskBadge level={pred.risk_level} prob={pred.failure_prob} />
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {machine.config.description}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-neutral-500 text-[10px] uppercase font-bold">State</div>
                <div className={`font-bold mt-0.5 ${t.status === 'RUNNING' ? 'text-emerald-600' : t.status === 'WARNING' ? 'text-amber-600' : 'text-red-600'}`}>
                  {t.status}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-neutral-500 text-[10px] uppercase font-bold">Est. TTF</div>
                <div className="font-bold text-neutral-900 mt-0.5 tabular-nums">
                  {pred.predicted_ttf_min > 0 ? `${pred.predicted_ttf_min} mins` : 'Immediate'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-neutral-500 text-[10px] uppercase font-bold">Anomaly Score</div>
                <div className="font-bold text-sky-600 mt-0.5 tabular-nums">
                  {(pred.anomaly_score * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-neutral-500 text-[10px] uppercase font-bold">Cycle Time</div>
                <div className="font-bold text-neutral-900 mt-0.5 tabular-nums">
                  {t.cycle_time.toFixed(1)} s
                </div>
              </div>
            </div>

            {/* Degradation State Banner */}
            {deg.active && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 mb-4">
                <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
                  <span>Simulating Fault Mode:</span>
                  <span className="font-mono tabular-nums">{(deg.progress * 100).toFixed(0)}% Progress</span>
                </div>
                <div className="text-xs text-amber-800 font-mono capitalize">
                  {deg.mode.replace('_', ' ')}
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, deg.progress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Machine Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onRecoverMachine(machine.config.id)}
                className="flex-1 py-2 px-3 rounded-full text-xs font-semibold bg-neutral-950 text-white hover:bg-neutral-800 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clear / Reset Machine</span>
              </button>
            </div>
          </div>

          {/* Fault Injection Panel for this machine */}
          <div className="p-5 rounded-3xl bg-white/80 border border-white/70 backdrop-blur-xl shadow-sm">
            <h3 className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-neutral-900" />
              <span>Direct Fault Injection</span>
            </h3>

            <div className="space-y-1.5">
              {failureOptions.map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => onInjectFailure(machine.config.id, opt.mode)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-mono flex items-center justify-between transition-all ${
                    deg.mode === opt.mode && deg.active
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-50 text-neutral-700 border border-neutral-200/70 hover:border-neutral-400'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <span className="text-[10px] font-bold">
                    {deg.mode === opt.mode && deg.active ? 'ACTIVE' : 'INJECT'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Charts & SHAP Analysis */}
        <div className="xl:col-span-2 space-y-6">
          {/* Real-time Multi-sensor telemetry visualizer */}
          <div className="p-5 rounded-3xl bg-white/80 border border-white/70 backdrop-blur-xl shadow-sm text-neutral-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
                  Live Sensor Stream & Degradation Curve
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  High-frequency sliding window (60s buffer) across critical physical transducers.
                </p>
              </div>

              {/* Sensor Channel Switcher */}
              <div className="flex items-center bg-neutral-100 p-1 rounded-full border border-neutral-200 text-xs font-mono">
                <button
                  onClick={() => setActiveChart('vibration')}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                    activeChart === 'vibration'
                      ? 'bg-neutral-950 text-white font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Vibration
                </button>
                <button
                  onClick={() => setActiveChart('temperature')}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                    activeChart === 'temperature'
                      ? 'bg-neutral-950 text-white font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Temperature
                </button>
                <button
                  onClick={() => setActiveChart('current')}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                    activeChart === 'current'
                      ? 'bg-neutral-950 text-white font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Current
                </button>
                <button
                  onClick={() => setActiveChart('pressure')}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-colors ${
                    activeChart === 'pressure'
                      ? 'bg-neutral-950 text-white font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Pressure
                </button>
              </div>
            </div>

            {/* Selected Channel Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs font-mono">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Current Value</div>
                <div className="text-xl font-extrabold text-neutral-950 tabular-nums mt-0.5">
                  {activeChart === 'vibration' && `${t.vibration.toFixed(2)} mm/s`}
                  {activeChart === 'temperature' && `${t.temperature.toFixed(1)} °C`}
                  {activeChart === 'current' && `${t.motor_current.toFixed(1)} A`}
                  {activeChart === 'pressure' && `${t.pressure.toFixed(1)} bar`}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Baseline Normal</div>
                <div className="text-neutral-700 font-semibold tabular-nums mt-0.5">
                  {activeChart === 'vibration' && `${machine.config.baselines.vibration.toFixed(2)} mm/s`}
                  {activeChart === 'temperature' && `${machine.config.baselines.temperature.toFixed(1)} °C`}
                  {activeChart === 'current' && `${machine.config.baselines.motor_current.toFixed(1)} A`}
                  {activeChart === 'pressure' && `${machine.config.baselines.pressure.toFixed(1)} bar`}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Warning Threshold</div>
                <div className="text-amber-600 font-semibold tabular-nums mt-0.5">
                  {activeChart === 'vibration' && `${machine.config.thresholds.vib_warn.toFixed(2)} mm/s`}
                  {activeChart === 'temperature' && `${machine.config.thresholds.temp_warn.toFixed(1)} °C`}
                  {activeChart === 'current' && `${machine.config.thresholds.curr_warn.toFixed(1)} A`}
                  {activeChart === 'pressure' && `${machine.config.thresholds.press_low_warn.toFixed(1)} bar`}
                </div>
              </div>
            </div>

            {/* High-Resolution Waveform Chart Container */}
            <div className="p-4 rounded-2xl bg-neutral-950 text-white shadow-inner">
              <MiniSparkline
                data={
                  activeChart === 'vibration'
                    ? machine.recentTelemetry.map((r) => r.vibration)
                    : activeChart === 'temperature'
                    ? machine.recentTelemetry.map((r) => r.temperature)
                    : activeChart === 'current'
                    ? machine.recentTelemetry.map((r) => r.motor_current)
                    : machine.recentTelemetry.map((r) => r.pressure)
                }
                color={
                  activeChart === 'vibration'
                    ? '#38bdf8'
                    : activeChart === 'temperature'
                    ? '#f59e0b'
                    : activeChart === 'current'
                    ? '#10b981'
                    : '#a855f7'
                }
                height={160}
                width={700}
              />
            </div>
          </div>

          {/* AI Explainability & SHAP Attribution Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Probability Gauge */}
            <div className="p-5 rounded-3xl bg-white/80 border border-white/70 backdrop-blur-xl shadow-sm flex flex-col items-center justify-between text-neutral-900">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                  Downtime Horizon (30m)
                </span>
                <span className="text-[11px] font-mono text-neutral-950 font-bold">XGBoost v2.4</span>
              </div>

              <GaugeChart value={pred.failure_prob} size={160} />

              <div className="w-full text-center pt-2 text-xs font-mono text-neutral-500">
                Confidence: <span className="text-neutral-900 font-bold">89.4% Recall</span> · Lead time:{' '}
                <span className="text-emerald-600 font-bold">~28.4 min</span>
              </div>
            </div>

            {/* Real-time SHAP Factor Attribution */}
            <div className="p-5 rounded-3xl bg-neutral-950 text-white shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>SHAP Feature Attribution</span>
                </h4>
                <span className="text-[10px] font-mono text-neutral-500">Local Explanation</span>
              </div>

              <div className="space-y-2.5">
                {pred.shap_factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{factor.label}</span>
                      <span
                        className={`font-bold tabular-nums ${
                          factor.impact > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {factor.impact > 0 ? `+${factor.impact.toFixed(2)}` : factor.impact.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 flex justify-between items-center">
                      <span>Observed: {factor.value}</span>
                      <span className="text-[10px] text-neutral-500">
                        {factor.impact > 0 ? 'Elevates Risk' : 'Healthy Factor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
