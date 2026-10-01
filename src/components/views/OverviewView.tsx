import React from 'react';
import { MachineState, LineMetrics, AlertItem } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { 
  ArrowRight, 
  Activity, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Zap, 
  FileText,
  Sliders,
  TrendingDown,
  ChevronRight,
  MoreHorizontal,
  Flame,
  Radio,
  Thermometer,
  Layers,
  CircleDot
} from 'lucide-react';

interface OverviewViewProps {
  machines: Map<string, MachineState>;
  metrics: LineMetrics;
  onSelectMachine: (id: string) => void;
  onOpenSimulator: () => void;
  onInjectBearingWear: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  machines,
  metrics,
  onSelectMachine,
  onOpenSimulator,
  onInjectBearingWear,
}) => {
  const machineList = Array.from(machines.values());

  return (
    <div className="space-y-5">
      {/* Top Grid: Shift Operational Timeline + Ongoing Metrics + File Preview (Directly matching the provided image's layout!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6 Columns: Shift Production Timeline (Matching the Gantt timeline in the reference image) */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Shift Schedule & Production Batches
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Line 1 Nominal</span>
              </div>
            </div>

            {/* Timeline Rows */}
            <div className="space-y-3.5 text-xs">
              {/* Row 1: Cutting Machine */}
              <div className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-neutral-500 font-medium truncate">
                  Cutting Station
                </span>
                <div className="flex-1 relative h-8 flex items-center">
                  <div className="absolute left-[5%] w-[40%] h-7 rounded-full bg-neutral-950 text-white flex items-center justify-between px-3 text-[11px] font-semibold shadow-md">
                    <span>about 2 hours</span>
                    <div className="w-4 h-4 rounded-full bg-neutral-700 text-[9px] flex items-center justify-center">
                      M1
                    </div>
                  </div>
                  <div className="w-full border-b border-dashed border-neutral-200" />
                </div>
              </div>

              {/* Row 2: CNC Milling (Target of Bearing Wear Demo) */}
              <div className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-neutral-900 font-bold truncate flex items-center gap-1">
                  <span>CNC Milling</span>
                  {machineList[1]?.currentDegradation.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </span>
                <div className="flex-1 relative h-8 flex items-center">
                  <div
                    onClick={() => onSelectMachine('cnc_01')}
                    className={`absolute left-[20%] w-[48%] h-7 rounded-full text-white flex items-center justify-between px-3 text-[11px] font-semibold shadow-md cursor-pointer transition-all ${
                      machineList[1]?.currentDegradation.active
                        ? 'bg-amber-600 border border-amber-400 animate-pulse'
                        : 'bg-neutral-950'
                    }`}
                  >
                    <span>
                      {machineList[1]?.currentDegradation.active
                        ? `Risk ${(machineList[1].latestPrediction.failure_prob * 100).toFixed(0)}%`
                        : 'about 5 hours'}
                    </span>
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full bg-indigo-500 text-[8px] flex items-center justify-center text-white ring-1 ring-neutral-950">
                        AK
                      </div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center text-white ring-1 ring-neutral-950">
                        JS
                      </div>
                    </div>
                  </div>
                  <div className="w-full border-b border-dashed border-neutral-200" />
                </div>
              </div>

              {/* Row 3: Welding Robot */}
              <div className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-neutral-500 font-medium truncate">
                  Welding Cell
                </span>
                <div className="flex-1 relative h-8 flex items-center">
                  <div className="absolute left-[35%] w-[32%] h-7 rounded-full bg-neutral-950 text-white flex items-center justify-between px-3 text-[11px] font-semibold shadow-md">
                    <span>about 3 hours</span>
                    <div className="w-4 h-4 rounded-full bg-neutral-700 text-[9px] flex items-center justify-center">
                      WR
                    </div>
                  </div>
                  <div className="absolute left-[70%] w-[25%] h-7 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 flex items-center justify-center text-[10px] font-semibold">
                    break
                  </div>
                  <div className="w-full border-b border-dashed border-neutral-200" />
                </div>
              </div>

              {/* Row 4: Painting Booth */}
              <div className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-neutral-500 font-medium truncate">
                  Painting Booth
                </span>
                <div className="flex-1 relative h-8 flex items-center">
                  <div className="absolute left-[45%] w-[42%] h-7 rounded-full bg-neutral-950 text-white flex items-center justify-between px-3 text-[11px] font-semibold shadow-md">
                    <span>about 3 hours</span>
                    <div className="w-4 h-4 rounded-full bg-purple-500 text-[8px] flex items-center justify-center text-white">
                      PB
                    </div>
                  </div>
                  <div className="w-full border-b border-dashed border-neutral-200" />
                </div>
              </div>

              {/* Row 5: Packaging Unit */}
              <div className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-neutral-500 font-medium truncate">
                  Packaging Unit
                </span>
                <div className="flex-1 relative h-8 flex items-center">
                  <div className="absolute left-[60%] w-[35%] h-7 rounded-full bg-neutral-950 text-white flex items-center justify-between px-3 text-[11px] font-semibold shadow-md">
                    <span>about 2 hours</span>
                    <div className="w-4 h-4 rounded-full bg-neutral-700 text-[9px] flex items-center justify-center">
                      PK
                    </div>
                  </div>
                  <div className="w-full border-b border-dashed border-neutral-200" />
                </div>
              </div>
            </div>

            {/* Timeline Horizontal Hour Markers */}
            <div className="flex justify-between pl-31 pr-2 pt-4 text-[10px] font-mono text-neutral-400">
              <span>8 AM</span>
              <span>10 AM</span>
              <span>12 PM</span>
              <span>2 PM</span>
              <span>4 PM</span>
              <span>6 PM</span>
              <span>8 PM</span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>Shift 1 (Day) Active</span>
            <span className="text-neutral-900 font-bold">Estimated Line OEE: {(metrics.oee * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Middle 3 Columns: Ongoing Operations / Line Dynamics (Matching "Ongoing projects" card from reference image) */}
        <div className="lg:col-span-3 p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-neutral-900">
                Ongoing Operations
              </h3>
              <div className="w-4 h-4 text-neutral-400 flex items-center justify-center">
                ::
              </div>
            </div>
            <div className="text-[11px] text-neutral-500">
              Line efficiency trend
            </div>

            <div className="my-3">
              <div className="text-3xl font-extrabold tracking-tight text-neutral-950 tabular-nums">
                {(metrics.oee * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-neutral-500 font-medium">
                Compared to last shift
              </div>
            </div>

            {/* Smooth Wavy Spline Chart (matching reference image dual wave) */}
            <div className="py-2">
              <svg viewBox="0 0 200 60" className="w-full h-14 overflow-visible">
                <path
                  d="M 0 45 C 30 15, 60 55, 100 25 C 140 -5, 170 45, 200 20"
                  fill="none"
                  stroke="#171717"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 0 35 C 40 50, 70 10, 110 35 C 150 60, 180 15, 200 40"
                  fill="none"
                  stroke="#a3a3a3"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Bullet List Breakdown (matching reference image) */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-950" />
                  <span>Availability</span>
                </div>
                <span className="font-bold text-neutral-900 font-mono">
                  {(metrics.availability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <span>Performance</span>
                </div>
                <span className="font-bold text-neutral-900 font-mono">
                  {(metrics.performance * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  <span>Quality / Scrap</span>
                </div>
                <span className="font-bold text-neutral-900 font-mono">
                  {(metrics.quality * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>Uptime: {metrics.uptime_pct.toFixed(1)}%</span>
            <span className="text-emerald-600 font-bold">STABLE</span>
          </div>
        </div>

        {/* Right 3 Columns: High Contrast Dark Card (Matching the "File Preview" dark card from reference image!) */}
        <div className="lg:col-span-3 p-5 rounded-3xl bg-neutral-950 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle luminous accent glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <CircleDot className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Station Digital Twin</span>
              </div>
              <span>CNC_01</span>
            </div>

            {/* Dark Fluid Visual Asset (Matching the metallic liquid orb in the reference image) */}
            <div className="rounded-2xl overflow-hidden relative mb-4 border border-neutral-800 bg-neutral-900">
              <img
                src="/src/assets/images/fluid_metallic_orb_1790840148833.jpg"
                alt="Fluid Metallic Sensor Orb"
                className="w-full h-36 object-cover brightness-95 hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
                <span className="text-white font-bold">Acoustic Vibration</span>
                <span className="text-sky-400">{machineList[1]?.currentTelemetry.vibration.toFixed(2)} mm/s</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-white font-bold flex items-center justify-between">
                <span>Vibration & Spindle Core</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  P(Fail): {(machineList[1]?.latestPrediction.failure_prob * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                12,000 RPM · Temp {machineList[1]?.currentTelemetry.temperature.toFixed(1)}°C
              </div>
            </div>
          </div>

          {/* Operator Lockup inside the dark card (Matching "Marta Adams" avatar in reference image) */}
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20">
                MA
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Marta Adams</div>
                <div className="text-[10px] text-neutral-400">Station Lead</div>
              </div>
            </div>

            <button
              onClick={() => onSelectMachine('cnc_01')}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-neutral-950 hover:bg-neutral-200 transition-colors"
            >
              Inspect
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: "All Files" Alert Stack + Middle Metrics (Output, Active Stations, Dynamics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left 4 Columns: Alert Stack (Matching the 4 pill cards on left-bottom of reference image) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-950 flex items-center justify-center text-white">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">
                Recent Line Events & Logs
              </h3>
            </div>
            <div className="w-4 h-4 text-neutral-400 flex items-center justify-center text-xs">
              ::
            </div>
          </div>

          {/* 4 Rounded Pill Rows matching the reference image's pill files */}
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-sm flex items-center justify-between text-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-5 h-5 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 text-[10px] font-bold">
                  01
                </div>
                <span className="font-semibold text-neutral-800 truncate">
                  CNC Spindle Micro-Pitting Analysis.pdf
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono shrink-0">14:15</span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-sm flex items-center justify-between text-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-5 h-5 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 text-[10px] font-bold">
                  02
                </div>
                <span className="font-semibold text-neutral-800 truncate">
                  Welding Arm Electrostatic Spec.fig
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono shrink-0">12:30</span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-sm flex items-center justify-between text-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-5 h-5 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 text-[10px] font-bold">
                  03
                </div>
                <span className="font-semibold text-neutral-800 truncate">
                  Hydraulic Seal Leakage Log.doc
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono shrink-0">10:45</span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-sm flex items-center justify-between text-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-5 h-5 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 text-[10px] font-bold">
                  04
                </div>
                <span className="font-semibold text-neutral-800 truncate">
                  National Factory Compliance.fig
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono shrink-0">08:00</span>
            </div>
          </div>
        </div>

        {/* Right 8 Columns: Numeric Metrics Row + Station Real-Time Load Dark Card */}
        <div className="lg:col-span-8 space-y-4">
          {/* Metrics Row (Matching "Total Users 1240, Active Users 562, Dynamics 25" from reference image) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-neutral-900">Line Fleet</span>
              <div className="w-6 h-6 rounded-full bg-neutral-950 flex items-center justify-center text-white">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Metric 1: Total Output */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 text-xs font-bold">
                O
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 font-medium">Total Output</div>
                <div className="text-base font-extrabold text-neutral-950 font-mono tabular-nums">
                  {metrics.total_output} <span className="text-[11px] font-normal text-emerald-600">+124</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Active Machines */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 text-xs font-bold">
                S
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 font-medium">Active Stations</div>
                <div className="text-base font-extrabold text-neutral-950 font-mono tabular-nums">
                  {machineList.filter((m) => m.currentTelemetry.status === 'RUNNING').length} / 5{' '}
                  <span className="text-[11px] font-normal text-emerald-600">Online</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Dynamics Wave */}
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[10px] text-neutral-500 font-medium">Vibration Dynamics</div>
                <div className="text-base font-extrabold text-neutral-950 font-mono tabular-nums">
                  2.4 mm/s
                </div>
              </div>
              <svg viewBox="0 0 60 20" className="w-16 h-6 overflow-visible">
                <path
                  d="M 0 15 Q 15 0, 30 15 T 60 10"
                  fill="none"
                  stroke="#171717"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Wide Dark Card: Station Load & Frequency Equalizer (Matching bottom wide dark card in reference image) */}
          <div className="p-6 rounded-3xl bg-neutral-950 text-white shadow-xl relative overflow-hidden">
            {/* Subtle fluid wave pattern background in the dark card */}
            <div className="absolute right-0 bottom-0 w-80 h-36 opacity-15 pointer-events-none">
              <svg viewBox="0 0 300 120" className="w-full h-full">
                <path d="M 0 80 Q 75 0, 150 80 T 300 40 L 300 120 L 0 120 Z" fill="white" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Column 1: Cutting Station */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white tracking-wide">
                  Station 01 · Cutting
                </div>
                <div className="text-[11px] text-neutral-400">
                  Circular shear & prep
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-white">
                    M1
                  </div>
                  <div className="w-6 h-6 rounded-full bg-neutral-700 text-[10px] font-bold flex items-center justify-center text-white">
                    OP
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Progress</span>
                    <span className="text-white font-bold">85%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[85%]" />
                  </div>
                </div>
              </div>

              {/* Column 2: CNC Milling (Bearing Wear) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>Station 02 · CNC Milling</span>
                  {machineList[1]?.currentDegradation.active && (
                    <span className="text-[10px] text-amber-400 font-mono font-bold">FAULT SIM</span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">
                  5-Axis High Precision Center
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-[10px] font-bold flex items-center justify-center text-white">
                    AK
                  </div>
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white">
                    MA
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Risk Level</span>
                    <span className={machineList[1]?.latestPrediction.failure_prob > 0.5 ? 'text-amber-400 font-bold' : 'text-white'}>
                      {(machineList[1]?.latestPrediction.failure_prob * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        machineList[1]?.latestPrediction.failure_prob > 0.5 ? 'bg-amber-400' : 'bg-white'
                      }`}
                      style={{ width: `${Math.max(15, machineList[1]?.latestPrediction.failure_prob * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Column 3: Welding & Frequency Equalizer (Matching the vertical bars in the reference image) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white tracking-wide">
                  Station 03 · Robotic Welding
                </div>
                <div className="text-[11px] text-neutral-400">
                  Articulated 6-Axis Spot Cell
                </div>

                {/* Vertical Bar Frequency Equalizer from reference image */}
                <div className="flex items-end gap-1.5 h-12 pt-1">
                  <div className="w-1.5 bg-neutral-700 h-3 rounded-t" />
                  <div className="w-1.5 bg-neutral-600 h-6 rounded-t" />
                  <div className="w-1.5 bg-neutral-500 h-9 rounded-t" />
                  <div className="w-1.5 bg-neutral-400 h-11 rounded-t" />
                  <div className="w-1.5 bg-white h-8 rounded-t" />
                  <div className="w-1.5 bg-neutral-300 h-10 rounded-t" />
                  <div className="w-1.5 bg-white h-12 rounded-t" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Load / Harmonic</span>
                    <span className="text-white font-bold">78%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[78%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
