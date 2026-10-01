import { AlertItem, AlertSeverity, FailureType, MachineState, PredictionResult } from '../types';

export class AlertEngine {
  private alerts: AlertItem[] = [];
  private lastAlertTimestamp: Map<string, number> = new Map(); // key: machineId_severity, value: epoch ms
  private cooldownMs = 180 * 1000; // 3 minutes cooldown for same alert type
  private listeners: ((alerts: AlertItem[]) => void)[] = [];

  constructor() {
    // Pre-populate with a couple of past historical alerts for immediate richness
    this.alerts = [
      {
        id: 'alt_hist_01',
        ts: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        machine_id: 'cut_01',
        machine_name: 'Cutting Machine',
        severity: 'INFO',
        type: 'ROUTINE_PRECHECK',
        message: 'Shift handover diagnostic completed. Blade alignment nominal.',
        failure_prob: 0.05,
        predicted_ttf_min: 180,
        probable_cause: 'none',
        recommended_action: 'Continue standard production run.',
        top_contributor: 'Operational Cycle Time: 3.5s',
        acknowledged: true,
        acknowledged_by: 'Shift Sup. Alex Mercer',
        acknowledged_at: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
        resolved: true,
        resolved_at: new Date(Date.now() - 3600 * 1000 * 1.7).toISOString(),
      },
    ];
  }

