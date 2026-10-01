import pandas as pd
import numpy as np
from typing import Dict, Any, List

def compute_slope(series: pd.Series) -> float:
    if len(series) < 2:
        return 0.0
    x = np.arange(len(series))
    y = series.values
    denom = np.sum((x - x.mean()) ** 2)
    if denom == 0:
        return 0.0
    return float(np.sum((x - x.mean()) * (y - y.mean())) / denom)

class FeatureEngineer:
    def __init__(self):
        pass

    def transform_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Computes rolling features without future lookahead (preventing data leakage)."""
        df = df.sort_values(by=["machine_id", "ts"]).copy()
        features_list = []

        for machine_id, group in df.groupby("machine_id"):
            group = group.copy()
            # Rolling means
            group["temp_mean_1m"] = group["temperature"].rolling(window=60, min_periods=5).mean().fillna(group["temperature"])
            group["vib_mean_1m"] = group["vibration"].rolling(window=60, min_periods=5).mean().fillna(group["vibration"])
            group["vib_std_5m"] = group["vibration"].rolling(window=300, min_periods=10).std().fillna(0.0)
            group["current_mean_1m"] = group["motor_current"].rolling(window=60, min_periods=5).mean().fillna(group["motor_current"])
            group["pressure_mean_1m"] = group["pressure"].rolling(window=60, min_periods=5).mean().fillna(group["pressure"])

            # Rolling slopes (trends)
            group["vib_slope_15m"] = group["vibration"].rolling(window=120, min_periods=10).apply(compute_slope, raw=False).fillna(0.0)
            group["temp_slope_15m"] = group["temperature"].rolling(window=120, min_periods=10).apply(compute_slope, raw=False).fillna(0.0)
            group["current_slope_15m"] = group["motor_current"].rolling(window=120, min_periods=10).apply(compute_slope, raw=False).fillna(0.0)
            group["pressure_slope_15m"] = group["pressure"].rolling(window=120, min_periods=10).apply(compute_slope, raw=False).fillna(0.0)

            # Cross sensor ratios
            group["vib_to_rpm_ratio"] = np.where(group["rpm"] > 0, (group["vibration"] / group["rpm"]) * 1000.0, 0.0)
            group["current_to_power_ratio"] = np.where(group["power_kw"] > 0, group["motor_current"] / group["power_kw"], 0.0)

            features_list.append(group)

        return pd.concat(features_list).sort_values("ts")
