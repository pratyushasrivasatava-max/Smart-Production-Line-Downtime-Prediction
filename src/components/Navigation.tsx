import React from 'react';
import { 
  Activity, 
  Cpu, 
  AlertTriangle, 
  BarChart3, 
  Sliders, 
  Network, 
  Code2, 
  Sparkles,
  Layers,
  CircleDot,
  CheckCircle2,
  Clock
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'machines' 
  | 'alerts' 
  | 'analytics' 
  | 'ml_performance' 
  | 'simulation_lab' 
  | 'system_health' 
  | 'codebase';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeAlertsCount: number;
  criticalAlertsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  activeAlertsCount,
  criticalAlertsCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; isCritical?: boolean }[] = [
    {
      id: 'overview',
      label: 'Home & Line',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'machines',
      label: 'Machines',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: activeAlertsCount,
      isCritical: criticalAlertsCount > 0,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'ml_performance',
      label: 'AI Models',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'simulation_lab',
      label: 'Fault Lab',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'system_health',
      label: 'MQTT Telemetry',
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: 'codebase',
      label: 'Code & Deploy',
      icon: <Code2 className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-60 shrink-0 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-4 flex flex-col justify-between shadow-sm select-none">
      <div>
        {/* Brand identity matching the sleek logo mark from reference image */}
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-neutral-950 flex items-center justify-center text-white shadow-md font-bold">
            <span className="text-sm font-extrabold tracking-tighter">C</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-1.5">
              Synapse IoT
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium">Predictive Line 1</p>
          </div>
        </div>

        {/* Nav Items styled with the exact black rounded pill active state from the reference image */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-neutral-950 text-white shadow-md shadow-neutral-950/20 font-bold'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-800'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      item.isCritical
                        ? 'bg-red-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-neutral-800 text-white'
                        : 'bg-neutral-200 text-neutral-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator Profile Card at bottom (matching the avatar lockup from the reference image) */}
      <div className="pt-4 border-t border-neutral-100 space-y-3">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-neutral-50/80 border border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
                AK
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">Ann Kowalski</div>
              <div className="text-[10px] text-neutral-500 font-mono">Shift Supervisor</div>
            </div>
          </div>
          <div className="w-5 h-5 rounded-full bg-neutral-200/80 flex items-center justify-center text-neutral-600 text-[10px]">
            ::
          </div>
        </div>

        <div className="px-2 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
          <span>HiveMQ 1883</span>
          <span className="text-emerald-600 font-bold">ONLINE</span>
        </div>
      </div>
    </aside>
  );
};
