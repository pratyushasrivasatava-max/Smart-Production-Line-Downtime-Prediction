import { FailureType, MachineConfig, MachineState, MachineStatus, TelemetryReading } from '../types';
import { MACHINES_CONFIG } from '../constants/machines';

/**
 * Standard Box-Muller Gaussian random generator
 */
function randomGaussian(mean = 0, stdev = 1): number {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export interface SimulationClock {
  virtualTime: Date;
  speed: number;
  isPaused: boolean;
  shift: 'Shift 1 (Day)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)';
}

export class FactorySimulationEngine {
  private machines: Map<string, MachineState> = new Map();
  private clock: SimulationClock;
  private listeners: ((states: Map<string, MachineState>, clock: SimulationClock) => void)[] = [];
  private tickIntervalId: number | null = null;
  private lastTickMs: number = Date.now();

  constructor() {
    this.clock = {
      virtualTime: new Date(),
      speed: 1,
      isPaused: false,
      shift: 'Shift 1 (Day)',
    };

    // Initialize all machines
    for (const config of MACHINES_CONFIG) {
      const initialTelemetry: TelemetryReading = {
        ts: this.clock.virtualTime.toISOString(),
        machine_id: config.id,
        temperature: config.baselines.temperature,
        vibration: config.baselines.vibration,
        motor_current: config.baselines.motor_current,
        pressure: config.baselines.pressure,
        rpm: config.baselines.rpm,
        power_kw: config.baselines.power_kw,
        cycle_time: config.baselines.cycle_time,
        output_count: 0,
        reject_count: 0,
        status: 'RUNNING',
      };

      this.machines.set(config.id, {
        config,
        currentTelemetry: initialTelemetry,
        recentTelemetry: [initialTelemetry],
        latestPrediction: {
          ts: this.clock.virtualTime.toISOString(),
          machine_id: config.id,
          failure_prob: 0.04,
          predicted_ttf_min: 180,
          anomaly_score: 0.08,
          risk_level: 'LOW',
          probable_cause: 'none',
          model_version: 'v2.4-xgb-calibrated',
          shap_factors: [
            { feature: 'vibration_slope_15m', label: 'Vibration Trend', impact: 0.01, value: '+0.02 mm/s' },
            { feature: 'temp_mean_1m', label: 'Spindle Temperature', impact: 0.01, value: `${config.baselines.temperature.toFixed(1)}°C` },
            { feature: 'current_to_power_ratio', label: 'Motor Electromechanical Load', impact: -0.02, value: 'Nominal' },
          ],
        },
        predictionHistory: [],
        currentDegradation: {
          mode: 'none',
          active: false,
          startTs: 0,
          durationMs: 0,
          progress: 0,
        },
        totalOutput: 240 + Math.floor(Math.random() * 80),
        totalRejects: 2 + Math.floor(Math.random() * 3),
        uptimeSeconds: 14400,
        downtimeSeconds: 0,
      });
    }
  }

  public getMachines(): Map<string, MachineState> {
    return this.machines;
  }

  public getClock(): SimulationClock {
    return this.clock;
  }

  public setSpeed(speed: number): void {
    this.clock.speed = speed;
  }

  public togglePause(): boolean {
    this.clock.isPaused = !this.clock.isPaused;
    return this.clock.isPaused;
  }

  public subscribe(callback: (states: Map<string, MachineState>, clock: SimulationClock) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public start(): void {
    if (this.tickIntervalId !== null) return;
    this.lastTickMs = Date.now();
    this.tickIntervalId = window.setInterval(() => {
      this.step();
    }, 1000);
  }

  public stop(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  /**
   * Injects a specific degradation mode or clears it
   */
  public injectFailure(machineId: string, mode: FailureType, durationMinutes = 30): void {
    const machine = this.machines.get(machineId);
    if (!machine) return;

    if (mode === 'none') {
      machine.currentDegradation = {
        mode: 'none',
        active: false,
        startTs: 0,
        durationMs: 0,
        progress: 0,
      };
      if (machine.currentTelemetry.status === 'FAULT' || machine.currentTelemetry.status === 'WARNING') {
        machine.currentTelemetry.status = 'RUNNING';
      }
      return;
    }

    if (mode === 'random_breakdown') {
      // Immediate unexpected failure
      machine.currentDegradation = {
        mode: 'random_breakdown',
        active: true,
        startTs: Date.now(),
        durationMs: 60 * 1000,
        progress: 1.0,
      };
      machine.currentTelemetry.status = 'FAULT';
      return;
    }

    // Gradual degradation curve
    machine.currentDegradation = {
      mode,
      active: true,
      startTs: Date.now(),
      // duration scaled by minutes
      durationMs: durationMinutes * 60 * 1000,
      progress: 0.05,
    };
  }

  public recoverMachine(machineId: string): void {
    const machine = this.machines.get(machineId);
    if (!machine) return;

    machine.currentDegradation = {
      mode: 'none',
      active: false,
      startTs: 0,
      durationMs: 0,
      progress: 0,
    };
    machine.currentTelemetry.status = 'RUNNING';
  }

  /**
   * Advance simulation by 1 logical step
   */
  public step(): void {
    if (this.clock.isPaused) return;

    const realDeltaSec = 1;
    const simDeltaSec = realDeltaSec * this.clock.speed;
    const nextVirtualTime = new Date(this.clock.virtualTime.getTime() + simDeltaSec * 1000);
    this.clock.virtualTime = nextVirtualTime;

    // Determine current shift based on hour
    const hour = nextVirtualTime.getHours();
    if (hour >= 6 && hour < 14) {
      this.clock.shift = 'Shift 1 (Day)';
    } else if (hour >= 14 && hour < 22) {
      this.clock.shift = 'Shift 2 (Evening)';
    } else {
      this.clock.shift = 'Shift 3 (Night)';
    }

    // Shift thermal bias (slight cooling at night, warming during peak day)
    const shiftTempBias = hour >= 10 && hour <= 16 ? 1.5 : (hour >= 23 || hour <= 5 ? -1.8 : 0);

    for (const [id, state] of this.machines.entries()) {
      this.updateMachineTelemetry(state, simDeltaSec, shiftTempBias);
    }

    // Notify all subscribers
    for (const cb of this.listeners) {
      cb(this.machines, this.clock);
    }
  }

  private updateMachineTelemetry(state: MachineState, simDeltaSec: number, shiftTempBias: number): void {
    const base = state.config.baselines;
    const deg = state.currentDegradation;

    // Progress degradation if active
    if (deg.active && deg.mode !== 'random_breakdown') {
      // In accelerated or real time, progress advances
      const progressIncrement = (simDeltaSec * 1000) / Math.max(deg.durationMs, 10000);
      deg.progress = Math.min(1.0, deg.progress + progressIncrement);
    }

    const p = deg.progress;
    let tempOffset = 0;
    let vibOffset = 0;
    let currOffset = 0;
    let pressOffset = 0;
    let rpmOffset = 0;
    let powerOffset = 0;
    let cycleTimeOffset = 0;
    let extraRejectProb = 0;

    // Apply exact degradation physics curves
    if (deg.active) {
      switch (deg.mode) {
        case 'bearing_wear':
          // Rising vibration (quadratic) + creeping temperature elevation
          vibOffset = Math.pow(p, 1.8) * 4.6;
          tempOffset = Math.pow(p, 1.5) * 22.0;
          powerOffset = p * 2.5;
          break;

        case 'overheating':
          // Steep thermal climb + power increase
          tempOffset = Math.pow(p, 1.3) * 34.0;
          powerOffset = p * 4.8;
          currOffset = p * 4.0;
          break;

        case 'motor_overload':
          // Current spikes dramatically, RPM drops under high electromagnetic drag
          currOffset = Math.pow(p, 1.4) * 15.0;
          rpmOffset = -Math.pow(p, 1.6) * (base.rpm * 0.35);
          tempOffset = p * 18.0;
          powerOffset = p * 7.5;
          break;

        case 'hydraulic_leak':
          // Pressure decays, cycle time increases (sluggish hydraulic cylinder action)
          pressOffset = -Math.pow(p, 1.4) * (base.pressure * 0.45);
          cycleTimeOffset = Math.pow(p, 1.2) * 5.5;
          powerOffset = p * 1.5;
          break;

        case 'tool_wear':
          // Reject count rises rapidly, cycle time drifts
          cycleTimeOffset = p * 3.8;
          extraRejectProb = Math.pow(p, 1.3) * 0.45;
          vibOffset = p * 1.8;
          tempOffset = p * 8.0;
          break;

        case 'random_breakdown':
          // Instant fault state
          state.currentTelemetry.status = 'FAULT';
          break;
      }
    }

    // Determine status transitions based on degradation
    let status: MachineStatus = state.currentTelemetry.status;
    if (deg.active) {
      if (p >= 0.95 || deg.mode === 'random_breakdown') {
        status = 'FAULT';
      } else if (p >= 0.55) {
        status = 'WARNING';
      } else if (p > 0) {
        status = 'RUNNING';
      }
    } else {
      if (status === 'FAULT' || status === 'WARNING') {
        status = 'RUNNING';
      }
    }

    // Gaussian noise + slow drift
    const tempNoise = randomGaussian(0, 0.4);
    const vibNoise = randomGaussian(0, 0.08);
    const currNoise = randomGaussian(0, 0.3);
    const pressNoise = randomGaussian(0, 0.05);
    const rpmNoise = randomGaussian(0, base.rpm * 0.005);
    const powerNoise = randomGaussian(0, 0.2);
    const cycleNoise = randomGaussian(0, 0.15);

    // Apply baseline + noise + offsets + shift bias
    const temperature = Math.max(15, base.temperature + tempOffset + shiftTempBias + tempNoise);
    const vibration = Math.max(0.1, base.vibration + vibOffset + vibNoise);
    const motor_current = Math.max(0, base.motor_current + currOffset + currNoise);
    const pressure = Math.max(0.5, base.pressure + pressOffset + pressNoise);
    const rpm = Math.max(0, base.rpm + rpmOffset + rpmNoise);
    const power_kw = Math.max(0.5, base.power_kw + powerOffset + powerNoise);
    const cycle_time = Math.max(1.0, base.cycle_time + cycleTimeOffset + cycleNoise);

    // Part production logic
    let produced = 0;
    let rejected = 0;
    if (status === 'RUNNING' || status === 'WARNING') {
      // 1 part completed roughly every cycle_time
      const chance = simDeltaSec / cycle_time;
      if (Math.random() < chance) {
        produced = 1;
        // Standard reject baseline is ~1.5%, plus degradation penalty
        if (Math.random() < 0.015 + extraRejectProb) {
          rejected = 1;
        }
      }
      state.uptimeSeconds += simDeltaSec;
    } else if (status === 'FAULT') {
      state.downtimeSeconds += simDeltaSec;
    }

    state.totalOutput += produced;
    state.totalRejects += rejected;

    const newTelemetry: TelemetryReading = {
      ts: this.clock.virtualTime.toISOString(),
      machine_id: state.config.id,
      temperature: Number(temperature.toFixed(2)),
      vibration: Number(vibration.toFixed(2)),
      motor_current: Number(motor_current.toFixed(2)),
      pressure: Number(pressure.toFixed(2)),
      rpm: Math.round(rpm),
      power_kw: Number(power_kw.toFixed(2)),
      cycle_time: Number(cycle_time.toFixed(2)),
      output_count: state.totalOutput,
      reject_count: state.totalRejects,
      status,
    };

    state.currentTelemetry = newTelemetry;

    // Maintain recent telemetry buffer for charts (keep up to 60 readings)
    state.recentTelemetry.push(newTelemetry);
    if (state.recentTelemetry.length > 60) {
      state.recentTelemetry.shift();
    }
  }
}

// Global singleton instance for easy access across views
export const factoryEngine = new FactorySimulationEngine();
