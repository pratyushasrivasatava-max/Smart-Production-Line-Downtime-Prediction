import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Zap, 
  RotateCcw, 
  Search, 
  Bell, 
  Sun, 
  Video, 
  Calendar, 
  ChevronRight,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import { SimulationClock } from '../simulation/engine';

interface HeaderProps {
  clock: SimulationClock;
  activeAlertsCount: number;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
  onInjectDemoFailure: () => void;
  onResetLine: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  clock,
  activeAlertsCount,
  onTogglePause,
  onSpeedChange,
  onInjectDemoFailure,
  onResetLine,
}) => {
  const [activeSegment, setActiveSegment] = useState<'Day' | 'Week' | 'Month' | 'Shift'>('Day');
  const speeds = [1, 5, 20, 60];

  return (
    <header className="px-2 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Left Section: Title & Date Selector (Matching the reference image) */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Operations Management
          </h2>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-neutral-200/80 shadow-sm text-xs font-semibold text-neutral-800">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span>OCTOBER 1, 2026</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        </div>

        {/* Segmented Time Filter Tabs (Day, Week, Month, Shift) */}
        <div className="flex items-center bg-white/80 p-1 rounded-full border border-neutral-200/80 shadow-sm text-xs font-medium text-neutral-600">
          {(['Day', 'Week', 'Month', 'Shift'] as const).map((seg) => (
            <button
              key={seg}
              onClick={() => setActiveSegment(seg)}
              className={`px-3 py-1 rounded-full transition-all text-xs ${
                activeSegment === seg
                  ? 'bg-neutral-950 text-white font-bold shadow-sm'
                  : 'hover:text-neutral-900'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Right Section: Circular & Pill Controls from reference image */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Speed Control Segmented Pill */}
        <div className="flex items-center bg-white/90 p-1 rounded-full border border-neutral-200/80 shadow-sm text-xs font-mono">
          <span className="px-2 text-[10px] text-neutral-500 font-sans font-semibold">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded-full transition-all text-xs ${
                clock.speed === s
                  ? 'bg-neutral-950 text-white font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Pause/Resume circular button */}
        <button
          onClick={onTogglePause}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
            clock.isPaused
              ? 'bg-amber-500 text-neutral-950 font-bold'
              : 'bg-white/90 border border-neutral-200/80 text-neutral-700 hover:bg-neutral-100'
          }`}
          title={clock.isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {clock.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Telemetry pill with black video-style circle (matching reference image) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-neutral-200/80 shadow-sm text-xs text-neutral-700">
          <div className="w-5 h-5 rounded-full bg-neutral-950 flex items-center justify-center text-white">
            <Video className="w-2.5 h-2.5" />
          </div>
          <span className="font-semibold text-neutral-800">Telemetry Feed</span>
        </div>

        {/* Ambient Temperature & Time Pill (matching "14:20 · 23° Sunny" from reference image) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-neutral-200/80 shadow-sm text-xs text-neutral-700 font-mono">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-bold text-neutral-900">{clock.virtualTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-neutral-300">·</span>
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>23° Factory</span>
        </div>

        {/* Search Pill Input (matching reference image) */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Type searching..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-full bg-white/90 border border-neutral-200/80 shadow-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-950 w-36"
          />
        </div>

        {/* Notification Bell Circle with Badge (matching black circle with +9 from reference image) */}
        <div className="relative">
          <button className="w-9 h-9 rounded-full bg-neutral-950 flex items-center justify-center text-white shadow-sm hover:bg-neutral-800 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-neutral-950 text-white border-2 border-white">
              +{activeAlertsCount}
            </span>
          )}
        </div>

        {/* Section 13 Demo Fault Button */}
        <button
          onClick={onInjectDemoFailure}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-950 text-white shadow-md hover:bg-neutral-800 active:scale-95 transition-all whitespace-nowrap"
          title="Inject progressive Bearing Wear on CNC Milling (Section 13 Demo)"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Demo Fault</span>
        </button>

        {/* Reset Line */}
        <button
          onClick={onResetLine}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 border border-neutral-200/80 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shadow-sm"
          title="Clear all faults & restore normal state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
