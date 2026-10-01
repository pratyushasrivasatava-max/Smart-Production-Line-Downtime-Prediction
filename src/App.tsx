import React, { useEffect, useState, useMemo } from 'react';
import { factoryEngine, SimulationClock } from './simulation/engine';
import { runInferenceOnMachine } from './ml/inference';
import { alertEngine } from './alerts/alertEngine';
import { mqttBroker, MQTTBrokerStatus, MQTTMessageLog } from './mqtt/brokerSimulator';
import { AlertItem, FailureType, LineMetrics, MachineState } from './types';
import { Navigation, NavTab } from './components/Navigation';
import { Header } from './components/Header';
import { OverviewView } from './components/views/OverviewView';
import { MachineDetailView } from './components/views/MachineDetailView';
import { AlertsView } from './components/views/AlertsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ModelPerformanceView } from './components/views/ModelPerformanceView';
import { SimulatorLabView } from './components/views/SimulatorLabView';
import { SystemHealthView } from './components/views/SystemHealthView';
import { CodebaseView } from './components/views/CodebaseView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('cnc_01');
  const [machines, setMachines] = useState<Map<string, MachineState>>(() => new Map(factoryEngine.getMachines()));
  const [clock, setClock] = useState<SimulationClock>(() => ({ ...factoryEngine.getClock() }));
  const [alerts, setAlerts] = useState<AlertItem[]>(() => alertEngine.getAlerts());
  const [brokerStatus, setBrokerStatus] = useState<MQTTBrokerStatus>({
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
  });
  const [messageLogs, setMessageLogs] = useState<MQTTMessageLog[]>([]);

  // Wire up real-time engine and event pipelines
  useEffect(() => {
    // 1. Subscribe to broker
    const unsubBroker = mqttBroker.subscribe((status, logs) => {
      setBrokerStatus(status);
      setMessageLogs(logs);
    });

    // 2. Subscribe to alerts
    const unsubAlerts = alertEngine.subscribe((newAlerts) => {
      setAlerts([...newAlerts]);
    });

    // 3. Subscribe to simulation physics ticks
    const unsubEngine = factoryEngine.subscribe((updatedMachines, updatedClock) => {
      for (const [id, state] of updatedMachines.entries()) {
        mqttBroker.publishTelemetry(state.currentTelemetry);

        const prediction = runInferenceOnMachine(state);
        state.latestPrediction = prediction;

        state.predictionHistory.push({
          ts: prediction.ts,
          prob: prediction.failure_prob,
          ttf: prediction.predicted_ttf_min,
          anomaly: prediction.anomaly_score,
        });
        if (state.predictionHistory.length > 50) {
          state.predictionHistory.shift();
        }

        mqttBroker.publishPrediction(prediction);
        alertEngine.evaluateMachine(state, prediction);
      }

      setMachines(new Map(updatedMachines));
      setClock({ ...updatedClock });
    });

    factoryEngine.start();

    return () => {
      unsubBroker();
      unsubAlerts();
      unsubEngine();
      factoryEngine.stop();
    };
  }, []);

  // Compute Line Level aggregate metrics
  const metrics: LineMetrics = useMemo(() => {
    const list = Array.from(machines.values());
    const totalOutput = list.reduce((acc, m) => acc + m.totalOutput, 0);
    const totalRejects = list.reduce((acc, m) => acc + m.totalRejects, 0);
    const totalUptimeSec = list.reduce((acc, m) => acc + m.uptimeSeconds, 0);
    const totalDowntimeSec = list.reduce((acc, m) => acc + m.downtimeSeconds, 0);

    const activeAlerts = alerts.filter((a) => !a.resolved);
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'CRITICAL');

    const highRiskMachines = list.filter((m) => m.latestPrediction.failure_prob >= 0.6);
    const predictedDowntimeMin = highRiskMachines.reduce((acc, m) => {
      return acc + (m.latestPrediction.predicted_ttf_min < 60 ? 30 : 0);
    }, 0);

    const availability = totalUptimeSec / Math.max(1, totalUptimeSec + totalDowntimeSec);
    const performance = 0.94;
    const quality = totalOutput > 0 ? (totalOutput - totalRejects) / totalOutput : 1.0;
    const oee = availability * performance * quality;

    return {
      oee,
      availability,
      performance,
      quality,
      uptime_pct: availability * 100,
      active_alerts_count: activeAlerts.length,
      critical_alerts_count: criticalAlerts.length,
      predicted_downtime_next_1h_min: predictedDowntimeMin,
      total_output: totalOutput,
      total_rejects: totalRejects,
      current_shift: clock.shift,
    };
  }, [machines, alerts, clock.shift]);

  const handleTogglePause = () => {
    factoryEngine.togglePause();
    setClock({ ...factoryEngine.getClock() });
  };

  const handleSpeedChange = (speed: number) => {
    factoryEngine.setSpeed(speed);
    setClock({ ...factoryEngine.getClock() });
  };

  const handleInjectDemoFailure = () => {
    setSelectedMachineId('cnc_01');
    factoryEngine.setSpeed(20);
    factoryEngine.injectFailure('cnc_01', 'bearing_wear', 20);
    setClock({ ...factoryEngine.getClock() });
    setCurrentTab('overview');
  };

  const handleInjectFailure = (machineId: string, mode: FailureType, durationMinutes = 30) => {
    factoryEngine.injectFailure(machineId, mode, durationMinutes);
    setMachines(new Map(factoryEngine.getMachines()));
  };

  const handleRecoverMachine = (machineId: string) => {
    factoryEngine.recoverMachine(machineId);
    setMachines(new Map(factoryEngine.getMachines()));
  };

  const handleResetLine = () => {
    for (const id of machines.keys()) {
      factoryEngine.recoverMachine(id);
    }
    setMachines(new Map(factoryEngine.getMachines()));
  };

  const handleAcknowledgeAlert = (id: string, byName: string, notes?: string) => {
    alertEngine.acknowledgeAlert(id, byName, notes);
  };

  const handleResolveAlert = (id: string) => {
    alertEngine.resolveAlert(id);
  };

  return (
    <div
      className="min-h-screen p-3 md:p-6 lg:p-8 flex items-center justify-center relative bg-[#ebedf1] selection:bg-neutral-900 selection:text-white"
      style={{
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.95), transparent 60%), radial-gradient(circle at 90% 80%, rgba(220, 226, 235, 0.8), transparent 70%), url('/src/assets/images/luminous_fluid_backdrop_1790840720854.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Floating Glassmorphic Capsule (Directly matching the floating tablet container in the reference image!) */}
      <div className="w-full max-w-[1560px] min-h-[92vh] rounded-[36px] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.07),0_0_1px_1px_rgba(255,255,255,0.9)] p-3 md:p-5 flex flex-col md:flex-row gap-4 relative overflow-hidden">
        {/* Left Navigation Dock matching reference image */}
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          activeAlertsCount={metrics.active_alerts_count}
          criticalAlertsCount={metrics.critical_alerts_count}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header matching reference image controls */}
          <Header
            clock={clock}
            activeAlertsCount={metrics.active_alerts_count}
            onTogglePause={handleTogglePause}
            onSpeedChange={handleSpeedChange}
            onInjectDemoFailure={handleInjectDemoFailure}
            onResetLine={handleResetLine}
          />

          {/* Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto pr-1 pt-3 pb-2 space-y-5">
            {currentTab === 'overview' && (
              <OverviewView
                machines={machines}
                metrics={metrics}
                onSelectMachine={(id) => {
                  setSelectedMachineId(id);
                  setCurrentTab('machines');
                }}
                onOpenSimulator={() => setCurrentTab('simulation_lab')}
                onInjectBearingWear={handleInjectDemoFailure}
              />
            )}

            {currentTab === 'machines' && (
              <MachineDetailView
                machines={machines}
                selectedMachineId={selectedMachineId}
                onSelectMachine={setSelectedMachineId}
                onInjectFailure={handleInjectFailure}
                onRecoverMachine={handleRecoverMachine}
              />
            )}

            {currentTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onAcknowledge={handleAcknowledgeAlert}
                onResolve={handleResolveAlert}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView machines={machines} />
            )}

            {currentTab === 'ml_performance' && (
              <ModelPerformanceView />
            )}

            {currentTab === 'simulation_lab' && (
              <SimulatorLabView
                machines={machines}
                clock={clock}
                onInjectFailure={handleInjectFailure}
                onRecoverMachine={handleRecoverMachine}
                onSpeedChange={handleSpeedChange}
                onTogglePause={handleTogglePause}
                onResetAll={handleResetLine}
              />
            )}

            {currentTab === 'system_health' && (
              <SystemHealthView
                brokerStatus={brokerStatus}
                messageLogs={messageLogs}
                tableStats={mqttBroker.getTableStats()}
                onToggleBrokerMode={(mode) => mqttBroker.setBrokerMode(mode)}
                onToggleConnection={() => mqttBroker.toggleConnection()}
              />
            )}

            {currentTab === 'codebase' && (
              <CodebaseView />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
