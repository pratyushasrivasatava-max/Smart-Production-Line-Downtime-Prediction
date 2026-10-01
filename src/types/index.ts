export type MachineStatus = 'RUNNING' | 'IDLE' | 'WARNING' | 'FAULT' | 'MAINTENANCE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FailureType = 
  | 'none'
  | 'bearing_wear'
  | 'overheating'
  | 'motor_overload'
  | 'hydraulic_leak'
  | 'tool_wear'
  | 'random_breakdown';

export interface MachineConfig {
  id: string;
  name: string;
  line: string;
  position: number;
  installDate: string;
  iconName: string;
  description: string;
  baselines: {
    temperature: number; // °C
    vibration: number;   // mm/s
    motor_current: number; // A
    pressure: number;    // bar
    rpm: number;
    power_kw: number;
    cycle_time: number;  // seconds
  };
  thresholds: {
    temp_warn: number;
    temp_crit: number;
    vib_warn: number;
    vib_crit: number;
    curr_warn: number;
    curr_crit: number;
    press_low_warn: number;
    press_low_crit: number;
  };
}

export interface TelemetryReading {
  id?: number;
  ts: string;
  machine_id: string;
  temperature: number;
  vibration: number;
  motor_current: number;
  pressure: number;
  rpm: number;
  power_kw: number;
  cycle_time: number;
  output_count: number;
  reject_count: number;
  status: MachineStatus;
}

export interface FeatureSnapshot {
  machine_id: string;
  ts: string;
  temp_mean_1m: number;
  temp_slope_15m: number;
  vib_mean_1m: number;
  vib_std_5m: number;
  vib_slope_15m: number;
  current_mean_1m: number;
  current_slope_15m: number;
  pressure_mean_1m: number;
  pressure_slope_15m: number;
  vib_to_rpm_ratio: number;
  current_to_power_ratio: number;
  reject_rate_15m: number;
  cycle_time_drift_15m: number;
  time_since_last_maintenance_hours: number;
  shift_id: 1 | 2 | 3;
}

export interface ShapFactor {
  feature: string;
  label: string;
  impact: number; // positive increases risk, negative decreases
  value: string;
}

export interface PredictionResult {
  ts: string;
  machine_id: string;
  failure_prob: number; // 0.0 - 1.0 (failure in next 30 min)
  predicted_ttf_min: number; // Remaining Useful Life in minutes
  anomaly_score: number; // 0.0 - 1.0 (Isolation Forest style)
  risk_level: RiskLevel;
  probable_cause: FailureType;
  model_version: string;
  shap_factors: ShapFactor[];
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertItem {
  id: string;
  ts: string;
  machine_id: string;
  machine_name: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  failure_prob: number;
  predicted_ttf_min: number;
  probable_cause: FailureType;
  recommended_action: string;
  top_contributor: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  acknowledged_notes?: string;
  resolved: boolean;
  resolved_at?: string;
  escalated?: boolean;
}

export interface MachineState {
  config: MachineConfig;
  currentTelemetry: TelemetryReading;
  recentTelemetry: TelemetryReading[]; // last 60 points for charts
  latestPrediction: PredictionResult;
  predictionHistory: { ts: string; prob: number; ttf: number; anomaly: number }[];
  currentDegradation: {
    mode: FailureType;
    active: boolean;
    startTs: number;
    durationMs: number;
    progress: number; // 0 to 1
  };
  totalOutput: number;
  totalRejects: number;
  uptimeSeconds: number;
  downtimeSeconds: number;
}

export interface LineMetrics {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  uptime_pct: number;
  active_alerts_count: number;
  critical_alerts_count: number;
  predicted_downtime_next_1h_min: number;
  total_output: number;
  total_rejects: number;
  current_shift: 'Shift 1 (Day)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)';
}

export interface DowntimeEvent {
  id: string;
  machine_id: string;
  machine_name: string;
  start_ts: string;
  end_ts?: string;
  duration_min: number;
  cause: FailureType;
  shift: string;
  status: 'ACTIVE' | 'RESOLVED';
}
