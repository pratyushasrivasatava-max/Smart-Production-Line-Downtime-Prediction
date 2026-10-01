import { FailureType, MachineState, PredictionResult, RiskLevel, ShapFactor, TelemetryReading } from '../types';

/**
 * Calculates simple linear slope over an array of numbers
 */
function calculateSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[], m?: number): number {
  if (arr.length < 2) return 0;
  const avg = m ?? mean(arr);
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Executes ML feature extraction and evaluates:
 * 1. XGBoost-calibrated Failure Classifier P(failure in next 30min)
 * 2. Time-To-Failure (TTF) Regressor
 * 3. Isolation Forest Anomaly Score
 * 4. Local SHAP factor contributions
 */
export function runInferenceOnMachine(state: MachineState): PredictionResult {
  const recent = state.recentTelemetry;
  const curr = state.currentTelemetry;
  const base = state.config.baselines;
  const thresh = state.config.thresholds;

  const temps = recent.map((r) => r.temperature);
  const vibs = recent.map((r) => r.vibration);
  const currents = recent.map((r) => r.motor_current);
  const pressures = recent.map((r) => r.pressure);

  const tempMean = mean(temps.slice(-15));
  const tempSlope = calculateSlope(temps.slice(-20));
  const vibMean = mean(vibs.slice(-15));
  const vibStd = std(vibs.slice(-20));
  const vibSlope = calculateSlope(vibs.slice(-20));
  const currMean = mean(currents.slice(-15));
  const currSlope = calculateSlope(currents.slice(-20));
  const pressMean = mean(pressures.slice(-15));
  const pressSlope = calculateSlope(pressures.slice(-20));

  // Cross-sensor ratios
  const vibToRpm = curr.rpm > 0 ? (curr.vibration / curr.rpm) * 1000 : 0;
  const currToPower = curr.power_kw > 0 ? curr.motor_current / curr.power_kw : 0;

  // Normalized deviations from baseline
  const normTemp = (curr.temperature - base.temperature) / (thresh.temp_crit - base.temperature);
  const normVib = (curr.vibration - base.vibration) / (thresh.vib_crit - base.vibration);
  const normCurr = (curr.motor_current - base.motor_current) / (thresh.curr_crit - base.motor_current);
  const normPressLoss = (base.pressure - curr.pressure) / (base.pressure - thresh.press_low_crit);

  // 1. Isolation Forest Anomaly Score (multivariate distance in normalized sensor space)
  const anomalyRaw = Math.sqrt(
    Math.pow(Math.max(0, normTemp), 2) +
    Math.pow(Math.max(0, normVib * 1.2), 2) +
    Math.pow(Math.max(0, normCurr), 2) +
    Math.pow(Math.max(0, normPressLoss), 2) +
    Math.pow(vibStd * 1.5, 2)
  );
  // Anomaly score bounded [0.04, 0.99]
  const anomalyScore = Math.min(0.99, Math.max(0.04, 1 / (1 + Math.exp(-2.5 * (anomalyRaw - 0.7)))));

  // 2. Failure Probability Classifier P(failure in 30 min)
  // XGBoost logistic regression surrogate based on degradation progress and slope acceleration
  let logit = -3.8; // base healthy rate (~2.2%)
  logit += Math.max(0, normVib) * 3.5;
  logit += Math.max(0, vibSlope * 20) * 2.2;
  logit += Math.max(0, normTemp) * 2.8;
  logit += Math.max(0, tempSlope * 15) * 1.8;
  logit += Math.max(0, normCurr) * 2.4;
  logit += Math.max(0, normPressLoss) * 2.1;
  logit += (vibToRpm > 0.8 ? 1.2 : 0);

  if (curr.status === 'FAULT') {
    logit = 8.0;
  }

  const rawProb = 1 / (1 + Math.exp(-logit));
  const failure_prob = Number(Math.min(0.995, Math.max(0.015, rawProb)).toFixed(3));

  // Determine Risk Level
  let risk_level: RiskLevel = 'LOW';
  if (failure_prob >= 0.85 || curr.status === 'FAULT') {
    risk_level = 'CRITICAL';
  } else if (failure_prob >= 0.6) {
    risk_level = 'HIGH';
  } else if (failure_prob >= 0.3) {
    risk_level = 'MEDIUM';
  }

  // 3. Time-to-Failure (TTF) Regressor (in minutes)
  let predicted_ttf_min = 180;
  if (curr.status === 'FAULT') {
    predicted_ttf_min = 0;
  } else if (failure_prob > 0.05) {
    // Inverse exponential decay mapping prob -> minutes remaining
    const est = 180 * Math.pow(1 - failure_prob, 1.8);
    predicted_ttf_min = Math.round(Math.max(2, est));
  }

  // Determine most probable cause
  let probable_cause: FailureType = 'none';
  if (normVib > 0.4 && normTemp > 0.3) {
    probable_cause = 'bearing_wear';
  } else if (normTemp > 0.5) {
    probable_cause = 'overheating';
  } else if (normCurr > 0.45 && curr.rpm < base.rpm * 0.9) {
    probable_cause = 'motor_overload';
  } else if (normPressLoss > 0.4) {
    probable_cause = 'hydraulic_leak';
  } else if (curr.reject_count > 8 || curr.cycle_time > base.cycle_time * 1.25) {
    probable_cause = 'tool_wear';
  } else if (state.currentDegradation.active) {
    probable_cause = state.currentDegradation.mode;
  }

  // 4. SHAP Factors calculation (Top positive/negative drivers)
  const shap_factors: ShapFactor[] = [];

  if (vibMean > base.vibration * 1.15) {
    const impact = Number((Math.min(0.48, normVib * 0.4)).toFixed(3));
    shap_factors.push({
      feature: 'vib_mean_1m',
      label: 'Radial Bearing Vibration',
      impact,
      value: `${curr.vibration.toFixed(2)} mm/s (+${((curr.vibration / base.vibration - 1) * 100).toFixed(0)}%)`,
    });
  }

  if (tempMean > base.temperature * 1.1) {
    const impact = Number((Math.min(0.42, normTemp * 0.35)).toFixed(3));
    shap_factors.push({
      feature: 'temp_mean_1m',
      label: 'Spindle Temperature',
      impact,
      value: `${curr.temperature.toFixed(1)} °C (+${(curr.temperature - base.temperature).toFixed(1)} °C)`,
    });
  }

  if (vibSlope > 0.02) {
    shap_factors.push({
      feature: 'vib_slope_15m',
      label: 'Vibration Acceleration Rate',
      impact: Number((Math.min(0.35, vibSlope * 4)).toFixed(3)),
      value: `+${(vibSlope * 60).toFixed(2)} mm/s/min`,
    });
  }

  if (curr.motor_current > base.motor_current * 1.15) {
    shap_factors.push({
      feature: 'current_mean_1m',
      label: 'Motor Armature Amperage',
      impact: Number((Math.min(0.38, normCurr * 0.35)).toFixed(3)),
      value: `${curr.motor_current.toFixed(1)} A (+${(curr.motor_current - base.motor_current).toFixed(1)} A)`,
    });
  }

  if (curr.pressure < base.pressure * 0.85) {
    shap_factors.push({
      feature: 'pressure_mean_1m',
      label: 'Hydraulic System Pressure',
      impact: Number((Math.min(0.4, normPressLoss * 0.38)).toFixed(3)),
      value: `${curr.pressure.toFixed(1)} bar (loss ${(base.pressure - curr.pressure).toFixed(1)} bar)`,
    });
  }

  // Healthy negative drivers if nominal
  if (shap_factors.length === 0) {
    shap_factors.push(
      { feature: 'vib_mean_1m', label: 'Vibration Stability', impact: -0.12, value: `${curr.vibration.toFixed(2)} mm/s (Nominal)` },
      { feature: 'temp_mean_1m', label: 'Operating Thermal State', impact: -0.09, value: `${curr.temperature.toFixed(1)} °C (Stable)` },
      { feature: 'vib_to_rpm_ratio', label: 'Harmonic Dynamic Ratio', impact: -0.06, value: `${vibToRpm.toFixed(3)} (Balanced)` }
    );
  }

  // Sort by highest absolute impact
  shap_factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    ts: curr.ts,
    machine_id: state.config.id,
    failure_prob,
    predicted_ttf_min,
    anomaly_score: Number(anomalyScore.toFixed(3)),
    risk_level,
    probable_cause,
    model_version: 'v2.4-xgb-calibrated',
    shap_factors: shap_factors.slice(0, 4),
  };
}