  public subscribe(cb: (alerts: AlertItem[]) => void): () => void {
    this.listeners.push(cb);
    cb(this.alerts);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getAlerts(): AlertItem[] {
    return this.alerts;
  }

  public evaluateMachine(machine: MachineState, pred: PredictionResult): void {
    const now = Date.now();
    const curr = machine.currentTelemetry;
    const thresh = machine.config.thresholds;

    // Check Auto-escalation on unacknowledged alerts older than 3 minutes
    for (const alt of this.alerts) {
      if (!alt.resolved && !alt.acknowledged && alt.machine_id === machine.config.id) {
        const ageSec = (now - new Date(alt.ts).getTime()) / 1000;
        if (ageSec > 180 && !alt.escalated && alt.severity === 'WARNING') {
          alt.escalated = true;
          alt.severity = 'CRITICAL';
          alt.message = `[ESCALATED] Unattended risk: ${alt.message}`;
          this.notify();
        }
      }
    }

    // Auto-resolve check: if machine is healthy and alert was active
    if (pred.risk_level === 'LOW' && curr.status === 'RUNNING') {
      let resolvedAny = false;
      for (const alt of this.alerts) {
        if (!alt.resolved && alt.machine_id === machine.config.id && alt.severity !== 'INFO') {
          alt.resolved = true;
          alt.resolved_at = new Date().toISOString();
          resolvedAny = true;
        }
      }
      if (resolvedAny) this.notify();
    }

    // Rule 1: FAULT status (Highest Priority CRITICAL)
    if (curr.status === 'FAULT') {
      this.triggerAlert({
        machine_id: machine.config.id,
        machine_name: machine.config.name,
        severity: 'CRITICAL',
        type: 'HARDWARE_FAULT',
        message: `Line stopped: ${machine.config.name} entered FAULT state. Immediate inspection required.`,
        failure_prob: 0.99,
        predicted_ttf_min: 0,
        probable_cause: pred.probable_cause !== 'none' ? pred.probable_cause : 'random_breakdown',
        recommended_action: 'Engage safety lock-out tag-out (LOTO). Dispatch field maintenance technician.',
        top_contributor: pred.shap_factors[0] ? `${pred.shap_factors[0].label}: ${pred.shap_factors[0].value}` : 'Fault Trip',
      });
      return;
    }

    // Rule 2: ML High / Critical Risk (>0.60, >0.85)
    if (pred.risk_level === 'CRITICAL') {
      this.triggerAlert({
        machine_id: machine.config.id,
        machine_name: machine.config.name,
        severity: 'CRITICAL',
        type: 'PREDICTIVE_FAILURE_IMMINENT',
        message: `High confidence downtime predicted in ${pred.predicted_ttf_min} mins ($P=${(pred.failure_prob * 100).toFixed(0)}%).`,
        failure_prob: pred.failure_prob,
        predicted_ttf_min: pred.predicted_ttf_min,
        probable_cause: pred.probable_cause,
        recommended_action: this.getRecommendedAction(pred.probable_cause),
        top_contributor: pred.shap_factors[0] ? `${pred.shap_factors[0].label}: ${pred.shap_factors[0].value}` : 'Sensor Drift',
      });
      return;
    }

    if (pred.risk_level === 'HIGH' || pred.anomaly_score > 0.78) {
      this.triggerAlert({
        machine_id: machine.config.id,
        machine_name: machine.config.name,
        severity: 'WARNING',
        type: 'PREDICTIVE_DEGRADATION',
        message: `Degradation pattern detected on ${machine.config.name}. Estimated TTF ~${pred.predicted_ttf_min} min.`,
        failure_prob: pred.failure_prob,
        predicted_ttf_min: pred.predicted_ttf_min,
        probable_cause: pred.probable_cause,
        recommended_action: this.getRecommendedAction(pred.probable_cause),
        top_contributor: pred.shap_factors[0] ? `${pred.shap_factors[0].label}: ${pred.shap_factors[0].value}` : 'Harmonic Variance',
      });
      return;
    }

    // Rule 3: Hard sensor boundary checks
    if (curr.temperature >= thresh.temp_crit) {
      this.triggerAlert({
        machine_id: machine.config.id,
        machine_name: machine.config.name,
        severity: 'CRITICAL',
        type: 'THERMAL_OVERRUN',
        message: `Spindle core temperature breached critical limit (${curr.temperature.toFixed(1)}°C >= ${thresh.temp_crit}°C).`,
        failure_prob: 0.88,
        predicted_ttf_min: 15,
        probable_cause: 'overheating',
        recommended_action: 'Purge coolant filters and verify secondary chiller recirculation pump.',
        top_contributor: `Temperature: ${curr.temperature.toFixed(1)}°C`,
      });
    } else if (curr.vibration >= thresh.vib_crit) {
      this.triggerAlert({
        machine_id: machine.config.id,
        machine_name: machine.config.name,
        severity: 'CRITICAL',
        type: 'VIBRATION_SPIKE',
        message: `Radial bearing vibration exceeded safety threshold (${curr.vibration.toFixed(2)} mm/s >= ${thresh.vib_crit} mm/s).`,
        failure_prob: 0.86,
        predicted_ttf_min: 22,
        probable_cause: 'bearing_wear',
        recommended_action: 'Inspect bearing raceway lubrication and measure axial clearance.',
        top_contributor: `Vibration: ${curr.vibration.toFixed(2)} mm/s`,
      });
    }
  }

  private triggerAlert(params: Omit<AlertItem, 'id' | 'ts' | 'acknowledged' | 'resolved'>): void {
    const key = `${params.machine_id}_${params.type}`;
    const now = Date.now();
    const last = this.lastAlertTimestamp.get(key) || 0;

    // Cooldown check (don't spam same alert within cooldown period unless escalated to critical)
    if (now - last < this.cooldownMs && params.severity !== 'CRITICAL') {
      return;
    }

    // Deduplication check: check if an identical unacknowledged active alert exists
    const existing = this.alerts.find(
      (a) => !a.resolved && a.machine_id === params.machine_id && a.type === params.type
    );

    if (existing) {
      // Update probability and timestamp
      existing.ts = new Date().toISOString();
      existing.failure_prob = params.failure_prob;
      existing.predicted_ttf_min = params.predicted_ttf_min;
      this.notify();
      return;
    }

    this.lastAlertTimestamp.set(key, now);

    const newAlert: AlertItem = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ts: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      ...params,
    };

    this.alerts.unshift(newAlert);
    // Keep max 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.pop();
    }

    this.notify();
  }

  public acknowledgeAlert(alertId: string, byName: string, notes?: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return;
    alert.acknowledged = true;
    alert.acknowledged_by = byName;
    alert.acknowledged_at = new Date().toISOString();
    alert.acknowledged_notes = notes;
    this.notify();
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return;
    alert.resolved = true;
    alert.resolved_at = new Date().toISOString();
    this.notify();
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb([...this.alerts]);
    }
  }

  private getRecommendedAction(cause: FailureType): string {
    switch (cause) {
      case 'bearing_wear':
        return 'Schedule greasing & acoustic bearing emission scan during next 15-min shift break.';
      case 'overheating':
        return 'Inspect chiller flow rate and blow down radiator heat sink fins.';
      case 'motor_overload':
        return 'Reduce feed-rate by 20%, inspect mechanical guides for foreign particle binding.';
      case 'hydraulic_leak':
        return 'Check hydraulic accumulator charge pressure and inspect high-pressure manifold seals.';
      case 'tool_wear':
        return 'Swap cutting insert tool cartridge and run laser calibration cycle.';
      default:
        return 'Perform standard visual pre-check and review vibration spectral density.';
    }
  }
}

export const alertEngine = new AlertEngine();
