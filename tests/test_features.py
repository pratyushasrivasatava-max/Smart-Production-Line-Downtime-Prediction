import pytest
import pandas as pd
from datetime import datetime, timedelta
from src.features.engineering import FeatureEngineer

def test_feature_engineering_no_leakage():
    fe = FeatureEngineer()
    now = datetime.utcnow()
    rows = []
    for i in range(150):
        rows.append({
            "ts": (now + timedelta(seconds=i)).isoformat(),
            "machine_id": "cnc_01",
            "temperature": 68.0 + (i * 0.1),
            "vibration": 2.8 + (i * 0.02),
            "motor_current": 22.4,
            "pressure": 6.5,
            "rpm": 12000,
            "power_kw": 21.8,
            "cycle_time": 14.0,
            "output_count": i,
            "reject_count": 0,
            "status": "RUNNING"
        })
    df = pd.DataFrame(rows)
    transformed = fe.transform_dataframe(df)

    assert "vib_slope_15m" in transformed.columns
    assert "temp_mean_1m" in transformed.columns
    assert "vib_to_rpm_ratio" in transformed.columns
    # Upward slope should be strictly positive
    assert transformed["vib_slope_15m"].iloc[-1] > 0
