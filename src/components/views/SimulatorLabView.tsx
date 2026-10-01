import React, { useState } from 'react';
import { FailureType, MachineState } from '../../types';
import { 
  Sliders, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  Flame, 
  Activity, 
  Droplet, 
  Wrench, 
  AlertOctagon,
  CheckCircle2,
  FastForward,
  Clock
} from 'lucide-react';
import { SimulationClock } from '../../simulation/engine';

interface SimulatorLabViewProps {
  machines: Map<string, MachineState>;
  clock: SimulationClock;
  onInjectFailure: (machineId: string, mode: FailureType, durationMinutes?: number) => void;
  onRecoverMachine: (machineId: string) => void;
  onSpeedChange: (speed: number) => void;
  onTogglePause: () => void;
  onResetAll: () => void;
}

export const SimulatorLabView: React.FC<SimulatorLabViewProps> = ({
  machines,
  clock,
  onInjectFailure,
  onRecoverMachine,
  onSpeedChange,
  onTogglePause,
  onResetAll,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState('cnc_01');
  const [selectedMode, setSelectedMode] = useState<FailureType>('bearing_wear');
  const [durationMinutes, setDurationMinutes] = useState(30);

  const failureModes: { mode: FailureType; title: string; subtitle: string; icon: React.ReactNode; leadTime: string }[] = [
    {
      mode: 'bearing_wear',
      title: 'Bearing Wear & Micro-Pitting',
      subtitle: 'Exponential vibration rise + Spindle thermal climb',
      icon: <Activity className="w-4 h-4 text-sky-400" />,
      leadTime: '45-120 min',
    },
    {
      mode: 'overheating',
      title: 'Cooling Loop Failure',
      subtitle: 'Rapid thermal elevation + Power kW escalation',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      leadTime: '30-60 min',
    },
    {
      mode: 'motor_overload',
      title: 'Motor Winding Overload',
      subtitle: 'Current spike (Amps) + Heavy RPM drag drop',
      icon: <Zap className="w-4 h-4 text-red-400" />,
      leadTime: '20-40 min',
    },
    {
      mode: 'hydraulic_leak',
      title: 'Hydraulic Seal Leak',
      subtitle: 'Bar pressure decay + Sluggish cycle time creep',
      icon: <Droplet className="w-4 h-4 text-purple-400" />,
      leadTime: '60-180 min',
    },
    {
      mode: 'tool_wear',
      title: 'Tool Cutting Edge Chipping',
      subtitle: 'Reject count spike + Dimensional drift',
      icon: <Wrench className="w-4 h-4 text-emerald-400" />,
      leadTime: '30-90 min',
    },
    {
      mode: 'random_breakdown',
      title: 'Unheralded Catastrophic Trip',
      subtitle: '10% spontaneous failure mode (no prior warning)',
      icon: <AlertOctagon className="w-4 h-4 text-red-500" />,
      leadTime: '0 min (Instant)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Synthetic Physics Simulator & Fault Injection Lab
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Simulate multi-hour degradation curves in minutes to test predictive ML lead time and alert triggers.
        </p>
      </div>

      {/* Guided 1-Click Demo Scenarios Box (Section 13 requirement) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Section 13 Official Demo Script</span>
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          "Inject a bearing-wear failure on cnc_01 and watch the risk rise, alert fire, and downtime get predicted"
        </h3>
        <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed mb-4">
          Click below to initiate the verified benchmark demonstration. The CNC Milling machine will begin progressive
          roller bearing micro-pitting. You will observe the vibration accelerate, ML failure probability climb above 60%
          triggering a WARNING, and lead time predicted before physical breakdown!
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              onSpeedChange(20);
              onInjectFailure('cnc_01', 'bearing_wear', 20);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Launch Benchmark Demo (CNC Bearing Wear @ 20x Speed)</span>
          </button>
          <button
            onClick={() => onRecoverMachine('cnc_01')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Reset CNC Milling</span>
          </button>
        </div>
      </div>

      {/* Custom Fault Injection Studio */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Step 1: Select Target Machine */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Step 1: Select Machine Cell
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">Station</span>
          </div>

          <div className="space-y-2">
            {Array.from(machines.values()).map((m) => {
              const isSelected = m.config.id === selectedMachineId;
              const hasFault = m.currentDegradation.active;
              return (
                <button
                  key={m.config.id}
                  onClick={() => setSelectedMachineId(m.config.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-800 text-white border-amber-500/50 shadow-sm'
                      : 'bg-neutral-950/50 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span className="text-amber-400">0{m.config.position}</span>
                      <span>{m.config.name}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Status: {m.currentTelemetry.status} · P(Fail): {(m.latestPrediction.failure_prob * 100).toFixed(0)}%
                    </div>
                  </div>
                  {hasFault && (
                    <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-bold">
                      FAULT ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Degradation Curve */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Step 2: Physics Failure Mode
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">Degradation Curve</span>
          </div>

          <div className="space-y-2">
            {failureModes.map((item) => {
              const isSelected = item.mode === selectedMode;
              return (
                <button
                  key={item.mode}
                  onClick={() => setSelectedMode(item.mode)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all ${
                    isSelected
                      ? 'bg-neutral-800 text-white border-amber-500/50 shadow-sm'
                      : 'bg-neutral-950/50 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-2 text-white">
                      {item.icon}
                      {item.title}
                    </span>
                    <span className="text-[10px] text-neutral-400">{item.leadTime}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Execution Settings & Controls */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-4">
              Step 3: Duration & Speed Setup
            </h3>

            {/* Duration slider */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-400">Degradation Horizon:</span>
                <span className="text-white font-bold">{durationMinutes} Minutes</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>10m (Fast fail)</span>
                <span>30m (Standard)</span>
                <span>120m (Long drift)</span>
              </div>
            </div>

            {/* Simulation speed buttons */}
            <div className="space-y-2 mb-6 text-xs font-mono">
              <span className="text-neutral-400">Simulation Speed Multiplier:</span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 20, 60].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`py-2 rounded-xl text-center font-bold border transition-colors ${
                      clock.speed === s
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Pause / Resume */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs font-mono">
              <span className="text-neutral-400">Simulator Clock State:</span>
              <button
                onClick={onTogglePause}
                className="flex items-center gap-1.5 text-amber-300 font-bold hover:text-amber-200"
              >
                {clock.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{clock.isPaused ? 'Paused' : 'Running'}</span>
              </button>
            </div>
          </div>

          {/* Action triggers */}
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <button
              onClick={() => onInjectFailure(selectedMachineId, selectedMode, durationMinutes)}
              className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Apply Fault to Station</span>
            </button>

            <button
              onClick={onResetAll}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Clear Faults On All Machines</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
